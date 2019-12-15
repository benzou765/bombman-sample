package models

import (
    // echo
    "github.com/labstack/echo"

	// database
    _ "github.com/go-sql-driver/mysql"
    "github.com/gocraft/dbr"
)

var Conn *dbr.Connection
var Session *dbr.Session
var Logger echo.Logger

func ConnectionDB(e *echo.Echo) {
	var err error
	Logger = e.Logger
//	e.Logger.Info("connect database")
	Conn, err = dbr.Open("mysql", "root:root@tcp(db:3306)/mydb", nil)
	if err != nil {
		Logger.Error(err)
	}
	Session = Conn.NewSession(nil)
}
