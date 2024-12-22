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
        fallbackfunc(e);
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
        let fallbacks = fallback;
        show_msg("获取失败。将在2秒后重试。(" + fallbacks + ")", 1000);
        if (fallbacks <= 1) {
            fallbackfunc(e);
            return;
        }
        fallbacks = fallbacks - 1;
        setTimeout(function () {
            fetchi(url, type, callback, fallbackfunc, fallbacks);
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
