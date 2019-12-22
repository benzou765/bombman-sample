"use strict";

(function() {
    // debug code
    let type = "WebGL";
    if (!PIXI.utils.isWebGLSupported()) {
        type = "canvas";
    }
    PIXI.utils.sayHello(type);

    let stage = new PIXI.Container();

    // 画面の大きさ、オプションを定義
    let renderer = PIXI.autoDetectRenderer(640, 360, {
        antialias: true,
        backgroundColor: 0x00ffd4
    });

    // 描画場所の指定
    document.getElementById('stage').appendChild(renderer.view);

    /**
     * アニメーション関数の定義
     */
    let animation = function() {
        // アニメーションを再帰的に呼び出す
        requestAnimationFrame(animation);

        // 描画
        renderer.render(stage);
    }

    animation();
})();