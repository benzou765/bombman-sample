package main

import (
    "os"
    "io"
    "net/http"
    "fmt"
    "html/template"

    // echo
    "github.com/labstack/echo"
    "github.com/labstack/echo/middleware"
    "github.com/labstack/gommon/log"

    // local packages
    "./controllers"
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
    e.Static("/assets", "assets/bootstrap-3.4.1-dist")
    e.POST("/login", controllers.LoginPost)
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
