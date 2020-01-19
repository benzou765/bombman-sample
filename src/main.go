package main

import (
	"fmt"
	"html/template"
	"io"
	"net/http"
	"os"

	// echo
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	"github.com/labstack/gommon/log"

	// local packages
	"./controllers"
	"./models"
)

// htmlテンプレートを定義する構造体
type Template struct {
	templates *template.Template
}

// htmlテンプレートを描画するための設定
func (t *Template) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

// ルートの設定
func setRoute(e *echo.Echo) {
	// Test
	e.GET("/ping", func(c echo.Context) error {
		return c.String(http.StatusOK, "Hello, World!")
	})
	e.File("/", "public/index.html")
	e.File("/game", "public/game/game.html")
	e.Static("/assets", "assets/bootstrap-3.4.1-dist")
	e.Static("/js", "public/game/js")
	e.Static("/img", "public/game/img")
	e.POST("/login", controllers.LoginPost)
	e.POST("/rooms/create", controllers.CreateRoom)
	e.POST("/rooms/:id", controllers.EnterRoom)
	e.POST("/rooms", controllers.ShowRoom)
}

// メイン関数
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

	// コントローラ関連の初期化
	dbConn := models.NewConnection(e)
	controllers.New(dbConn)
	controllers.NewRoomManager(e)

	// htmlテンプレートの設定
	t := &Template{
		templates: template.Must(template.ParseGlob("templates/*.html")),
	}
	e.Renderer = t


	// Route
	setRoute(e)

	e.Logger.Info("start web")
	e.Logger.Fatal(e.Start(addr))
}
