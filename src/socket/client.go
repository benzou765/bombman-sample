package socket

import (
	"time"
	// websocket
	"github.com/gorilla/websocket"
)

// クライアント構造体
type Client struct {
	socket *websocket.Conn
	// チャネル
	send chan []byte
	// チャットルーム
	room *Room
	// ユーザ（キャラクター）情報
	chara *Character
}

type Character struct {
	// ユーザID
	id int
	// キャラID（色）
	charaId int
	// キャラの座標
	charaPoint *Point
	// キャラの向き 0:down、1:left、2:right、3:up
	direction int
	// 爆弾爆発までの時間
	expTime *time.Timer
	// 爆弾の座標
	bombPoint *Point
}

type Point struct {
	x int
	y int
}

// クライアント作成
func NewClient(socket *websocket.Conn, room *Room, userId int, charaId int) *Client {
	// キャラの初期位置設定
	width := (room.size - 1) / 2
	num := len(room.clients)
	initCharaX := ((1 + 2 * (num % width)) * 32) + 16
	initCharaY := ((1 + 2 * (num / width)) * 32) + 16
	charaPoint := &Point{
		x: initCharaX,
		y: initCharaY,
	}

	// 爆弾の初期設定
	bombPoint := &Point{
		x: 0,
		y: 0,
	}

	// キャラの初期化
	chara := &Character{
		id:         userId,
		charaId:    charaId,
		charaPoint: charaPoint,
		direction:  0,
		expTime:    nil,
		bombPoint:  bombPoint,
	}

	// クライアントの初期化
	client := &Client{
		socket: socket,
		send:   make(chan []byte, 256),
		room:   room,
		chara:  chara,
	}
	return client
}

// socketに届いているメッセージを読み取る
func (c *Client) Read() {
	for {
		if _, msg, err := c.socket.ReadMessage(); err == nil {
			c.room.forward <- msg
		} else {
			break
		}
	}
	c.socket.Close()
}

// socketにメッセージを送る
func (c *Client) Write() {
	for msg := range c.send {
		if err := c.socket.WriteMessage(websocket.TextMessage, msg); err != nil {
			break
		}
	}
	c.socket.Close()
}

func (c *Client) SetTimer() {
	// 爆発までの時間
	c.chara.expTime = time.NewTimer(1500 * time.Millisecond)
}

func (c *Client) TimerBomb(byteMsg []byte) {
	<- c.chara.expTime.C
	c.chara.expTime = nil
	// 爆発メッセージの送信
	c.room.forward <- byteMsg
} 

func (c *Client) UpdateCharaPoint(x int, y int, d int) {
	c.chara.charaPoint.x = x
	c.chara.charaPoint.y = y
	c.chara.direction = d
}
