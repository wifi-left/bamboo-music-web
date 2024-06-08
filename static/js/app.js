// 搜索缓存
var s_total = -1;
var s_searchkey = "";
var s_page = -1;
var s_type = "random";
var nowsel = -1;
var myAudioStation = [];

var v_total = -1;
var v_playlistid = "";
var v_vid = "";
var v_page = -1;
var v_cooldown = false;

var l_total = -1;
var l_playlistid = "";
var l_page = -1;
var l_cooldown = false;
var l_type = "";

var playing_albumid = -1;
var playing_album = -1;
var playing_singer = -1;
var playing_singerid = -1;
var playing_id = -1;
var playing_idx = -1;
var playing_list = [];

var lrc_normal_line_height = 42;
var lrc_normal_font_size = 16;
var lrc_selected_line_height = 42;
var lrc_selected_font_size = 24;
var lrc_normal_line_color = "rgb(209, 209, 209)";
var lrc_selected_line_color = "rgb(23, 236, 148)";
var orderType = 0; // 0: 顺序; 1:单曲; 2:随机; 3:逆序

var updateRate = 0.2;

var enableListSaving = true;

var userLoves = {};

var mp = null;

// 播放顺序
orderType = parseInt(localStorage.getItem("music-play-order"));
if (orderType == null || isNaN(orderType)) orderType = 0;
// var show_msg = function(data,time){console.log("The log function hasn't be inited yet...",data)};
onChangeOrderType();
function onChangeOrderType() {
    if (orderType == 0) {
        orderTypeObj.className = "fa fa-sort-numeric-asc button playing-list-order";
        show_msg("播放顺序：顺序播放", 1000, false, true)
    } else if (orderType == 1) {
        orderTypeObj.className = "fa fa-repeat button playing-list-order";
        show_msg("播放顺序：单曲循环", 1000, false, true)
    } else if (orderType == 2) {
        orderTypeObj.className = "fa fa-random button playing-list-order";
        show_msg("播放顺序：随机播放", 1000, false, true)
    } else {
        orderTypeObj.className = "fa fa-sort-numeric-desc button playing-list-order";
        show_msg("播放顺序：逆序播放", 1000, false, true)
    }
};

// 判断是否已经读过用户已读
let hasReadme = localStorage.getItem("hasReadme");
let backgroundImage = localStorage.getItem("backgroundImage");
if (backgroundImage == null) backgroundImage = "on";
if (hasReadme != "true") {
    location = "./readme.html?return=" + encodeURIComponent(location.href);
}
document.getElementById("setting-background-image").value = backgroundImage;
if (backgroundImage != "") {
    if (backgroundImage != "on") {
        document.getElementById("win-playing").style.background = (backgroundImage);
        document.getElementById("win-playing-host").classList.remove("color");
    }
} else {
    document.getElementById("win-playing").style.background = "rgb(30,30,30)";
    document.getElementById("win-playing-host").classList.add("color");
}
// 初始化 kuroshiro
var Kuroshiro_state = (localStorage.getItem("kuroshiro") == "true");
const KURO = new Kuroshiro.default();
if (allow_Kuroshiro) {
    if (Kuroshiro_state) {
        KURO.init(new KuromojiAnalyzer({
            dictPath: Kuroshiro_lib_url
        })).then(function () {
            console.log("Kuromoji Loaded!");
        });
    }
}
//检测语言
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
// 罗马音翻译
function romajiTranslate(texts, resultFunc) {
    KURO.convert(texts,
        { to: "romaji", "mode": "spaced", "romajiSystem": "passport" }).then(data => {
            resultFunc(data);
            // console.log(this.ele.id);
        }).catch(e => {
            console.warn(e);
            resultFunc();
        });
}

