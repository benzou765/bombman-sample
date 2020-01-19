package controllers

import (
	"net/http"
	"strconv"
	"encoding/json"

	// echo
	"github.com/labstack/echo"

	// local packages
	"../socket"
	"../models"
)

type RoomCreateData struct {
	CharaId int `json:"chara_id,int"`
	Size int `json:"size,int"`
}

type RoomSelectData struct {
	CharaId int `json:"chara_id,int"`
}

type RoomInfo struct {
	// 部屋ID
	Id int `json:"id,int"`
	// 部屋の大きさ
	Size int `json:"size,int"`
	// 現在の人数
	Num int `json:"num,int"`
}

type ShowRooms struct {
	Rooms []*RoomInfo `json:"room_info"`
}

var roomManager *socket.RoomManager

func NewRoomManager(e *echo.Echo) {
	roomManager = socket.New(e)
}

func CreateRoom(c echo.Context) error {
	// cookie からIDを取得
	cookie, err := c.Cookie("BombmanUserId")
	if err != nil {
		c.String(http.StatusUnauthorized, "Unauthorized")
	}
	userId, err := strconv.Atoi(cookie.Value)
	if err != nil {
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}

	// 入力データの解析
	reqData := new(RoomCreateData)
	err = c.Bind(reqData)
	if err != nil {
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}
	// ログイン処理
	user := models.FindUser(dbConn, userId)
	if user == nil {
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}
	user.Chara_id = reqData.CharaId
	user.UpdateChara(dbConn)

	// 部屋の作成
	room := roomManager.CreateRoom(dbConn, reqData.Size)
	room.Run()

	// 部屋へ入室
	room.EnterRoom(c, user.Id, dbConn)
	return nil
}

func ShowRoom(c echo.Context) error {
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
	user.UpdateChara(dbConn)

	// 戻り値の作成
	rooms := models.GetAllRoom(dbConn)
	infos := make([]*RoomInfo, 0)
	for _, room := range rooms {
		var users []int
		err := json.Unmarshal([]byte(room.Members), &users)
		if err != nil {
			return c.HTML(http.StatusInternalServerError, "<strong>InternalServerError</strong>")
		}
		info := &RoomInfo{
			Id: room.Id,
			Size: room.Size,
			Num: len(users),
		}
		infos = append(infos, info)

	}
	response := &ShowRooms{
		Rooms: infos,
	}

	return c.JSON(http.StatusOK, response)
}

func EnterRoom(c echo.Context) error {
	// cookie からIDを取得
	cookie, err := c.Cookie("BombmanUserId")
	if err != nil {
		c.String(http.StatusUnauthorized, "Unauthorized")
	}
	userId, err := strconv.Atoi(cookie.Value)
	if err != nil {
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}

	// 入力データの解析
	reqData := new(RoomSelectData)
	err = c.Bind(reqData)
	if err != nil {
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}
	// ログイン処理
	user := models.FindUser(dbConn, userId)
	if user == nil {
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}
	user.Chara_id = reqData.CharaId
	user.UpdateChara(dbConn)

	// 部屋IDの取得
	roomId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}
	room := roomManager.GetRoom(roomId)
	room.EnterRoom(c, user.Id, dbConn)
	return nil
}
