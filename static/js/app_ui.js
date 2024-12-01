
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
// 页面加载完后...
window.onload = function () {
    changeWindow(default_page);

    if (playing_list.length > 0) {
        playing_idx = -1;
        // changeWindow("home");
        showPlayList(true)
    }
    hashDetect();

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
searchBoxObj.oninput = (function () {
    api_suggestKey(this.value);
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
    // console.log(ev.keyCode);
    switch (ev.keyCode) {
        case 38:
            if (nowsel >= 0) nowsel--;
            displayNowSelSuggest();
            break;
        case 40:
            if (nowsel < 9) nowsel++;
            displayNowSelSuggest();
            break;
        case 13:
            if (nowsel >= 0) {
                let ele = document.querySelector(".li-sel");
                // searchBoxObj.value = ele.innerText;
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
        case 27:
            suggestKeyRootObj.style.display = "none";
            break;
        case 9:  //如果是其它键，换上相应在ascii 码即可。
            if (nowsel >= 0) {
                let ele = document.querySelector(".li-sel");
                // searchBoxObj.value = ele.innerText;
                if (ele.onclick != undefined)
                    searchBoxObj.value = ele.innerText;
                else {
                    break;
                }
                displayNowSelSuggest();
                return false;
            }

    }
    // console.log(ev.keyCode)
    //38 up 40 down 13 enter 27 esc
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
document.getElementById("playlist-item-head").addEventListener('scroll', function () {
    if (!l_cooldown)
        if (l_page * PAGESIZE < l_total) {
            if (this.scrollTop > this.scrollHeight - this.clientHeight * 1.5) {
                api_list_alarm(l_playlistid, l_type, false, l_page + 1);
            }
        };
});
listRootObj.addEventListener('scroll', function () {
    if (s_page * PAGESIZE < s_total) {
        if (this.scrollTop > this.scrollHeight - this.clientHeight * 1.5) {
            api_search(s_searchkey, s_type, s_page + 1, false);
        }
    };
});
var moreVideoSuggestFuc = function () {
    if (!v_cooldown) {
        if (v_page * PAGESIZE < s_total) {
            if (this.scrollTop > this.scrollHeight - this.clientHeight * 1.5) {
                // (s_searchkey, s_type, s_page + 1, false);
                try {
                    v_cooldown = true;
                    v_page = v_page + 1;
                    let url = get_api_suggest_url(v_vid, v_playlistid, "video", v_page);
                    if (url == undefined) {
                        document.getElementById("video-player-suggest-list").innerHTML = `<span class="small-gray-text">无推荐内容</span>`;
                        return;
                    }
                    var loading_todeal = document.createElement("div");
                    loading_todeal.classList.add("loading_todeal");
                    loading_todeal.innerHTML = `<div class="loader" style="width:12px;height:12px;"></div><b class="unable-sel" style="margin-left:16px;font-size:16px;">正在缓冲中...</b>`
                    document.getElementById("video-player-suggest-list").appendChild(loading_todeal);
                    $.fetch(url, "json").then(data => {
                        deal_data_suggest_video(data, false);
                        v_cooldown = false;
                    }).catch(e => {
                        console.error(e);
                        document.getElementById("video-player-suggest-list").innerHTML = `<li class="small-gray-text">出现错误：${e.message}</li>`;
                        v_cooldown = false;
                        return;
                    });
                } catch (e) {
                    console.error(e);
                    document.getElementById("video-player-suggest-list").innerHTML = `<li class="small-gray-text">出现错误：${e.message}</li>`;
                    v_cooldown = false;
                    return;
                }
            }
        };
    }
}
document.getElementById("video-player-suggest-list").addEventListener('scroll', moreVideoSuggestFuc);
document.getElementById("win-video-player").addEventListener('scroll', moreVideoSuggestFuc);

function btn_seeSinger(ele) {
    let infoele = ele.parentNode.parentNode.parentNode;
    // let songid = infoele.getAttribute("songid");
    // let songname = infoele.getAttribute("songname");
    let singer = infoele.getAttribute("singer");
    let singerid = infoele.getAttribute("singerid");
    list_singer_gui(singer, singerid, true);
}
function btn_seeAlbum(ele) {
    let infoele = ele.parentNode.parentNode.parentNode;
    // let songid = infoele.getAttribute("songid");
    // let songname = infoele.getAttribute("songname");
    let singer = infoele.getAttribute("singer");
    let singerid = infoele.getAttribute("singerid");
    let album = infoele.getAttribute("album");
    let albumid = infoele.getAttribute("albumid");
    list_alarm_gui(singer, singerid, album, albumid, true);
}

function btn_watchVideo(ele, isRootNode = false, reloadSuggest = true) {
    let infoele = undefined;
    if (isRootNode) {
        if (ele.classList.contains("playing")) {
            return;
            // 已经播放
        }
        infoele = ele;
    }
    else infoele = ele.parentNode.parentNode.parentNode;
    // console.log(infoele)

    let hasmv = infoele.getAttribute("hasmv");
    let songid = hasmv
    if (!(hasmv != false && hasmv != "false" && hasmv != null && hasmv != "null" && hasmv != "" && hasmv != 1 && hasmv != true && hasmv != "true")) {
        songid = infoele.getAttribute("songid");
    }
    let songname = infoele.getAttribute("songname");
    let singer = infoele.getAttribute("singer");
    let singerid = infoele.getAttribute("singerid");
    let albumid = infoele.getAttribute("albumid");

    // console.log(songname)
    watchVideo(songid, songname, singer, singerid, albumid, reloadSuggest);
}
function btn_shareURL(ele) {
    infoele = ele.parentNode.parentNode.parentNode;
    // console.log(infoele)
    let songid = infoele.getAttribute("songid");
    let songname = infoele.getAttribute("songname");
    let singer = infoele.getAttribute("singer");
    let singerid = infoele.getAttribute("singerid");
    let album = infoele.getAttribute("album");
    let albumid = infoele.getAttribute("albumid");
    shareEventHandler(songid, songname, singer, album)

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
    let infoele = undefined;
    if (isRootNode) {
        if (ele.classList.contains("playing")) {
            return;
            // 已经播放
        }
        infoele = ele;
    }
    else infoele = ele.parentNode.parentNode.parentNode;
    // console.log(infoele)
    let songid = infoele.getAttribute("songid");
    let songname = infoele.getAttribute("songname");
    let singer = infoele.getAttribute("singer");
    let singerid = infoele.getAttribute("singerid");
    let album = infoele.getAttribute("album");
    let albumid = infoele.getAttribute("albumid");
    let picele = infoele.querySelector(".list-left-img");
    let pic = undefined;
    if (picele != undefined) pic = picele.src;
    addToList({ name: songname, singer: singer, singerid: singerid, album: album, albumid: albumid, id: songid, pic: pic }, -1, true, openGUI);
    // console.log(songname)
    // play_music_id(songid, openGUI);
}
function btn_addtoList(ele, openGUI = false, isRootNode = false) {
    let infoele = undefined;
    if (isRootNode) {
        if (ele.classList.contains("playing")) {
            return;
            // 已经播放
        }
        infoele = ele;
    }
    else infoele = ele.parentNode.parentNode.parentNode;
    // console.log(infoele)
    let songid = infoele.getAttribute("songid");
    let songname = infoele.getAttribute("songname");
    let singer = infoele.getAttribute("singer");
    let singerid = infoele.getAttribute("singerid");
    let album = infoele.getAttribute("album");
    let albumid = infoele.getAttribute("albumid");
    let picele = infoele.querySelector(".list-left-img");
    let pic = undefined;
    if (picele != undefined) pic = picele.src;
    addToList({ name: songname, singer: singer, singerid: singerid, album: album, albumid: albumid, id: songid, pic: pic }, -1);
    show_msg("已添加【" + songname + "】到播放列表", 1000);
    // console.log(songname)
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

function showHideMusicPlayerPane(show_or_hide, exit_fullscreen = false, fromControlPane = false) {
    suggestKeyRootObj.style.display = "none";
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

window.onresize = windowsOnResize;
function windowsOnResize() {
    let h = LRC_root_obj.clientHeight;
    let w = LRC_root_obj.clientWidth;
    document.documentElement.style.setProperty(`--lrc-client-height`, h + 'px');
    document.documentElement.style.setProperty(`--lrc-client-width`, w + 'px');
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
    // document.documentElement.style.setProperty(`--lrc-client-width`, w + 'px');
    // --norlrccolor: rgb(209, 209, 209);
    // --sellrccolor: rgb(23, 236, 148);
    // --norlineheight: 28px;
    // --sellineheight: 40px;
    // --norfontsize: 16px;
    // --selfontsize: 24px;
}
function loadLrcConfig() {
    let networkSavingMode = localSettings.getItem("NetworkSavingMode");
    let enableList = localSettings.getItem("enableListSaving");
    if (enableList != "" && enableList != null) {
        try {
            enableListSaving = JSON.parse(enableList);
        } catch (e) {
            enableListSaving = true;
        }
    }
    if (networkSavingMode != "" && networkSavingMode != null) {
        try {
            NetworkSavingMode = JSON.parse(networkSavingMode);
        } catch (e) {
            NetworkSavingMode = false;
        }
    }
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
function setMusicSourceQuality(quality){
    MusicSourceQuality = quality;
    localSettings.setItem("MusicSourceQuality", (quality));
}
function enableListSave(flag) {
    enableListSaving = flag;
    localSettings.setItem("enableListSaving", (flag));
}
function enableNetworkSaving(flag) {
    NetworkSavingMode = flag;
    localSettings.setItem("NetworkSavingMode", (flag));
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
function enableKuromaji(flag) {
    if (flag == true) {
        localSettings.setItem("kuroshiro", true);
        Kuroshiro_state = true;
        alert("您需要重新刷新才能生效");
    } else {
        localSettings.setItem("kuroshiro", false);
        Kuroshiro_state = false;
    }
}

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
function Sdwoijnjudhewhgfryhgrh32r3726tyr46723tyf3w42e7t(i, idx, root) {

    let linef = document.createElement("li");
    linef.id = "star-list-" + idx;
    let line = document.createElement("div");
    line.classList.add("star-list-text-root");
    line.setAttribute("idx", idx);
    line.setAttribute("pid", i);

    if (userLoves[i] == undefined) userLoves[i] = { lists: [] };
    let indexname = document.createElement("span");
    indexname.innerText = (idx + 1);
    indexname.classList.add("l-idx")
    let songname = document.createElement("b");
    songname.onclick = function () {
        show_star_detail(this, true);
    }
    songname.classList.add("songname");
    if (i == 'default') songname.innerText = "默认收藏夹";
    else if (i == 'later') songname.innerText = "稍后再听";
    else
        songname.innerText = i;
    songname.innerText += " (" + userLoves[i].lists.length + ")";
    line.appendChild(indexname);
    line.appendChild(songname);
    let actionbar = document.createElement("div");
    actionbar.classList.add("action-bar");
    actionbar.setAttribute("pid", i);
    let actioncode = ``;
    actioncode += `<button title="立即播放" class="button btn-play fa fa-play-circle" onclick="addStarListToPlaying(this,true);">`;
    actioncode += `<button title="添加到列表" class="button btn-play fa fa-plus-circle btn-add-list" onclick="addStarListToPlaying(this,false);">`;
    actioncode += `<button title="详情" class="button btn-info fa fa-info-circle" onclick="show_star_detail(this);">`;
    actioncode += `<button title="删除" class="button fa fa-remove" onclick="removeStarList(this);"></button>`;
    actionbar.innerHTML = actioncode;
    linef.appendChild(line);
    linef.appendChild(actionbar);
    root.appendChild(linef);
    idx++;
}
function ReloadLoveListUI() {
    let root = document.getElementById("lover-displayer");
    root.innerHTML = "";
    let idx = 2;
    //
    Sdwoijnjudhewhgfryhgrh32r3726tyr46723tyf3w42e7t("default", 0, root);
    Sdwoijnjudhewhgfryhgrh32r3726tyr46723tyf3w42e7t("later", 1, root);
    //
    for (var i in userLoves) {
        if (i == 'default' || i == 'later') continue;
        Sdwoijnjudhewhgfryhgrh32r3726tyr46723tyf3w42e7t(i, idx++, root);
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
    let infoele = undefined;
    if (isRootNode) {
        if (ele.classList.contains("playing")) {
            return;
            // 已经播放
        }
        infoele = ele;
    }
    else infoele = ele.parentNode.parentNode.parentNode;
    // console.log(infoele)
    let songid = infoele.getAttribute("songid");
    let songname = infoele.getAttribute("songname");
    let starId = infoele.getAttribute("starid");
    if (userLoves[starId] == undefined) return;
    let flag = false;
    for (let i in userLoves[starId].lists) {
        if (userLoves[starId].lists[i].id == songid) {
            userLoves[starId].lists.splice(i, 1);
            flag = true;
            break;
        }
    }
    if (flag) {
        show_msg("成功将“" + songname + "”从收藏夹“" + starId + "”删除", 1000);
        ele.parentNode.parentNode.parentNode.remove();
        saveUserLoves();
    } else {
        show_msg("无法删除“" + songname + "”。无法从收藏夹“" + starId + "”找到此歌曲。", 1000);
    }

    // ele.remove();
}
function btn_addStar(ele, type = 'music', isRootNode = false) {
    let infoele = undefined;
    if (isRootNode) {
        if (ele.classList.contains("playing")) {
            return;
            // 已经播放
        }
        infoele = ele;
    }
    else infoele = ele.parentNode.parentNode.parentNode;
    // console.log(infoele)
    let songid = infoele.getAttribute("songid");
    let songname = infoele.getAttribute("songname");
    let singer = infoele.getAttribute("singer");
    let singerid = infoele.getAttribute("singerid");
    let album = infoele.getAttribute("album");
    let albumid = infoele.getAttribute("albumid");
    let picele = infoele.querySelector(".list-left-img");
    let pic = undefined;
    if (picele != undefined) pic = picele.src;
    let info = { name: songname, singer: singer, singerid: singerid, album: album, albumid: albumid, id: songid, pic: pic };
    openAddStarDialog(info, type);
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
function wantAddLovesToList() {
    let elements = document.getElementById("playlist-item-head").querySelectorAll("li");
    if (elements.length == 0) return;
    let infos = [];
    for (let i = 0; i < elements.length; i++) {
        let infoele = elements[i];
        let songid = infoele.getAttribute("songid");
        let songname = infoele.getAttribute("songname");
        let singer = infoele.getAttribute("singer");
        let singerid = infoele.getAttribute("singerid");
        let album = infoele.getAttribute("album");
        let albumid = infoele.getAttribute("albumid");
        let picele = infoele.querySelector(".list-left-img");
        let pic = undefined;
        if (picele != undefined) pic = picele.src;
        let info = { name: songname, singer: singer, singerid: singerid, album: album, albumid: albumid, id: songid, pic: pic };
        infos.push(info);
    }
    openAddStarDialog(infos, "list");
}
function wantPlayListAddToList(clean = false) {
    let elements = document.getElementById("playlist-item-head").querySelectorAll("li");
    if (elements.length == 0) return;
    if (clean) {
        playing_list = [];
        playing_idx = -1;
        playing_id = -1;
    }
    for (let i = 0; i < elements.length; i++) {
        let infoele = elements[i];
        let songid = infoele.getAttribute("songid");
        let songname = infoele.getAttribute("songname");
        let singer = infoele.getAttribute("singer");
        let singerid = infoele.getAttribute("singerid");
        let album = infoele.getAttribute("album");
        let albumid = infoele.getAttribute("albumid");
        let picele = infoele.querySelector(".list-left-img");
        let pic = undefined;
        if (picele != undefined) pic = picele.src;
        let info = { name: songname, singer: singer, singerid: singerid, album: album, albumid: albumid, id: songid, pic: pic };
        playing_list.push(info);
    }
    reloadPlayingList();
    show_msg("添加到播放列表成功！", 1000)
}
function addStarListToPlaying(ele, clear = false) {
    let id = ele.parentNode.getAttribute("pid");
    if (userLoves[id] == undefined) return;
    if (userLoves[id].lists.length <= 0) return;
    if (clear) {
        playing_list = userLoves[id].lists;
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
    document.getElementById("list-album-singer").innerText = "上次更新：" + userLoves[id].lastUpdatedTime;
    document.getElementById("list-album-singer").onclick = function () {

    };
    if (nowWindow != "search") {
        changeWindow("search", true);
    }
    showWindow("musiclist", false);
    treat_star_detail(id);
}
function treat_star_detail(ppid) {
    let clean = true;
    let listRootObj = document.getElementById("playlist-item-head");
    listRootObj.scrollTo(0, 0);
    listRootObj.innerHTML = "";
    l_playlistid = ppid;
    l_type = "star";
    try {
        l_total = 0;
        let keys = userLoves[ppid].lists;
        for (var i in keys) {
            let liele = document.createElement("li");
            // 存储信息
            let linedata = keys[i];
            let id = linedata['id'];
            let name = linedata['name'];
            let singer = linedata['singer'];
            let singerid = linedata['singerid'];
            let album = linedata['album'];
            let albumid = linedata['albumid'];
            let releasedata = undefined;
            let hasaudio = true;
            let hasmv = linedata['hasMv'];
            let addition = linedata['addition'];
            // let warning = linedata['warning'];

            let pic = linedata['pic'];
            if (pic == null || pic == "" || NetworkSavingMode) {
                pic = "./static/img/default_cd.png";
            }
            liele.setAttribute("songid", id);
            liele.setAttribute("songname", name);
            liele.setAttribute("singer", singer);
            liele.setAttribute("singerid", singerid);
            liele.setAttribute("album", album);
            liele.setAttribute("albumid", albumid);
            liele.setAttribute("releasedata", releasedata);
            liele.setAttribute("starid", ppid);
            liele.setAttribute("hasmv", hasmv);

            // 显示信息
            // 左侧：图片
            let leftpart = document.createElement("div");
            leftpart.classList.add("left-part");

            let imgele = document.createElement("img");
            imgele.classList.add("list-left-img");
            imgele.src = pic;
            leftpart.appendChild(imgele);
            // 右侧：信息

            let rightpart = document.createElement("div");
            rightpart.classList.add("right-part");
            let nameele = document.createElement("div");
            let singerele = document.createElement("div");;
            let albumele = document.createElement("div");;
            let dataele = document.createElement("div");;
            let additionele = document.createElement("div");
            nameele.classList.add("list-line-ele");
            singerele.classList.add("list-line-ele");
            albumele.classList.add("list-line-ele");
            dataele.classList.add("list-line-ele");
            additionele.classList.add("list-line-ele");

            // nameele.innerHTML = `<b>歌曲名：</b>`;
            singerele.innerHTML = `<span class='small-gray-text'>相关人员：</span>`;
            albumele.innerHTML = `<span class='small-gray-text'>专辑：</span>`;
            dataele.innerHTML = `<span class='small-gray-text'>出版时间：</span>`;
            additionele.innerHTML = `<span class='small-gray-text'>附加信息：</span>`;
            let songnameobj = document.createElement("b");
            songnameobj.classList.add("song-name");
            songnameobj.innerText = name;
            songnameobj.onclick = function () {
                if (hasaudio)
                    btn_playMusic(this, true);
                else
                    if ((hasmv != "" && hasmv != null && hasmv != false)) {
                        btn_watchVideo(this);
                    }
            }
            let singernameobj = document.createElement("a");
            singernameobj.classList.add("singer-name");
            // singernameobj.classList.add("")
            singernameobj.onclick = function () {
                btn_seeSinger(this);
            }
            singernameobj.innerText = singer;
            let albumobj = document.createElement("a");
            albumobj.classList.add("album-name");
            albumobj.innerText = album;
            albumobj.onclick = function () {
                btn_seeAlbum(this);
            }
            let dataobj = document.createElement("span");
            dataobj.classList.add("release-date");
            dataobj.innerText = releasedata;
            let additionobj = document.createElement("span");
            additionobj.classList.add("addition-msg");
            additionobj.innerText = addition;
            // 添加文本
            additionele.appendChild(additionobj);
            nameele.appendChild(songnameobj);
            singerele.appendChild(singernameobj);
            albumele.appendChild(albumobj);
            dataele.appendChild(dataobj);
            // 添加对象
            rightpart.appendChild(nameele);
            rightpart.appendChild(singerele);
            rightpart.appendChild(albumele);
            if (releasedata != undefined && releasedata != "")
                rightpart.appendChild(dataele);
            if (addition != undefined && addition != "")
                rightpart.appendChild(additionele);

            // 控制按钮
            let actionbar = document.createElement("div");
            actionbar.classList.add("action-bar");
            let actioncode = ``;
            if (hasaudio) {
                actioncode += `<button title="添加到播放列表" class="button btn-add-list fa fa-plus-circle" onclick="btn_addtoList(this);"></button>`;
                actioncode += `<button title="立即播放" class="button btn-play fa fa-play-circle" onclick="btn_playMusic(this,false);">`;
                if ((hasmv != "" && hasmv != null && hasmv != false)) {
                    actioncode += `<button title="观看MV" class="button btn-add-list fa fa-tv" onclick="btn_watchVideo(this);"></button>`;
                }
                actioncode += `<button title="添加到其他收藏夹" class="button fa fa-star" onclick="btn_addStar(this,'music');"></button>`;

            } else {
                if ((hasmv != "" && hasmv != null && hasmv != false)) {
                    actioncode += `<button title="观看MV" class="button btn-add-list fa fa-tv" onclick="btn_watchVideo(this);"></button>`;
                }
            }

            actioncode += `<button title="分享" class="button btn-add-list fa fa-share" onclick="btn_shareURL(this);"></button>`;
            actioncode += `<button title="从收藏夹删除" class="button fa fa-trash" onclick="btn_removeStar(this,'music');"></button>`;
            actionbar.innerHTML = actioncode;

            rightpart.appendChild(actionbar);

            liele.appendChild(leftpart);
            liele.appendChild(rightpart);
            // 添加成员

            listRootObj.appendChild(liele);
            let hr = document.createElement("div");
            hr.classList.add("pretty-hr");
            listRootObj.appendChild(hr);
        }
        if (keys.length == 0) {
            if (clean) {
                let ele = document.createElement("div");
                ele.innerHTML = `<span class="text-not-found-error">很抱歉，什么都没有找到。请重试或者更换关键词。</span>`
                listRootObj.appendChild(ele);
            } else {
                let ele = document.createElement("div");
                ele.classList.add("list-no-more");
                ele.innerHTML = "<span>没有更多了。</span>"
                listRootObj.appendChild(ele);
            }

        } else {
            let ele = document.createElement("div");
            ele.classList.add("list-no-more");
            ele.innerHTML = "<span>没有更多了。</span>"
            listRootObj.appendChild(ele);
        }
        // console.log(keys)
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