// 歌词罗马音转换
var toRomajiCount = 0, nowRomajiCount = 0;
function lrcRomaji(refunc) {
    toRomajiCount = 0, nowRomajiCount = 0;
    for (let i = 0; i < oLRC['ms'].length; i++) {
        if (checkLanguage(oLRC.ms[i].c) === 2) {
            oLRC['ms'][i].tkuro = true;
            toRomajiCount++;
            // texts += (texts === "" ? "" : "\r\n") + oLRC['ms'][i].c;
            let idx = i;
            romajiTranslate(oLRC['ms'][idx].c, function (data) {
                if (data == null) {
                    oLRC['ms'][i].tkuro = false;
                }
                oLRC['ms'][idx].tc = data;
                nowRomajiCount++;
                if (nowRomajiCount >= toRomajiCount) refunc();
            })
        };
    }
}

// 自动搜索
function auto_search(key) {
    searchBoxObj.value = key;
    api_search(key, searchTypeSelector.value);
}

// API 部分

function watchVideo(songid, songname = "一个视频", singer = "未知上传者", singerid = "0", albumid = undefined, reloadSuggest = true) {
    // location.hash = "";
    musicPlayerObj.pause();
    document.getElementById("win-video-player").scrollTop = 0;
    document.getElementById("video-player-title").innerText = songname;
    document.getElementById("video-player-title").title = songname;
    document.getElementById("video-player-uploader-text").innerText = singer;
    document.getElementById("video-player-uploader-text").title = singer;
    showWindow("video-player", false);
    document.getElementById("video-player-loading-pane").style.display = "none";
    let url = get_api_play_url(songid, "video");
    //video-player-suggest-list
    // document.getElementById("video-player-suggest-loading-pane").style.display = "inline-block";
    if (reloadSuggest)
        loadSuggestVideos(songid, albumid);
    else {
        var eles = document.querySelectorAll("#video-player-suggest-list li");
        for (let i = 0; i < eles.length; i++) {
            let ele = eles[i];
            if (ele.getAttribute("songid") == (songid)) {
                ele.classList.add("playing")
            } else {
                ele.classList.remove("playing");
            }
        }
    }
    fetchi(url, "text", (data) => {
        setVideoUrl(songname, data);
    }, e => {
        show_msg("无法播放。出现了错误：" + e.message, 5000);
    });
}
function setVideoUrl(title, url) {
    document.getElementById("mui-player").src = url;
    document.getElementById("mui-player").play();
}
var suggest_idx = 0;

function list_alarm_gui(singer, singerid, album, albumid, clean = true) {
    document.getElementById("list-album-name").innerText = "专辑：" + album;
    document.getElementById("list-album-singer").innerText = singer;
    document.getElementById("list-album-singer").onclick = function () {
        list_singer_gui(singer, singerid, true);
    };
    if (nowWindow != "search") {
        changeWindow("search");
    }
    showWindow("musiclist", false);
    api_list_alarm(albumid, "album", clean);
    // console.log(114514);
}
function list_playlist_gui(singer, singerid, playlist, playlistid, clean = true) {
    document.getElementById("list-album-name").innerText = "播放列表：" + playlist;
    document.getElementById("list-album-singer").innerText = singer;
    document.getElementById("list-album-singer").onclick = function () {
        list_singer_gui(singer, singerid, true);
    };
    if (nowWindow != "search") {
        changeWindow("search");
    }
    showWindow("musiclist", false);
    api_list_alarm(playlistid, "singer", clean);
    // console.log(114514);
}
function list_singer_gui(singer, singerid, clean = true) {
    document.getElementById("list-album-name").innerText = "关键词：" + singer;
    document.getElementById("list-album-singer").innerText = singer;
    document.getElementById("list-album-singer").onclick = function () {
        list_singer_gui(singer, singerid, true);
    };
    if (nowWindow != "search") {
        changeWindow("search");
    }
    showWindow("musiclist", false);
    api_list_alarm(singerid, "singer", clean);
    // console.log(114514);
}

