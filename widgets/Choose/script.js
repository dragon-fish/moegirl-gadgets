// <pre>
/**
 * @name MGPChoose 萌娘百科の选择（划掉）
 * @desc 对于 <choose> 扩展标签的纯 JS 实现
 * @author 机智的小鱼君
 * @license CC BY-NC-SA
 * @example ```html
 * <!-- 随机标题，额外添加 mgp-random-title 这个 class 即可 -->
 * <div class="mgp-choose">
 * <div class="mgp-choose-option">option 1</div>
 * <div class="mgp-choose-option">option 2</div>
 * </div>
 * ```
 */

"use strict";
(() => {
    // 变量
    const CLASS_NAME = {
        chooseContainer: "mgp-choose",
        chooseItem: "mgp-choose-option",
        choosePicked: "mgp-choose-picked",
        randomTitle: "mgp-random-title",
    };
    const MAX_WEIGHT = 1000;

    // 工具类
    class RandomPick {
        /**
         * @param {{ value: any, weight: number }[]} data
         */
        constructor(data) {
            /** @type {{ value: any, id: number }[]} */
            this._list = [];
            if (data) {
                this.init(data);
            }
        }
        /**
         * @param {{ value: any, weight: number }[]} data
         */
        init(data) {
            data.map(({ value, weight }, index) => ({
                index,
                value,
                weight: isNaN(parseInt(weight))
                    ? 1
                    : Math.min(MAX_WEIGHT, Math.max(0, parseInt(weight))),
            }))
                .filter(({ value }) => !!value)
                .forEach(({ weight, value, index }) => {
                    for (let i = 0; i < weight; i++) {
                        this._list.push({ value, id: index });
                    }
                });
            return this;
        }
        /**
         * 返回实际上的种类数量
         */
        valueLength() {
            return [...new Set(this._list.map(({ id }) => id))].length;
        }
        /**
         * @param {number} count
         */
        pick(count = 1) {
            const that = this;
            const result = [];
            let howMany = parseInt(count);
            howMany = !isNaN(howMany)
                ? Math.max(1, Math.min(howMany, this.valueLength()))
                : 1;
            (function _push(i = 0, pickedIndex = []) {
                if (that._list.length < 1) {
                    return;
                }
                const index = Math.floor(Math.random() * that._list.length);
                const item = that._list[index];
                if (
                    !result.find(({ id }) => id === item.id) &&
                    !pickedIndex.includes(index)
                ) {
                    result.push(item);
                } else {
                    _push(i, pickedIndex);
                    return;
                }
                if (i + 1 < howMany) {
                    _push(i + 1, [...pickedIndex, index]);
                }
            })();
            return result.map(({ value }) => value);
        }
    }

    /**
     * @param {JQuery<HTMLElement>} $el
     */
    function toPickList($el) {
        return $el.toArray().map((element) => ({
            value: element,
            weight: parseInt($(element).data("weight") || "1"),
        }));
    }

    // Main
    async function main() {
        await $.ready;
        /**
         * @type {HTMLElement[]}
         * @desc 缓存被选中的所有 HTML 元素，后面统一处理
         */
        const pickedList = [];
        let randomTitleReady = false;
        // 获取所有 choose
        const $allTargets = $(`.${CLASS_NAME.chooseContainer}`);
        $allTargets.each((index, element) => {
            const $choose = $(element);
            const $options = $choose
                .children(`.${CLASS_NAME.chooseItem}`)
                .hide()
                .removeClass(CLASS_NAME.choosePicked);
            const picker = new RandomPick(toPickList($options));
            const count = parseInt($choose.data("count") || "1");

            console.log("[MGPChoose]", "Original element", $choose, {
                $options,
                count,
                list: picker._list,
            });

            // 如果是随机标题，特殊处理
            if ($choose.hasClass(CLASS_NAME.randomTitle)) {
                if (randomTitleReady) {
                    return;
                }
                randomTitleReady = true;
                return handleRandomTitle(picker);
            }

            pickedList.push(...picker.pick(count));
        });
        console.log("[MGPChoose]", "Picked list", pickedList);
        // 统一添加 class 属性
        pickedList.forEach((el) =>
            // eslint-disable-next-line comma-dangle
            $(el).show().addClass(CLASS_NAME.choosePicked)
        );
    }

    /**
     *
     * @param {RandomPick} picker
     */
    function handleRandomTitle(picker) {
        /** @type {JQuery<HTMLElement>} */
        const $title = $(picker.pick(1)[0]).clone();
        const titleText = $title.text().trim();

        // 替换页面 h1 标题
        $("h1#firstHeading, h1#section_0")
            .empty()
            .append($title.get(0).childNodes);

        // 替换浏览器标签页标题
        const titleSufix =
            document.title.split("-").pop()?.trim() ||
            "萌娘百科_万物皆可萌的百科全书";
        document.title = `${titleText} - ${titleSufix}`;
    }

    (window.RLQ = window.RLQ || []).push(main);
})();
