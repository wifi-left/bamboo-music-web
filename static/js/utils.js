// var isIphone = false;
const isIphone = function () {
    //获取浏览器navigator对象的userAgent属性（浏览器用于HTTP请求的用户代理头的值）
    var info = navigator.userAgent;
    //通过正则表达式的test方法判断是否包含“Mobile”字符串
    var isPhone = /mobile/i.test(info);
    //如果包含“Mobile”（是手机设备）则返回true
    return isPhone;
}();

const WEB_TITLE = document.getElementById("web-title");
function change_web_title(title){
    WEB_TITLE.innerText = title;
}
function checkLanguage(name) {
    var result = 0; //未知 / 英文
    var reg = /[\u4E00-\u9FA5\uF900-\uFA2D]/;
    if (name.search(reg) != -1) {
        result = 1; //中文
    }

    var reg = /[\u3040-\u309F\u30A0-\u30FF]/;
    if (name.search(reg) != -1) {
        result = 2; //日文
    }

    var reg = /[\uac00-\ud7ff]/;
    if (name.search(reg) != -1) {
        result = 3; //韩文
    }

    var reg = /[а-яА-Я]/;
    if (name.search(reg) != -1) {
        result = 4; //俄语
    }

    return result;
}
function fetchi(url, type = 'text', callback, fallbackfunc, fallback = 3) {
    if (fallback <= 0) {
        fallbackfunc(new Error("获取失败。"));
        return;
    }
    $.fetch(url, type).then(data => {
        callback(data);
    }).catch(e => {
        if (e.name == 'TypeError') {
            show_msg("获取失败。", 1000);
            fallbackfunc(e);
            return;
        }
        console.warn(e);
        show_msg("获取失败。将在2秒后重试。(" + fallback + ")", 1000);
        if (fallback <= 1) {
            fallbackfunc(e);
            return;
        }
        setTimeout(function () {
            fetchi(url, type, callback, fallbackfunc, fallback - 1);
        }, 2000);
    })
}

function get_random(min, max) {
    return parseInt(Math.random() * (max - min) + min)
}

