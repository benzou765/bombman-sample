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
 * キャラ選択画面
 */
let SelectCharaScene = new Phaser.Class ({
    Extends: Phaser.Scene,

    initialize: function SelectScene(config) {
        Phaser.Scene.call(this, config);
        // キーボード
        this.cursors = null;
        // 操作アイコン群
        this.selectMenuIcon = null;
        this.selectCharaIcon = null;
        // アセット群
        this.bomb = null;
        this.bommers = [];
        this.bommersList = {
            BommerA: "img/bommer_a.png",
            BommerB: "img/bommer_b.png",
            BommerC: "img/bommer_c.png",
            BommerD: "img/bommer_d.png",
            BommerE: "img/bommer_e.png",
            BommerF: "img/bommer_f.png"
        };
    },
    preload: function() {
        console.log("select scene preload");
        // アセットのロード
        this.load.spritesheet('Bomb', 'img/bomb.png', { frameWidth: 32, frameHeight: 32, startFrame: 0, endFrame: 5});
        for (let key in this.bommersList) {
            this.load.spritesheet(key, this.bommersList[key], { frameWidth: 32, frameHeight: 32, startFrame: 0, endFrame: 11});
        }
    },
    create: function() {
        console.log("select scene create");
        // 背景色
        this.cameras.main.setBackgroundColor("#ecf4f3");
        // タイトルテキスト
        this.add.text(160, 80, "爆弾マン？").setFontSize(64).setColor("#34675c");
        // 説明テキスト
        this.add.rectangle(305, 425, 220, 50, 0xd1eecc);
        this.add.text(200, 410, "←、→キーでキャラクター選択を、").setFontSize(13).setColor("#34675c");
        this.add.text(200, 430, "↑、↓キーで部屋作成か選択してね").setFontSize(13).setColor("#34675c");
        // 部屋選択テキスト
        this.add.text(260, 290, "部屋を作成する").setFontSize(16).setColor("#34675c");
        this.add.text(260, 320, "部屋を選択する").setFontSize(16).setColor("#34675c");

        // キャラ選択アイコンの初期化
        this.selectCharaIcon = this.add.rectangle(210, 220, 40, 40, 0x76dbd1);
        // 部屋選択アイコンの初期化
        this.selectMenuIcon = this.add.circle(250, 298, 5, 0x76dbd1);

        // キャラアニメの初期化
        let index = 0;
        for (let key in this.bommersList) {
            this.bommers[key] = this.add.sprite(210 + (index * 42), 220, key);
            this.anims.create({
                key: (key + 'Down'),
                frames: this.anims.generateFrameNames(key, {start: 0, end: 2}),
                frameRate: 4, // 1が1秒, 2が0.5秒
                repeat: -1
            });
            index++;
        }

        // 爆弾アニメの初期化
        this.bomb = this.add.sprite(500, 105, 'Bomb', 6).setDisplaySize(64, 64);
        this.anims.create({
            key: 'time',
            frames: this.anims.generateFrameNames('Bomb', {start: 0, end: 2}),
            frameRate: 4, // 1が1秒, 2が0.5秒
            repeat: -1
        });

        // キーボード設定の初期化
        this.cursors = this.input.keyboard.createCursorKeys();

    },
    update: function() {
        // キャラ選択アイコン描画
        if (this.cursors.left.isDown) {
            console.log("left");
            this.selectCharaIcon.setPosition(100, 220);
        } else if (this.cursors.right.isDown) {
            console.log("right");
            this.selectCharaIcon.setPosition(500, 220);
        }
        // 部屋選択アイコン描画
        if (this.cursors.up.isDwon) {
            this.selectMenuIcon.setPosition(250, 298);
        } else if (this.cursors.down.isDown) {
            this.selectMenuIcon.setPosition(250, 308);
        }

        // アニメーションの描画
        this.bomb.play('time', true);
        for (let key in this.bommersList) {
            this.bommers[key].play((key + 'Down'), true);
        }
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
