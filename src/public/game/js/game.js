'use strict';

let BattleScene = new Phaser.Class ({
    Extends: Phaser.Scene,
    initialize: function BattleScene(config) {
        Phaser.Scene.call(this, config);
        this.bomb = null;
        this.tilemap = null;
        this.layer = null;
        this.frameTimer = 0;
    },
    preload: function() {
        console.log("battle scene preload");
        // load images
        this.load.image('Tile', 'img/map.png');
        this.load.spritesheet('Bomb', 'img/bomb.png', { frameWidth: 32, frameHeight: 32, startFrame: 0, endFrame: 5});
    },
    create: function() {
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
 * 部屋作成画面
 */
let CreateRoomScene = new Phaser.Class ({
    Extends: Phaser.Scene,

    initialize: function CreateRoomScene(config) {
        Phaser.Scene.call(this, config);
        console.log("create room scene initialize");
    },
    preload: function() {
        console.log("create room scene preload");
    },
    create: function() {
        console.log("create room scene create");
    },
    update: function() {

    }
});

/**
 * 部屋選択画面
 */
let SelectRoomScene = new Phaser.Class ({
    Extends: Phaser.Scene,

    initialize: function SelectRoomScene(config) {
        Phaser.Scene.call(this, config);
        console.log("select room scene initialize");
    },
    preload: function() {
        console.log("select room scene preload");
    },
    create: function() {
        console.log("select room scene create");
    },
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
game.scene.add('select', SelectCharaScene, true);
game.scene.add('battle', BattleScene, false);
