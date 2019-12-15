# WebSocketによるリアルタイム通信のゲーム
部屋数は無限大, 1部屋最大100,000ユーザを想定してゲームを構築
最終的には特定インスタンスサイズでの限界、部屋数のスケール方法について検討できるようにする

## 設計
ステージサイズ（計算式）
n*n -> (n-2) * ceil(n/2) + ceil(n/2) * (ceil(n/2)-1)

101*101 -> 99 * 50 + 50 * 49 = 7400
401*401 -> 119600
最大ステージサイズ
401 * 401

## スケール方法
RedisのPub/Subを使う。割と一般的みたい
* https://www.tetsis.com/blog/?p=632
* https://qiita.com/mserizawa/items/31e94c25bc177dcbc2c9

別の方法によるスケール
* https://www.slideshare.net/kidach1/nodejs-54841327
* https://www.atmarkit.co.jp/ait/articles/1010/20/news105.html
* https://www.walksocket.com/archives/29



### 気づいたこと
LoadBalancerとWebSocketの相性は悪い（LBはコネクションを確立するためだけに存在するので当たり前）。
なので、コネクションを確立したあとは別サーバに接続するよう促し、通信させるのが良さそう

# 実装中のメモ
gorillaライブラリを使用してwebsocketを実装するとUnity経由でも動作
golang は先頭が大文字か小文字かでprivateとpublicを使い分けている。
パッケージ化するときは注意
dbrからパラメータを受け取る際にも変数が大文字で始まっていないと値が入らない
下記は例
```
type User struct {
    Id int
}
```

# echoフレームワーク
公式サイト：https://echo.labstack.com/  
FWのGinより早いらしい。日本語ドキュメントは皆無なので、頑張るしか無さそう

# 起動手順
下記コマンドを実行
```
$ docker-compose build
$ docker-compose up
```
バックグラウンドで実行してしまうとログが見れなくなるので、フォアグラウンドで実行すること  
その後、ブラウザを起動し、下記サイトへアクセス  
http://localhost:8080/chat  
勝手にwebsocket通信を行う。  

# テストコマンド
追々は単体テストできるようにする
```
$ curl -X POST -d '{"id":"1", "name":"hoge", "room_id":"1"}' localhost:8080/user
$ curl localhost:8080/user/1
$ curl -X POST -d '{"id":"1", "name":"hoge", "room_id":"2"}' localhost:8080/user/1
```

# mysql関連
user: root
pass: root
```
create database mydb character set utf8mb4;
alter database mydb character set utf8mb4;
create table user (id int unsigned not null auto_increment, name varchar(20), icon varchar(30), room_id int not null, primary key(`id`)) character set utf8mb4 collate utf8mb4_unicode_ci;
create table chat_log (id int unsigned not null auto_increment, room_id int not null, user_id int not null, message text, primary key (`id`)) character set utf8mb4 collate utf8mb4_unicode_ci;
alter table chat_log default character set utf8mb4;
alter table user add index room_idx(room_id);
alter table chat_log add index user_idx(user_id);
alter table chat_log add index room_idx(room_id);
```

# ビルド手順
```
$ cd models
$ go build -o models user.go
```
