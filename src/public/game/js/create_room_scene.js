'use strict';

/**
 * 部屋作成画面
 * @see https://photonstorm.github.io/phaser3-docs/Phaser.Scene.html
 */
let CreateRoomScene = new Phaser.Class ({
    Extends: Phaser.Scene,

    /**
     * シーンのコンストラクタ。ゲーム起動時とともに1回だけ実行される。
     * @param object config
     */
    initialize: function CreateRoomScene(config) {
        Phaser.Scene.call(this, config); // 親クラスのコンストラクタの呼び出し
    },
    /**
     * シーンの初期化。シーンの実行時（start）に実行される。パラメータの初期化、受け渡し等に使用。
     * @param object data
     */
    init: function(data)
    {
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
        this.roomSettings = [
            { name: "前画面に戻る", size: 0, point: {x: 100, y: 200} },
            { name: "25人部屋を作成", size: 11, point: {x: 100, y: 220} },
            { name: "100人部屋を作成", size: 21, point: {x: 100, y: 240} },
            { name: "625人部屋を作成", size: 51, point: {x: 100, y: 260} },
            { name: "2500人部屋を作成", size: 101, point: {x: 100, y: 280} },
            { name: "10000人部屋を作成", size: 201, point: {x: 100, y: 300} },
            { name: "62500人部屋を作成", size: 501, point: {x: 100, y: 320} },
            { name: "250000人部屋を作成", size: 1001, point: {x: 100, y: 340} },
        ];
        // ユーザ操作変数群
        this.roomSizeSelectNum = 0;
        this.modalActive = false;
        this.roomId = 0;
        // 操作アイコン群
        this.selectRoomSizeIcon = null;
        // アセット群
        this.bommer = null;
        this.modalWindowAssets = [];
        this.blind = null;
    },
    /**
     * シーンに使用するアセットの読み込み。シーン実行時に実行される
     */
    preload: function() {
        let id = this.selectedCharaNum;
        this.load.spritesheet(this.bommerSettings[id].key, this.bommerSettings[id].path, { frameWidth:32, frameHeight: 32, startFrame: 0, endFrame: 11});
    },
    /**
     * シーンの作成。シーンの実行時に実行される。アセットの読み込み完了後に実行され、画面の構築等を行う。
     * @param object data
     */
    create: function(data) {
        console.log("create room scene create");
        this.cameras.main.setBackgroundColor("ecf4f3");
        // タイトルテキスト
        this.add.text(20, 20, "部屋を作成する").setFontSize(32).setColor("#34675c");
        // 説明テキスト
        this.add.rectangle(495, 62, 250, 50, 0xd1eecc);
        this.add.text(380, 45, "↑、↓キーで部屋の大きさを選んでね！").setFontSize(13).setColor("#34675c");
        this.add.text(380, 65, "SPACEキーで確定！").setFontSize(13).setColor("#34675c");
        // 部屋サイズテキスト
        for (let i = 0; i < this.roomSettings.length; i++) {
            let room = this.roomSettings[i];
            this.add.text(room.point.x, room.point.y, room.name).setFontSize(16).setColor("#34675c");
        }
        // カーソルアイコンの初期化
        this.selectRoomSizeIcon = this.add.circle(this.roomSettings[this.roomSizeSelectNum].point.x - 10, this.roomSettings[this.roomSizeSelectNum].point.y + 8, 5, 0x76dbd1)
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
        // モーダルウィンドウの初期化
        let modal = this.add.rectangle(320, 240, 160, 80, 0xf4f4f4).setName("modalWindow").setStrokeStyle(3, 0x34675c);
        this.modalWindowAssets.push(modal);
        let modalMessage = this.add.text(253, 213, "部屋ID：").setName("modalText").setFontSize(16).setColor("#34675c");
        this.modalWindowAssets.push(modalMessage);
        let modalButton = this.add.rectangle(320, 260, 40, 26, 0x76dbd1).setName("modalButton");
        this.modalWindowAssets.push(modalButton);
        let modalButtonText = this.add.text(310, 248, "OK").setName("modalButtonText").setFontSize(20).setColor("#34675c");
        this.modalWindowAssets.push(modalButtonText);
        for (let i = 0; i < this.modalWindowAssets.length; i++) {
            this.modalWindowAssets[i].setVisible(this.modalActive);
            this.modalWindowAssets[i].setActive(this.modalActive);
        }
        this.blind = this.add.rectangle(320, 240, 640, 480, 0x000000);
        this.blind.setAlpha(0.25);
        this.blind.setVisible(false);
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
        let setting = this.bommerSettings[this.selectedCharaNum];
        this.bommer.play(setting.key + 'Down', true);

        if (this.blind.visible) {
            return;
        }

        if (this.modalActive) {
            // モーダル表示時の操作
            // 決定処理
            if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
                let sendData = { chara_id: this.selectedCharaNum, map_size: this.roomSettings[this.roomSizeSelectNum].size, room_id: this.roomId, num: 0};
                this.scene.stop();
                this.scene.start("battle", sendData);
            }
        } else {
            // モーダル非表示時の操作
            if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
                if (0 < this.roomSizeSelectNum && this.roomSizeSelectNum < this.roomSettings.length) {
                    this.roomSizeSelectNum -= 1;
                    let setting = this.roomSettings[this.roomSizeSelectNum];
                    this.selectRoomSizeIcon.setPosition(setting.point.x - 10, setting.point.y + 8);
                }
            } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
                if (0 <= this.roomSizeSelectNum && this.roomSizeSelectNum < (this.roomSettings.length - 1)) {
                    this.roomSizeSelectNum += 1;
                    let setting = this.roomSettings[this.roomSizeSelectNum];
                    this.selectRoomSizeIcon.setPosition(setting.point.x - 10, setting.point.y + 8);
                }
            }
            // 決定処理
            if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
                switch(this.roomSizeSelectNum) {
                    case 0:
                        this.scene.stop();
                        let sendData = { chara_id: this.selectedCharaNum};
                        this.scene.start("selectChara", sendData);
                        break;
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                        /**
                         * 部屋作成APIの呼び出し関数
                         * @param {Phaser.Scene} scene この関数を呼び出しているシーン
                         */
                        async function postCreateRoom(scene) {
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
                            let jsonBody = JSON.stringify({"chara_id": scene.selectedCharaNum, "size": scene.roomSettings[scene.roomSizeSelectNum].size});
                            let response = await fetch("/rooms/create", {
                                method: method,
                                headers: headers,
                                body: jsonBody
                            })
                            .then(res => {
                                return res.json();
                            })
                            .catch(err => {
                                console.log("Error!!");
                                console.log(err)
                            });
                            scene.roomId = response.room_id;
                            // モーダルウィンドウの表示準備
                            scene.modalActive = true;
                            for (let i = 0; i < scene.modalWindowAssets.length; i++) {
                                scene.modalWindowAssets[i].setVisible(scene.modalActive);
                                scene.modalWindowAssets[i].setActive(scene.modalActive)
                                if (scene.modalWindowAssets[i].name == "modalText") {
                                    let message = "部屋ID：" + ('000000' + scene.roomId).slice(-6);
                                    scene.modalWindowAssets[i].setText(message);
                                }
                            }
                            scene.blind.setVisible(false);
                        };
                        // 部屋作成APIの呼び出し
                        postCreateRoom(this);
                        this.blind.setVisible(true);
                        break;
                }
            }
        }
    },
});
