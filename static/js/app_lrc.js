var oLRC = {
    ti: "",
    //歌曲名
    ar: "",
    //演唱者
    al: "",
    //专辑名
    by: "",
    //歌词制作人
    offset: 0,
    //时间补偿值，单位毫秒，用于调整歌词整体位置
    ms: [],
    //歌词数组{t:时间,c:歌词}
    hasTranslate: false,
    info: { id: "", name: "", singer: "", singerid: "", album: "", albumid: "", pic: "", addition: "" }
};

function to_string(s) {
    return "" + s;
}
function round(s) {
    return Math.round(s);
}
function toLrcTime(second) {
    var result = "";
    var tHour = 0,
        tMin = 0;
    var tSec = round(second * 100) / 100; //初始化变量，四舍五入秒数。
    tMin = parseInt(tSec / 60);
    tSec = parseInt(tSec * 100 % 6000) / 100; //先乘100再取余，最后除以100。
    tHour = parseInt(tMin / 60);
    tMin = parseInt(tMin % 60);
    if (tHour > 0) {
        //判断有没有1小时
        if (tHour < 10) result = result + "0"; //小时
        result = result + to_string(tHour);
        result = result + ":";
        if (tMin < 10) result = result + "0"; //分钟
        result = result + to_string(tMin);
        result = result + ":";
        if (tSec < 10) result = result + "0"; //秒
        result = result + to_string(tSec);
        if (parseInt(tSec * 100) % 100 == 0) result = result + ".0";
        if (parseInt(tSec * 100) % 10 == 0) result = result + "0";
    } else {
        if (tMin < 10) result = result + "0"; //分钟
        result = result + to_string(tMin);
        result = result + ":";
        if (tSec < 10) result = result + "0"; //秒
        result = result + to_string(tSec);
        if (parseInt(tSec * 100) % 100 == 0) result = result + ".0";
        if (parseInt(tSec * 100) % 10 == 0) result = result + "0";
    }
    return result;
}
function JsonToLrc(json) {
    var result = "";
    for (var i in json) {
        try {
            var nl = json[i];
            result += (result == "" ? "" : "\r\n") + "[" + toLrcTime(nl.T) + "]" + nl.C;
        } catch (e) {
            console.error(e);
        }
    }
    return result;
}
function createLrcObj(lrc) {
    oLRC.ms = [];
    oLRC.hasTranslate = false;
    oLRC.ti = "", oLRC.ar = "", oLRC.al = "", oLRC.by = "", oLRC.offset = 0;
    if (lrc.length == 0) return;
    // 统一换行符
    let lrc1 = lrc.replaceAll("\r\n", "\n").replaceAll("\n\r", "\n").replaceAll("\r", "\n");
    let lrcs = lrc1.split('\n'); //用回车拆分成数组
    for (var i in lrcs) {
        //遍历歌词数组
        lrcs[i] = lrcs[i].replace(/(^\s*)|(\s*$)/g, ""); //去除前后空格
        let t = lrcs[i].substring(lrcs[i].indexOf("[") + 1, lrcs[i].indexOf("]")); //取[]间的内容
        let s = t.split(":"); //分离:前后文字
        if (isNaN(parseInt(s[0]))) {
            //不是数值（元信息标签，如 [ti:] [ar:]）
            for (var tag in oLRC) {
                if (tag != "ms" && tag == s[0].toLowerCase()) {
                    oLRC[tag] = s[1];
                }
            }
        } else {
            //是数值（歌词时间轴）
            let arr = lrcs[i].match(/\[(\d+:.+?)\]/g); //提取时间字段，可能有多个
            let start = 0;
            for (var k in arr) {
                start += arr[k].length; //计算歌词内容起始位置
            }

            let content = lrcs[i].substring(start); //获取歌词内容
            for (var k2 in arr) {
                let tm = arr[k2].substring(1, arr[k2].length - 1); //取[]间的内容
                let sm = tm.split(":"); //分离:前后文字
                let sec = parseFloat(sm[0]) * 60 + parseFloat(sm[1]);
                oLRC.ms.push({
                    t: sec.toFixed(3),
                    // 数值时间：歌词滚动每刻都要比较时间，原来每次 parseFloat 字符串。
                    // 字符串字段 t 保留给 download.html 的 JsonToLrc 用。
                    tn: sec,
                    c: content
                });
            }
        }
    }
    oLRC.ms.sort(function (a, b) {
        //按时间顺序排序
        return a.t - b.t;
    });
    try {
        if (oLRC.ms.length >= 4) {
            if (oLRC.ms[1].c == '//' || oLRC.ms[3].c == '//') {
                oLRC.hasTranslate = true;
            }
        }
    } catch (e) {
        console.error(e);
    }
}

loading_settings();
function loading_settings() {
    //TODO: 设置
    // set_globle_css_var();
    loadLrcConfig();
    loadUserLoves();
}