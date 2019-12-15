package controllers

import (
    "net/http"

    // echo
    "github.com/labstack/echo"
)

// ログイン関連の構造体
type UserId struct {
    Id int `form:"id"`
}

// POST /login
func LoginPost(c echo.Context) error {
    data := map[string]interface{} {
        "Title": "爆弾マン？",
    }
    return c.Render(http.StatusOK, "menu", data)
}
