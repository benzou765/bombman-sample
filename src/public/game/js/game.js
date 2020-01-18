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
        // アセット群
        this.bomb = null;
        this.tilemap = null;
        this.layer = null;
        this.bommers = null;
        this.player = null;
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
        let map = [];
        let row = [];
        // 1行目
        for (let x = 0; x < this.mapSize; x++) {
            row.push(1);
        }
        map.push(row);
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
            map.push(row);
        }
        // 最終行
        row = [];
        for (let x = 0; x < this.mapSize; x++) {
            row.push(1);
        }
        map.push(row);
        this.tilemap = this.make.tilemap({data: map, tileWidth: 32, tileHeight: 32});
        let tiles = this.tilemap.addTilesetImage('Tile');
        this.layer = this.tilemap.createStaticLayer(0, tiles, 0, 0);

        // create bomb
        this.bomb = this.add.sprite(16, 16, 'Bomb', 6);
        this.anims.create({
            key: 'time',
            frames: this.anims.generateFrameNames('Bomb', {start: 0, end: 2}),
            frameRate: 4, // 1が1秒, 2が0.5秒
            repeat: 3
        });
        this.anims.create({
            key: 'explosion',
            frames: this.anims.generateFrameNames('Bomb', {start: 3, end: 5}),
            frameRate: 4,
            repeat: 1
        });

        // プレイヤーキャラの作成
        let setting = this.bommerSettings[this.selectedCharaNum];
        this.player = this.add.sprite(48, 48, setting.key);
        this.anims.create({
            key: (setting.key + 'Down'),
            frames: this.anims.generateFrameNames(setting.key, {start: 0, end: 2}),
            frameRate: 4, // 1が1秒, 2が0.5秒
            repeat: -1
        });
        this.anims.create({
            key: (setting.key + 'Left'),
            frames: this.anims.generateFrameNames(setting.key, {start: 3, end: 5}),
            frameRate: 4, // 1が1秒, 2が0.5秒
            repeat: -1
        });
        this.anims.create({
            key: (setting.key + 'Right'),
            frames: this.anims.generateFrameNames(setting.key, {start: 6, end: 8}),
            frameRate: 4, // 1が1秒, 2が0.5秒
            repeat: -1
        });
        this.anims.create({
            key: (setting.key + 'Up'),
            frames: this.anims.generateFrameNames(setting.key, {start: 9, end: 11}),
            frameRate: 4, // 1が1秒, 2が0.5秒
            repeat: -1
        });
        // キーボード設定の初期化
        this.cursors = this.input.keyboard.createCursorKeys();
    },
    /**
     * シーンの更新。毎フレーム実行される。
     * @param number time
     * @param number delta
     */
    update: function() {

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
