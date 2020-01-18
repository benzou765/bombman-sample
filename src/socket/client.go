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
	 // ユーザーID
	 id int
 }
 
func (c *Client) GetId() int {
	return c.id
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
		 if err := c.socket.WriteMessage(websocket.TextMessage, msg);
				 err != nil {
			 break
		 }
	 }
	 c.socket.Close()
 }