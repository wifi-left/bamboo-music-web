// 标题
change_web_title(BAMBOOMUSIC.name);

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

var playing_id = -1;
var playing_idx = -1;
var playing_list = [];

// 手动排序进行中：拖动期间任何重渲染都会把 DOM 清掉（比如切歌回调里的 reloadPlayingList），
// 所以各处渲染入口都要看这个标记。
var reorderInProgress = false;
// 收藏面板是否需要重建（只有"个人中心"可见时才真的重建，见 saveUserLoves）
var loveUIDirty = false;

var lrc_normal_line_height = 42;
var lrc_normal_font_size = 16;
var lrc_selected_line_height = 42;
var lrc_selected_font_size = 24;
var lrc_normal_line_color = "rgb(209, 209, 209)";
var lrc_selected_line_color = "rgb(23, 236, 148)";
var orderType = 0; // 0: 顺序; 1:单曲; 2:随机; 3:逆序

var updateRate = 0.2;

var userLoves = {};

// 读取播放顺序设置
orderType = parseInt(localSettings.getItem("music-play-order", 0));
if (orderType == null || isNaN(orderType)) orderType = 0;
onChangeOrderType(false);
function onChangeOrderType(showMessage = true) {
    if (orderType == 0) {
        orderTypeObj.className = "fa fa-sort-numeric-asc button playing-list-order";
        if (showMessage)
            show_msg("播放顺序：顺序播放", 1000, false, true)
    } else if (orderType == 1) {
        orderTypeObj.className = "fa fa-repeat button playing-list-order";
        if (showMessage)
            show_msg("播放顺序：单曲循环", 1000, false, true)
    } else if (orderType == 2) {
        orderTypeObj.className = "fa fa-random button playing-list-order";
        if (showMessage)
            show_msg("播放顺序：随机播放", 1000, false, true)
    } else {
        orderTypeObj.className = "fa fa-sort-numeric-desc button playing-list-order";
        if (showMessage)
            show_msg("播放顺序：逆序播放", 1000, false, true)
    }
};

// 判断是否已经读过用户已读
var hasReadme = localSettings.getItem("hasReadme");
if (location.search.includes("hasreadme") == true) {
    hasReadme = "true";
}
var backgroundImage = localSettings.getItem("backgroundImage");
if (backgroundImage == null) backgroundImage = "";
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
    document.getElementById("win-playing").style.background = "var(--main-bg-color)";
    document.getElementById("win-playing-host").classList.add("color");
}
// kuroshiro（日语罗马字/注音）按需初始化：
var Kuroshiro_state = SETTING_VAR.kuroshiro;
// 原来只要设置开着，每次打开页面就并行拉 12 个词典文件（约 17.8MB）并在主线程 gunzip 建索引，
// 哪怕这一整套歌单里没有一首日文歌。现在只有真的遇到日文歌词那一行才会启动，且只初始化一次。
var KURO = new Kuroshiro.default();
var kuroReadyPromise = null;
function ensureKuroshiro() {
    if (!allow_Kuroshiro || !Kuroshiro_state) return Promise.resolve(false);
    if (kuroReadyPromise == null) {
        console.log("正在按需加载 kuroshiro 词典…");
        kuroReadyPromise = KURO.init(new KuromojiAnalyzer({
            dictPath: Kuroshiro_lib_url
        })).then(function () {
            console.log("Kuromoji Loaded!");
            return true;
        }).catch(function (e) {
            console.error(e);
            kuroReadyPromise = null;   // 允许下次再试
            return false;
        });
    }
    return kuroReadyPromise;
}
//检测语言（定义于 utils.js）
// 罗马音翻译（结果按原文缓存：重播同一首、同专辑重复行都不再重算）
var romajiCache = new Map();
function romajiTranslate(texts, resultFunc) {
    let key = SETTING_VAR.kuroTo + "|" + SETTING_VAR.kuroMode + "|" + SETTING_VAR.kuroRomajiSystem + "|" + texts;
    if (romajiCache.has(key)) {
        resultFunc(romajiCache.get(key));
        return;
    }
    KURO.convert(texts, { to: SETTING_VAR.kuroTo, "mode": SETTING_VAR.kuroMode, "romajiSystem": SETTING_VAR.kuroRomajiSystem }).then(data => {
        romajiCache.set(key, data);
        resultFunc(data);
    }).catch(e => {
        console.warn(e);
        resultFunc();
    });
}

