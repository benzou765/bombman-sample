package socket

import (
	"encoding/json"
	"errors"
	"strconv"
	"unsafe"

	// echo
	"github.com/labstack/echo"

	// websocket
	"github.com/gorilla/websocket"

	// local packages
	"../models"
)

// 部屋管理の構造体
type RoomManager struct {
	rooms  map[int]*Room
	logger echo.Logger
}

// 部屋の構造体
type Room struct {
	id int
	// クライアントにメッセージを送信するために保持するチャネル
	forward chan []byte
	// チャットルームに参加しようとしているクライアントのためのチャネル
	join chan *Client
	// チャットルームから退出しようとしているクライアントのためのチャネル
	leave chan *Client
	// 在室しているクライアントを保持
	clients map[*Client]bool
	// 部屋の大きさ
	size int
	// Echoフレームワーク
	echo *echo.Echo
}

// 通信上のJson構造体
type Talk struct {
	User_id int    `json:"id,int"`
	Action  string `json:"action,string"` // start, move, set_bomb, exp_bomb, dead のいずれか
	X       int    `json:"x,int"`
	Y       int    `json:"y,int"`
}

// websocketのメッセージバッファ
var upgrader = &websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// Roomを管理する構造体の初期化
func New(e *echo.Echo) *RoomManager {
	return &RoomManager{
		rooms:  make(map[int]*Room),
		logger: e.Logger,
	}
}

func (rm *RoomManager) GetRoom(roomId int) (*Room, error) {
	room, exist := rm.rooms[roomId]
	if exist {
		return room, nil
	}
	return nil, errors.New("The room is not exist!!")
}

func (rm *RoomManager) CreateRoom(conn *models.DbConnection, size int, echo *echo.Echo) *Room {
	// 部屋情報をDBに保存
	var roomModel *models.Room
	roomModel = new(models.Room)
	roomModel.Insert(conn, size)

	room := &Room{
		id:      roomModel.Id,
		forward: make(chan []byte),
		join:    make(chan *Client),
		leave:   make(chan *Client),
		clients: make(map[*Client]bool),
		size:    size,
		echo:    echo,
	}
	rm.rooms[roomModel.Id] = room
	return room
}

// ルーム内での処理
func (r *Room) Run() {
	for {
		select {
		case client := <-r.join:
			// 参加
			r.clients[client] = true
			// 入室情報の書き込み
		case client := <-r.leave:
			// 退出情報の書き込み
			// 退出
			delete(r.clients, client)
			close(client.send)
		case msg := <-r.forward:
			// 送信内容の解析と書き込み
			var talk Talk
			if err := json.Unmarshal(msg, &talk); err != nil {
				r.echo.Logger.Error(err)
			}
			retMsg := "{\"user_id\":" + strconv.Itoa(talk.User_id) + ", \"action\":\"" + talk.Action + "\", \"x\":\"" + strconv.Itoa(talk.X) + "\", \"y\":\"" + strconv.Itoa(talk.Y) + "\"}"
			byteMsg := *(*[]byte)(unsafe.Pointer(&retMsg))

			// すべてのクライアントにメッセージを送信
			for client := range r.clients {
				select {
				case client.send <- byteMsg:
					// メッセージを送信
				default:
					// 送信に失敗
					delete(r.clients, client)
					close(client.send)
				}
			}
		}
	}
}

// クライアントの退出
func leaveClient(r *Room, c *Client) {
	r.leave <- c
}

// ルームの使用開始
func (r *Room) EnterRoom(c echo.Context, userId int, charaId int, conn *models.DbConnection) error {
	// 最大人数のチェック
	width := (r.size - 1) / 2
	maxNum := width * width
	if len(r.clients) > maxNum {
		return errors.New("The room is over capacity!")
	}

	// WebSocketの準備
	socket, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return err
	}
	client := NewClient(socket, r, userId, charaId)
	r.join <- client
	defer func() { r.leave <- client }()
	go client.Write()
	client.Read()

	// 現在の部屋状態を送信
	for client, exist := range r.clients {
		if exist {
			var talk Talk
			// キャラの状態を送信
			talk = Talk{
				User_id: client.chara.id,
				Action:  "start",
				X:       client.chara.charaPoint.x,
				Y:       client.chara.charaPoint.y,
			}
			msg, err := json.Marshal(talk)
			if err != nil {
				return err
			}
			r.forward <- msg
			// 爆弾の状態を送信
			if client.chara.expTime != -1 {
				talk = Talk{
					User_id: client.chara.id,
					Action:  "set_bomb",
					X:       client.chara.bombPoint.x,
					Y:       client.chara.bombPoint.y,
				}
				msg, err = json.Marshal(talk)
				if err != nil {
					return err
				}
				r.forward <- msg

			}
		}
	}

	// DBへの保存
	roomModel := models.FindRoom(conn, r.id)
	roomModel.AddRoom(conn, userId)

	return nil
}

func (r *Room) GetId() int {
	return r.id
}

// Clientのいない部屋を削除
func (rm *RoomManager) CleanRoom(conn *models.DbConnection) {
	// Clientの確認
	var deleteRooms []*Room
	for _, room := range rm.rooms {
		isDelete := true
		for _, exist := range room.clients {
			if exist {
				isDelete = false
				break
			}
		}
		if isDelete {
			deleteRooms = append(deleteRooms, room)
		}
	}
	// 部屋の削除
	for _, delRoom := range deleteRooms {
		modelRoom := models.FindRoom(conn, delRoom.id)
		modelRoom.DeleteRoom(conn)
		delete(rm.rooms, delRoom.id)
	}
}
