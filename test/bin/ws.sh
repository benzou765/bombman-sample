#!/bin/sh
if [ $# -ne 2 ]; then
    echo "set argument user_id and room_id"
    exit 1
fi

../node_modules/wscat/bin/wscat -H "Cookie:BombmanUserId=$1" -c localhost:8080/ws/$2
