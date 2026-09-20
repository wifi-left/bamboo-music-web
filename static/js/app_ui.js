const APP_ROOT = document.getElementById("app-root");
var SlideDownTimeoutFunc = 0;
var PromptTimeoutId = -1;
var hashChanged = false;

// 获取固定的 HTML 对象
document.querySelectorAll(".version-show").forEach((ele) => {
    ele.innerText = BAMBOOMUSIC.version;
});
function show_msg(message, timeout = 0, raw = false, showRightNow = false) {
    if (PromptTimeoutId != -1) {
        clearInterval(PromptTimeoutId);
        PromptTimeoutId = -1;
    }
    if (raw) {
        promptBlockTitleObj.innerHTML = message;
    } else {
        promptBlockTitleObj.innerText = message;
    }
    if (showRightNow) $(promptBlockObj).fadeIn(1);
    else $(promptBlockObj).fadeIn(200);

    if (timeout > 0) {
        PromptTimeoutId = setTimeout(function () {
            if (showRightNow) {
                $(promptBlockObj).fadeOut(1);
            } else
                $(promptBlockObj).fadeOut(200);
            PromptTimeoutId = -1;
        }, timeout);
    }
}
const searchTypeSelector = document.getElementById("search-selector");
const searchBoxObj = document.getElementById("music-searchbox");
const searchButtonObj = document.getElementById("search-music-page");
const refrushButtonObj = document.getElementById("reflush-music-page");
const promptBlockObj = document.querySelector(".promptBlock");
const promptBlockTitleObj = document.getElementById("prompt-content");
const autoFillObj = document.getElementById("fillinfo");
const suggestKeyRootObj = document.querySelector(".suggestKeyRoot");
const playListPaneObj = document.querySelector("#win-playlist");
const musicPaneObj = document.querySelector("#win-playing");
const smallMusicControlPaneObj = document.querySelector(".small-music-control");
const musicPlayerObj = document.getElementById("music-player-audio");
// 获取固定加载 HTML 对象
const searchLoadingPaneObj = document.getElementById("search-loading-pane");
const MusicListLoadingPaneObj = document.getElementById("musiclist-loading-pane");
const LRC_root_obj = document.querySelector(".lrc-right-part");
const listRootObj = document.querySelector("#list-item-head");
const orderTypeObj = document.getElementById("obj-order-type");

var nowWindow = "";

// 初始化部分 HTML 对象方法
function init_elements() {
    for (var i in search_types) {
        let ele = document.createElement("option");
        ele.value = search_types[i].id;
        // ele.innerText = search_types[i].name;
        ele.text = search_types[i].name;
        searchTypeSelector.appendChild(ele);
    }
}

// 主菜单
var rootmenu = document.getElementsByClassName("root-left-part")[0];
// 显示/隐藏主菜单
function show_or_hide_the_menubar(op = null) {
    let winbtn = document.querySelector(".active");
    if (op == true) {
        rootmenu.classList.add("show");
        let dsTop = winbtn.getBoundingClientRect().top + 22;
        document.getElementById("left-sel-display-bar").style.top = dsTop + "px";
        return;
    } else if (op == false) {
        rootmenu.classList.remove("show");
        return;
    }
    if (rootmenu.classList.contains("show")) {
        rootmenu.classList.remove("show");
    } else {
        rootmenu.classList.add("show");
        if (winbtn != undefined) {
            let dsTop = winbtn.getBoundingClientRect().top + 22;
            document.getElementById("left-sel-display-bar").style.top = dsTop + "px";
        }
    }
}

// 变更窗口
function showWindow(winname, closeold = false) {
    let wid = "win-" + winname;
    let winele = document.getElementById(wid);
    winele.style.display = "inline-block";
}
function changeWindow(winname, closeold = true, _element) {
    showHideMusicPlayerPane(false);
    let wid = "win-" + winname;
    nowWindow = winname;
    let winele = document.getElementById(wid);
    let allwins = document.getElementsByClassName("app-content-window");
    let winbtn = document.getElementById("btn-" + winname);
    let winbtn2 = null;
    try {
        winbtn2 = document.getElementById("btn-" + winname + "-bottom");
    } catch (e) {
        console.error(e);
    }
    if (winbtn == undefined) winbtn = { id: undefined };
    let allbtns = document.querySelectorAll(".active");
    if (_element != null) {
        if (_element.classList.contains("active")) {
            return;
        }
    }
    if (allbtns != undefined && closeold) {
        for (let i = 0; i < allbtns.length; i++) {
            allbtns[i].classList.remove("active");
        }
    }
    if (winbtn.id != undefined) {
        let dsTop = winbtn.getBoundingClientRect().top + 22;

        document.getElementById("left-sel-display-bar").style.top = dsTop + "px";
        winbtn.classList.add("active")
        winbtn2.classList.add("active")
    }
    if (closeold) {
        for (var i = 0; i < allwins.length; i++) {
            // $(allwins[i]).fadeOut(1);
            allwins[i].style.display = "none";
        }
    }
    if (winname == 'account') {
        // 只有在不可见期间收藏变动过才重建（见 saveUserLoves）
        loveUIDirty = false;
        ReloadLoveListUI();
    }
    $(winele).fadeIn(100);
    rootmenu.classList.remove("show");
    showHideMusicPlayerPane(false);
}

function hideWindow(ele) {
    // $(ele).an;
    ele.style.display = "none";
    // $("#top-bar").show();
}
function slideDownWindow(ele) {
    // $(ele).an;
    // clearInterval(SlideDownTimeoutFunc);
    ele.style.top = "100%";
    // $("#top-bar").show();
}
function slideUpWindow(ele) {
    // clearInterval(SlideDownTimeoutFunc);
    // $(ele).an;
    ele.style.top = "0%";
    // $("#top-bar").hide();
}

function closeWindow(ele) {
    $(ele).fadeOut(100);
}
function slideUpWindow_name(elename) {
    let winele = document.getElementById("win-" + elename);
    // console.log(winele.style.top);
    if (winele.style.top == "" || winele.style.top == null) {
        winele.style.display = "inline-block";
        winele.style.top = "100%";
        setTimeout(() => {
            winele.style.top = "0%";
        }, 1);
    } else {
        winele.style.display = "inline-block";
        winele.style.top = "0";
    }

}
function getQueryString(name, url = window.location.search) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = url.substring(1).match(reg);
    if (r != null) return decodeURI(r[2]); return null;
}
// 首屏遮罩：DOMContentLoaded 就撤掉。
// 原来放在 window.onload 里，而 onload 要等所有脚本、样式和图片都加载完 —— 列表里的封面图
// 会让首屏白屏时间被图片拖长。这里只负责"界面可以看了"，数据仍由各自的请求异步填充。
function hideInitLoadingPane() {
    let initObj = document.getElementById("init-loading-pane");
    if (initObj != null) initObj.remove();
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hideInitLoadingPane);
} else {
    hideInitLoadingPane();
}

// 页面加载完后...
window.onload = function () {
    changeWindow(default_page);

    if (playing_list.length > 0) {
        playing_idx = -1;
        // changeWindow("home");
        showPlayList(true)
    }
    hashDetect();
    hideInitLoadingPane();

}
function hashDetect() {
    if (location.hash === "#station") {
        show_msg("正在进入随机电台模式...");
        enterAudioStation();
        return;
    }

    let plid = getQueryString("musicid");
    if (plid == null) {
        plid = getQueryString("musicid", location.hash);
    }
    if (plid != null && plid != "") {
        if (oLRC.info.id != plid)
            play_music_id(plid, true, true, true);
        // addToList()
    }
    let search = getQueryString("search");
    let type = getQueryString("type");
    if (search == null) {
        search = getQueryString("search", location.hash);
    }
    if (type == null) {
        type = getQueryString("type", location.hash);
    }
    if (search != null) {
        search = (search);
        if (type == null) type = "audio";
        searchTypeSelector.value = type;
        searchBoxObj.value = search;
        changeWindow("search");
        searchButtonObj.onclick();
    }
}
// 初始化部分HTML对象
init_elements();

