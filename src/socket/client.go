package socket

import (
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
	// 爆弾爆発までの時間 (-1は未設置)
	expTime int
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
	initCharaX := num / width
	initCharaY := num % width
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
		expTime:    -1,
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

// チャットルームに届いているメッセージを読み取る
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

// チャットルームにメッセージを送る
func (c *Client) Write() {
	for msg := range c.send {
		if err := c.socket.WriteMessage(websocket.TextMessage, msg); err != nil {
			break
		}
	}
	c.socket.Close()
}
