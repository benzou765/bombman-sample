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

type RoomMembers struct {
	Members []int `json:"members"`
}

const (
	tableRoom = "room"
)

// create room
func (room *Room) Insert(conn *DbConnection, size int) {
	var err error
	now := time.Now()
	var roomMembers RoomMembers
	roomMembers.Members = []int{}
	byteMembers, _ := json.Marshal(roomMembers)

	// insert
	_, err = conn.GetSession().InsertInto(tableRoom).Columns("size", "members", "created_at", "updated_at").Values(size, string(byteMembers), now, now).Exec()
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

func (room *Room) AddMember(conn *DbConnection, userId int) {
		// members変数にuserIdを追加
	var roomMembers RoomMembers
	err := json.Unmarshal([]byte(room.Members), &roomMembers)
	if err != nil {
		conn.GetEcho().Logger.Error(err)
	}
	roomMembers.Members = append(roomMembers.Members, userId)
	byteMembers, _ := json.Marshal(roomMembers)

	// レコードの更新
	now := time.Now()
	attrsMap := map[string]interface{}{"members": string(byteMembers), "updated_at": now}
	_, err = conn.GetSession().Update(tableRoom).SetMap(attrsMap).Where("id = ?", room.Id).Exec()
	if err != nil {
		conn.GetEcho().Logger.Error(err)
	}
}

func (room *Room) DeleteMember(conn *DbConnection, userId int) {
	// members変数にuserIdを追加
	var roomMembers RoomMembers
	err := json.Unmarshal([]byte(room.Members), &roomMembers)
	if err != nil {
		conn.GetEcho().Logger.Error(err)
	}
	roomMembers.Members = removeArray(roomMembers.Members, userId)
	byteMembers, _ := json.Marshal(&roomMembers)

	// レコードの更新
	now := time.Now()
	attrsMap := map[string]interface{}{"members": byteMembers, "updated_at": now}
	_, err = conn.GetSession().Update(tableRoom).SetMap(attrsMap).Where("id = ?", room.Id).Exec()
	if err != nil {
		conn.GetEcho().Logger.Error(err)
	}
}

// int型のsliceからsearchを削除
func removeArray(arrayInt []int, search int) []int {
	var result []int
	for _, val := range arrayInt {
		if val != search {
			result = append(result, val)
		}
	}
	return result
}

func (room *Room) GetMembers(conn *DbConnection) []int {
	var roomMembers RoomMembers
	err := json.Unmarshal([]byte(room.Members), &roomMembers)
	if err != nil {
		conn.GetEcho().Logger.Error(err)
	}
	return roomMembers.Members
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