// 绑定事件
searchButtonObj.onclick = function () {
    api_search(searchBoxObj.value, searchTypeSelector.value);
}
refrushButtonObj.onclick = function () {
    api_search(s_searchkey, s_type);
}
function refrush_detail_list() {
    api_list_alarm(l_playlistid, l_type, true, 1);
}
// 搜索提示词：输入防抖（原来每敲一个字符就发一次请求，后端搜索只要十几毫秒，
// 浪费的是"每字符一次网络往返 + 一次渲染"）。
// debounceByKey 会把所有参数原样转给回调：第一个是防抖分组用的 key，搜索词在第二个位置上。
var suggestKeyDebounced = debounceByKey(function (source, value) {
    api_suggestKey(value);
}, 140);
searchBoxObj.oninput = (function () {
    suggestKeyDebounced("main", this.value);
});

function displayNowSelSuggest() {
    let ele = document.querySelectorAll(".li-sel");
    for (let i = 0; i < ele.length; i++) {
        ele[i].classList.remove("li-sel");
    }
    let eles = document.querySelectorAll("#fillinfo li");
    if (nowsel >= eles.length) {
        nowsel = eles.length - 1;
    }
    if (nowsel >= 0) {
        if (nowsel < eles.length) {
            eles[nowsel].classList.add("li-sel");
        }
    }
}
searchBoxObj.onkeydown = (ev => {
    switch (ev.keyCode) {
        // 上键：选择上一个建议词
        case 38:
            if (nowsel >= 0) nowsel--;
            displayNowSelSuggest();
            break;
        // 下键：选择下一个建议词
        case 40:
            if (nowsel < 9) nowsel++;
            displayNowSelSuggest();
            break;
        // 回车：确认选择
        case 13:
            if (nowsel >= 0) {
                let ele = document.querySelector(".li-sel");
                if (ele.onclick != undefined)
                    ele.onclick();
                else {
                    break;
                }
                nowsel = -1;
                displayNowSelSuggest();
                suggestKeyRootObj.style.display = "none";
            } else {
                searchButtonObj.onclick();
            }
            break;
        // Esc：隐藏建议框
        case 27:
            suggestKeyRootObj.style.display = "none";
            break;
        // Tab：用建议词补全输入框
        case 9:
            if (nowsel >= 0) {
                let ele = document.querySelector(".li-sel");
                if (ele.onclick != undefined)
                    searchBoxObj.value = ele.innerText;
                else {
                    break;
                }
                displayNowSelSuggest();
                return false;
            }

    }
})

searchBoxObj.onfocus = (function () {
    nowsel = -1;
    api_suggestKey(this.value);
    suggestKeyRootObj.style.display = "inline-block";
});
let pageContents = document.querySelectorAll(".page-content");
for (var i = 0; i < pageContents.length; i++) {
    pageContents[i].onclick = function () {
        suggestKeyRootObj.style.display = "none";
    }
}
let pageContents1 = document.querySelectorAll(".left-btn");
for (var i = 0; i < pageContents1.length; i++) {
    pageContents1[i].addEventListener("click", function () {
        suggestKeyRootObj.style.display = "none";
    });
}
// 滚动加载：加 passive（不调用 preventDefault 的滚动监听没必要让浏览器等 JS），
// 并且在手动排序进行中不触发加载（追加的 DOM 会打乱拖动）。
document.getElementById("playlist-item-head").addEventListener('scroll', function () {
    if (reorderInProgress) return;
    if (!l_cooldown)
        if (l_page * PAGESIZE < l_total) {
            if (this.scrollTop > this.scrollHeight - this.clientHeight * 1.5) {
                api_list_alarm(l_playlistid, l_type, false, l_page + 1);
                // console.log(1)
            }
        };
}, { passive: true });
listRootObj.addEventListener('scroll', function () {
    if (reorderInProgress) return;
    if (s_page * PAGESIZE < s_total) {
        if (this.scrollTop > this.scrollHeight - this.clientHeight * 1.5) {
            api_search(s_searchkey, s_type, s_page + 1, false);
        }
    };
}, { passive: true });
// 视频推荐滚动加载
var moreVideoSuggestFuc = function () {
    if (!v_cooldown && v_page * PAGESIZE < v_total) {
        if (this.scrollTop > this.scrollHeight - this.clientHeight * 1.5) {
            loadMoreSuggestVideos();
        }
    }
}
document.getElementById("video-player-suggest-list").addEventListener('scroll', moreVideoSuggestFuc, { passive: true });
document.getElementById("win-video-player").addEventListener('scroll', moreVideoSuggestFuc, { passive: true });

// 读取点击元素所在歌曲行存储的信息
function readLineInfo(ele, isRootNode = false) {
    if (isRootNode) {
        if (ele.classList.contains("playing")) return null; // 已是当前播放行
        return getLineData(ele);
    }
    return getLineData(ele.parentNode.parentNode.parentNode);
}
// 从 <li> 元素提取歌曲信息
function getLineData(infoele) {
    if (infoele == undefined) return null;
    let picele = infoele.querySelector(".list-left-img");
    let pic = undefined;
    if (picele != undefined) pic = picele.src;
    return {
        ele: infoele,
        songid: infoele.getAttribute("songid"),
        songname: infoele.getAttribute("songname"),
        singer: infoele.getAttribute("singer"),
        singerid: infoele.getAttribute("singerid"),
        album: infoele.getAttribute("album"),
        albumid: infoele.getAttribute("albumid"),
        pic
    };
}

function btn_seeSinger(ele) {
    let info = readLineInfo(ele);
    list_singer_gui(info.singer, info.singerid, true);
}
function btn_seeAlbum(ele) {
    let info = readLineInfo(ele);
    list_alarm_gui(info.singer, info.singerid, info.album, info.albumid, true);
}