// 歌词罗马音转换。分批做（每批 doBatchSize 行，用空闲时间继续），避免一次性开几百个
// convert 把主线程占满；每批完成只给受影响的行打补丁，不再重建整个歌词 DOM。
var toRomajiCount = 0, nowRomajiCount = 0;
var lrcRomajiBatchSize = 40;
function lrcRomaji(refunc) {
    let total = oLRC['ms'].length;
    if (total === 0) return;
    // 先扫一遍：整首里没有日文行就完全不碰 kuroshiro（这是省掉 17.8MB 词典的关键）
    let jpLines = [];
    for (let i = 0; i < total; i++) {
        if (checkLanguage(oLRC.ms[i].c) === 2) jpLines.push(i);
    }
    if (jpLines.length === 0) return;
    for (let k = 0; k < jpLines.length; k++) oLRC.ms[jpLines[k]].tkuro = true;
    toRomajiCount = jpLines.length;
    nowRomajiCount = 0;
    let userLrcOffset = oLRC.offset || 0;
    // 从当前播放位置附近开始转，先让看得见的那几行有罗马字
    let cur = lrcState.idx > 0 ? lrcState.idx : 0;
    jpLines.sort(function (a, b) { return Math.abs(a - cur) - Math.abs(b - cur); });
    let cursor = 0;
    ensureKuroshiro().then(function (ok) {
        if (!ok) {
            for (let k = 0; k < jpLines.length; k++) oLRC.ms[jpLines[k]].tkuro = false;
            if (typeof refunc == "function") refunc();
            return;
        }
        let runBatch = function () {
            let batch = jpLines.slice(cursor, cursor + lrcRomajiBatchSize);
            cursor += lrcRomajiBatchSize;
            if (batch.length === 0) {
                if (typeof refunc == "function") refunc();
                return;
            }
            for (let k = 0; k < batch.length; k++) {
                let idx = batch[k];
                romajiTranslate(oLRC['ms'][idx].c, function (data) {
                    if (data == null) {
                        oLRC['ms'][idx].tkuro = false;
                    }
                    oLRC['ms'][idx].tc = data;
                    nowRomajiCount++;
                    if (nowRomajiCount >= toRomajiCount) {
                        // 全部转完：自己把结果补丁到歌词行上（不依赖调用方是否记得刷新）
                        patchLrcRomaji();
                        if (typeof refunc == "function") refunc();
                    }
                });
            }
            // 这一批要等它自己的结果回来再打补丁（下面的回调里统一做）
            patchLrcRomajiSoon();
            if (cursor < jpLines.length) onIdle(runBatch);
        };
        runBatch();
    });
}
/** 把已完成的罗马字补丁到现有歌词行上（不重建 DOM）。 */
var lrcPatchTimer = 0;
function patchLrcRomajiSoon() {
    if (lrcPatchTimer != 0) return;
    lrcPatchTimer = setTimeout(function () {
        lrcPatchTimer = 0;
        patchLrcRomaji();
    }, 120);
}
function patchLrcRomaji() {
    let root = document.getElementById("lrc-show-root");
    if (root == null) return;
    let rows = root.querySelectorAll(":scope > li");
    for (let i = 0; i < rows.length && i < oLRC.ms.length; i++) {
        let line = oLRC.ms[i];
        if (line == null || line.tc == null) continue;   // 还没转好的不动
        applyLrcLineDisplay(rows[i], i);
    }
    // 高亮行的内容要按新数据再刷一次（补丁会把文本重置成原文）
    if (lrcState.idx >= 0) {
        let li = document.getElementById("lrc-" + lrcState.idx);
        if (li != null && li.classList.contains("lrc-active")) {
            let text = li.querySelector(".lrc-text");
            if (text != null && text.getAttribute("hasromaji") == "true") {
                if (SETTING_VAR.kuroMode == 'furigana') text.innerHTML = text.getAttribute("romajilrc");
                else text.innerText = text.getAttribute("romajilrc");
            }
        }
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
    change_web_title(`${songname} - 在线观看 - ${BAMBOOMUSIC.name}`);

    musicPlayerObj.pause();
    document.getElementById("win-video-player").scrollTop = 0;
    document.getElementById("video-player-title").innerText = songname;
    document.getElementById("video-player-title").title = songname;
    document.getElementById("video-player-uploader-text").innerText = singer;
    document.getElementById("video-player-uploader-text").title = singer;
    showWindow("video-player", false);
    document.getElementById("video-player-loading-pane").style.display = "none";
    let url = get_api_play_url(songid, "video");
    if (reloadSuggest)
        loadSuggestVideos(songid, albumid);
    else {
        // 不重新加载，仅高亮当前播放的视频
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
    document.getElementById("list-album-name").title = "专辑：" + album;
    document.getElementById("list-album-singer").innerText = singer;
    document.getElementById("list-album-singer").onclick = function () {
        list_singer_gui(singer, singerid, true);
    };
    if (nowWindow != "search") {
        changeWindow("search");
    }
    showWindow("musiclist", false);
    api_list_alarm(albumid, "album", clean);
}
function list_playlist_gui(singer, singerid, playlist, playlistid, clean = true) {
    document.getElementById("list-album-name").innerText = "播放列表：" + playlist;
    document.getElementById("list-album-name").title = "播放列表：" + playlist;
    document.getElementById("list-album-singer").innerText = singer;
    document.getElementById("list-album-singer").onclick = function () {
        list_singer_gui(singer, singerid, true);
    };
    if (nowWindow != "search") {
        changeWindow("search");
    }
    showWindow("musiclist", false);
    api_list_alarm(playlistid, "singer", clean);
}
function list_singer_gui(singer, singerid, clean = true) {
    document.getElementById("list-album-name").innerText = "关键词：" + singer;
    document.getElementById("list-album-name").title = "关键词：" + singer;
    document.getElementById("list-album-singer").innerText = singer;
    document.getElementById("list-album-singer").title = singer;
    document.getElementById("list-album-singer").onclick = function () {
        list_singer_gui(singer, singerid, true);
    };
    if (nowWindow != "search") {
        changeWindow("search");
    }
    showWindow("musiclist", false);
    api_list_alarm(singerid, "singer", clean);
}

function play_music_id(songid, openGUI = false, whetherAddToList = false, preventRepeat = false) {
    playing_id = songid;
    let url = get_api_play_url(songid, "music", SETTING_VAR.MusicSourceQuality);
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
                    // 转写完成后只给受影响的歌词行打补丁，不再重建整棵歌词 DOM
                    // （原来这里会 init_lrc_pane() 再建一遍，等于每个日文歌白建一次）
                    patchLrcRomaji();
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
                    oLRC.kuroDownload = SETTING_VAR['kuroDownloadLrc'];
                    localSettings.setItem("songlrc", JSON.stringify(oLRC));
                    window.open(`./download.html?url=${btoa(playurl)}&filename=${btoa(encodeURI(`${singer} - ${name}`))}`);
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
            show_msg("无法获取歌曲信息，但歌曲可以播放。" + e, 3000);

            document.querySelector("#pane-next-music").removeAttribute("disabled");
            document.querySelector("#pane-last-music").removeAttribute("disabled");
        });
    }, e => {
        document.getElementById("video-musicplayer-loading-pane").style.display = "none";
        console.error(e);
        show_msg("无法获取歌曲信息，无法播放歌曲", 3000);

        document.querySelector("#pane-next-music").removeAttribute("disabled");
        document.querySelector("#pane-last-music").removeAttribute("disabled");
    });
}

