'use strict';

/**
 * キャラ選択画面
 * @see https://photonstorm.github.io/phaser3-docs/Phaser.Scene.html
 */
let BattleScene = new Phaser.Class ({
    Extends: Phaser.Scene,

    /**
     * シーンのコンストラクタ。ゲーム起動時とともに1回だけ実行される。
     * @param object config
     */
    initialize: function BattleScene(config) {
        Phaser.Scene.call(this, config); // 親クラスのコンストラクタの呼び出し
    },
    /**
     * シーンの初期化。シーンの実行時（start）に実行される。パラメータの初期化、受け渡し等に使用。
     * @param object data
     */
    init: function(data) {
        // 前画面からのデータ
        this.mapSize = data.map_size;
        this.roomId = data.room_id;
        this.selectedCharaNum = data.chara_id;
        this.numPeople = data.num;
        // cookieからユーサIDの取得
        this.userId = 0;
        let cookies = document.cookie;
        let cookiesArray = cookies.split(';');
        if (cookiesArray.length == 1) {
            let cArray = cookiesArray[0].split('=');
            if (cArray[0] == 'BombmanUserId') {
                this.userId = parseInt(cArray[1]);
            }
        }
        // キーボード
        this.cursors = null;
        // 設定変数群
        this.bommerSettings = [
            { key: "BommerA", path: "img/bommer_a.png"},
            { key: "BommerB", path: "img/bommer_b.png"},
            { key: "BommerC", path: "img/bommer_c.png"},
            { key: "BommerD", path: "img/bommer_d.png"},
            { key: "BommerE", path: "img/bommer_e.png"},
            { key: "BommerF", path: "img/bommer_f.png"},
        ];
        // 定数
        this.speed = 2;
        this.downDirection = 0;
        this.leftDirection = 1;
        this.rightDirection = 2;
        this.upDirection = 3;
        this.bombDirection = 0;
        // ゲーム内ユーザデータ
        this.isGameOver = false;
        // ゲーム内オブジェクト
        this.charaObjects = {}; // {"object":null, "direction":0} 0:down、1:left、2:right、3:up
        this.bombObjects = {}; // {"object":null, "explosion":false, "time":60, "exp_obj":[] }
        this.playerObjName = "chara_" + this.userId;
        this.isPlayerSetBomb = false;
        this.map = [];
        // アセット群
        this.tilemap = null;
        this.layer = null;
        // socket通信
        this.socket = null;
    },
    /**
     * シーンに使用するアセットの読み込み。シーン実行時に実行される
     */
    preload: function() {
        // load images
        this.load.image('Tile', 'img/map.png');
        this.load.spritesheet('Bomb', 'img/bomb.png', { frameWidth: 32, frameHeight: 32, startFrame: 0, endFrame: 5});
        for (let i = 0; i < this.bommerSettings.length; i++) {
            this.load.spritesheet(this.bommerSettings[i].key, this.bommerSettings[i].path, { frameWidth: 32, frameHeight: 32, startFrame: 0, endFrame: 11});
        }
    },
    /**
     * シーンの作成。シーンの実行時に実行される。アセットの読み込み完了後に実行され、画面の構築等を行う。
     * @param object data
     */
    create: function(data) {
        // create map
        let row = [];
        // 1行目
        for (let x = 0; x < this.mapSize; x++) {
            row.push(1);
        }
        this.map.push(row);
        for (let y = 1; (y < this.mapSize - 1); y++) {
            let row = [];
            if (y % 2 == 0) {
                // 奇数行
                for (let x = 0; x < this.mapSize; x++) {
                    if (x % 2 == 0) {
                        row.push(1);
                    } else {
                        row.push(0);
                    }
                }
            } else {
                // 偶数行
                row.push(1);
                for (let x = 1; x < (this.mapSize - 1); x++) {
                    row.push(0);
                }
                row.push(1);
            }
            this.map.push(row);
        }
        // 最終行
        row = [];
        for (let x = 0; x < this.mapSize; x++) {
            row.push(1);
        }
        this.map.push(row);
        this.tilemap = this.make.tilemap({data: this.map, tileWidth: 32, tileHeight: 32});
        let tiles = this.tilemap.addTilesetImage('Tile');
        this.layer = this.tilemap.createStaticLayer(0, tiles, 0, 0);

        // socketの準備
        let hostname = location.host
        this.socket = new WebSocket("ws://" + hostname + "/ws/" + this.roomId);
        // socketが閉じたときのイベントリスナー
        this.socket.onclose = function() {
            // GAME OVERの表示
            this.add.text(this.cameras.main.scrollX + 160, this.cameras.main.scrollY + 210, "GAME OVER").setFontSize(64).setColor("#ecf4f3");
            function gameReload() {
                window.location.reload();
            };
            setTimeout(gameReload, 2000);
        }.bind(this);
        // socketでメッセージを受けたときのイベントリスナー
        this.socket.onmessage = function(event) {
            let data = JSON.parse(event.data);
            let charaObj = this.charaObjects["chara_" + data.user_id];
            switch (data.action) {
                case "start":
                    let startPlayerName = "chara_" + data.user_id;
                    if (startPlayerName != this.playerObjName) {
                        let charaId = data.chara_id;
                        let charaAsset = this.createCharaAsset(startPlayerName, charaId, data.x, data.y);
                        this.charaObjects[startPlayerName] = { object: charaAsset, direction: this.downDirection };
                    }
                    break;
                case "move":
                    charaObj.object.setX(data.x);
                    charaObj.object.setY(data.y);
                    charaObj.direction = data.direction;
                    break;
                case "set_bomb":
                    let setBombName = "bomb_" + data.user_id;
                    if (setBombName in this.bombObjects) {
                        this.bombObjects[setBombName].object.setX(data.x).setY(data.y).setActive(true).setVisible(true);
                        this.bombObjects[setBombName].exp_obj[0].setX(data.x).setY(data.y + 32); // down
                        this.bombObjects[setBombName].exp_obj[1].setX(data.x - 32).setY(data.y); // left
                        this.bombObjects[setBombName].exp_obj[2].setX(data.x + 32).setY(data.y); // right
                        this.bombObjects[setBombName].exp_obj[3].setX(data.x).setY(data.y - 32); // up
                    } else {
                        // 爆弾自体のオブジェクト生成
                        let bombAsset =  this.createBombAsset(setBombName, data.x, data.y);
                        this.bombObjects[setBombName] = { object: bombAsset, explosion: false, time: -1, exp_obj: [] };
                        // 爆発オブジェクトの生成
                        let expObjs = this.createExplodeAsset(setBombName, data.x, data.y);
                        this.bombObjects[setBombName].exp_obj = expObjs;
                    }
                    break;
                case "exp_bomb":
                    let expBombName = "bomb_" + data.user_id;
                    if (expBombName in this.bombObjects) {
                        for (let i = 0; i < this.bombObjects[expBombName].exp_obj.length; i++) {
                            this.bombObjects[expBombName].exp_obj[i].setVisible(true).setActive(true);
                        }
                    }
                    this.bombObjects[expBombName].explosion = true;
                    this.bombObjects[expBombName].time = 30;
                    break;
                case "dead":
                    let deadPlayerName = "chara_" + data.user_id;
                    if (deadPlayerName != this.playerObjName) {
                        this.charaObjects[deadPlayerName].object.setActive(false).setVisible(false);
                        this.charaObjects[deadPlayerName].direction = this.downDirection;
                    }
                    break;
            }
        }.bind(this);

        // プレイヤーキャラの作成
        let width = (this.mapSize - 1) / 2;
        let x = ((1 + 2 * (this.numPeople % width)) * 32) + 16;
        let y = ((1 + 2 * Math.floor(this.numPeople / width)) * 32) + 16;
        let player = this.createCharaAsset(this.playerObjName, this.selectedCharaNum, x, y);
        this.charaObjects[this.playerObjName] = { object: player, direction: this.downDirection };
        
        // カメラの設定
        this.cameras.main.setSize(640, 480);
        this.cameras.main.startFollow(player)

        // キーボード設定の初期化
        this.cursors = this.input.keyboard.createCursorKeys();
    },
    /**
     * シーンの更新。毎フレーム実行される。
     * @param number time
     * @param number delta
     */
    update: function(time, delta) {
        // アニメーションの描画
        // キャラクターの描画
        let charaKeys = Object.keys(this.charaObjects);
        for (const key of charaKeys) {
            switch (this.charaObjects[key].direction) {
                case this.upDirection:
                    this.charaObjects[key].object.anims.play('UpObj_' + key, true);
                    break;
                case this.downDirection:
                    this.charaObjects[key].object.anims.play('DownObj_' + key, true);
                    break;
                case this.leftDirection:
                    this.charaObjects[key].object.anims.play('LeftObj_' + key, true);
                    break;
                case this.rightDirection:
                    this.charaObjects[key].object.anims.play('RightObj_' + key, true);
                    break;
            }
        }
        // 爆弾の描画
        let bombKeys = Object.keys(this.bombObjects);
        for (const key of bombKeys) {
            let bombObject = this.bombObjects[key];
            if(bombObject.explosion) {
                // アニメーション
                bombObject.object.anims.play('explosion_' + key, true);
                bombObject.exp_obj[0].anims.play('explosion_down_' + key, true);
                bombObject.exp_obj[1].anims.play('explosion_left_' + key, true);
                bombObject.exp_obj[2].anims.play('explosion_right_' + key, true);
                bombObject.exp_obj[3].anims.play('explosion_up_' + key, true);
                bombObject.time -= 1;
                if (bombObject.time == 0) {
                    // 爆発後はスプライトを非表示にする
                    bombObject.time = -1;
                    bombObject.explosion = false;
                    bombObject.object.setVisible(false).setActive(false);
                    for(let i = 0; i < bombObject.exp_obj.length; i++) {
                        bombObject.exp_obj[i].setVisible(false).setActive(false);
                    }
                    if (key == ("bomb_" + this.userId)) {
                        this.isPlayerSetBomb = false;
                    }
                }
                // ゲームロジックの処理
                if (this.damageBomb(bombObject, this.charaObjects[this.playerObjName]) && this.socket.readyState == 1) {
                    // socketにメッセージを送信
                    let sendData = {
                        user_id: this.userId,
                        action: "dead", // start, move, set_bomb, exp_bomb, dead のいずれか
                        direction: this.downDirection, // 0:down, 1:left, 2:right, 3:up
                        x: this.charaObjects[this.playerObjName].object.x,
                        y: this.charaObjects[this.playerObjName].object.y,
                    };
                    this.socket.send(JSON.stringify(sendData));
                    this.charaObjects[this.playerObjName].object.setVisible(false).setActive(false);
                    this.socket.close();
                }
            } else {
                bombObject.object.anims.play('time_' + key, true);
            }
        }

        // ゲームオーバー時は操作を受け付けない
        if (this.isGameOver) {
            return;
        }

        // カーソル操作
        let playerX = this.charaObjects[this.playerObjName].object.x;
        let playerY = this.charaObjects[this.playerObjName].object.y;
        if (this.cursors.left.isDown && !this.isCollision(playerX, playerY, (playerX - this.speed), playerY, this.map)) {
            let diff = (playerY % 32) - 16;
            let nextX = playerX - this.speed;
            let nextY = playerY - diff;
            // socketにメッセージを送信
            let sendData = {
                user_id: this.userId,
                action: "move", // start, move, set_bomb, exp_bomb, dead のいずれか
                direction: this.leftDirection, // 0:down, 1:left, 2:right, 3:up
                x: nextX,
                y: nextY
            };
            this.socket.send(JSON.stringify(sendData));
        } else if (this.cursors.right.isDown && !this.isCollision(playerX, playerY, (playerX + this.speed), playerY, this.map)) {
            let diff = (playerY % 32) - 16;
            let nextX = playerX + this.speed;
            let nextY = playerY - diff;
            // socketにメッセージを送信
            let sendData = {
                user_id: this.userId,
                action: "move", // start, move, set_bomb, exp_bomb, dead のいずれか
                direction: this.rightDirection, // 0:down, 1:left, 2:right, 3:up
                x: nextX,
                y: nextY
            };
            this.socket.send(JSON.stringify(sendData));
        } else if (this.cursors.up.isDown && !this.isCollision(playerX, playerY, playerX, (playerY - this.speed), this.map)) {
            let diff = (playerX % 32) - 16;
            let nextX = playerX - diff;
            let nextY = playerY - this.speed;
            // socketにメッセージを送信
            let sendData = {
                user_id: this.userId,
                action: "move",
                direction: this.upDirection, // 0:down, 1:left, 2:right, 3:up
                x: nextX,
                y: nextY
            };
            this.socket.send(JSON.stringify(sendData));
        } else if (this.cursors.down.isDown && !this.isCollision(playerX, playerY, playerX, (playerY + this.speed), this.map)) {
            let diff = (playerX % 32) - 16;
            let nextX = playerX - diff;
            let nextY = playerY + this.speed;
            // socketにメッセージを送信
            let sendData = {
                user_id: this.userId,
                action: "move",
                direction: this.downDirection,
                x: nextX,
                y: nextY
            };
            this.socket.send(JSON.stringify(sendData));
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && !this.isPlayerSetBomb) {
            let pointX = Math.floor(playerX / 32) * 32 + 16;
            let pointY = Math.floor(playerY / 32) * 32 + 16;
            let bombObject = null;
            let bombKeys = Object.keys(this.bombObjects);
            for (let key of bombKeys) {
                if (this.bombObjects[key].object.x == pointX & this.bombObjects[key].object.y == pointY) {
                    bombObject = this.bombObjects[key];
                }
            }
            if (bombObject == null) {
                let sendData = {
                    user_id: this.userId,
                    action: "set_bomb",
                    direction: this.bombDirection,
                    x: pointX,
                    y: pointY
                }
                this.socket.send(JSON.stringify(sendData));
                this.isPlayerSetBomb = true;
            }
        }
    },

    /**
     * マップの衝突判定
     * @param {int} nowX プレイヤーのX座標
     * @param {int} nowY プレイヤーのY座標
     * @param {int} nextX プレイヤーの移動先のX座標
     * @param {int} nextY プレイヤーの移動先のY座標
     * @param {array} map マップの配列
     * @returns {boolean} 衝突するか否か
     */
    isCollision: function(nowX, nowY, nextX, nextY, map) {
        if (nextX - nowX > 0) {
            let nextPointX = Math.floor((nextX + 15) / 32);
            let topPointY = Math.floor((nowY - 12) / 32);
            let bottomPointY = Math.floor((nowY + 11) / 32);
            if (map[topPointY][nextPointX] == 0 && map[bottomPointY][nextPointX] == 0) {
                return false;
            }
        } else if (nextX - nowX < 0) {
            let nextPointX = Math.floor((nextX - 16) / 32);
            let topPointY = Math.floor((nowY - 12) / 32);
            let bottomPointY = Math.floor((nowY + 11) / 32);
            if (map[topPointY][nextPointX] == 0 && map[bottomPointY][nextPointX] == 0) {
                return false;
            }
        }
        if (nextY - nowY > 0) {
            let nextPointY = Math.floor((nextY + 15) / 32);
            let leftPointX = Math.floor((nowX - 12) / 32);
            let rightPointX = Math.floor((nowX + 11) / 32);
            if (map[nextPointY][leftPointX] == 0 && map[nextPointY][rightPointX] == 0) {
                return false;
            }
        } else if (nextY - nowY < 0) {
            let nextPointY = Math.floor((nextY - 16) / 32);
            let leftPointX = Math.floor((nowX - 12) / 32);
            let rightPointX = Math.floor((nowX + 11) / 32);
            if (map[nextPointY][leftPointX] == 0 && map[nextPointY][rightPointX] == 0) {
                return false;
            }
        }
        return true;
    },

    /**
     * キャラの生成
     * @param {string} playerName キャラ識別用の名前。"chara_<userId>"
     * @param {int} charaId キャライメージの番号 
     * @param {int} x 
     * @param {int} y 
     * @return {Phaser.GameObjects.Sprite} キャラオブジェクト
     */
    createCharaAsset: function(playerName, charaId, x, y) {
        let setting = this.bommerSettings[charaId];
        let chara = this.add.sprite(x, y, setting.key);
        if (this.anims.exists('DownObj_' + playerName)) {
            let anim = this.anims.get('DownObj_' + playerName);
            anim.destroy();
        }
        this.anims.create({
            key: ('DownObj_' + playerName),
            frames: this.anims.generateFrameNames(setting.key, {start: 0, end: 2}),
            frameRate: 4, // 1が1秒, 2が0.5秒
            repeat: -1
        });
        if (this.anims.exists('LeftObj_' + playerName)) {
            let anim = this.anims.get('LeftObj_' + playerName);
            anim.destroy();
        }
        this.anims.create({
            key: ('LeftObj_' + playerName),
            frames: this.anims.generateFrameNames(setting.key, {start: 3, end: 5}),
            frameRate: 4, // 1が1秒, 2が0.5秒
            repeat: -1
        });
        if (this.anims.exists('RightObj_' + playerName)) {
            let anim = this.anims.get('RightObj_' + playerName);
            anim.destroy();
        }
        this.anims.create({
            key: ('RightObj_' + playerName),
            frames: this.anims.generateFrameNames(setting.key, {start: 6, end: 8}),
            frameRate: 4, // 1が1秒, 2が0.5秒
            repeat: -1
        });
        if (this.anims.exists('UpObj_' + playerName)) {
            let anim = this.anims.get('UpObj_' + playerName);
            anim.destroy();
        }
        this.anims.create({
            key: ('UpObj_' + playerName),
            frames: this.anims.generateFrameNames(setting.key, {start: 9, end: 11}),
            frameRate: 4, // 1が1秒, 2が0.5秒
            repeat: -1
        });
        return chara
    },

    /**
     * 爆弾の生成
     * @param {string} bombName ボム識別用の名前。一つしか所有できない前提。"bomb_<userId>"
     * @param {int} x 配置場所のX座標
     * @param {int} y 配置場所のY座標
     * @returns {Phaser.GameObjects.Sprite} 爆弾オブジェクト
     */
    createBombAsset: function(bombName, x, y) {
        let bomb = this.add.sprite(x, y, 'Bomb');
        this.anims.create({
            key: 'time_' + bombName,
            frames: this.anims.generateFrameNames('Bomb', {start: 0, end: 2}),
            frameRate: 4, // 1が1秒, 2が0.5秒
            repeat: 3
        });
        this.anims.create({
            key: 'explosion_' + bombName,
            frames: this.anims.generateFrameNames('Bomb', {start: 3, end: 5}),
            frameRate: 4,
            repeat: 1
        });
        return bomb;
    },
    /**
     * 爆発アニメーション用アセットの生成
     * @param {string} bombName ボム識別用の名前
     * @param {int} x ボムのX座標
     * @param {int} y ボムのY座標
     * @returns {array<Phaser.GameObjects.Sprite>} 爆発オブジェクト
     */
    createExplodeAsset: function(bombName, x, y) {
        let explodeObjs = [];
        // DOWN
        let downSprite = this.add.sprite(x, y + 32, 'Bomb');
        this.anims.create({
            key: 'explosion_down_' + bombName,
            frames: this.anims.generateFrameNames('Bomb', {start: 3, end: 5}),
            frameRate: 4,
            repeat: 1
        });
        explodeObjs.push(downSprite);
        downSprite.setVisible(false).setActive(false);
        // LEFT
        let leftSprite = this.add.sprite(x - 32, y, 'Bomb');
        this.anims.create({
            key: 'explosion_left_' + bombName,
            frames: this.anims.generateFrameNames('Bomb', {start: 3, end: 5}),
            frameRate: 4,
            repeat: 1
        });
        explodeObjs.push(leftSprite);
        leftSprite.setVisible(false).setActive(false);
        // RIGHT
        let rightSprite = this.add.sprite(x + 32, y, 'Bomb');
        this.anims.create({
            key: 'explosion_right_' + bombName,
            frames: this.anims.generateFrameNames('Bomb', {start: 3, end: 5}),
            frameRate: 4,
            repeat: 1
        });
        explodeObjs.push(rightSprite);
        rightSprite.setVisible(false).setActive(false);
        // UP
        let upSprite = this.add.sprite(x, y - 32, 'Bomb');
        this.anims.create({
            key: 'explosion_up_' + bombName,
            frames: this.anims.generateFrameNames('Bomb', {start: 3, end: 5}),
            frameRate: 4,
            repeat: 1
        });
        explodeObjs.push(upSprite);
        upSprite.setVisible(false).setActive(false);
        return explodeObjs;
    },

    /**
     * 爆発によるダメージ処理
     * @param {Phaser.GameObjects.Sprite} bombObject 爆発した爆弾オブジェクト
     * @param {Phaser.GameObjects.Sprite} playerObject ワールド内のキャラ配列
     * @returns {boolean} ダメージを受けたかどうか
     */
    damageBomb: function(bombObject, playerObject) {
        let charaX = Math.floor(playerObject.object.x / 32);
        let charaY = Math.floor(playerObject.object.y / 32);
        // down
        let pointX = Math.floor(bombObject.exp_obj[0].x / 32);
        let pointY = Math.floor(bombObject.exp_obj[0].y / 32);
        if (charaX == pointX && charaY == pointY) {
            return true;
        }
        // left
        pointX = Math.floor(bombObject.exp_obj[1].x / 32);
        pointY = Math.floor(bombObject.exp_obj[1].y / 32);
        if (charaX == pointX && charaY == pointY) {
            return true;
        }
        // right
        pointX = Math.floor(bombObject.exp_obj[2].x / 32);
        pointY = Math.floor(bombObject.exp_obj[2].y / 32);
        if (charaX == pointX && charaY == pointY) {
            return true;
        }
        // up
        pointX = Math.floor(bombObject.exp_obj[3].x / 32);
        pointY = Math.floor(bombObject.exp_obj[3].y / 32);
        if (charaX == pointX && charaY == pointY) {
            return true;
        }
        // center
        pointX = Math.floor(bombObject.object.x / 32);
        pointY = Math.floor(bombObject.object.y / 32);
        if (charaX == pointX && charaY == pointY) {
            return true;
        }
        return false;
    }
});

// main game
let config = {
    type: Phaser.AUTO,
    width: 640,
    height: 480,
};
let game = new Phaser.Game(config);
game.scene.add('selectChara', SelectCharaScene, true);
game.scene.add('battle', BattleScene, false);
game.scene.add('createRoom', CreateRoomScene, false);
game.scene.add('selectRoom', SelectRoomScene, false);
