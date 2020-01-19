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
        console.log("battle scene initialize");
        Phaser.Scene.call(this, config); // 親クラスのコンストラクタの呼び出し
    },
    /**
     * シーンの初期化。シーンの実行時（start）に実行される。パラメータの初期化、受け渡し等に使用。
     * @param object data
     */
    init: function(data) {
        console.log("battle scene init");
        // debug
        this.mapSize = 21;
        this.roomId = 1;
        this.selectedCharaNum = 1;
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
        this.timeAnim = 4;
        this.explosionAnim = 5;
        // ゲーム内オブジェクト
        this.charaObjects = [];
        this.bombObjects = []; // {"x":1, "y":1, "object":null, "explosion":false, "time":60}
        this.objectsDirection = []; // 0: 下、1: 左、2: 右、3: 上
        this.playerObjNum = 0;
        this.map = [];
        // アセット群
        this.tilemap = null;
        this.layer = null;
    },
    /**
     * シーンに使用するアセットの読み込み。シーン実行時に実行される
     */
    preload: function() {
        console.log("battle scene preload");
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
        console.log("battle scene create");
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

        // プレイヤーキャラの作成
        this.playerObjNum = this.charaObjects.length
        let setting = this.bommerSettings[this.selectedCharaNum];
        let player = this.add.sprite(48, 48, setting.key);
        this.anims.create({
            key: ('DownObj_' + this.playerObjNum),
            frames: this.anims.generateFrameNames(setting.key, {start: 0, end: 2}),
            frameRate: 4, // 1が1秒, 2が0.5秒
            repeat: -1
        });
        this.anims.create({
            key: ('LeftObj_' + this.playerObjNum),
            frames: this.anims.generateFrameNames(setting.key, {start: 3, end: 5}),
            frameRate: 4, // 1が1秒, 2が0.5秒
            repeat: -1
        });
        this.anims.create({
            key: ('RightObj_' + this.playerObjNum),
            frames: this.anims.generateFrameNames(setting.key, {start: 6, end: 8}),
            frameRate: 4, // 1が1秒, 2が0.5秒
            repeat: -1
        });
        this.anims.create({
            key: ('UpObj_' + this.playerObjNum),
            frames: this.anims.generateFrameNames(setting.key, {start: 9, end: 11}),
            frameRate: 4, // 1が1秒, 2が0.5秒
            repeat: -1
        });
        this.charaObjects.push(player);
        this.objectsDirection.push(this.downDirection);

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
    update: function() {
        // カーソル操作
        let playerX = this.charaObjects[this.playerObjNum].x;
        let playerY = this.charaObjects[this.playerObjNum].y;
        if (this.cursors.left.isDown && !this.isCollision(playerX, playerY, (playerX - this.speed), playerY, this.map)) {
            this.charaObjects[this.playerObjNum].setX(playerX - this.speed);
            this.objectsDirection[this.playerObjNum] = this.leftDirection;
        } else if (this.cursors.right.isDown && !this.isCollision(playerX, playerY, (playerX + this.speed), playerY, this.map)) {
            this.charaObjects[this.playerObjNum].setX(playerX + this.speed);
            this.objectsDirection[this.playerObjNum] = this.rightDirection;
        } else if (this.cursors.up.isDown && !this.isCollision(playerX, playerY, playerX, (playerY - this.speed), this.map)) {
            this.charaObjects[this.playerObjNum].setY(playerY - this.speed);
            this.objectsDirection[this.playerObjNum] = this.upDirection;
        } else if (this.cursors.down.isDown && !this.isCollision(playerX, playerY, playerX, (playerY + this.speed), this.map)) {
            this.charaObjects[this.playerObjNum].setY(playerY + this.speed);
            this.objectsDirection[this.playerObjNum] = this.downDirection;
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            let pointX = Math.floor(playerX / 32);
            let pointY = Math.floor(playerY / 32);
            // TODO: メモリを抑えるか、計算速度を早くするか
            let bombObject = null;
            for (let i = 0; i < this.bombObjects.length; i++) {
                if (this.bombObjects.x == pointX && this.bombObjects.y == pointY) {
                    bombObject = this.bombObjects.object;
                }
            }
            if (bombObject == null) {
                let setX = pointX * 32 + 16;
                let setY = pointY * 32 + 16;
                let bomb = this.createBomb(setX, setY, this.bombObjects.length);
                this.bombObjects.push({"x": pointX, "y": pointY, "object": bomb, "explosion": false, "time": 90});
            }
        }

        // アニメーションの描画
        for (let i = 0; i < this.charaObjects.length; i++) {
            switch (this.objectsDirection[i]) {
                case this.upDirection:
                    this.charaObjects[i].anims.play('UpObj_' + i, true);
                    break;
                case this.downDirection:
                    this.charaObjects[i].anims.play('DownObj_' + i, true);
                    break;
                case this.leftDirection:
                    this.charaObjects[i].anims.play('LeftObj_' + i, true);
                    break;
                case this.rightDirection:
                    this.charaObjects[i].anims.play('RightObj_' + i, true);
                    break;
            }
        }
        for (let i = 0; i < this.bombObjects.length; i++) {
            let bombObject = this.bombObjects[i];
            if (bombObject.explosion) {
                bombObject.object.anims.play('explosion_' + i, true);
            } else {
                bombObject.object.anims.play('time_' + i, true);
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
     * @return {boolean} 衝突するか否か
     */
    isCollision: function(nowX, nowY, nextX, nextY, map) {
        if (nextX - nowX > 0) {
            let nextPointX = Math.floor((nextX + 15) / 32);
            let topPointY = Math.floor((nowY - 16) / 32);
            let bottomPointY = Math.floor((nowY + 15) / 32);
            if (map[topPointY][nextPointX] == 0 && map[bottomPointY][nextPointX] == 0) {
                return false;
            }
        } else if (nextX - nowX < 0) {
            let nextPointX = Math.floor((nextX - 16) / 32);
            let topPointY = Math.floor((nowY - 16) / 32);
            let bottomPointY = Math.floor((nowY + 15) / 32);
            if (map[topPointY][nextPointX] == 0 && map[bottomPointY][nextPointX] == 0) {
                return false;
            }
        }
        if (nextY - nowY > 0) {
            let nextPointY = Math.floor((nextY + 15) / 32);
            let leftPointX = Math.floor((nowX - 16) / 32);
            let rightPointX = Math.floor((nowX + 15) / 32);
            if (map[nextPointY][leftPointX] == 0 && map[nextPointY][rightPointX] == 0) {
                return false;
            }
        } else if (nextY - nowY < 0) {
            let nextPointY = Math.floor((nextY - 16) / 32);
            let leftPointX = Math.floor((nowX - 16) / 32);
            let rightPointX = Math.floor((nowX + 15) / 32);
            if (map[nextPointY][leftPointX] == 0 && map[nextPointY][rightPointX] == 0) {
                return false;
            }
        }

        return true;
    },

    /**
     * 爆弾の生成
     * @param {int} x 配置場所のX座標
     * @param {int} y 配置場所のY座標
     * @param {int} id オブジェクトのID
     * @param {Phaser.GameObjects.Sprite} 爆弾オブジェクト
     */
    createBomb: function(x, y, id) {
        let bomb = this.add.sprite(x, y, 'Bomb');
        this.anims.create({
            key: 'time_' + id,
            frames: this.anims.generateFrameNames('Bomb', {start: 0, end: 2}),
            frameRate: 4, // 1が1秒, 2が0.5秒
            repeat: 3
        });
        this.anims.create({
            key: 'explosion_' + id,
            frames: this.anims.generateFrameNames('Bomb', {start: 3, end: 5}),
            frameRate: 4,
            repeat: 1
        });
        return bomb;
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
