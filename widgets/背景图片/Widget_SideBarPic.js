"use strict";
window.RLQ = window.RLQ || [];
window.RLQ.push((async () => {
    // wait dependency
    await Promise.all([
        mw.loader.using(["mediawiki.Uri"]),
        $.ready,
    ]);

    // user disabled
    if (+mw.user.options.get("gadget-disableSideBarPic") === 1) {
        return;
    }

    // get sidebar
    /** @type {() => JQuery<HTMLDivElement>} */
    const useSidebar = () => {
        switch (mw.config.get("skin")) {
            case "moeskin":
                return $("#moe-global-sidenav");
            case "vector":
            default:
                return $("#mw-navigation");
        }
    };

    // wait bg container
    await new Promise((res) => {
        const i = setInterval(() => {
            if (useSidebar().length) {
                clearInterval(i);
                res();
            }
        }, 100);
    });
    console.info(" Widget:SideBarPic pre-init-check", useSidebar());

    // already executed?
    if ($("body").hasClass("sideBarPic-executed")) {
        return;
    }
    $("body").addClass("sideBarPic-executed");

    // get this character, limit to 3 pictures
    /** @type {JQuery<HTMLDivElement>} */
    const $sidebarCharacter = $(".sidebar-character:not(.executed)").addClass("executed").slice(0, 3);
    if (!$sidebarCharacter.length) {
        return;
    }

    // preload images
    await Promise.all($sidebarCharacter.find("img").toArray().map((img) => new Promise((res) => {
        let retryCount = 0;
        try {
            const lazyload = new Image();
            const url = new mw.Uri(img.dataset.src || img.src);
            if (url.host.endsWith(".moegirl.org")) {
                url.host += ".cn";
            }
            lazyload.addEventListener("load", () => {
                img.src = url;
                res();
            });
            lazyload.addEventListener("error", () => {
                if (retryCount++ < 3) {
                    const url = new mw.Uri(lazyload.src);
                    url.query._ = Math.random();
                    lazyload.src = url;
                } else {
                    console.info(" Widget:SideBarPic img-load-failed\n", img.dataset.src);
                    img.remove();
                    res();
                }
            });
            lazyload.src = url;
        } catch (e) {
            console.info(" Widget:SideBarPic img-load-failed\n", e);
            img.remove();
            res();
            return;
        }
    })));
    $("body").addClass("sideBarPic");

    // mount images
    $sidebarCharacter.each((_, ele) => {
        const $this = $(ele);
        if (!$this.find("img")[0]) {
            return;
        }
        const $sidebar = useSidebar();
        console.info(" Widget:SideBarPic append-check\n", $sidebar);
        $this.appendTo($sidebar);
        $this.fadeIn().addClass(ele.dataset.align === "top" ? "top" : "bottom").css("user-select", "none");
        $this.addClass("active").find("img").removeAttr("width").removeAttr("height");
    });
    $(window).on("resize", () => {
        $sidebarCharacter.each((_, ele) => {
            const self = $(ele);
            self.find("img").width(self.width());
        });
    }).trigger("resize");
    if ($sidebarCharacter.data("displaylogo") === "yes") {
        $("body").addClass("show-logo");
    }
})());