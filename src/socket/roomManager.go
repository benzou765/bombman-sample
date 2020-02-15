package socket

import (
	"encoding/json"
	"errors"
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
	clients map[int]*Client
	// 部屋の大きさ
	size int
	// Echoフレームワーク
	echo *echo.Echo
}

// 通信上のJson構造体
type Talk struct {
	User_id   int    `json:"user_id,int"`
	Action    string `json:"action"` // start, move, set_bomb, exp_bomb, dead のいずれか
	Direction int    `json:"direction,int"` // 0:down, 1:left, 2:right, 3:up
	X         int    `json:"x,int"`
	Y         int    `json:"y,int"`
}

// 初回のキャラ作成時のJson構造体
type InitTalk struct {
	User_id   int    `json:"user_id,int"`
	Action    string `json:"action"` // start, move, set_bomb, exp_bomb, dead のいずれか
	Chara_id  int    `json:"chara_id,int"`
	Direction int    `json:"direction,int"` // 0:down, 1:left, 2:right, 3:up
	X         int    `json:"x,int"`
	Y         int    `json:"y,int"`
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
		clients: make(map[int]*Client),
		size:    size,
		echo:    echo,
	}
	rm.rooms[roomModel.Id] = room
	return room
}

// ルーム内での処理
func (r *Room) Run(conn *models.DbConnection) {
	for {
		select {
		case client := <- r.join:
			// 参加
			r.clients[client.chara.id] = client

			// 全クライアントに新規クライアントの情報を送信
			for _, roomClient := range r.clients {
				var initTalk *InitTalk
				// キャラの状態を送信
				initTalk = &InitTalk{
					User_id:   client.chara.id,
					Action:    "start",
					Chara_id:  client.chara.charaId,
					Direction: client.chara.direction,
					X:         client.chara.charaPoint.x,
					Y:         client.chara.charaPoint.y,
				}
				byteMsg, err := json.Marshal(initTalk)
				if err != nil {
					r.echo.Logger.Error(err)
				} else {
					roomClient.send <- byteMsg
				}
			}
			// 新規クライアントにほかクライアントの情報を送信
			for _, roomClient := range r.clients {
				var initTalk *InitTalk
				// キャラの状態を送信
				initTalk = &InitTalk{
					User_id:   roomClient.chara.id,
					Action:    "start",
					Chara_id:  roomClient.chara.charaId,
					Direction: roomClient.chara.direction,
					X:         roomClient.chara.charaPoint.x,
					Y:         roomClient.chara.charaPoint.y,
				}
				byteMsg, err := json.Marshal(initTalk)
				if err != nil {
					r.echo.Logger.Error(err)
				} else {
					client.send <- byteMsg
				}
				// 爆弾の状態を送信
				if roomClient.chara.expTime != nil {
					var talk *Talk
					talk = &Talk{
						User_id:   roomClient.chara.id,
						Action:    "set_bomb",
						Direction: 0,
						X:         roomClient.chara.bombPoint.x,
						Y:         roomClient.chara.bombPoint.y,
					}
					byteMsg, err = json.Marshal(talk)
					if err != nil {
						r.echo.Logger.Error(err)
					} else {
						client.send <- byteMsg
					}
				}
			}
			// 部屋状態の更新
			roomModel := models.FindRoom(conn, r.id)
			roomModel.AddMember(conn, client.chara.id)
		case client := <- r.leave:
			r.ExitRoom(client, conn)
		case msg := <- r.forward:
			// 送信内容の解析と書き込み
			var talk Talk
			if err := json.Unmarshal(msg, &talk); err != nil {
				r.echo.Logger.Error(err)
			}
			retMsg := &Talk{
				User_id:   talk.User_id,
				Action:    talk.Action,
				Direction: talk.Direction,
				X:         talk.X,
				Y:         talk.Y,
			}
			retByteMsg, _ := json.Marshal(retMsg)

			// すべてのクライアントにメッセージを送信
			for _, client := range r.clients {
				if client.chara.id == talk.User_id {
					switch talk.Action {
					case "move":
						// キャラの座標を更新
						client.UpdateCharaPoint(talk.X, talk.Y, talk.Direction)
					case "set_bomb":
						// 爆弾の時限設定
						client.SetTimer()
						// 爆発時のメッセージを生成
						expMsg := &Talk{
							User_id:   talk.User_id,
							Action:    "exp_bomb",
							Direction: 0,
							X:         talk.X,
							Y:         talk.Y,
						}
						expByteMsg, _ := json.Marshal(expMsg)
						// 爆弾の時限監視
						go client.TimerBomb(expByteMsg)
					case "exp_bomb":
						// 爆発時の処理
					case "dead":
						// 死亡時の処理
					}
				}

				select {
				case client.send <- retByteMsg:
					// メッセージを送信
				default:
					// 送信に失敗
					r.ExitRoom(client, conn)
				}
			}
		}
	}
}

// 部屋離脱時の処理
func (r *Room) ExitRoom(client *Client, conn *models.DbConnection) {
	// 部屋状態の更新
	roomModel := models.FindRoom(conn, r.id)
	roomModel.DeleteMember(conn, client.chara.id)
	// 退出
	delete(r.clients, client.chara.id)
	close(client.send)
}

// ルームの使用開始
func (r *Room) EnterRoom(c echo.Context, userId int, charaId int, conn *models.DbConnection) error {
	// 最大人数のチェック
	width := (r.size - 1) / 2
	maxNum := width * width
	if len(r.clients) > maxNum {
		r.echo.Logger.Error("The room is over capacity!")
		return errors.New("The room is over capacity!")
	}

	// WebSocketの準備
	socket, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		r.echo.Logger.Error(err)
		return nil
	}
	client := NewClient(socket, r, userId, charaId)
	r.join <- client
	// socketでエラーが発生した場合の処理
	defer func() { r.leave <- client }()

	// socketによる送受信の開始
	go client.Write()
	client.Read()

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
		clientNum := len(room.clients)
		if clientNum == 0 {
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