function formatDateTime(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(
        second
    )}`;
}
function pad(num) {
    return num.toString().padStart(2, "0");
}
function HTML_encode(text) {
    let e = document.createElement("span");
    e.innerText = text;
    let result = e.innerHTML;
    return result;
}
class TemporaryLocalStorage {

    constructor() {
        this.items = {};
    }
    setItem(item, value) {
        this.items[item] = value;
    };
    getItem(item, default_value = null) {
        let value = this.items[item];
        if (value == null) return default_value;
        return value;
    };
    removeItem(item) {
        // localStorage.removeItem(item);
        delete this.items[item];
    };
    clear(sure = false) {
        if (sure)
            this.items = {};
    };
}
class LocalSettings {
    constructor() {

    }
    setItem(item, value) {
        localStorage.setItem(item, value);
    };
    getItem(item, default_value = null) {
        let value = localStorage.getItem(item);
        if (value == null) return default_value;
        return value;
    };
    removeItem(item) {
        localStorage.removeItem(item);
    };
    clear(sure = false) {
        if (sure)
            localStorage.clear();
    };
}
if (localStorage == null) {
    var localStorage = new TemporaryLocalStorage();
    console.warn("正在使用虚拟localStorage，您是否没有启用本地存储权限？")
}
const localSettings = new LocalSettings();

/* ---------------- 通用小工具 ---------------- */

/** 一帧最多执行一次：用于 resize/scroll 这类每秒触发几十次的回调。 */
function throttleRAF(fn) {
    let raf = 0, lastArgs = null;
    return function () {
        lastArgs = arguments;
        if (raf != 0) return;
        raf = requestAnimationFrame(function () {
            raf = 0;
            fn.apply(null, lastArgs);
        });
    };
}
/** 空闲时执行（老浏览器退回 setTimeout）。 */
function onIdle(fn) {
    if (typeof requestIdleCallback == "function") requestIdleCallback(function () { fn(); }, { timeout: 800 });
    else setTimeout(fn, 60);
}
/** 批量插入：一次 insert，而不是逐行 appendChild 到已在文档里的节点。 */
function appendAll(container, nodes) {
    if (nodes == null || nodes.length == 0) return;
    let frag = document.createDocumentFragment();
    for (let i = 0; i < nodes.length; i++) frag.appendChild(nodes[i]);
    container.appendChild(frag);
}
/** 按 key 防抖：同一来源的连续触发只跑最后一次（搜索提示词用）。 */
function debounceByKey(fn, wait) {
    let timers = {};
    return function (key) {
        let args = arguments;
        if (timers[key] != null) clearTimeout(timers[key]);
        timers[key] = setTimeout(function () {
            timers[key] = null;
            fn.apply(null, args);
        }, wait);
    };
}

/* ---------------- 拦掉浏览器原生拖放 ----------------
   Edge / Chromium 153 的回归 bug（Chromium issue 559347435 / 560749214）：
   选中文本后按住拖动会触发浏览器原生「拖走选中的文本」，随后整个页面输入无响应
   （鼠标点击、滚动、快捷键全失效），只能刷新恢复。官方给的页面侧规避就是拦掉 dragstart。
   本应用没有依赖原生拖放的控件：手动排序走 pointer 事件，图片/链接也不需要被拖走。
   文字照旧可以选中、复制，只是选中后再拖不会触发原生拖放。
   注意：以后若要用 HTML5 拖放，给元素显式加 draggable="true"，下面的判断会放行。 */
document.addEventListener("dragstart", function (e) {
    let t = e.target;
    if (t != null && t.closest != null && t.closest('[draggable="true"]') != null) return;
    e.preventDefault();
}, true);

/* ---------------- 手动排序（拖动） ----------------
   把一次拖动做成一小组状态，落定后由调用方重排数组并重渲染。
   几个关键取舍（都踩过坑）：
   - 只在手柄上接管指针（手柄带 touch-action:none），列表本身照旧能滚 —— 手机上不会抢手势；
   - 不用第三方库：项目没有模块系统；而且 HTML5 拖放（draggable/dragstart）在触屏上根本不触发；
   - 拖动过程只改 transform（合成器），落点用拖开始前量好的矩形 + 累计滚动量算，过程中不读布局；
   - 落定后必须重排数组 + 重渲染：行内"播放/删除"按钮把数组下标写死在 onclick 里，只挪 DOM 会让它们指错歌。
*/
function createSortList(opts) {
    const container = opts.container;
    const itemSelector = opts.itemSelector || "li";
    const handleClass = opts.handleClass || "drag-handle";
    const scroller = opts.scroller || container;
    const onCommit = opts.onCommit;
    // 行高整齐的列表（播放列表）：让其它行让位，视觉上"空位"很清楚。
    // 行高不齐、还夹着分隔符的列表（收藏详情）：只移动被拖的那一行，避免分隔符不跟着动显得乱。
    const shiftOthers = (opts.shiftOthers === undefined) ? true : !!opts.shiftOthers;
    let armed = false;
    let drag = null;
    let autoRAF = 0;

    function items() {
        return Array.prototype.slice.call(container.querySelectorAll(":scope > " + itemSelector));
    }
    function arm() {
        if (armed) return;
        armed = true;
        container.classList.add("sort-armed");
        container.addEventListener("pointerdown", onDown, { passive: false });
    }
    function disarm() {
        if (!armed && drag == null) return;
        armed = false;
        container.classList.remove("sort-armed");
        container.removeEventListener("pointerdown", onDown);
        finishDrag(false);
    }

    function onDown(e) {
        if (!armed || e.button > 0) return;
        let handle = (e.target && e.target.closest) ? e.target.closest("." + handleClass) : null;
        if (handle == null) return;
        let li = handle.closest(itemSelector);
        if (li == null) return;
        let list = items();
        let from = list.indexOf(li);
        if (from < 0) return;
        e.preventDefault();
        let rects = list.map(function (el) { return el.getBoundingClientRect(); });
        drag = {
            li: li, from: from, to: from, list: list, rects: rects,
            startY: e.clientY, lastY: e.clientY, dy: 0, scrollDelta: 0, moved: false,
            scrollerRect: scroller.getBoundingClientRect()
        };
        if (handle.setPointerCapture != null) {
            try { handle.setPointerCapture(e.pointerId); } catch (err) { }
        }
        document.addEventListener("pointermove", onMove, { passive: false });
        document.addEventListener("pointerup", onUp);
        document.addEventListener("pointercancel", onUp);
    }

    function onMove(e) {
        if (drag == null) return;
        drag.lastY = e.clientY;
        drag.dy = e.clientY - drag.startY;
        if (!drag.moved) {
            if (Math.abs(drag.dy) < 6) return; // 6px 以内算点击，避免误触
            drag.moved = true;
            reorderInProgress = true;          // 拖动期间禁止重渲染（切歌回调会清掉 DOM）
            drag.li.classList.add("sort-dragging");
            startAutoScroll();
        }
        e.preventDefault();
        // 每次移动都要重算落点（只算不读布局：矩形是拖开始前量好的，滚动量是自己累计的）
        updateTarget();
    }
    function onUp() { finishDrag(true); }

    /** 只改 transform，不读布局：其它行按"让出空位"的方向平移，被拖行跟着手指。 */
    function layout() {
        if (drag == null) return;
        let h = drag.rects[drag.from].height;
        drag.li.style.transform = "translateY(" + (drag.dy + drag.scrollDelta) + "px)";
        for (let i = 0; i < drag.list.length; i++) {
            if (i === drag.from) continue;
            let el = drag.list[i];
            let shift = 0;
            if (shiftOthers) {
                if (drag.from < drag.to && i > drag.from && i <= drag.to) shift = -h;
                else if (drag.from > drag.to && i >= drag.to && i < drag.from) shift = h;
            }
            el.style.transform = shift == 0 ? "" : "translateY(" + shift + "px)";
        }
    }
    /** 落点 = 有多少个"其它行"的中点在"被拖行"中心之上。 */
    function updateTarget() {
        if (drag == null) return;
        let center = drag.rects[drag.from].top + drag.rects[drag.from].height / 2 + drag.dy;
        let count = 0;
        for (let i = 0; i < drag.list.length; i++) {
            if (i === drag.from) continue;
            let r = drag.rects[i];
            if (r.top - drag.scrollDelta + r.height / 2 < center) count++;
        }
        drag.to = count;
        layout();
    }
    /** 拖到列表上下边缘时自动滚动（手机上播放列表面板很矮，必须有）。 */
    function startAutoScroll() {
        if (autoRAF != 0) return;
        let step = function () {
            autoRAF = 0;
            if (drag == null || !drag.moved) return;
            let sr = drag.scrollerRect;
            let edge = 48;
            let delta = 0;
            if (drag.lastY < sr.top + edge) delta = -Math.max(4, (sr.top + edge - drag.lastY) / 4);
            else if (drag.lastY > sr.bottom - edge) delta = Math.max(4, (drag.lastY - (sr.bottom - edge)) / 4);
            if (delta != 0) {
                let before = scroller.scrollTop;
                scroller.scrollTop = before + delta;
                drag.scrollDelta += (scroller.scrollTop - before);
                if (scroller.scrollTop !== before) updateTarget();
            }
            autoRAF = requestAnimationFrame(step);
        };
        autoRAF = requestAnimationFrame(step);
    }
    /** 结束拖动：清理样式与全局标记，必要时把 (from,to) 交给调用方去重排数组。 */
    function finishDrag(commit) {
        if (autoRAF != 0) { cancelAnimationFrame(autoRAF); autoRAF = 0; }
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
        let d = drag;
        drag = null;
        if (d == null) return;
        let moved = d.moved;
        d.li.classList.remove("sort-dragging");
        for (let i = 0; i < d.list.length; i++) d.list[i].style.transform = "";
        if (!moved) return;
        reorderInProgress = false;
        // 拖动结束后的那次 click 要吞掉：播放列表面板是"点外面就关"，
        // 手指/鼠标抬起时会在面板外合成一次点击，把面板关掉。
        suppressNextClickOnce();
        if (commit && d.to !== d.from && typeof onCommit == "function") onCommit(d.from, d.to);
    }
    return { arm: arm, disarm: disarm, items: items, isDragging: function () { return drag != null && drag.moved; } };
}

/** 吞掉接下来的一次 click（拖动结束时避免面板被关掉 / 误触发行点击）。 */
function suppressNextClickOnce() {
    let handler = function (e) {
        e.stopPropagation();
        e.preventDefault();
        document.removeEventListener("click", handler, true);
    };
    document.addEventListener("click", handler, true);
    setTimeout(function () { document.removeEventListener("click", handler, true); }, 400);
}