function btn_watchVideo(ele, isRootNode = false, reloadSuggest = true) {
    let info = readLineInfo(ele, isRootNode);
    if (info == null) return;
    let hasmv = info.ele.getAttribute("hasmv");
    // 若有 MV ID，优先播放 MV
    let songid = hasmv;
    if (!(hasmv != false && hasmv != "false" && hasmv != null && hasmv != "null" && hasmv != "" && hasmv != 1 && hasmv != true && hasmv != "true")) {
        songid = info.songid;
    }
    watchVideo(songid, info.songname, info.singer, info.singerid, info.albumid, reloadSuggest);
}
function btn_shareURL(ele) {
    let info = readLineInfo(ele);
    shareEventHandler(info.songid, info.songname, info.singer, info.album)
}
function shareEventHandler(songid, songname, singer, album) {
    let brE = document.createElement("br");
    let brE1 = document.createElement("br");
    let brE2 = document.createElement("br");
    let brE3 = document.createElement("br");
    let titleE = document.createElement("h2");
    titleE.innerText = "歌曲【" + songname + "】";
    let songidE = document.createElement("span");
    songidE.innerText = "歌曲ID：" + songid + "";
    let singerE = document.createElement("span");
    singerE.innerText = "歌手：" + singer + "";
    let albumE = undefined;
    if (album != undefined && album != "") {
        albumE = document.createElement("span");
        albumE.innerText = "专辑：" + album + "";
    }
    let urlE = document.createElement("span");
    urlE.innerText = "链接：" + location.origin + location.pathname + "#musicid=" + songid;
    let tipE = document.createElement("p");
    tipE.innerText = "点击此处或者空白处关闭";
    tipE.onclick = closeShare;
    tipE.classList.add("share-tip");
    const SHARE_CONTENT = document.getElementById("share-content");
    SHARE_CONTENT.innerHTML = "";
    let closeButton = document.createElement("button")
    closeButton.onclick = closeShare;
    closeButton.classList.add("button");
    closeButton.classList.add("fa");
    closeButton.classList.add("fa-close");
    closeButton.classList.add("close-share");
    SHARE_CONTENT.appendChild(closeButton)
    SHARE_CONTENT.appendChild(titleE)
    SHARE_CONTENT.appendChild(brE)
    SHARE_CONTENT.appendChild(songidE)
    SHARE_CONTENT.appendChild(brE1)
    SHARE_CONTENT.appendChild(singerE)
    SHARE_CONTENT.appendChild(brE2)
    if (albumE != undefined)
        SHARE_CONTENT.appendChild(albumE)
    SHARE_CONTENT.appendChild(brE3)
    SHARE_CONTENT.appendChild(urlE)
    SHARE_CONTENT.appendChild(tipE)
    showWindow("share", false)
}
document.getElementById("share-content").onclick = function () {
    event.stopPropagation();
}
document.getElementById("win-share").onclick = closeShare;
function closeShare() {
    document.getElementById("win-share").style.display = "none";
}
function closeDialog() {
    document.getElementById("dialog-root").style.display = "none";
}
function btn_playMusic(ele, openGUI = false, isRootNode = false) {
    let info = readLineInfo(ele, isRootNode);
    if (info == null) return;
    addToList({ name: info.songname, singer: info.singer, singerid: info.singerid, album: info.album, albumid: info.albumid, id: info.songid, pic: info.pic }, -1, true, openGUI);
}
function btn_addtoList(ele, openGUI = false, isRootNode = false) {
    let info = readLineInfo(ele, isRootNode);
    if (info == null) return;
    addToList({ name: info.songname, singer: info.singer, singerid: info.singerid, album: info.album, albumid: info.albumid, id: info.songid, pic: info.pic }, -1);
    show_msg("已添加【" + info.songname + "】到播放列表", 1000);
}
var PlayListPaneState = false;
function showPlayList(show_or_hide) {
    PlayListPaneState = show_or_hide;
    closeShare();
    closeDialog();
    if (show_or_hide) {
        playListPaneObj.style.display = "inline-block";

    } else {
        (playListPaneObj.style.display = "none");
        // smallMusicControlPaneObj.style.display = "inline-block";
    }
}
var MusicPlayerPaneState = false;
function preventPopUp(e) {
    e.stopPropagation();
}
function detectWhetherRightenMode() {
    return APP_ROOT.classList.contains("righten-mode");
}
function rightenMusicPlayer(flag) {
    if (flag == null) flag = !detectWhetherRightenMode();
    if (flag) APP_ROOT.classList.add("righten-mode");
    else APP_ROOT.classList.remove("righten-mode");
}

function showHideMusicPlayerPane(show_or_hide, exit_fullscreen = false, fromControlPane = false) {

    suggestKeyRootObj.style.display = "none";

    if (show_or_hide == false) {
        if (detectWhetherRightenMode()) {
            rightenMusicPlayer(false)
        }
    }

    if (isFullScreen()) {
        document.exitFullscreen()
        if (exit_fullscreen) {
            return;
        }
    }
    if (fromControlPane) {
        closeShare();
        closeDialog();
    }


    MusicPlayerPaneState = show_or_hide;
    let ass = document.querySelector(".musicpane-control");
    let wplaying = document.querySelector("#win-playlist");

    if (PlayListPaneState) showPlayList(false);
    if (show_or_hide) {
        ass.classList.add("playing-display")
        wplaying.classList.add("playing-display");
        // showPlayList(false)
        // slideUpWindow_name("playing");
        musicPaneObj.style.display = "inline-block";
        // smallMusicControlPaneObj.style.display = "none";
        windowsOnResize();

    } else {
        wplaying.classList.remove("playing-display");

        ass.classList.remove("playing-display")
        musicPaneObj.style.display = "none";
        // smallMusicControlPaneObj.style.display = "inline-block";
    }
}
//small-music-control

// resize 用一帧一次合并：原来拖动窗口时每个事件都要读两次 clientHeight（强制同步排版）、
// 写两次 :root 变量（整文档样式失效）并重排一次歌词，60Hz 地重复。
var resizeRAF = 0;
window.onresize = function () {
    if (resizeRAF != 0) return;
    resizeRAF = requestAnimationFrame(function () {
        resizeRAF = 0;
        windowsOnResize();
    });
};
function windowsOnResize() {
    let h = LRC_root_obj.clientHeight;
    let w = LRC_root_obj.clientWidth;
    document.documentElement.style.setProperty(`--lrc-client-height`, h + 'px');
    document.documentElement.style.setProperty(`--lrc-client-width`, w + 'px');
    // 容器尺寸变了，歌词的居中/滚动上限要用新值重算
    if (typeof lrcInvalidateGeometry == "function") lrcInvalidateGeometry();
    if (choose_lrc)
        choose_lrc(musicPlayerObj.currentTime, true);
}
function set_globle_css_var() {
    document.documentElement.style.setProperty(`--norlrccolor`, lrc_normal_line_color);
    document.documentElement.style.setProperty(`--sellrccolor`, lrc_selected_line_color);
    document.documentElement.style.setProperty(`--norlineheight`, lrc_normal_line_height + "px");
    document.documentElement.style.setProperty(`--sellineheight`, lrc_selected_line_height + "px");
    document.documentElement.style.setProperty(`--norfontsize`, lrc_normal_font_size + "px");
    document.documentElement.style.setProperty(`--selfontsize`, lrc_selected_font_size + "px");
    // 行高/字号改了，歌词的几何缓存要作废
    if (typeof lrcInvalidateGeometry == "function") lrcInvalidateGeometry();
    // document.documentElement.style.setProperty(`--lrc-client-width`, w + 'px');
    // --norlrccolor: rgb(209, 209, 209);
    // --sellrccolor: rgb(23, 236, 148);
    // --norlineheight: 28px;
    // --sellineheight: 40px;
    // --norfontsize: 16px;
    // --selfontsize: 24px;
}
function loadLrcConfig() {
    let enableListSaving = SETTING_VAR.enableListSaving;

    let m = localSettings.getItem("lrc_settings");
    if (m != "" && m != null) {
        try {
            m = JSON.parse(m);
            lrc_normal_line_color = m['normal-line-color'];
            lrc_selected_line_color = m['selected-line-color'];
            lrc_normal_line_height = m['normal-line-height'];
            lrc_selected_line_height = m['selected-line-height'];
            lrc_normal_font_size = m['normal-font-size'];
            lrc_selected_font_size = m['selected-font-size'];
        } catch (e) {
            console.error(e);
        }
    }
    let rate = parseFloat(localSettings.getItem("update-rate"));
    if (rate == "" || rate == null || isNaN(rate)) {
        rate = 0.2;
    }
    if (rate <= 0) rate = 0;
    updateRate = rate;
    document.getElementById("setting-rateInput").value = updateRate;


    document.getElementById("norlrccolor").value = lrc_normal_line_color;
    document.getElementById("norlineheight").value = lrc_normal_line_height;
    document.getElementById("norfontsize").value = lrc_normal_font_size;
    document.getElementById("sellrccolor").value = lrc_selected_line_color;
    document.getElementById("sellineheight").value = lrc_selected_line_height;
    document.getElementById("selfontsize").value = lrc_selected_font_size;
    set_globle_css_var();
}
function saveRate() {
    updateRate = parseFloat(document.getElementById("setting-rateInput").value);
    if (isNaN(updateRate)) {
        updateRate = 0.2;
        document.getElementById("setting-rateInput").value = updateRate;
    }
    localSettings.setItem("update-rate", updateRate);
}
function saveVolume() {
    let volume = parseFloat(document.getElementById("setting-volumeInput").value) / 100;
    if (isNaN(volume) || volume < 0 || volume > 100) {
        volume = 0;
        document.getElementById("setting-volumeInput").value = volume * 100;
    }
    volumeobj.value = volume * 100;
    changePos(volumeobj);
    volumeobj.onchange();
}
function saveLrcConfig() {
    lrc_normal_line_color = document.getElementById("norlrccolor").value;
    lrc_normal_line_height = document.getElementById("norlineheight").value;
    lrc_normal_font_size = document.getElementById("norfontsize").value;
    lrc_selected_line_color = document.getElementById("sellrccolor").value;
    lrc_selected_line_height = document.getElementById("sellineheight").value;
    lrc_selected_font_size = document.getElementById("selfontsize").value;

    let m = {
        'normal-line-color': lrc_normal_line_color,
        'selected-line-color': lrc_selected_line_color,
        'normal-line-height': lrc_normal_line_height,
        'selected-line-height': lrc_selected_line_height,
        'normal-font-size': lrc_normal_font_size,
        'selected-font-size': lrc_selected_font_size
    }

    localSettings.setItem("lrc_settings", JSON.stringify(m));
    set_globle_css_var();
};
// kuroshiro

