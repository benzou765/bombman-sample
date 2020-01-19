### cookieを取得しつつ、curlを実行する方法
```
curl -v -c cookie.txt -F "input_id=8" -XPOST http://localhost:8080/login
```

### cookieを付随してcurlを実行する方法
```
curl -v -b cookie.txt -XPOST http://localhost:8080/room/create
```
