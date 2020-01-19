package models

import (
	"time"
	// database
	_ "github.com/go-sql-driver/mysql"
)

// User Model
type User struct {
	Id         int
	Chara_id   int
	Created_at string
	Updated_at string
}

const (
	tableUser = "user"
)

// insert user
func (u *User) Insert(conn *DbConnection, charaId int) {
	var err error
	now := time.Now()
	// insert
	_, err = conn.GetSession().InsertInto(tableUser).Columns("chara_id", "created_at", "updated_at").Values(charaId, now, now).Exec()
	if err != nil {
		conn.GetEcho().Logger.Error(err)
	}

	// select
	_, err = conn.GetSession().Select("*").From(tableUser).OrderDesc("id").Limit(1).Load(&u)
	if err != nil {
		conn.GetEcho().Logger.Error(err)
	}
}

// find user
func FindUser(conn *DbConnection, id int) *User {
	var u User
	//select
	err := conn.GetSession().Select("*").From(tableUser).Where("id = ?", id).LoadOne(&u)
	if err != nil {
		conn.GetEcho().Logger.Error(err)
		return nil
	}
	return &u
}

func (u *User) UpdateChara(conn *DbConnection) {
	var err error
	now := time.Now()
	// update
	attrsMap := map[string]interface{}{"chara_id": u.Chara_id, "updated_at": now}
	_, err = conn.GetSession().Update(tableUser).SetMap(attrsMap).Where("id = ?", u.Id).Exec()
	if err != nil {
		conn.GetEcho().Logger.Error(err)
	}
}
