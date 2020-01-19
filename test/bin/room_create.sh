#!/bin/sh
curl -v -b cookie.txt -XPOST http://localhost:8080/room/create
