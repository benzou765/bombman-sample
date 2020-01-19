#!/bin/sh
curl -v -c cookie.txt -F "input_id=0" -XPOST http://localhost:8080/login