function showPlayingMenu(control) {
    let eme = document.querySelector(".lrc-left-part")
    let eme2 = document.querySelector(".lrc-right-part")
    if (control == null) {
        // 切换模式
        if (eme.classList.contains("active")) {

            eme.classList.remove("active");
            eme2.classList.remove("active");
        } else {
            eme.classList.add("active");
            eme2.classList.add("active");
        }

    } else {
        if (control) {
            eme.classList.add("active");
            eme2.classList.add("active");

        } else {
            eme.classList.remove("active");
            eme2.classList.remove("active");
        }
    }
}
document.querySelector(".music-player-info-root").onclick = function (e) {
    e.stopPropagation();
}
document.querySelector(".lrc-left-part").onclick = function () {
    showPlayingMenu(false);
}

function saveBackgroundImage() {
    let ele = document.getElementById("setting-background-image");
    localSettings.setItem("backgroundImage", ele.value);
    backgroundImage = ele.value;
    if (backgroundImage != "") {
        if (backgroundImage != "on") {
            document.getElementById("win-playing").style.background = (backgroundImage);
        }
        document.getElementById("win-playing-host").classList.remove("color");
    } else {
        document.getElementById("win-playing").style.background = "var(--main-bg-color)";
        document.getElementById("win-playing-host").classList.add("color");
    }
}
function saveBackgroundImageSample(value) {
    let ele = document.getElementById("setting-background-image");
    ele.value = value;
    saveBackgroundImage();
}
function GetFullscreen() {
    document.querySelector("#win-playing").requestFullscreen();
}
// 渲染"个人中心"里的一个收藏夹行
function renderLoveListItem(folderId, idx, root) {
    if (userLoves[folderId] == undefined) userLoves[folderId] = { lists: [] };

    let linef = document.createElement("li");
    linef.id = "star-list-" + idx;
    // 只有用户自建的收藏夹可参与排序：默认/稍后再听固定在最前面
    let sortable = (folderId != "default" && folderId != "later");
    if (sortable) linef.setAttribute("data-sortable", "1");
    if (loveSortMode && sortable) {
        let handle = document.createElement("span");
        handle.className = "drag-handle fa fa-bars";
        handle.setAttribute("title", "拖动排序");
        linef.appendChild(handle);
    }
    let line = document.createElement("div");
    line.classList.add("star-list-text-root");
    line.setAttribute("idx", idx);
    line.setAttribute("pid", folderId);

    let indexname = document.createElement("span");
    indexname.innerText = (idx + 1);
    indexname.classList.add("l-idx")
    let songname = document.createElement("b");
    songname.onclick = function () {
        show_star_detail(this, true);
    }
    songname.classList.add("songname");
    if (folderId == 'default') songname.innerText = "默认收藏夹";
    else if (folderId == 'later') songname.innerText = "稍后再听";
    else
        songname.innerText = folderId;
    songname.innerText += " (" + userLoves[folderId].lists.length + ")";
    line.appendChild(indexname);
    line.appendChild(songname);
    let actionbar = document.createElement("div");
    actionbar.classList.add("action-bar");
    actionbar.setAttribute("pid", folderId);
    actionbar.innerHTML = `<button title="立即播放" class="button btn-play fa fa-play-circle" onclick="addStarListToPlaying(this,true);">`
        + `<button title="添加到列表" class="button btn-play fa fa-plus-circle btn-add-list" onclick="addStarListToPlaying(this,false);">`
        + `<button title="详情" class="button btn-info fa fa-info-circle" onclick="show_star_detail(this);">`
        + `<button title="删除" class="button fa fa-remove" onclick="removeStarList(this);"></button>`;
    linef.appendChild(line);
    linef.appendChild(actionbar);
    root.appendChild(linef);
}
function ReloadLoveListUI() {
    let root = document.getElementById("lover-displayer");
    root.innerHTML = "";
    if (loveSortMode) root.classList.add("sort-armed"); else root.classList.remove("sort-armed");
    let idx = 2;
    renderLoveListItem("default", 0, root);
    renderLoveListItem("later", 1, root);
    let userFolders = 0;
    for (var i in userLoves) {
        if (i == 'default' || i == 'later') continue;
        renderLoveListItem(i, idx++, root);
        userFolders++;
    }
    if (userFolders === 0) {
        let hint = document.createElement("div");
        hint.className = "list-item unable-sel";
        hint.innerText = "还没有自建收藏夹。在列表或播放页点星标就能添加收藏。";
        root.appendChild(hint);
    }
    let sub = document.getElementById("love-subtitle");
    if (sub != null) sub.innerText = "收藏列表（共 " + loveTotalCount() + " 首）";
}

/* ---------- 收藏夹（个人中心里的列表）手动排序 ---------- */
var loveSortMode = false;
var loveSortable = null;