function play_music_id(songid, openGUI = false, whetherAddToList = false, preventRepeat = false) {
    playing_id = songid;
    let url = get_api_play_url(songid, "music");
    if (openGUI)
        document.getElementById("video-musicplayer-loading-pane").style.display = "inline-block";
    fetchi(url, "text", (data) => {
        let playurl = data;
        let url = get_api_info(songid, "music");
        fetchi(url, "json", data => {
            let info = data.data.info;
            let lrc = data.data.lrc;
            oLRC.ms = []
            if (lrc != undefined) {
                createLrcObj(lrc);
            }

            init_lrc_pane();
            if (Kuroshiro_state) {
                lrcRomaji(() => {
                    init_lrc_pane();
                });
            }

            let name = info['name'];
            let singer = info['artist'];
            let singerid = info['artistid'];
            let album = info['album'];
            let albumid = info['albumid'];
            let pic = info['pic'];
            let addition = info['addition'];
            // location.hash = `musicid=${songid}`;
            oLRC.info = { id: songid, name: name, singer: singer, singerid: singerid, album: album, albumid: albumid, pic: pic, addition: addition };
            change_music(name, singer, playurl, true, info, openGUI);
            if (whetherAddToList) {
                playing_idx = addToList({ name: name, singer: singer, singerid: singerid, album: album, albumid: albumid, pic: pic, id: songid }, -1, false, false, preventRepeat);
                highlight_playing_list_ele();
            }
            document.getElementById("video-musicplayer-loading-pane").style.display = "none";
            try {
                document.querySelector("#pane-download-music").onclick = function () {
                    localStorage.setItem("songlrc", JSON.stringify(oLRC));
                    window.open(`./apis/download.php?url=${btoa(playurl)}&filename=${btoa(encodeURI(`${singer} - ${name}`))}`);
                }
                document.querySelector("#pane-share").onclick = function () {
                    shareEventHandler(playing_id, name, singer, album);
                }
            } catch (e) {
                console.warn(e);
            }
            reloadPlayingList();

        }, e => {
            change_music("获取歌曲信息失败", "无法获取到信息", playurl, true, undefined, openGUI);
            console.error(e);
            document.getElementById("video-musicplayer-loading-pane").style.display = "none";
            show_msg("无法获取歌曲信息，但歌曲可以播放。", 3000);
        });
    }, e => {
        document.getElementById("video-musicplayer-loading-pane").style.display = "none";
        console.error(e);
        show_msg("无法获取歌曲信息，无法播放歌曲", 3000);
    });
}

