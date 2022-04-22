"use strict";

$(function () {
    var skin = mw.config.get("skin");
    var isAnon = mw.config.get("wgUserName") === null;
    var api = new mw.Api({
        parameters: {
            format: "json",
            formatversion: 2,
        },
    });

    if (skin === "moeskin") {
        return;
    }

    var $button = $("<div>", { class: "try-moeskin" });
    $button
        .text("体验新版")
        .css({
            position: "fixed",
            background: "#fff",
            height: "40px",
            textAlign: "center",
            padding: "4px",
            fontSize: "12px",
        })
        .on("click", isAnon ? toggleAnon : toggleSkin);
    $button.appendTo("body");

    function toggleSkin() {
        api.postWithToken("csrf", {
            action: "options",
            change: "skin=moeskin",
        }).then(function (data) {
            if (data.options === "success") {
                location.reload(true);
            }
        });
    }
    function toggleAnon() {}
});
