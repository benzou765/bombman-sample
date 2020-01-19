package models

import (
	"time"
	"encoding/json"
	// database
	_ "github.com/go-sql-driver/mysql"
)

type Room struct {
	Id int
	Size int
	Members string // json
	Created_at string
	Updated_at string
}

const (
	tableRoom = "room"
)

// create room
func (room *Room) Insert(conn *DbConnection, size int) {
	var err error
	now := time.Now()
	members := ""
	// insert
	_, err = conn.GetSession().InsertInto(tableRoom).Columns("size", "members", "created_at", "updated_at").Values(size, members, now, now).Exec()
	if err != nil {
		conn.GetEcho().Logger.Error(err)
	}

	// select
	_, err = conn.GetSession().Select("*").From(tableRoom).OrderDesc("id").Limit(1).Load(&room)
	if err != nil {
		conn.GetEcho().Logger.Error(err)
	}
}

// find room
func FindRoom(conn *DbConnection, id int) *Room {
	var room Room
	//select
	err := conn.GetSession().Select("*").From(tableRoom).Where("id = ?", id).LoadOne(&room)
	if err != nil {
		conn.GetEcho().Logger.Error(err)
		return nil
	}
	return &room
}

func (room *Room) AddRoom(conn *DbConnection, userId int) {
	// members変数にuserIdを追加
	var users []int
	err := json.Unmarshal([]byte(room.Members), &users)
	if err != nil {
		conn.GetEcho().Logger.Info(err)
	}
	conn.GetEcho().Logger.Info(users)
	users = append(users, userId)
	users_str, _ := json.Marshal(&users)
	room.Members = string(users_str)

	// レコードの更新
	now := time.Now()
	attrsMap := map[string]interface{}{"members": room.Members, "updated_at": now}
	_, err = conn.GetSession().Update(tableRoom).SetMap(attrsMap).Where("id = ?", room.Id).Exec()
	if err != nil {
		conn.GetEcho().Logger.Error(err)
	}
}

func GetAllRoom(conn *DbConnection) []Room {
	var rooms []Room
	conn.GetSession().Select("*").From(tableRoom).Load(&rooms)
	return rooms
}

// delete room
func (room *Room) DeleteRoom(conn *DbConnection) {
	var err error
	_, err = conn.GetSession().DeleteFrom(tableRoom).Where("id = ?", room.Id).Exec()
	if err != nil {
		conn.GetEcho().Logger.Error(err)
	}
}