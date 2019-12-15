package models

import (
    // database
    _ "github.com/go-sql-driver/mysql"
)

// User Model
type User struct {
	Id int
	Name string
	Room_id int
	Icon string
}

var (
	tableUser = "user"
)

// insert user
func (u *User) Insert(name string, icon string, room_id int) {
	var err error
	// insert
	_, err = Session.InsertInto(tableUser).Columns("name", "icon", "room_id").Values(name, icon, room_id).Exec()
	if (err != nil) {
		Logger.Error(err)
	}

	// select
	_, err = Session.Select("*").From(tableUser).OrderDesc("id").Limit(1).Load(&u)
	if (err != nil) {
		Logger.Error(err)
	}
}

// find user
func FindUser(id int) *User {
	var u User
	//select
	err := Session.Select("*").From(tableUser).Where("id = ?", id).LoadOne(&u)
	if err != nil {
		Logger.Error(err)
		return nil
	}
	return &u
}

// update user
func (u *User) Update(id int, name string, room_id int) {
	var err error
	// update
	attrsMap := map[string]interface{}{"name": name, "room_id": room_id}
	_, err = Session.Update(tableUser).SetMap(attrsMap).Where("id = ?", id).Exec()
	if (err != nil) {
		Logger.Error(err)
	}

	// select
	_, err = Session.Select("*").From(tableUser).Where("id = ?", id).Load(&u)
	if (err != nil) {
		Logger.Error(err)
	}
}

func (u *User) Delete(id int) {
	var err error
	_, err = Session.DeleteFrom(tableUser).Where("id = ?", id).Exec()
	if (err != nil) {
		Logger.Error(err)
	}
}
