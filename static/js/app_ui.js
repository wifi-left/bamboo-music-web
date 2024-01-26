
var SlideDownTimeoutFunc = 0;
// 获取固定的 HTML 对象
document.querySelectorAll(".version-show").forEach((ele) => {
    ele.innerText = BAMBOOMUSIC.version;
});
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

    let plid = getQueryString("musicid");
    if (plid == null) {
        plid = getQueryString("musicid", location.hash);
    }
    if (plid != null && plid != "") {
        play_music_id_toList(plid, true);
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
    let songid = infoele.getAttribute("songid");
    let songname = infoele.getAttribute("songname");
    let singer = infoele.getAttribute("singer");
    let singerid = infoele.getAttribute("singerid");
    let albumid = infoele.getAttribute("albumid");

    // console.log(songname)
    watchVideo(songid, songname, singer, singerid, albumid, reloadSuggest);
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
    addToList({ name: songname, singer: singer, singerid: singerid, album: album, albumid: albumid, id: songid }, -1, true, openGUI);
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
    addToList({ name: songname, singer: singer, singerid: singerid, album: album, albumid: albumid, id: songid }, -1);
    show_msg("已添加【" + songname + "】到播放列表", 1000);
    // console.log(songname)
}
var PlayListPaneState = false;
function showPlayList(show_or_hide) {
    PlayListPaneState = show_or_hide;

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

function showHideMusicPlayerPane(show_or_hide, exit_fullscreen = false) {

    if (isFullScreen()) {
        document.exitFullscreen()
        if (exit_fullscreen) {
            return;
        }
    }


    MusicPlayerPaneState = show_or_hide;
    let ass = document.querySelector(".musicpane-control");

    if (PlayListPaneState) showPlayList(false);
    if (show_or_hide) {
        ass.classList.add("playing-display")
        // showPlayList(false)
        // slideUpWindow_name("playing");
        musicPaneObj.style.display = "inline-block";
        // smallMusicControlPaneObj.style.display = "none";
        windowsOnResize();

    } else {
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
    let enableList = localStorage.getItem("enableListSaving");
    if (enableList != "" && enableList != null) {
        try {
            enableListSaving = JSON.parse(enableList);
        } catch (e) {
            enableListSaving = true;
        }
    }
    let m = localStorage.getItem("lrc_settings");
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
    document.getElementById("norlrccolor").value = lrc_normal_line_color;
    document.getElementById("norlineheight").value = lrc_normal_line_height;
    document.getElementById("norfontsize").value = lrc_normal_font_size;
    document.getElementById("sellrccolor").value = lrc_selected_line_color;
    document.getElementById("sellineheight").value = lrc_selected_line_height;
    document.getElementById("selfontsize").value = lrc_selected_font_size;
    set_globle_css_var();
}

function enableListSave(flag) {
    enableListSaving = flag;
    localStorage.setItem("enableListSaving", (flag));
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
    localStorage.setItem("lrc_settings", JSON.stringify(m));
    set_globle_css_var();
};
// kuroshiro
function enableKuromaji(flag) {
    if (flag == true) {
        localStorage.setItem("kuroshiro", true);
        Kuroshiro_state = true;
        alert("您需要重新刷新才能生效");
    } else {
        localStorage.setItem("kuroshiro", false);
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
        } else {
            eme.classList.remove("active");
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
    localStorage.setItem("backgroundImage", ele.value);
    backgroundImage = ele.value;
    if (backgroundImage != "") {
        if (backgroundImage != "on") {
            document.getElementById("win-playing").style.background = (backgroundImage);
        }
        document.getElementById("win-playing-host").classList.remove("color");
    } else {
        document.getElementById("win-playing").style.background = "rgb(30,30,30)";
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

function ReloadLoveListUI() {
    let root = document.getElementById("lover-displayer");
    root.innerHTML = "";
    for (var i = 0; i < playing_list.length; i++) {
        let linef = document.createElement("li");
        linef.id = "star-list-" + i;
        let line = document.createElement("div");
        line.classList.add("star-list-text-root");
        line.setAttribute("idx", i);

        let indexname = document.createElement("span");
        indexname.innerText = (i + 1);
        indexname.classList.add("l-idx")
        let songname = document.createElement("b");
        songname.onclick = function () {
            show_star_detail(parseInt(this.parentNode.getAttribute("idx")), true);
        }
        songname.classList.add("songname");
        songname.innerText = playing_list[i].name;
        line.appendChild(indexname);
        line.appendChild(songname);
        let actionbar = document.createElement("div");
        actionbar.classList.add("action-bar");

        let actioncode = ``;
        actioncode += `<button title="立即播放" class="button btn-play fa fa-play-circle" onclick="addStarListToPlaying(${i});">`;
        actioncode += `<button title="详情" class="button btn-info fa fa-info-circle" onclick="show_star_detail(${i});">`;
        actioncode += `<button title="删除" class="button fa fa-remove" onclick="removeFromStarList(${i});"></button>`;
        actionbar.innerHTML = actioncode;
        linef.appendChild(line);
        linef.appendChild(actionbar);
        root.appendChild(linef);
    }
}