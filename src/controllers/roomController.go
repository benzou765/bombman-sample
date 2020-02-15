package controllers

import (
	"net/http"
	"strconv"

	// echo
	"github.com/labstack/echo"

	// local packages
	"../models"
	"../socket"
)

type RequestCreateRoom struct {
	CharaId int `json:"chara_id,int"`
	Size    int `json:"size,int"`
}

type ResponseCreateRoom struct {
	RoomId int `json:"room_id,int"`
}

type RoomInfo struct {
	// 部屋ID
	Id int `json:"id,int"`
	// 部屋の大きさ
	Size int `json:"size,int"`
	// 現在の人数
	Num int `json:"num,int"`
}

type ResponseShowRoom struct {
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
		c.Echo().Logger.Error(err)
		c.String(http.StatusUnauthorized, "Unauthorized")
	}
	userId, err := strconv.Atoi(cookie.Value)
	if err != nil {
		c.Echo().Logger.Error(err)
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}

	// 入力データの解析
	reqData := new(RequestCreateRoom)
	err = c.Bind(reqData)
	if err != nil {
		c.Echo().Logger.Error(err)
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}
	// ログイン処理
	user := models.FindUser(dbConn, userId)
	if user == nil {
		c.Echo().Logger.Error(err)
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}
	user.Chara_id = reqData.CharaId
	user.UpdateChara(dbConn)

	// 部屋の掃除
	roomManager.CleanRoom(dbConn)

	// 部屋の作成
	room := roomManager.CreateRoom(dbConn, reqData.Size, c.Echo())
	go room.Run(dbConn)

	response := &ResponseCreateRoom{
		RoomId: room.GetId(),
	}
	return c.JSON(http.StatusOK, response)
}

func ShowRoom(c echo.Context) error {
	// cookie からIDを取得
	cookie, err := c.Cookie("BombmanUserId")
	if err != nil {
		c.Echo().Logger.Error(err)
		c.String(http.StatusUnauthorized, "Unauthorized")
	}
	userId, err := strconv.Atoi(cookie.Value)
	if err != nil {
		c.Echo().Logger.Error(err)
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}
	// ログイン処理
	user := models.FindUser(dbConn, userId)
	if user == nil {
		c.Echo().Logger.Error(err)
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}
	user.UpdateChara(dbConn)

	// 戻り値の作成
	rooms := models.GetAllRoom(dbConn)
	infos := make([]*RoomInfo, 0)
	for _, room := range rooms {
		members := room.GetMembers(dbConn)
		info := &RoomInfo{
			Id:   room.Id,
			Size: room.Size,
			Num: members,
		}
		infos = append(infos, info)

	}
	response := &ResponseShowRoom{
		Rooms: infos,
	}

	return c.JSON(http.StatusOK, response)
}

func ConnectWebSocket(c echo.Context) error {
	// cookie からIDを取得
	cookie, err := c.Cookie("BombmanUserId")
	if err != nil {
		c.Echo().Logger.Error(err)
		c.String(http.StatusUnauthorized, "Unauthorized")
	}
	userId, err := strconv.Atoi(cookie.Value)
	if err != nil {
		c.Echo().Logger.Error(err)
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}
	// ログイン処理
	user := models.FindUser(dbConn, userId)
	if user == nil {
		c.Echo().Logger.Error(err)
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}
	user.UpdateChara(dbConn)

	// 部屋へ入室
	roomId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.Echo().Logger.Error(err)
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}
	room, err := roomManager.GetRoom(roomId)
	if err != nil {
		c.Echo().Logger.Error(err)
		return c.HTML(http.StatusForbidden, "<strong>Forbidden</strong>")
	}

	return room.EnterRoom(c, user.Id, user.Chara_id, dbConn)
}
