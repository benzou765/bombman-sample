package controllers

import (
	"net/http"
    "strconv"

	// echo
    "github.com/labstack/echo"

	// local packages
	"../models"
)

type jsonUser struct {
    Id int
    Name string
}

// insert
func InsertUser(c echo.Context) error {
    name := c.FormValue("name")
    icon := c.FormValue("icon_name")
    user := new(models.User)
    user.Insert(name, icon, 1)

    result := jsonUser{user.Id, user.Name}
    return c.JSON(http.StatusOK, result)
}

// select one
func SelectUser(c echo.Context) error {
    id, _ := strconv.Atoi(c.Param("id"))
    user := models.FindUser(id)

    result := jsonUser{user.Id, user.Name}
    return c.JSON(http.StatusOK, result)
}

// update
func UpdateUser(c echo.Context) error {
    user := new(models.User)
    user.Update(1, "nameless", 1)
    return c.NoContent(http.StatusOK)
}

// delete
func DeleteUser(c echo.Context) error {
    id, _ := strconv.Atoi(c.Param("id"))
    user := new(models.User)
    user.Delete(id)
    return c.NoContent(http.StatusNoContent)
}
