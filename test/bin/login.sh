#!/bin/sh
if [ $# -ne 1 ]; then
    echo "set argument user_id"
    exit 1
fi

curl -v -c cookie.txt -F "input_id=$1" -XPOST http://localhost:8080/login
