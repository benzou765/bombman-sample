package models

import (
    // database
    _ "github.com/go-sql-driver/mysql"
)

// Chat model
type ChatLog struct {
	Id int
	Room_id int
	User_id int
	Message string
}

var (
	tableLog = "chat_log"
)

func (log *ChatLog) Insert(user_id int, room_id int, message string) {
	var err error
	_, err = Session.InsertInto(tableLog).Columns("room_id", "user_id", "message").Values(room_id, user_id, message).Exec()
	if err != nil {
		Logger.Error(err)
	}
}

func SelectAll() []ChatLog {
	var logs []ChatLog
	var err error
	_, err = Session.Select("*").From(tableLog).Load(&logs)
	if err != nil {
		Logger.Error(err)
	}
	return logs
}
