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

type RequestUpdateCharaId struct {
	CharaId int `json:"chara_id,int"`
}

type ResponseUpdateCharaId struct {
	Status string `json:"status,string"`
}

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
		user.UpdateChara(dbConn)
	}
	// create cookie
	cookie := new(http.Cookie)
	cookie.Name = "BombmanUserId"
	cookie.Value = strconv.Itoa(user.Id)
	cookie.Expires = time.Now().Add(6 * time.Hour)
	c.SetCookie(cookie)

	return c.Redirect(http.StatusSeeOther, "/game")
}

func UpdateCharaId(c echo.Context) error {
	// cookie からIDを取得
	cookie, err := c.Cookie("BombmanUserId")
	if err != nil {
		c.String(http.StatusUnauthorized, "Unauthorized")
	}
	userId, err := strconv.Atoi(cookie.Value)
	if err != nil {
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}
	// ログイン処理
	user := models.FindUser(dbConn, userId)
	if user == nil {
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}

	// リクエストデータの解析
	reqData := new(RequestUpdateCharaId)
	err = c.Bind(reqData)
	if err != nil {
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}
	user.Chara_id = reqData.CharaId
	user.UpdateChara(dbConn)

	// レスポンスデータの作成
	response := &ResponseUpdateCharaId{
		Status: "OK",
	}

	return c.JSON(http.StatusOK, response)
}
