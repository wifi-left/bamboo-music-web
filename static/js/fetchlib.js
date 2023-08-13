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