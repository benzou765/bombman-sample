package controllers

import (
	"net/http"
	"strconv"
	"time"

	// echo
	"github.com/labstack/echo"

	// local packages
	"../models"
)

// ログイン関連の構造体

// POST /login
func LoginPost(c echo.Context) error {
	id_str := c.FormValue("input_id")

	// Database
	conn := models.NewConnection(c.Echo())

	// Validate
	id, err := strconv.Atoi(id_str)
	if err != nil {
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}
	// ログイン処理
	var user *models.User
	if id == 0 {
		// id が 0 の場合はアカウントを新規作成
		user = new(models.User)
		user.Insert(conn, id)
	} else {
		user = models.FindUser(conn, id)
		user.Access(conn)
	}
	// create cookie
	cookie := new(http.Cookie)
	cookie.Name = "BombmanUserId"
	cookie.Value = strconv.Itoa(user.Id)
	cookie.Expires = time.Now().Add(1 * time.Hour)
	c.SetCookie(cookie)

	return c.Redirect(http.StatusSeeOther, "/game")
}
