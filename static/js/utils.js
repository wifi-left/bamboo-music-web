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
function HTML_encode(text){
    let e = document.createElement("span");
    e.innerText = text;
    let result = e.innerHTML;
    return result;
}