function getLoveSortable() {
    if (loveSortable == null) {
        loveSortable = createSortList({
            container: document.getElementById("lover-displayer"),
            // 只把带 data-sortable 的行当可拖项，所以拖不到"默认/稍后再听"前面去
            itemSelector: "li[data-sortable]",
            handleClass: "drag-handle",
            scroller: document.getElementById("win-account"),
            onCommit: function (from, to) { moveLoveFolderByIndex(from, to); }
        });
    }
    return loveSortable;
}
function toggleLoveSort(force) {
    let next = (force === undefined) ? !loveSortMode : !!force;
    if (next === loveSortMode) return;
    loveSortMode = next;
    let btn = document.getElementById("btn-love-sort");
    if (btn != null) btn.classList.toggle("sort-on", next);
    if (next) getLoveSortable().arm(); else getLoveSortable().disarm();
    ReloadLoveListUI();
    show_msg(next ? "排序模式：拖动手柄调整收藏夹顺序" : "已退出排序模式", 1800);
}
/** 收藏夹的显示顺序就是 userLoves 里字符串键的插入顺序（default/later 固定在最前）。 */
function moveLoveFolderByIndex(from, to) {
    let root = document.getElementById("lover-displayer");
    let rows = Array.prototype.slice.call(root.querySelectorAll(":scope > li[data-sortable]"));
    let pidAt = function (i) {
        let row = rows[i];
        if (row == null) return null;
        let el = row.querySelector("[pid]");
        return el == null ? null : el.getAttribute("pid");
    };
    let fromPid = pidAt(from), toPid = pidAt(to);
    if (fromPid == null || toPid == null || fromPid === toPid) return;
    let keys = Object.keys(userLoves).filter(function (k) { return k !== "default" && k !== "later"; });
    let f = keys.indexOf(fromPid), t = keys.indexOf(toPid);
    if (f < 0 || t < 0 || f === t) return;
    keys.splice(t, 0, keys.splice(f, 1)[0]);
    let rebuilt = { default: userLoves["default"], later: userLoves["later"] };
    for (let i = 0; i < keys.length; i++) rebuilt[keys[i]] = userLoves[keys[i]];
    userLoves = rebuilt;
    ReloadLoveListUI();
    saveUserLoves();
    show_msg("收藏夹顺序已保存", 1200);
}

/* ---------- 收藏详情（某个收藏夹里的歌曲）手动排序 ---------- */
var starSortMode = false;
var starSortable = null;
var starFilterText = "";

function getStarSortable() {
    if (starSortable == null) {
        starSortable = createSortList({
            container: document.getElementById("playlist-item-head"),
            itemSelector: "li",
            handleClass: "drag-handle",
            // 行高不固定、还夹着 .pretty-hr 分隔符：只移动被拖的那一行更清楚
            shiftOthers: false,
            onCommit: function (from, to) { moveStarItem(from, to); }
        });
    }
    return starSortable;
}
function attachStarHandles() {
    let rows = document.getElementById("playlist-item-head").querySelectorAll(":scope > li");
    for (let i = 0; i < rows.length; i++) {
        if (rows[i].querySelector(".drag-handle") == null) {
            let h = document.createElement("span");
            h.className = "drag-handle fa fa-bars";
            h.setAttribute("title", "拖动排序");
            rows[i].insertBefore(h, rows[i].firstChild);
        }
    }
}
function removeStarHandles() {
    let hs = document.getElementById("playlist-item-head").querySelectorAll(".drag-handle");
    for (let i = 0; i < hs.length; i++) hs[i].parentNode.removeChild(hs[i]);
}
/** 每页追加都会留一个"没有更多了"提示，只保留最后一个。 */
function trimStarEndHints() {
    let root = document.getElementById("playlist-item-head");
    let hints = root.querySelectorAll(".list-no-more");
    for (let i = 0; i < hints.length - 1; i++) hints[i].parentNode.removeChild(hints[i]);
}
/** 排序前必须把没加载的页补齐：否则只能在已渲染的 20 首里排。 */
function ensureStarRowsLoaded() {
    if (l_type !== "star") return;
    let folder = userLoves[l_playlistid];
    if (folder == undefined || !Array.isArray(folder.lists)) return;
    let totalPages = Math.max(1, Math.ceil(folder.lists.length / PAGESIZE));
    if (l_page >= totalPages) return;
    for (let p = l_page + 1; p <= totalPages; p++) {
        treat_star_detail(l_playlistid, "star", false, p);
    }
    l_page = totalPages;
    trimStarEndHints();
}
function toggleStarSort(force) {
    let next = (force === undefined) ? !starSortMode : !!force;
    if (next === starSortMode) return;
    if (next && l_type !== "star") {
        show_msg("排序模式只在收藏夹里可用", 1500);
        return;
    }
    starSortMode = next;
    let btn = document.getElementById("btn-star-sort");
    if (btn != null) btn.classList.toggle("sort-on", next);
    let root = document.getElementById("playlist-item-head");
    let filterInput = document.getElementById("star-filter-input");
    if (next) {
        // 筛选会把行藏起来（隐藏的行没有矩形，落点会算错），所以排序期间关闭筛选并清空
        starFilterText = "";
        if (filterInput != null) { filterInput.value = ""; filterInput.disabled = true; }
        applyStarFilter("");
        ensureStarRowsLoaded();
        attachStarHandles();
        root.classList.add("sort-armed");
        getStarSortable().arm();
        let n = root.querySelectorAll(":scope > li").length;
        show_msg("排序模式：拖动手柄调整顺序（共 " + n + " 首）", 2200);
    } else {
        getStarSortable().disarm();
        root.classList.remove("sort-armed");
        removeStarHandles();
        if (filterInput != null) filterInput.disabled = false;
        show_msg("已退出排序模式", 1500);
    }
}
function moveStarItem(from, to) {
    if (from === to) return;
    let folder = userLoves[l_playlistid];
    if (folder == undefined || !Array.isArray(folder.lists)) return;
    if (from < 0 || to < 0 || from >= folder.lists.length || to >= folder.lists.length) return;
    folder.lists.splice(to, 0, folder.lists.splice(from, 1)[0]);
    folder.lastUpdatedTime = formatDateTime(new Date());
    // 行内按钮把下标写死在 onclick 里，落定后必须重渲染（并保持已加载的页数）
    starRerenderAll();
    saveUserLoves();
}
/* ---------- 收藏：批量操作 / 收藏夹管理 / 导入导出 / 失效清理 ---------- */

// 这两个是"虚拟收藏夹"，不能重命名也不能删（原来删掉默认收藏夹会连歌一起消失且毫无痕迹）
var LOVE_FIXED_FOLDERS = ["default", "later"];
var starBatchMode = false;

