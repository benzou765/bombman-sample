# WebSocketによるリアルタイム通信のゲーム
## 目標
部屋数は無限大, 1部屋100,000ユーザ以上を想定してゲームを構築。  
最終的には特定サーバでの限界、部屋数のスケール方法について検討できるようにする。

## サーバの設計
### ステージの大きさ
ステージは正方形とし、nは横幅のブロック数とする  
配置できる理論上のユーザ数（移動可能マス）は下記の計算式で算出  
```
n * n -> (n-2) * ceil(n/2) + ceil(n/2) * (ceil(n/2)-1)
```
上記だと、キャラクターを完全に敷き詰めてしまうため、1マスおきに置くよう変更  
```
n * n -> ceil(n/2)^2
```
最低、635*635マスのステージにする必要がある  

部屋数は無限大, 1部屋最大100,000ユーザを想定してゲームを構築
最終的には特定インスタンスサイズでの限界、部屋数のスケール方法について検討できるようにする

# Golang サーバ関連
## 設計
ステージサイズ（計算式）
n*n -> (n-2) * ceil(n/2) + ceil(n/2) * (ceil(n/2)-1)

101*101 -> 99 * 50 + 50 * 49 = 7400マス, 2500ユーザ
401*401 -> 119600, 40000

### API
| メソッド | URL | IN | OUT | 説明 |
|---|---|---|---|---|
| GET | / |  | index.html | ログイン画面 |
| POST | /login | {"id":1} | game.html | ログイン処理しつつ、game.htmlへ遷移、cookieでユーザ管理 |
| POST | /user/update | {"chara_id":1} | {"status":"ok"} | キャラアイコン、ログイン時間の更新 |
| POST | /rooms/create | {"chara_id":1,"size":11} | {"room_id":1} | 部屋の作成、部屋IDは自動発番、キャラアイコンの更新 |
| POST | /rooms | {"chara_id":1} | {[{"id":1,"size":11,"num":1},...]} | 作成済みの部屋一覧 |
| GET | /ws/:id |  |  | websocketによる通信の開始 |
| WS | {"id":0, "action":"move", "direction":0, "x":0, "y":0} | {"id":0, "action":, "direction":0, "x":0, "y":0} | キャラの操作等 |

### DB
| テーブル名 | カラム |
|---|---|
| user | id, chara_id, created_at, updated_at |
| room | id, size, members, created_at, updated_at |
| action_log | id, room_id, user_id, log, created_at, updated_at |

### Redis
Redisで設計したデータはmongoDBにも持っていけそう？（要確認）
今回の実装では使用しない
設定方法：https://qiita.com/momotaro98/items/ed496ba06908b278e103

### スケール方法
RedisのPub/Subを使った事例。WebSocketのスケールアウトでよく使われている？
* https://www.tetsis.com/blog/?p=632
* https://qiita.com/mserizawa/items/31e94c25bc177dcbc2c9
* https://medium.com/eureka-engineering/go-redis-application-28c8c793a652
* https://www.slideshare.net/kidach1/nodejs-54841327

### テスト
wscatによるテスト
* https://qiita.com/TakashiOshikawa/items/1483a334d54cb0f6ed78

### サーバの起動手順
下記コマンドを実行
```
$ docker-compose build
$ docker-compose up
```

### websocketのテスト
curlのように、WebSocketをかんたんにテストするツールとしてwscatがある  
インストール手順：https://qiita.com/TakashiOshikawa/items/1483a334d54cb0f6ed78


### curlの使い方
追々は単体テストできるようにする
```
$ curl -X POST -d '{"id":"1", "name":"hoge", "room_id":"1"}' localhost:8080/user
$ curl localhost:8080/user/1
$ curl -X POST -d '{"id":"1", "name":"hoge", "room_id":"2"}' localhost:8080/user/1
```

## 実装中のメモ
### go言語の利用時の注意点
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

### echoフレームワーク
公式サイト：https://echo.labstack.com/  
FWのGinより早いらしい。日本語ドキュメントは皆無なので、頑張るしか無さそう

## 問題点とか
### サーバ構築で気づいたこと
LoadBalancerとWebSocketの相性は悪い（LBはコネクションを確立するためだけに存在するので当たり前）。
なので、コネクションを確立したあとは別サーバに接続するよう促し、通信させるのが良さそう

### データの管理方法
ゲーム状態をDBとWebサーバそれぞれで管理しようとしたが、同期を保つことが難しい。
どちらかが落ちることはない前提で作るべき。
DBは基本落ちることがない（落ちたら、ゲーム以外の修正も発生する）ので、DBを真としてデータを作る
Webサーバが落ちた場合、ゲーム内データが消える。DBでゲーム内データを保持することも可能だが、
データ量が多く保持は難しそう。Webサーバが落ちないような対策か、部屋移動がWebサーバ間でできる仕掛けがいるかも。
キャッシュやドキュメントDBに持たせることもできなくはないが、うまくできるか不明。

### 中央集権管理
データの管理方法とも連動するが、DBで管理できれば中央管理はできそう。Webサーバだけにゲームデータを保持すると、
どのWebサーバでどの部屋が動いているか確認する必要はある。
ただ、Webアクセスは可能なので問題があれば部屋に対してアクションはできそう。

### golangでの動作確認簡略化
realize（https://github.com/oxequa/realize）を使って、実装しながら動作確認できるツールもある。
実装例はこちら：https://qiita.com/go_sagawa/items/ae53d42abd76492471c1

### サーバ側で"connection has been hijacked"と表示される
Echoの仕様（websocketを使用するにあたり、ResponseWriterを乗っ取る必要がある）上、エラーが表示される。
Middleware等で制御可能なようなので、今後の対応として検討。

### Websocket開始時の注意点
websocketを開始するときの制約として
* GETメソッドであること
* ヘッダーは送付できないこと
に注意する必要がある。ヘッダー送付はできないが、Cookie情報は送れる。  
また、サブプロトコルという機能を使えば追加情報は付与できる模様。WebsocketJWTでは、サブプロトコルを使う事例が多い。  
どうしてもヘッダーを使用したい場合は、socket.ioを使う手もある。

## フロント（クライアント）の実装
### javascript、phaser3
フロント作成に当たり、Unityやjs等いろいろ検討したが、
websocketの取り回しはjsが一番簡単と感じ、phaser3とjsで実装

* Phaser3の使い方：https://magazine.halake.com/entry/phaser-ts-rpg-simple1?utm_source=feed
* Phaser3でUI作成のためのライブラリ：https://github.com/rexrainbow/phaser3-rex-notes
* webpack（今回は使用しない。typescript等で実装する場合には必要）：https://qiita.com/koedamon/items/3e64612d22f3473f36a4
* bindの使い方：http://enlosph.hatenablog.com/entry/2017/01/20/222605

### 素材サイト
今回の実装で使用した素材
* ぴぽや：https://pipoya.net/
* ドット絵世界：http://yms.main.jp/
* ColorDrop：https://colordrop.io/
