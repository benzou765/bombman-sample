package socket

import (
    "log"
    "encoding/json"
    "unsafe"
    "strconv"

    // echo
    "github.com/labstack/echo"

    // websocket
    "github.com/gorilla/websocket"

    // local packages
    "../models"
)

// 部屋管理の構造体
type RoomManager struct {
    rooms map[int]*Room
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
    // DB接続情報
    dbConn *models.DbConnection
    // 部屋の大きさ
    size int
}

// 通信上のJson構造体
type Talk struct {
    User_id int `json:"id"`
    Action string `json:"action"`
    X int `json:"x"`
    Y int `json:"y"`
}

// websocketのメッセージバッファ
var upgrader = &websocket.Upgrader {
    ReadBufferSize: 1024,
    WriteBufferSize: 1024,
}

// Roomを管理する構造体の初期化
func New(e *echo.Echo) *RoomManager {
    return &RoomManager {
        rooms: make(map[int]*Room),
        logger: e.Logger,
    }
}

func (rm *RoomManager) GetRoom(roomId int) *Room{
    return rm.rooms[roomId]
}

func (rm *RoomManager) CreateRoom(conn *models.DbConnection, size int) *Room {
    // 部屋情報をDBに保存
    var roomModel *models.Room
    roomModel = new(models.Room)
    roomModel.Insert(conn, size)

    room := &Room {
        id: roomModel.Id,
        forward: make(chan []byte),
        join: make(chan *Client),
        leave: make(chan *Client),
        clients: make(map[*Client]bool),
        dbConn: conn,
        size: size,
    }
    rm.rooms[roomModel.Id] = room
    return room
}

// ルーム内での処理
func (r *Room) Run() {
    for {
        select {
        case client := <- r.join:
            // 参加
            r.clients[client] = true
            // 入室情報の書き込み
        case client := <- r.leave:
            // 退出情報の書き込み
            // 退出
            delete(r.clients, client)
            close(client.send)
        case msg := <- r.forward:
            // 送信内容の解析と書き込み
            var talk Talk
            if err := json.Unmarshal(msg, &talk); err != nil {
                log.Fatal(err)
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
func (r *Room) EnterRoom(c echo.Context, userId int, conn *models.DbConnection) error {
    // WebSocketの準備
    socket, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
    if err != nil {
        return err
    }
    client := &Client {
        socket: socket,
        send: make(chan []byte, 256),
        room: r,
        id: userId,
    }
    r.join <- client
    defer func() { r.leave <- client }()
    go client.Write()
    client.Read()

    // DBへの保存
    roomModel := models.FindRoom(conn, r.id)
    roomModel.AddRoom(conn, userId)
    
    return nil
}

func (r *Room) GetId() int {
    return r.id
}
