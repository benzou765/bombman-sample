package models

import (
	"time"
	// database
	_ "github.com/go-sql-driver/mysql"
)

type ActionLog struct {
	Id int
	Room_id int
	User_id int
	Log string
	Created_at string
}

const (
	tableActionLog = "action_log"
)

func (actionLog *ActionLog) Insert(conn *DbConnection, roomId int, userId int, log string) {
	var err error
	now := time.Now()
	// insert
	_, err = conn.GetSession().InsertInto(tableActionLog).Columns("room_id", "user_id", "log", "created_at").Values(roomId, userId, log, now).Exec()
	if err != nil {
		conn.GetEcho().Logger.Error(err)
	}

	// select
	_, err = conn.GetSession().Select("*").From(tableActionLog).OrderDesc("id").Limit(1).Load(&actionLog)
	if err != nil {
		conn.GetEcho().Logger.Error(err)
	}
}