function removeFromList(idx) {
    if (idx == -1) {
        // idx = playing_list.length;
        return;
    }
    try {
        // playing_idx 是裸下标，删完必须按"同一个对象"重算，否则高亮与"下一首"会错位。
        // 播放列表允许重复 id（addToList 只跟末尾和当前项比较），所以不能用 id 找。
        let wasPlaying = (playing_idx >= 0 && playing_idx < playing_list.length) ? playing_list[playing_idx] : null;
        playing_list.splice(idx, 1);
        if (wasPlaying !== null && playing_list.indexOf(wasPlaying) === -1) {
            // 删掉的正是当前播放项：接着播现在落到这个位置上的那首，没有就置空
            if (playing_idx > playing_list.length - 1) playing_idx = playing_list.length - 1;
            if (playing_idx >= 0) {
                play_idx_music(playing_idx, false, true);
            } else {
                playing_idx = -1;
                playing_id = -1;
                highlight_playing_list_ele();
            }
        } else {
            if (wasPlaying !== null) playing_idx = playing_list.indexOf(wasPlaying);
            highlight_playing_list_ele();
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
        // 新加的歌放头部还是尾部（默认尾部；设成头部时插在最前）
        let atHead = (SETTING_VAR.newItemAtTail === false || SETTING_VAR.newItemAtTail === "false");
        idx = atHead ? 0 : playing_list.length;
    }
    try {
        if (idx == playing_list.length) {
            if (playing_list[playing_list.length - 1]['id'] == info['id']) {
                show_msg("歌曲已在播放列表中", 1000);
                if (forcePlayNow) {
                    play_idx_music(playing_list.length - 1, openGUI);
                }
                if (openGUI) {
                    showHideMusicPlayerPane(true);
                }
                return playing_list.length - 1;
            }
        }
    } catch (e) {

    }

    try {

        if (playing_list[playing_idx]['id'] == info['id']) {
            show_msg("歌曲已在播放中", 1000);
            if (openGUI) {
                showHideMusicPlayerPane(true);
            }
            return playing_idx;
        } else if (preventRepeat && forcePlayNow) {
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
    reloadPlayingList(openGUI, forcePlayNow, !(playing_list.length <= 0));
    saveUserLoves();
    return idx;
}
function reloadPlayingList(openGUI = false, forcePlay = false, autoplay = true) {
    saveUserLoves();
    let root = document.getElementById("playing-list-head");
    root.innerHTML = "";
    for (var i = 0; i < playing_list.length; i++) {
        let linef = document.createElement("li");
        linef.id = "playing-list-" + i;
        if (i == playing_idx) {
            linef.classList.add("playing");
        }
        if (playlistSortMode) {
            // 排序模式：手柄要排在文本前面（宽度按 28 + (100%-93) + 65 = 100% 算，见 base.css）
            let handle = document.createElement("span");
            handle.className = "drag-handle fa fa-bars";
            handle.setAttribute("title", "拖动排序");
            linef.appendChild(handle);
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
        if (playlistSortMode) {
            // 排序模式下只放上下移按钮（多两个按钮会挤出行宽）；退出后恢复播放/删除
            actioncode += `<button title="上移" class="button fa fa-arrow-up" onclick="movePlayingItemBy(${i}, -1);"></button>`;
            actioncode += `<button title="下移" class="button fa fa-arrow-down" onclick="movePlayingItemBy(${i}, 1);"></button>`;
        } else {
            actioncode += `<button title="立即播放" class="button btn-play fa fa-play-circle" onclick="play_idx_music(${i});">`;
            actioncode += `<button title="删除" class="button fa fa-remove" onclick="removeFromList(${i});"></button>`;
        }
        actionbar.innerHTML = actioncode;
        linef.appendChild(line);
        linef.appendChild(actionbar);
        root.appendChild(linef);
    }

    if (autoplay && !forcePlay && playing_list.length > 0) {
        if (playing_idx == -1) {
            play_next_music(openGUI, true);
        }
    }

}
function saveOrderType() {
    localSettings.setItem("music-play-order", orderType);
}

/* ---------- 播放列表手动排序 ---------- */
var playlistSortMode = false;
var playlistSortable = null;

function getPlaylistSortable() {
    if (playlistSortable == null) {
        playlistSortable = createSortList({
            container: document.getElementById("playing-list-head"),
            itemSelector: "li",
            handleClass: "drag-handle",
            onCommit: function (from, to) { movePlayingItem(from, to); }
        });
    }
    return playlistSortable;
}
/** 进入/退出排序模式。做成显式开关（与"批量操作"同款）而不是长按直接拖：
 *  手机上长按容易和滚动/点击打架，手柄+开关最稳。 */
function togglePlaylistSort(force) {
    let next = (force === undefined) ? !playlistSortMode : !!force;
    if (next === playlistSortMode) return;
    playlistSortMode = next;
    let btn = document.getElementById("obj-sort-mode");
    if (btn != null) btn.classList.toggle("sort-on", next);
    if (next) getPlaylistSortable().arm(); else getPlaylistSortable().disarm();
    // 重画一次：让手柄与上下移按钮出现/消失，同时刷新行内写死的下标
    reloadPlayingList(false, true, false);
    show_msg(next ? "排序模式：拖动手柄或点 ↑↓ 调整顺序" : "已退出排序模式", 1800);
}
/** 把第 from 项移到 to 位置。落定后必须重排数组 + 重渲染：
 *  行内"播放/删除"按钮把数组下标写死在 onclick 里，只挪 DOM 会让它们指错歌（会删错歌）。 */
function movePlayingItem(from, to) {
    if (from === to) return;
    if (from < 0 || from >= playing_list.length || to < 0 || to >= playing_list.length) return;
    // 播放列表允许重复 id，所以"正在播放的那首"要按对象身份找回来，不能按 id
    let cur = (playing_idx >= 0 && playing_idx < playing_list.length) ? playing_list[playing_idx] : null;
    let item = playing_list.splice(from, 1)[0];
    playing_list.splice(to, 0, item);
    if (cur !== null) playing_idx = playing_list.indexOf(cur);
    reloadPlayingList(false, true, false); // forcePlay=true：抑制"列表一有内容就自动开始播放"
    saveUserLoves();
}
function movePlayingItemBy(idx, delta) {
    movePlayingItem(idx, idx + delta);
}

/* ---------- 收藏/播放列表的存储（数据安全相关，改动前请先读注释） ---------- */

/** 一条收藏记录至少要有 id 才能被去重和删除识别。*/
function isValidLoveEntry(item) {
    return (item != null && typeof item == "object" && item.id != null && item.id !== "");
}

/** 载入时把收藏数据修成可信形状，避免后面每处都做防御：
 *  - 缺 lists 字段（会让渲染直接抛错把整个列表变成"出现错误"）
 *  - null / 非对象条目（同样会让渲染中断）
 *  - 历史遗留的重复 id（删除只会删掉第一条，剩下的变幽灵）
 *  - 收藏夹名是 __proto__ 之类的键（赋值会打到原型上）
 * 旧格式（整个值就是一个数组）迁移成默认收藏夹，而不是像以前那样直接丢掉。 */
function normalizeUserLoves(data) {
    let out = {};
    if (data == null || typeof data != "object") data = {};
    if (Array.isArray(data)) {
        let lists = data.filter(isValidLoveEntry);
        if (lists.length > 0) console.warn("收藏数据是旧格式（数组），已迁移到默认收藏夹：" + lists.length + " 条");
        out["default"] = { lists: lists, lastUpdatedTime: "Unknown" };
    } else {
        let deduped = 0, dropped = 0;
        for (let name in data) {
            if (name === "" || name === "__proto__" || name === "constructor" || name === "prototype") continue;
            let folder = data[name];
            if (folder == null || typeof folder != "object") { dropped++; continue; }
            let lists = Array.isArray(folder.lists) ? folder.lists : [];
            let seen = {};
            let clean = [];
            for (let i = 0; i < lists.length; i++) {
                let item = lists[i];
                if (!isValidLoveEntry(item)) { dropped++; continue; }
                let key = String(item.id);
                if (seen[key] === true) { deduped++; continue; }
                seen[key] = true;
                clean.push(item);
            }
            out[name] = { lists: clean, lastUpdatedTime: folder.lastUpdatedTime || "Unknown" };
        }
        if (deduped > 0 || dropped > 0) {
            console.warn("收藏数据已清理：重复 " + deduped + " 条，无效 " + dropped + " 条");
        }
    }
    if (out["default"] == undefined) out["default"] = { lists: [], lastUpdatedTime: "Unknown" };
    if (out["later"] == undefined) out["later"] = { lists: [], lastUpdatedTime: "Unknown" };
    return out;
}

function loadUserLoves() {

    let enableListSaving = SETTING_VAR.enableListSaving;
    // 两个 key 各自解析：原来共用一个 try，playing-list 一旦坏掉会连收藏一起清空，
    // 紧接着的渲染还会把空值写回去（等于静默删掉全部收藏）。
    let lovesBroken = false;
    try {
        userLoves = JSON.parse(localSettings.getItem("user-loves"));
    } catch (e) {
        console.error(e);
        lovesBroken = true;
        userLoves = null;
    }
    if (lovesBroken || userLoves == null) {
        // 主键读不出来时先看备份，再退化成空
        let backup = null;
        try {
            backup = JSON.parse(localSettings.getItem("user-loves-backup"));
        } catch (e) {
            backup = null;
        }
        if (backup != null) {
            userLoves = backup;
            show_msg("收藏数据读取异常，已从备份恢复。", 3000);
        } else {
            userLoves = {};
        }
    }
    userLoves = normalizeUserLoves(userLoves);

    if (enableListSaving) {
        try {
            playing_list = JSON.parse(localSettings.getItem("playing-list"));
        } catch (e) {
            console.error(e);
            playing_list = [];
        }
    }
    if (!Array.isArray(playing_list)) {
        playing_list = [];
    }

    reloadPlayingList(false, false, false);
}
function saveUserLoves() {
    // 写入失败（配额满 / 隐私模式）不能把界面留在半更新状态：两个 key 各自保护，
    // 并且先写成功再重建界面。
    let oldRaw = localSettings.getItem("user-loves");
    let failed = false;
    try {
        localSettings.setItem("user-loves", JSON.stringify(userLoves));
    } catch (e) {
        failed = true;
        console.error(e);
    }
    // 备份只在"旧值本身是合法 JSON 且非空"时才更新，所以坏值永远进不了备份
    if (oldRaw != null && oldRaw != "" && oldRaw != "{}") {
        try {
            let parsed = JSON.parse(oldRaw);
            if (parsed != null && typeof parsed == "object" && Object.keys(parsed).length > 0) {
                localSettings.setItem("user-loves-backup", oldRaw);
            }
        } catch (e) {
            // 旧值已损坏：保留更早的备份，不覆盖
        }
    }
    try {
        localSettings.setItem("playing-list", JSON.stringify(playing_list));
    } catch (e) {
        failed = true;
        console.error(e);
    }
    if (failed) {
        show_msg("保存失败：本地存储不可写（隐私模式或空间已满）", 3000);
    }
    // 收藏面板只有在"个人中心"可见时才需要重建：原来每次切歌都要重建一遍整个收藏夹列表 DOM
    if (nowWindow == "account" && !reorderInProgress) {
        loveUIDirty = false;
        ReloadLoveListUI();
    } else {
        loveUIDirty = true;
    }

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
    if (!Array.isArray(userLoves[parent].lists)) userLoves[parent].lists = [];
    // 新加的歌放头部还是尾部：默认尾部（这样手动排序过的顺序不会被新收藏打乱）
    let atTail = (typeof SETTING_VAR.newItemAtTail === "undefined")
        ? true
        : (SETTING_VAR.newItemAtTail === true || SETTING_VAR.newItemAtTail === "true");
    let items = Array.isArray(info) ? info : [info];
    // 去重：一次 Set 查找（原来每加一首都要把整个收藏夹扫一遍，批量添加是 O(n·m)）
    let adding = new Set(items.map(function (x) { return String(x.id); }));
    let kept = userLoves[parent].lists.filter(function (x) { return !adding.has(String(x.id)); });
    userLoves[parent].lists = atTail ? kept.concat(items) : items.concat(kept);
    if (!noUpdate) {
        saveUserLoves();
    }
}

window.onhashchange = function (ev) {
    if (hashChanged) {
        hashChanged = false;
        return;
    }
    hashDetect();
}