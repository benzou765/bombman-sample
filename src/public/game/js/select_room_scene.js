'use strict';

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
        // 通信で取得するデータ
        this.rooms = [];
        // 前シーンからのデータ取得
        this.selectedCharaNum = data.chara_id;
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
        // ユーザ操作変数群
        this.selectRoomNum = 0;
        this.selectBack = true;
        // アセット群
        this.bommer = null;
        this.scrollablePanel = null;
        this.backButton = null;
        this.roomTexts = [];
    },
    /**
     * シーンに使用するアセットの読み込み。シーン実行時に実行される
     */
    preload: function() {
        console.log("select room scene preload");
        let id = this.selectedCharaNum;
        this.load.spritesheet(this.bommerSettings[id].key, this.bommerSettings[id].path, { frameWidth: 32, frameHeight: 32, startFrame:0, endFrame: 11});
        // スクロールプラグインの追加
        this.load.scenePlugin({
            key: 'rexuiplugin',
            url: './js/lib/rexuiplugin.min.js',
            sceneKey: 'rexUI'
        })
        // サーバから現在稼働中の部屋一覧を受け取る
        let cookies = document.cookie;
        let cookiesArray = cookies.split(';');
        let userId = 0;
        if (cookiesArray.length == 1) {
            let cArray = cookiesArray[0].split('=');
            if (cArray[0] == 'BombmanUserId') {
                userId = cArray[1];
            }
        }
        this.load.json({
            key: 'showRooms',
            url: '/rooms',
            xhrSettings: {
                headerValue: ("Cookie:BombmanUserId=" + userId)
            }
        });
    },
    /**
     * シーンの作成。シーンの実行時に実行される。アセットの読み込み完了後に実行され、画面の構築等を行う。
     * @param object data
     */
    create: function() {
        console.log("select room scene create");
        // 背景色の設定
        this.cameras.main.setBackgroundColor(0xecf4f3);
        // 部屋情報の設定
        this.rooms = this.cache.json.get('showRooms').room_info;
        // タイトルテキスト
        this.add.text(20, 20, "部屋を選択する").setFontSize(32).setColor("#34675c");
        // 前画面に戻るテキスト
        this.backButton = this.add.text(410, 80, "前画面に戻る").setFontSize(16).setColor("#34675c").setBackgroundColor("#76dbd1");
        // キャラアニメの初期化
        let setting = this.bommerSettings[this.selectedCharaNum];
        this.bommer = this.add.sprite(480, 250, setting.key)
        this.anims.create({
            key: (setting.key + 'Down'),
            frames: this.anims.generateFrameNames(setting.key, {start: 0, end: 2}),
            frameRate: 4, // 1が1秒, 2が0.5秒
            repeat: -1
        });
        this.add.text(420, 210, "選択中のキャラクター").setFontSize(13).setColor("#34675c");
        // スクロールパネルの初期化
        // @see https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-gridtable/
        /**
         * スクロール内のコンテンツを作成
         * @param Phaser.Scene scene 
         * @param object data 
         */
        let createPanel = function(scene, data) {
            let sizer = scene.rexUI.add.sizer({
                orientation: 'vertical',
            })
            .add(
                createTable(scene, data),
                0, // proportion
                'top', // align
                {
                    right: 1,
                }, //paddingConfig
                true // expand
            );
            return sizer;
        };
        /**
         * スクロール内のテーブルを作成
         * @param Phaser.Scene scene 
         * @param object data 
         */
        let createTable = function (scene, data) {
            let table = scene.rexUI.add.gridSizer({
                column: 1,
                row: data.length,
            });
            for (var i = 0, cnt = data.length; i < cnt; i++) {
                let showText = "room:" + data[i].id + ", num:" + data[i].num;
                let textObject = scene.add.text(0, 0, showText).setColor("#34675c");
                table.add(
                    textObject,
                    0, // columns
                    i, //rows
                    'left',
                    1,
                    true
                );
                scene.roomTexts.push(textObject);
            }
            return scene.rexUI.add.sizer({
                    orientation: 'y',
                })
                .addBackground(
                    scene.rexUI.add.roundRectangle(0, 0, 0, 0, 0, undefined).setStrokeStyle(2, 0x76dbd1, 1)
                )
                .add(table, // child
                    1, // proportion
                    'center', // align
                    5, // paddingConfig
                    true // expand
                );
        };        
        this.scrollablePanel = this.rexUI.add.scrollablePanel({
            x: 195,
            y: 250,
            width: 350,
            height: 400,
            scrollMode: 'vertical', // スクロール方向
            panel: { // スクロール内のコンテンツ
                child: createPanel(this, this.rooms),
            },
            slider: { // スライダーの設定
                track: this.rexUI.add.roundRectangle(0, 0, 20, 10, 10, 0xd1eecc),
                thumb: this.rexUI.add.roundRectangle(0, 0, 0, 0, 13, 0x34675c),
                input: 'none'
            }, // 余白
            space: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10,
                panel: 10
            }
        }).layout();
        // キーボード設定の初期化
        this.cursors = this.input.keyboard.createCursorKeys();
    },
    /**
     * シーンの更新。毎フレーム実行される。
     * @param number time
     * @param number delta
     */
    update: function() {
        // 部屋選択アイコン描画
        if (this.cursors != null) {
            if (Phaser.Input.Keyboard.JustDown(this.cursors.right) && !this.selectBack) {
                this.selectBack = true;
                this.backButton.setBackgroundColor("#76dbd1");
                this.roomTexts[this.selectRoomNum].setBackgroundColor(null);
            } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left) && this.selectBack && this.roomTexts.length != 0) {
                this.selectBack = false;
                this.backButton.setBackgroundColor(null);
                this.roomTexts[this.selectRoomNum].setBackgroundColor("#76dbd1");
            } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && !this.selectBack && this.selectRoomNum > 0) {
                this.roomTexts[this.selectRoomNum].setBackgroundColor(null);
                this.selectRoomNum -= 1;
                this.roomTexts[this.selectRoomNum].setBackgroundColor("#76dbd1");
                let scrollPer = this.selectRoomNum / this.roomTexts.length;
                this.scrollablePanel.setT(scrollPer);
                console.log(this.scrollablePanel.t);
            } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) && !this.selectBack && this.selectRoomNum < (this.roomTexts.length - 1) ) {
                this.roomTexts[this.selectRoomNum].setBackgroundColor(null);
                this.selectRoomNum += 1;
                this.roomTexts[this.selectRoomNum].setBackgroundColor("#76dbd1");
                let scrollPer = this.selectRoomNum / (this.roomTexts.length - 1);
                this.scrollablePanel.setT(scrollPer);
                console.log(this.scrollablePanel.t);
            }
            // 決定処理
            if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
                let sendData = { chara_id: this.selectedCharaNum};
                if (this.selectBack) {
                    this.scene.stop();
                    this.scene.start("selectChara", sendData);
                } else {
                    /**
                     * ユーザ更新APIの呼び出し関数
                     * @param {Phaser.Scene} scene 
                     */
                    async function postUpdateUser(scene) {
                        // cookieの取得
                        let userId = 0;
                        let cookies = document.cookie;
                        let cookiesArray = cookies.split(';');
                        if (cookiesArray.length == 1) {
                            let cArray = cookiesArray[0].split('=');
                            if (cArray[0] == 'BombmanUserId') {
                                userId = cArray[1];
                            }
                        }
                        // POST通信
                        let method = "POST";
                        let headers = {
                            "Cookie": "BombmanUserId=" + userId,
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        };
                        let jsonBody = JSON.stringify({"chara_id": scene.selectedCharaNum});
                        await fetch("/user/update", {
                            method: method,
                            headers: headers,
                            body: jsonBody
                        })
                        .then(res => {
                            return res.json();
                        })
                        .catch(err => {
                            console.log("Error!!");
                            console.log(err);
                        });
                    }
                    postUpdateUser(this);
                    this.scene.stop();
                    this.scene.start("battle", sendData);
                }
            }
        }

        // アニメーションの描画
        let setting = this.bommerSettings[this.selectedCharaNum];
        if (this.bommer != null) {
            this.bommer.play(setting.key + 'Down', true);
        }
    }
});
