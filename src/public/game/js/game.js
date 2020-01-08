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
        this.bomb = null;
        this.tilemap = null;
        this.layer = null;
        this.frameTimer = 0;
    },
    /**
     * シーンに使用するアセットの読み込み。シーン実行時に実行される
     */
    preload: function() {
        console.log("battle scene preload");
        // load images
        this.load.image('Tile', 'img/map.png');
        this.load.spritesheet('Bomb', 'img/bomb.png', { frameWidth: 32, frameHeight: 32, startFrame: 0, endFrame: 5});
    },
    /**
     * シーンの作成。シーンの実行時に実行される。アセットの読み込み完了後に実行され、画面の構築等を行う。
     * @param object data
     */
    create: function(data) {
        console.log("battle scene create");
        // create map
        let map = [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
        ];
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
    },
    /**
     * シーンの更新。毎フレーム実行される。
     * @param number time
     * @param number delta
     */
    update: function() {
        if (this.frameTimer > 90) {
            this.bomb.play('explosion', true);
        } else {
            this.bomb.play('time', true);
        }
        this.frameTimer++;
    }
});

/**
 * 部屋選択画面
 * @see https://photonstorm.github.io/phaser3-docs/Phaser.Scene.html
 */
let SelectRoomScene = new Phaser.Class ({
    Extends: Phaser.Scene,

    /**
     * シーンのコンストラクタ。ゲーム起動時とともに1回だけ実行される。
     * @param object config
     */
    initialize: function SelectRoomScene(config) {
        console.log("select room scene initialize");
        Phaser.Scene.call(this, config); // 親クラスのコンストラクタの呼び出し
    },
    /**
     * シーンの初期化。シーンの実行時（start）に実行される。パラメータの初期化、受け渡し等に使用。
     * @param object data
     */
    init: function(data) {
        console.log("select room scene init");
    },
    /**
     * シーンに使用するアセットの読み込み。シーン実行時に実行される
     */
    preload: function() {
        console.log("select room scene preload");
    },
    /**
     * シーンの作成。シーンの実行時に実行される。アセットの読み込み完了後に実行され、画面の構築等を行う。
     * @param object data
     */
    create: function() {
        console.log("select room scene create");
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
game.scene.add('selectChara', SelectCharaScene, false);
game.scene.add('battle', BattleScene, false);
game.scene.add('createRoom', CreateRoomScene, true);
game.scene.add('selectRoom', SelectRoomScene, false);
