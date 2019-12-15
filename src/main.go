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
)

func setRoute(e *echo.Echo) {
    // Test
    e.GET("/ping", func(c echo.Context) error {
        return c.String(http.StatusOK, "Hello, World!")
    })
    // 静的ページ
    e.File("/", "public/index.html")
    e.Static("/assets", "assets/bootstrap-3.4.1-dist")
    // database
}

func main() {
    // Init echo
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

    // Route
    setRoute(e)

    e.Logger.Info("start web")
    e.Logger.Fatal(e.Start(addr))
}
