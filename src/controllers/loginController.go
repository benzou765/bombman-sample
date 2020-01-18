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

// POST /login
func LoginPost(c echo.Context) error {
	id_str := c.FormValue("input_id")

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
		user.Insert(dbConn, id)
	} else {
		user = models.FindUser(dbConn, id)
		user.Access(dbConn)
	}
	// create cookie
	cookie := new(http.Cookie)
	cookie.Name = "BombmanUserId"
	cookie.Value = strconv.Itoa(user.Id)
	cookie.Expires = time.Now().Add(6 * time.Hour)
	c.SetCookie(cookie)

	return c.Redirect(http.StatusSeeOther, "/game")
}
