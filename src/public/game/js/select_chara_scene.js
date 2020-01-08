/**
 * キャラ選択画面
 */
let SelectCharaScene = new Phaser.Class ({
    Extends: Phaser.Scene,

    initialize: function SelectCharaScene(config) {
        Phaser.Scene.call(this, config);
        // キーボード
        this.cursors = null;
        // 設定変数群
        this.bommerSettings = [
            { key: "BommerA", path: "img/bommer_a.png", point: {x: 210, y: 220} },
            { key: "BommerB", path: "img/bommer_b.png", point: {x: 252, y: 220} },
            { key: "BommerC", path: "img/bommer_c.png", point: {x: 294, y: 220} },
            { key: "BommerD", path: "img/bommer_d.png", point: {x: 336, y: 220} },
            { key: "BommerE", path: "img/bommer_e.png", point: {x: 378, y: 220} },
            { key: "BommerF", path: "img/bommer_f.png", point: {x: 420, y: 220} },
        ];
        this.menuSettings = [
            { key: "create", point: {x: 250, y: 298} },
            { key: "insert", point: {x: 250, y: 10} },
        ]
        // 操作変数群
        this.selectMenuNum = 0;
        this.selectCharaNum = 0;
        // 操作アイコン群
        this.selectMenuIcon = null;
        this.selectCharaIcon = null;
        // アセット群
        this.bomb = null;
        this.bommers = [];
    },
    preload: function() {
        console.log("select scene preload");
        // アセットのロード
        this.load.spritesheet('Bomb', 'img/bomb.png', { frameWidth: 32, frameHeight: 32, startFrame: 0, endFrame: 5});
        for (let i = 0; i < this.bommerSettings.length; i++) {
            this.load.spritesheet(this.bommerSettings[i].key, this.bommerSettings[i].path, { frameWidth: 32, frameHeight: 32, startFrame: 0, endFrame: 11});
        }
    },
    create: function() {
        console.log("select scene create");
        // 背景色
        this.cameras.main.setBackgroundColor("#ecf4f3");
        // タイトルテキスト
        this.add.text(160, 80, "爆弾マン？").setFontSize(64).setColor("#34675c");
        // 説明テキスト
        this.add.rectangle(313, 415, 220, 70, 0xd1eecc);
        this.add.text(208, 390, "←、→キーでキャラクター選択を、").setFontSize(13).setColor("#34675c");
        this.add.text(208, 410, "↑、↓キーで部屋作成か選択してね").setFontSize(13).setColor("#34675c");
        this.add.text(208, 430, "SPACEキーでキャラと部屋を確定！").setFontSize(13).setColor("#34675c");
        // 部屋選択テキスト
        this.add.text(260, 290, "部屋を作成する").setFontSize(16).setColor("#34675c");
        this.add.text(260, 320, "部屋を選択する").setFontSize(16).setColor("#34675c");

        // キャラ選択アイコンの初期化
        this.selectCharaIcon = this.add.rectangle(this.bommerSettings[0].point.x, this.bommerSettings[0].point.y, 40, 40, 0x76dbd1);
        // 部屋選択アイコンの初期化
        this.selectMenuIcon = this.add.circle(this.menuSettings[0].point.x, this.menuSettings[0].point.y, 5, 0x76dbd1);

        // キャラアニメの初期化
        for (let i = 0; i < this.bommerSettings.length; i++) {
            let settings = this.bommerSettings[i];
            this.bommers[settings.key] = this.add.sprite(settings.point.x, settings.point.y, settings.key);
            this.anims.create({
                key: (settings.key + 'Down'),
                frames: this.anims.generateFrameNames(settings.key, {start: 0, end: 2}),
                frameRate: 4, // 1が1秒, 2が0.5秒
                repeat: -1
            });
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
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            if (0 < this.selectCharaNum && this.selectCharaNum < this.bommerSettings.length) {
                this.selectCharaNum -= 1;
                let settings = this.bommerSettings[this.selectCharaNum];
                this.selectCharaIcon.setPosition(settings.point.x, settings.point.y);
            }
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            if (0 <= this.selectCharaNum && this.selectCharaNum < (this.bommerSettings.length - 1)) {
                this.selectCharaNum += 1;
                let settings = this.bommerSettings[this.selectCharaNum];
                this.selectCharaIcon.setPosition(settings.point.x, settings.point.y);
            }
        }
        // 部屋選択アイコン描画
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.selectMenuIcon.setPosition(250, 298);
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.selectMenuIcon.setPosition(250, 327);
        }

        // アニメーションの描画
        this.bomb.play('time', true);
        for (let i = 0; i < this.bommerSettings.length; i++) {
            let settings = this.bommerSettings[i];
            this.bommers[settings.key].play(settings.key + 'Down', true);
        }
    }
});
