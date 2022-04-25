"use strict";

/**
 * @example moeskin.pagetools
 */
mw.hook("moeskin.pagetools").add(({ addPageToolsButton }) => {
    /** @type {JQuery<HTMLAnchorElement>} */
    const $myBtn = addPageToolsButton("icon", "tooltip");
    $myBtn.on("click", () => {
        alert("hello, world");
    });
});