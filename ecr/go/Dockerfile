FROM golang:1.12-alpine

RUN apk add tzdata && \
    cp /usr/share/zoneinfo/Asia/Tokyo /etc/localtime && \
    apk del tzdata && \
    rm -rf /var/cache/apk/*

RUN apk add --no-cache git
RUN go get github.com/labstack/echo/...
RUN go get github.com/labstack/gommon/log
RUN go get github.com/gorilla/websocket
RUN go get github.com/go-sql-driver/mysql
RUN go get github.com/gocraft/dbr
RUN go get github.com/gocraft/dbr/dialect

# import source file
ADD app.tar.gz /app

WORKDIR /app 

CMD go run main.go