function loveTotalCount() {
    let n = 0;
    for (let k in userLoves) {
        if (userLoves[k] != null && Array.isArray(userLoves[k].lists)) n += userLoves[k].lists.length;
    }
    return n;
}
/** 重渲染收藏详情并保持已加载的页数（treat_star_detail 自己不清空容器，这里手动清）。 */
function starRerenderAll() {
    let pages = Math.max(1, l_page);
    l_page = 1;
    document.getElementById("playlist-item-head").innerHTML = "";
    treat_star_detail(l_playlistid, "star", true, 1);
    for (let p = 2; p <= pages; p++) treat_star_detail(l_playlistid, "star", false, p);
    l_page = pages;
    trimStarEndHints();
    let root = document.getElementById("playlist-item-head");
    if (starSortMode) {
        root.classList.add("sort-armed");
        attachStarHandles();
    }
    if (starBatchMode) root.classList.add("batch-mode");
}
/** 收藏夹专属工具（排序/重命名按钮、筛选与批量工具行）只在该收藏夹详情里显示。 */
function setStarToolsVisible(visible) {
    let win = document.getElementById("win-musiclist");
    if (win != null) win.classList.toggle("star-bar-on", !!visible);
    if (!visible) {
        // 切到专辑/搜索列表时把这两种模式一并关掉，避免勾选状态残留
        if (starBatchMode) toggleStarBatchMode(false);
        if (starSortMode) toggleStarSort(false);
        applyStarFilter("");
        let input = document.getElementById("star-filter-input");
        if (input != null) input.value = "";
    }
}
function toggleStarBatchMode(force) {
    let next = (force === undefined) ? !starBatchMode : !!force;
    if (next === starBatchMode) return;
    if (next && l_type !== "star") {
        show_msg("批量操作只在收藏夹里可用", 1500);
        return;
    }
    if (next && starSortMode) toggleStarSort(false);   // 两种模式互斥
    starBatchMode = next;
    let bar = document.getElementById("star-batch-bar");
    let root = document.getElementById("playlist-item-head");
    if (bar != null) bar.classList.toggle("batch-mode", next);
    root.classList.toggle("batch-mode", next);
    // 与「探索」里的批量条一致：进入后收起开关、展开动作条；退出用动作条里的「完成」
    let toggle = document.getElementById("btn-star-batch-toggle");
    if (toggle != null) toggle.style.display = next ? "none" : "inline-block";
    let actions = document.getElementById("star-batch-actions");
    if (actions != null) actions.style.display = next ? "flex" : "none";
    if (!next) setStarSelection([]);
    show_msg(next ? "批量操作：勾选歌曲后选择动作（点「完成」退出）" : "已退出批量操作", 1600);
}
// 批量模式下点击条目空白区域 = 点击选择框（与「探索」列表里的行为一致）
document.getElementById("playlist-item-head").addEventListener("click", function (e) {
    if (!starBatchMode) return;
    let li = e.target.closest("li");
    if (li == null) return;
    // 交互元素（按钮/链接/勾选框/歌曲名等）保持原有行为
    if (e.target.closest("button, a, .batch-select, .song-name")) return;
    let box = li.querySelector(".batch-select");
    if (box == null) return;
    box.checked = !box.checked;
    li.classList.toggle("selected", box.checked);
});
function starRowIds(onlySelected) {
    let rows = document.getElementById("playlist-item-head").querySelectorAll(":scope > li");
    let out = [];
    for (let i = 0; i < rows.length; i++) {
        let box = rows[i].querySelector(".batch-select");
        if (box == null) continue;
        if (onlySelected && !box.checked) continue;
        let id = rows[i].getAttribute("songid");
        if (id != null && id !== "") out.push(id);
    }
    return out;
}
function setStarSelection(ids) {
    let set = new Set(ids);
    let rows = document.getElementById("playlist-item-head").querySelectorAll(":scope > li");
    for (let i = 0; i < rows.length; i++) {
        let box = rows[i].querySelector(".batch-select");
        if (box == null) continue;
        box.checked = set.has(String(rows[i].getAttribute("songid")));
        rows[i].classList.toggle("selected", box.checked);
    }
}
/** 全选／全不选（与「探索」里的 selectAllResults 同款）。
 *  会先把没加载的页补齐，这样"全选"才是真的全部，而不是只选当前这一页。 */
function starSelectAll(select) {
    ensureStarRowsLoaded();
    let rows = document.getElementById("playlist-item-head").querySelectorAll(":scope > li");
    let n = 0;
    for (let i = 0; i < rows.length; i++) {
        let box = rows[i].querySelector(".batch-select");
        if (box == null) continue;
        box.checked = !!select;
        rows[i].classList.toggle("selected", !!select);
        n++;
    }
    show_msg(select ? ("已选中全部 " + n + " 首") : "已取消全选", 1400);
}
function starBatchDelete() {
    let ids = starRowIds(true);
    if (ids.length === 0) { show_msg("请先勾选歌曲", 1400); return; }
    if (!confirm("确认从收藏夹移除选中的 " + ids.length + " 首吗？")) return;
    let set = new Set(ids);
    let folder = userLoves[l_playlistid];
    folder.lists = folder.lists.filter(function (x) { return !set.has(String(x.id)); });
    folder.lastUpdatedTime = formatDateTime(new Date());
    starRerenderAll();
    saveUserLoves();
    show_msg("已移除 " + ids.length + " 首", 1600);
}
function starBatchMoveTo() {
    let ids = starRowIds(true);
    if (ids.length === 0) { show_msg("请先勾选歌曲", 1400); return; }
    let names = Object.keys(userLoves).filter(function (k) { return k !== l_playlistid; });
    if (names.length === 0) { show_msg("没有其它收藏夹可移动", 1500); return; }
    let target = prompt("移动到哪个收藏夹？（输入名称）\n现有：" + names.join("、"), names[0]);
    if (target == null || String(target).trim() === "") return;
    target = String(target).trim();
    if (target === l_playlistid) { show_msg("已经在当前收藏夹里", 1500); return; }
    if (userLoves[target] == undefined || !Array.isArray(userLoves[target].lists)) { show_msg("没有这个收藏夹：" + target, 1800); return; }
    let set = new Set(ids);
    let folder = userLoves[l_playlistid];
    let moving = folder.lists.filter(function (x) { return set.has(String(x.id)); });
    folder.lists = folder.lists.filter(function (x) { return !set.has(String(x.id)); });
    userLoves[target].lists = userLoves[target].lists.concat(moving);
    userLoves[target].lastUpdatedTime = formatDateTime(new Date());
    folder.lastUpdatedTime = formatDateTime(new Date());
    starRerenderAll();
    saveUserLoves();
    show_msg("已移动 " + moving.length + " 首到「" + target + "」", 1800);
}
function starBatchAddToPlaying() {
    let ids = starRowIds(true);
    if (ids.length === 0) { show_msg("请先勾选歌曲", 1400); return; }
    let set = new Set(ids);
    let adding = userLoves[l_playlistid].lists.filter(function (x) { return set.has(String(x.id)); });
    playing_list = playing_list.concat(adding);
    reloadPlayingList(false, true, false);
    saveUserLoves();
    show_msg("已加入播放列表：" + adding.length + " 首", 1600);
}
function loveRenameFolderById(pid) {
    if (pid == null) { show_msg("请先打开一个收藏夹", 1500); return; }
    if (LOVE_FIXED_FOLDERS.indexOf(pid) >= 0) { show_msg("默认收藏夹与稍后再听不能重命名", 1800); return; }
    if (userLoves[pid] == undefined) return;
    let name = prompt("新的收藏夹名称：", pid);
    if (name == null) return;
    name = String(name).trim();
    if (name === "") { show_msg("名称不能为空", 1500); return; }
    if (name === pid) return;
    if (userLoves[name] != undefined || LOVE_FIXED_FOLDERS.indexOf(name) >= 0) { show_msg("已存在同名收藏夹", 1700); return; }
    // 收藏夹名称就是存储键：换键时按原顺序重建，避免顺序被打乱
    let rebuilt = {};
    let keys = Object.keys(userLoves);
    for (let i = 0; i < keys.length; i++) rebuilt[keys[i] === pid ? name : keys[i]] = userLoves[keys[i]];
    userLoves = rebuilt;
    if (l_type === "star" && l_playlistid === pid) show_star_detail_id(name);
    ReloadLoveListUI();
    saveUserLoves();
    show_msg("已重命名为「" + name + "」", 1800);
}
function loveExportFile() {
    try {
        let text = JSON.stringify({ version: 2, exportedAt: formatDateTime(new Date()), loves: userLoves }, null, 2);
        let blob = new Blob([text], { type: "application/json" });
        let a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "bamboo-loves-" + formatDateTime(new Date()).replace(/[^0-9]/g, "") + ".json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
        show_msg("已导出 " + loveTotalCount() + " 首收藏", 2200);
    } catch (e) {
        console.error(e);
        show_msg("导出失败：" + e, 2600);
    }
}
function loveImportFile(input) {
    let file = (input && input.files) ? input.files[0] : null;
    if (file == null) return;
    let reader = new FileReader();
    reader.onload = function () {
        input.value = "";   // 允许再次选择同一个文件
        let data = null;
        try { data = JSON.parse(String(reader.result)); } catch (e) { data = null; }
        if (data == null) { show_msg("文件不是合法的 JSON", 2500); return; }
        let incoming = (data.loves != null) ? data.loves : data;   // 兼容直接导出的 userLoves
        let clean = normalizeUserLoves(incoming);
        let count = 0;
        for (let k in clean) count += clean[k].lists.length;
        if (count === 0) { show_msg("文件里没有收藏数据", 2200); return; }
        let merge = confirm("文件里有 " + count + " 首收藏。\n点“确定”＝合并进现有收藏（同 id 不重复）\n点“取消”＝用文件内容替换全部收藏");
        if (merge) {
            for (let folder in clean) {
                if (userLoves[folder] == undefined) userLoves[folder] = { lists: [], lastUpdatedTime: "Unknown" };
                if (!Array.isArray(userLoves[folder].lists)) userLoves[folder].lists = [];
                let have = new Set(userLoves[folder].lists.map(function (x) { return String(x.id); }));
                let list = clean[folder].lists;
                for (let i = 0; i < list.length; i++) {
                    if (have.has(String(list[i].id))) continue;
                    userLoves[folder].lists.push(list[i]);
                }
                userLoves[folder].lastUpdatedTime = formatDateTime(new Date());
            }
        } else {
            userLoves = clean;
        }
        ReloadLoveListUI();
        saveUserLoves();
        show_msg("导入完成，现有 " + loveTotalCount() + " 首", 2500);
    };
    reader.readAsText(file);
}

