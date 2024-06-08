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
    var lrc1 = lrc;
    lrc1.replaceAll("\r\n", "\n");
    lrc1.replaceAll("\n\r", "\n");
    lrc1.replaceAll("\r", "\n"); //处理特殊换行
    var lrcs = lrc1.split('\n'); //用回车拆分成数组
    for (var i in lrcs) {
        //遍历歌词数组
        lrcs[i] = lrcs[i].replace(/(^\s*)|(\s*$)/g, ""); //去除前后空格
        var t = lrcs[i].substring(lrcs[i].indexOf("[") + 1, lrcs[i].indexOf("]")); //取[]间的内容
        var s = t.split(":"); //分离:前后文字
        // console.log(t);
        if (isNaN(parseInt(s[0]))) {
            //不是数值
            for (var i in oLRC) {
                if (i != "ms" && i == s[0].toLowerCase()) {
                    oLRC[i] = s[1];
                }
            }
        } else {
            //是数值
            var arr = lrcs[i].match(/\[(\d+:.+?)\]/g); //提取时间字段，可能有多个
            var start = 0;
            for (var k in arr) {
                start += arr[k].length; //计算歌词位置
            }

            var content = lrcs[i].substring(start); //获取歌词内容
            for (var k in arr) {
                var t = arr[k].substring(1, arr[k].length - 1); //取[]间的内容
                var s = t.split(":"); //分离:前后文字
                oLRC.ms.push({
                    //对象{t:时间,c:歌词}加入ms数组
                    t: (parseFloat(s[0]) * 60 + parseFloat(s[1])).toFixed(3),
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
        // logdata_error(e);
    }
}

loading_settings();
function loading_settings() {
    //TODO: 设置
    // set_globle_css_var();
    loadLrcConfig();
    loadUserLoves();
}