function removeFromList(idx) {
    if (idx == -1) {
        // idx = playing_list.length;
        return;
    }
    try {
        playing_list.splice(idx, 1);
        if (playing_idx > idx) {
            playing_idx--;
            highlight_playing_list_ele();
        } else if (playing_idx == idx) {
            // playing_idx;
            play_idx_music(idx);
        }
    } catch (e) {

    }
    reloadPlayingList(false, false, !musicPlayerObj.paused);
    saveUserLoves();
}
function clear_playing_list() {
    if (confirm("确认要清除播放列表吗？")) {
        playing_list = [];
        reloadPlayingList();
        saveUserLoves();
    }
}
function addToList(info, idx = -1, forcePlayNow = false, openGUI = false, preventRepeat = false) {
    if (idx == -1) {
        idx = playing_list.length;
    }
    try {
        if (idx == playing_list.length) {
            if (playing_list[playing_list.length - 1]['id'] == info['id']) {
                show_msg("歌曲已在播放列表中", 1000);
                if (forcePlayNow) {
                    play_idx_music(playing_list.length - 1, openGUI);
                }
                return playing_list.length - 1;
            }
        }
    } catch (e) {

    }

    try {

        if (playing_list[playing_idx]['id'] == info['id']) {
            show_msg("歌曲已在播放中", 1000);
            return playing_idx;
        } else if (preventRepeat) {
            for (let i = 0; i < playing_list.length; i++) {
                if (playing_list[i]['id'] == info.id) {
                    play_idx_music(i, openGUI);
                    return i;
                }
            }
        }
    } catch (e) {

    }
    playing_list.splice(idx, 0, info);
    if (forcePlayNow) {
        // playing_idx = idx;
        play_idx_music(idx, openGUI);
    }
    reloadPlayingList(openGUI, forcePlayNow);
    saveUserLoves();
    return idx;
}
function reloadPlayingList(openGUI = false, forcePlay = false, autoplay = true) {

    let root = document.getElementById("playing-list-head");
    root.innerHTML = "";
    for (var i = 0; i < playing_list.length; i++) {
        let linef = document.createElement("li");
        linef.id = "playing-list-" + i;
        if (i == playing_idx) {
            linef.classList.add("playing");
        }
        let line = document.createElement("div");
        line.classList.add("playing-list-text-root");
        line.setAttribute("idx", i);
        line.onclick = function () {
            if (this.getAttribute("idx") == playing_idx) {
                showHideMusicPlayerPane(true);
                return;
            }
            play_idx_music(parseInt(this.getAttribute("idx")), true);
        }
        let indexname = document.createElement("span");
        indexname.innerText = (i + 1);
        indexname.classList.add("l-idx")
        let songname = document.createElement("b");
        songname.classList.add("songname");
        songname.innerText = playing_list[i].name;
        let singername = document.createElement("span");
        singername.classList.add("singername");
        singername.innerText = playing_list[i].singer;
        line.appendChild(indexname);
        line.appendChild(songname);
        line.appendChild(singername);
        let actionbar = document.createElement("div");
        actionbar.classList.add("action-bar");

        let actioncode = ``;
        actioncode += `<button title="立即播放" class="button btn-play fa fa-play-circle" onclick="play_idx_music(${i});">`;
        actioncode += `<button title="删除" class="button fa fa-remove" onclick="removeFromList(${i});"></button>`;
        actionbar.innerHTML = actioncode;
        linef.appendChild(line);
        linef.appendChild(actionbar);
        root.appendChild(linef);
    }

    if (autoplay && !forcePlay && playing_list.length > 0) {
        if (playing_idx == -1) {
            play_next_music(openGUI, true);
        } else if (musicPlayerObj.paused) {
            play_next_music(openGUI);
        }
    }

}
function saveOrderType() {
    localStorage.setItem("music-play-order", orderType);
}
function loadUserLoves() {

    try {
        userLoves = JSON.parse(localStorage.getItem("user-loves"));
        if(Array.isArray(userLoves)){
            userLoves = {};
        }
        if (enableListSaving) {
            playing_list = JSON.parse(localStorage.getItem("playing-list"));
        }
    } catch (e) {
        userLoves = {};
        playing_list = [];
    }
    if (userLoves == null) {
        userLoves = {};
    }
    if (playing_list == null) {
        playing_list = [];
    }

    reloadPlayingList(false, false, false);
}
function saveUserLoves() {
    localStorage.setItem("user-loves", JSON.stringify(userLoves));
    localStorage.setItem("playing-list", JSON.stringify(playing_list));
    ReloadLoveListUI();
}

function isFullScreen() {
    return (
        (document.fullscreenElement && document.fullscreenElement !== null) ||
        (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
        (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
        (document.msFullscreenElement && document.msFullscreenElement !== null)
    );
}

function addToUserLove(info, parent = 'default', noUpdate = false) {
    if (parent == "") parent = "default";
    if (userLoves[parent] == undefined) {
        userLoves[parent] = { lists: [], lastUpdatedTime: "Unknown" }
    }
    userLoves[parent].lastUpdatedTime = formatDateTime(new Date());
    if (userLoves[parent].lists == undefined) userLoves[parent].lists = [];
    if (Array.isArray(info)) {
        for (let i = 0; i < info.length; i++) {
            userLoves[parent].lists.splice(userLoves[parent].lists.length, 0, info[i]);
        }
    } else {
        userLoves[parent].lists.splice(userLoves[parent].lists.length, 0, info);
    }
    if (!noUpdate) saveUserLoves();
}

window.onhashchange = function (ev) {
    if (hashChanged) {
        hashChanged = false;
        return;
    }
    hashDetect();
}