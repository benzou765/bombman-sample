package main

import (
    "os"
    "net/http"
    "fmt"

    // echo
    "github.com/labstack/echo"
    "github.com/labstack/echo/middleware"
    "github.com/labstack/gommon/log"

    // local packages
    "./controllers"
    "./chat"
    "./models"
)

func main() {
    var addr = ":8080"

    e := echo.New()

    // App Log
    e.Logger.SetLevel(log.DEBUG)
    e.Logger.Info("initialize")

    // WWW Log
    wwwLogFile, errWwwLogFile := os.Create("logs/www.log")
    defer wwwLogFile.Close()
    if errWwwLogFile != nil {
        fmt.Println(errWwwLogFile)
    }
    e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
        Output: wwwLogFile,
    }))
    e.Use(middleware.Recover())

    // DBへの接続
    models.ConnectionDB(e);

    // チャット部屋の作成
    r := room.NewRoom(e)

    // Route
    e.Static("/", "./public")
    e.GET("/ping", func(c echo.Context) error {
        return c.String(http.StatusOK, "Hello, World!")
    })
    // websocket
    e.GET("/room/:user_id", r.Start)
    // database
    e.POST("/user", controllers.InsertUser)
    e.GET("/user/:id", controllers.SelectUser)
    e.PUT("/user/:id", controllers.UpdateUser)
    e.DELETE("/user/:id", controllers.DeleteUser)

    // 部屋の監視
    go r.Run()

    e.Logger.Info("start web")
    e.Logger.Fatal(e.Start(addr))
}
