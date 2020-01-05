package models

import (
	// echo
	"github.com/labstack/echo"

	// database
	_ "github.com/go-sql-driver/mysql"
	"github.com/gocraft/dbr"
)

//var Conn *dbr.Connection
type DbConnection struct {
	session *dbr.Session
	echo    *echo.Echo
}

func NewConnection(e *echo.Echo) (dc *DbConnection) {
	dc = &DbConnection{}
	//	var err error
	conn, err := dbr.Open("mysql", "root:root@tcp(db:3306)/mydb", nil)
	if err != nil {
		e.Logger.Error(err)
	}
	dc.echo = e
	dc.session = conn.NewSession(nil)
	return
}

func (dc *DbConnection) GetSession() *dbr.Session {
	return dc.session
}

func (dc *DbConnection) GetEcho() *echo.Echo {
	return dc.echo
}
