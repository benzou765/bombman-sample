package controllers

import (
	"net/http"

	// echo
	"github.com/labstack/echo"

	// local packages
	"../socket"
)

type Status struct {
	Status string `json:"status"`
}

var roomManager *socket.RoomManager

func NewRoomManager(e *echo.Echo) {
	roomManager = socket.New(e)
}

func CreateRoom(c echo.Context) error {
	cookie, err := c.Cookie("BombmanUserId")
	if err != nil {
		c.String(http.StatusUnauthorized, "Unauthorized")
	}
	c.Echo().Logger.Info(cookie.Value)
	c.Echo().Logger.Info(cookie.Name)
	status := &Status {
		Status: "OK",
	}
	return c.JSON(http.StatusOK, status)
}

func EnterRoom(c echo.Context) error {
	status := &Status {
		Status: "OK",
	}
	return c.JSON(http.StatusOK, status)
}

func ExitRoom(c echo.Context) error {
	status := &Status {
		Status: "OK",
	}
	return c.JSON(http.StatusOK, status)
}