function applyStarFilter(text) {
    starFilterText = (text == null) ? "" : String(text);
    let root = document.getElementById("playlist-item-head");
    if (root == null) return;
    let kw = starFilterText.trim().toLowerCase();
    let rows = root.querySelectorAll(":scope > li");
    let shown = 0;
    for (let i = 0; i < rows.length; i++) {
        let li = rows[i];
        let hay = ((li.getAttribute("songname") || "") + " " + (li.getAttribute("singer") || "") + " " + (li.getAttribute("album") || "")).toLowerCase();
        let ok = (kw === "" || hay.indexOf(kw) >= 0);
        li.style.display = ok ? "" : "none";
        if (ok) shown++;
    }
    let hint = document.getElementById("star-filter-empty");
    if (kw !== "" && shown === 0 && rows.length > 0) {
        if (hint == null) {
            hint = document.createElement("div");
            hint.id = "star-filter-empty";
            hint.className = "list-no-more unable-sel";
            hint.innerText = "没有匹配的歌曲。";
            root.appendChild(hint);
        }
    } else if (hint != null && hint.parentNode != null) {
        hint.parentNode.removeChild(hint);
    }
}
function changeOrder(ele) {
    orderType++;
    if (orderType >= 4) orderType = 0;
    onChangeOrderType();
    saveOrderType();
}

document.getElementById("dialog-root").onclick = closeDialog;

document.getElementById("dialog-content").onclick = function (ev) {
    ev.stopPropagation();
}
var starInfoTemp = {};
function btn_addStar_now() {
    if (oLRC.info == "");
    openAddStarDialog(oLRC.info, 'music');
}
function btn_removeStar(ele, type, isRootNode = false) {
    let info = readLineInfo(ele, isRootNode);
    if (info == null) return;
    let starId = info.ele.getAttribute("starid");
    if (userLoves[starId] == undefined) return;
    let flag = false;
    for (let i in userLoves[starId].lists) {
        if (userLoves[starId].lists[i].id == info.songid) {
            userLoves[starId].lists.splice(i, 1);
            flag = true;
            break;
        }
    }
    if (flag) {
        show_msg("成功将“" + info.songname + "”从收藏夹“" + starId + "”删除", 1000);
        info.ele.remove();
        saveUserLoves();
    } else {
        show_msg("无法删除“" + info.songname + "”。无法从收藏夹“" + starId + "”找到此歌曲。", 1000);
    }
}
function btn_addStar(ele, type = 'music', isRootNode = false) {
    let info = readLineInfo(ele, isRootNode);
    if (info == null) return;
    openAddStarDialog({ name: info.songname, singer: info.singer, singerid: info.singerid, album: info.album, albumid: info.albumid, id: info.songid, pic: info.pic }, type);
}
function openAddStarDialog(info, type = 'music') {
    starInfoTemp = {};
    starInfoTemp = JSON.parse(JSON.stringify(info)); // 暂存数据
    document.getElementById("dialog-root").style.display = "block";
    reloadCustomLoveLists();
}
function reloadCustomLoveLists() {
    if (userLoves["default"] == undefined) userLoves["default"] = { lists: [] };
    if (userLoves["later"] == undefined) userLoves["later"] = { lists: [] };
    document.getElementById("love-name-lists").innerHTML = `<optgroup label="默认"><option value="default" selected>默认收藏夹 (${(userLoves["default"].lists.length)})</option><option value="later">稍后再听 (${(userLoves["later"].lists.length)})</option></optgroup><optgroup label="用户自定义收藏夹" id="user-custom-lovers"><option value="fol">小花</option><option value="gla">小草</option></optgroup>`;
    let rt = document.getElementById("user-custom-lovers");
    rt.innerHTML = "";
    for (let name in userLoves) {
        if (name == 'default' || name == 'later') continue;
        let ele = document.createElement("option");
        ele.value = name;
        ele.innerText = name + " (" + (userLoves[name].lists.length) + ")";
        rt.appendChild(ele);
    }
}
function addNewCustomLoveList(name) {
    if (userLoves[name] != undefined) {
        alert("您输入的名称已经存在！");
        return;
    }
    userLoves[name] = { lists: [], lastUpdatedTime: formatDateTime(new Date()) };
    reloadCustomLoveLists();
}
function wantNewLoves() {
    let name = prompt("请输入新收藏夹名称：");
    if (name == undefined || name == "")
        alert("请输入正确的名称！");
    else
        addNewCustomLoveList(name);
}
function wantAddUserLovers() {
    let rt = document.getElementById("love-name-lists");
    let options = rt.selectedOptions;
    for (let i = 0; i < options.length; i++) {
        addToUserLove(starInfoTemp, options[i].value, true)
        if (options[i].value == l_playlistid && l_type == 'star') {
            refrush_detail_list();
        }
    }
    saveUserLoves();
    closeDialog();
    show_msg("添加收藏成功", 1000);

}

function addPlaylisttoLoves() {
    if (playing_list.length > 0) {
        openAddStarDialog(playing_list);
    } else {
        alert("列表为空！无法添加收藏。");
    }
}

function removeStarList(ele) {
    let id = ele.parentNode.getAttribute("pid");
    // 默认收藏夹/稍后再听是虚拟收藏夹：删掉它们等于把里面的歌一起丢掉（而且渲染时会当成空夹重建），
    // 所以直接不允许删除。
    if (id === "default" || id === "later") {
        show_msg("默认收藏夹与稍后再听不能删除", 1800);
        return;
    }
    if (id != "" && id != undefined) {
        if (userLoves[id] != undefined) {
            if (userLoves[id].lists.length == 0) {
                delete userLoves[id];
                show_msg(`删除“${id}”成功！`, 1000);
            } else if (confirm(`确认删除“${id}”吗？这个操作无法恢复！`)) {
                delete userLoves[id];
                show_msg(`删除“${id}”成功！`, 1000);
            }
        }
    }
    saveUserLoves();
}
// 读取指定列表容器当前所有歌曲行数据（仅保留可播放的歌曲，跳过专辑条目）
function readAllListLines(rootId) {
    let elements = document.getElementById(rootId).querySelectorAll("li");
    let infos = [];
    for (let i = 0; i < elements.length; i++) {
        let d = getLineData(elements[i]);
        if (d == null || d.songid == null || d.songid == "") continue;
        infos.push({ name: d.songname, singer: d.singer, singerid: d.singerid, album: d.album, albumid: d.albumid, id: d.songid, pic: d.pic });
    }
    return infos;
}
function wantAddLovesToList() {
    let infos = readAllListLines("playlist-item-head");
    if (infos.length == 0) return;
    openAddStarDialog(infos, "list");
}
function wantPlayListAddToList(clean = false) {
    let infos = readAllListLines("playlist-item-head");
    if (infos.length == 0) return;
    if (clean) {
        playing_list = [];
        playing_idx = -1;
        playing_id = -1;
    }
    playing_list = playing_list.concat(infos);
    reloadPlayingList();
    show_msg("添加到播放列表成功！", 1000)
}

