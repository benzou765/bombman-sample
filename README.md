# WebSocketによるリアルタイム通信のゲーム
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
| POST | /login | {"id": 1} | menu.html | ログイン処理しつつ、menu.htmlへ遷移 |
| POST | /room/create | {"chara_id": 1} |  | 部屋の作成、IDは自動発番 |
| POST | /room/{id} | {"chara_id": 1} | game.html | 部屋への移動 |
| WS |  | {"id":0, "action":0, "x":0, "y":0} | {"id":0, "action":0, "x":0, "y":0} | ゲーム内アクション |

### DB
| テーブル名 | カラム |
|---|---|
| user | id, chara_id, created_at, updated_at |
| room | id, members, created_at, updated_at |
| log | id, room_id, user_id, action, created_at, updated_at |

遅い場合は、下記テーブルを追加
| テーブル名 | カラム |
|---|---|
| room_user | room_id, user_id, created_at |

## Redis
Redisで設計したデータはmongoDBにも持っていけそう？（要確認）
今回の実装では使用しない
設定方法：https://qiita.com/momotaro98/items/ed496ba06908b278e103

## スケール方法
RedisのPub/Subを使う。割と一般的みたい
* https://www.tetsis.com/blog/?p=632
* https://qiita.com/mserizawa/items/31e94c25bc177dcbc2c9
* https://medium.com/eureka-engineering/go-redis-application-28c8c793a652

別の方法によるスケール
* https://www.slideshare.net/kidach1/nodejs-54841327
* https://www.atmarkit.co.jp/ait/articles/1010/20/news105.html
* https://www.walksocket.com/archives/29

## テスト
wscatによるテスト
* https://qiita.com/TakashiOshikawa/items/1483a334d54cb0f6ed78

## 実装中のメモ
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

## echoフレームワーク
公式サイト：https://echo.labstack.com/  
FWのGinより早いらしい。日本語ドキュメントは皆無なので、頑張るしか無さそう

## 起動手順
下記コマンドを実行
```
$ docker-compose build
$ docker-compose up
```
バックグラウンドで実行してしまうとログが見れなくなるので、フォアグラウンドで実行すること  
その後、ブラウザを起動し、下記サイトへアクセス  
http://localhost:8080/chat  
勝手にwebsocket通信を行う。  

## ビルド手順
```
$ cd models
$ go build -o models user.go
```

### テストコマンド
追々は単体テストできるようにする
```
$ curl -X POST -d '{"id":"1", "name":"hoge", "room_id":"1"}' localhost:8080/user
$ curl localhost:8080/user/1
$ curl -X POST -d '{"id":"1", "name":"hoge", "room_id":"2"}' localhost:8080/user/1
```

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

### ログ収集
ログ自体はサーバに来るたびに撮りためておけば大丈夫そう。事後の対応は可能。

# フロント、phaser.js関連
当初はpixi.jsを考えたが、よりゲームの機能を提供しているphaser3へ変更

## pixi.jsで気づいたこと
npmでインストールした場合、webpackが必要っぽい。
手順は公式サイトの通り。
pixi 5.2.0の場合は下記のパッケージが必要
```
@babel/core
@babel/preset-env
babel-loader
webpack
webpack-cli
webpack-dev-server
copy-webpack-plugin (this one is for copying files from build/assets to dist/assets folder)
html-webpack-plugin
uglifyjs-webpack-plugin
```

## phaser環境の構築
https://qiita.com/d2cd-ytakada/items/dd4a5bf20d3066bf8c3f
https://magazine.halake.com/entry/phaser-ts-rpg-simple1?utm_source=feed

## js
phaser3でui作成のためのライブラリ
* https://github.com/rexrainbow/phaser3-rex-notes
webpack (今回は使用しないが、どこかで覚える必要はありそう)
* https://qiita.com/koedamon/items/3e64612d22f3473f36a4
bindの使い方
http://enlosph.hatenablog.com/entry/2017/01/20/222605

## 素材サイト
* ぴぽや
https://pipoya.net/
* ドット絵世界
http://yms.main.jp/
* ColorDrop
https://colordrop.io/
