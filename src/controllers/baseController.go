package controllers

import (
	// local packages
	"../models"
)

var dbConn *models.DbConnection
// 初期化
func New(conn *models.DbConnection) {
	dbConn = conn
}