// 搜索结果的批量操作
var searchBatchMode = false;

// 切换批量操作模式（显示/隐藏勾选框与批量按钮）
function toggleBatchMode(force) {
    searchBatchMode = (force !== undefined) ? !!force : !searchBatchMode;
    let bar = document.getElementById("search-batch-bar");
    bar.classList.toggle("batch-mode", searchBatchMode);
    document.getElementById("list-item-head").classList.toggle("batch-mode", searchBatchMode);
    document.getElementById("btn-batch-toggle").style.display = searchBatchMode ? "none" : "inline-block";
    document.getElementById("batch-actions").style.display = searchBatchMode ? "flex" : "none";
}

// 全选 / 全不选当前已加载的搜索结果
function selectAllResults(select) {
    let boxes = document.querySelectorAll("#list-item-head .batch-select");
    for (let i = 0; i < boxes.length; i++) {
        boxes[i].checked = !!select;
        let li = boxes[i].closest("li");
        if (li != null) li.classList.toggle("selected", !!select);
    }
}

// 批量模式下点击条目空白区域 = 点击选择框（切换选中）
document.getElementById("list-item-head").addEventListener("click", function (e) {
    if (!searchBatchMode) return;
    let li = e.target.closest("li");
    if (li == null) return;
    // 交互元素（按钮/链接/勾选框/歌曲名等）保持原有行为
    if (e.target.closest("button, a, .batch-select, .song-name")) return;
    let box = li.querySelector(".batch-select");
    if (box == null) return;
    box.checked = !box.checked;
    li.classList.toggle("selected", box.checked);
});

// 读取搜索列表中被勾选的歌曲行数据（跳过专辑条目与未勾选项）
function getSelectedSearchLines() {
    let elements = document.getElementById("list-item-head").querySelectorAll("li");
    let infos = [];
    for (let i = 0; i < elements.length; i++) {
        let li = elements[i];
        let box = li.querySelector(".batch-select");
        if (box != null && !box.checked) continue;
        let d = getLineData(li);
        if (d == null || d.songid == null || d.songid == "") continue;
        infos.push({ name: d.songname, singer: d.singer, singerid: d.singerid, album: d.album, albumid: d.albumid, id: d.songid, pic: d.pic });
    }
    return infos;
}

function addSearchResultsToList(clean = false) {
    let infos = getSelectedSearchLines();
    if (infos.length == 0) {
        show_msg("请先勾选要操作的歌曲", 1500);
        return;
    }
    if (clean) {
        playing_list = [];
        playing_idx = -1;
        playing_id = -1;
    }
    playing_list = playing_list.concat(infos);
    reloadPlayingList();
    show_msg("已添加 " + infos.length + " 首歌曲到播放列表", 1000);
}
function wantSearchListAddToList() {
    addSearchResultsToList(false);
}
function wantSearchListPlayNow() {
    addSearchResultsToList(true);
}
function wantSearchListAddToLoves() {
    let infos = getSelectedSearchLines();
    if (infos.length == 0) {
        show_msg("请先勾选要操作的歌曲", 1500);
        return;
    }
    openAddStarDialog(infos, "list");
}
function addStarListToPlaying(ele, clear = false) {
    let id = ele.parentNode.getAttribute("pid");
    if (userLoves[id] == undefined) return;
    if (userLoves[id].lists.length <= 0) return;
    if (clear) {
        // 必须拷贝：直接赋值会让 playing_list 和收藏夹的数组变成同一个对象，
        // 于是"从播放列表删一首"会真的删掉收藏里的同一首，重排也会连带重排收藏。
        playing_list = userLoves[id].lists.slice();
    } else {
        playing_list = playing_list.concat(userLoves[id].lists);
    }
    show_msg("已添加到播放列表。", 1000);
    if (clear || playing_idx == -1) {
        playing_idx = -1;
        playing_id = -1;
    }
    reloadPlayingList();

}
function show_star_detail(ele) {
    let id = ele.parentNode.getAttribute("pid");
    show_star_detail_id(id);
}
function show_star_detail_id(id) {
    if (userLoves[id].lastUpdatedTime == undefined) userLoves[id].lastUpdatedTime = "Unknown";
    let namei = id;
    if (namei == 'later') namei = "稍后再听";
    if (namei == 'default') namei = "默认收藏夹";
    document.getElementById("list-album-name").innerText = "收藏夹：" + namei;
    document.getElementById("list-album-name").title = "收藏夹：" + namei;

    document.getElementById("list-album-singer").innerText = "上次更新：" + userLoves[id].lastUpdatedTime;
    document.getElementById("list-album-singer").onclick = function () {

    };
    if (nowWindow != "search") {
        changeWindow("search", true);
    }
    showWindow("musiclist", false);
    // 换收藏夹时清掉上一次的筛选与排序模式，避免状态串场
    if (starSortMode) toggleStarSort(false);
    let input = document.getElementById("star-filter-input");
    if (input != null) input.value = "";
    applyStarFilter("");
    api_list_alarm(id, "star", true, 1);
}
function treat_star_detail(ppid, type, clean = true, page = 1) {
    let listRootObj = document.getElementById("playlist-item-head");
    l_playlistid = ppid;
    l_type = "star";
    l_page = page;
    setStarToolsVisible(true);
    try {
        let keys = userLoves[ppid].lists;
        l_total = keys.length;
        for (var i in keys) {
            if (i < (page - 1) * PAGESIZE) continue;
            if (i >= (page) * PAGESIZE) break;
            // 收藏夹数据字段名与 API 不同（singer/singerid）
            listRootObj.appendChild(createSongListItem(keys[i], { starMode: true, starid: ppid }));
            let hr = document.createElement("div");
            hr.classList.add("pretty-hr");
            listRootObj.appendChild(hr);
        }
        appendListEndHint(listRootObj, keys.length, l_total, l_page, clean, "很抱歉，什么都没有找到。这个收藏夹也许是空的。");
    } catch (e) {
        var errele = document.createElement("div");
        errele.innerHTML = `<h1>出现错误！</h1><span>${e}</span>`;
        listRootObj.appendChild(errele);
        console.error(e);
    }
}

function saveMyApi() {
    let ctx = LOCALAPIINPUT.value;
    localSettings.setItem("localapi", ctx);
}
function saveWYCookie() {
    let ctx = WYAPIINPUT.value;
    localSettings.setItem("wyapi", ctx);
}

// Shortcut keys
document.onkeydown = function (ev) {
    if (ev.shiftKey) {
        if (ev.code === 'KeyN') {
            play_next_music();
            ev.preventDefault();
        } else if (ev.code === 'KeyL') {
            play_last_music();
            ev.preventDefault();
        } else if (ev.code === 'KeyP') {
            pause_music();
            ev.preventDefault();
        }
    } else if (ev.key === 'MediaTrackPrevious') {
        play_last_music();
        ev.preventDefault();
    } else if (ev.key === 'MediaTrackNext') {
        play_next_music();
        ev.preventDefault();
    } else if (ev.key === 'MediaStop') {
        pause_music(true);
        musicPlayerObj.currentTime = 0;
        ev.preventDefault();
    }

}