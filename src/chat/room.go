package room

import (
    "strconv"
    "log"
    "encoding/json"
    "unsafe"

    // echo
    "github.com/labstack/echo"

    // websocket
    "github.com/gorilla/websocket"

    // local packages
    "../models"
)

// チャットルーム構造体
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
}

// 通信上のJson構造体
type Talk struct {
    User_id int `json:"user_id"`
    Message string `json:"message"`
}

var Logger echo.Logger

func NewRoom(e *echo.Echo) *Room {
    Logger = e.Logger

    return &Room {
        id: 1,
        forward: make(chan []byte),
        join: make(chan *Client),
        leave: make(chan *Client),
        clients: make(map[*Client]bool),
    }
}

// チャットルーム管理メソッド
func (r *Room) Run() {
    for {
        select {
        case client := <- r.join:
            // 参加
            r.clients[client] = true
            // 入室情報の書き込み
            chatLog := new(models.ChatLog)
            Logger.Info("ID:", client.id, " user login")
            chatLog.Insert(client.id, r.id, "[INFO]ユーザーが入室しました")
        case client := <- r.leave:
            // 退出情報の書き込み
            chatLog := new(models.ChatLog)
            Logger.Info("ID:", client.id, " user logout")
            chatLog.Insert(client.id, r.id, "[INFO]ユーザーが退出しました")
            // 退出
            delete(r.clients, client)
            close(client.send)
        case msg := <- r.forward:
            // 送信内容の解析と書き込み
            var talk Talk
            if err := json.Unmarshal(msg, &talk); err != nil {
                log.Fatal(err)
            }
            chatLog := new(models.ChatLog)
            Logger.Info("ID:", talk.User_id, " user send message:", talk.Message)
            chatLog.Insert(talk.User_id, r.id, talk.Message)
            user := models.FindUser(talk.User_id);
            retMsg := "{\"user_id\":" + strconv.Itoa(user.Id) + ", \"name\":\"" + user.Name + "\", \"icon\":\"" + user.Icon + "\", \"message\":\"" + talk.Message + "\"}"
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

const (
    socketBufferSize = 1024
    messageBufferSize = 256
)

var upgrader = &websocket.Upgrader {
    ReadBufferSize: socketBufferSize,
    WriteBufferSize: socketBufferSize,
}

func leaveClient(r *Room, c *Client) {
    r.leave <- c
}

func (r *Room) Start(c echo.Context) error {
    Logger.Info("create room")
    // ユーザーIDの読み取り
    id, _ := strconv.Atoi(c.Param("user_id"))

    // ユーザーの存在確認
    user := models.FindUser(id)
    if user == nil {
        user = new(models.User)
        user.Insert("nameless", "CowboyButton", r.id)
    }

    // WebSocketの準備
    socket, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
    if err != nil {
        return err
    }
    client := &Client {
        socket: socket,
        send: make(chan []byte, messageBufferSize),
        room: r,
        id: user.Id,
    }
    r.join <- client
    defer func() { r.leave <- client }()
    go client.Write()
    client.Read()
    return nil
}
