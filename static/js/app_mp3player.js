const volumeobj = document.getElementById("volume-set");
const playerobj = document.getElementById("play-progress");
const currentTimeObj = document.getElementById("player-time-current");
const totalTimeObj = document.getElementById("player-time-total");

const videoPlayerObj = document.getElementById("mui-player");
const pauseMusicBTNObj = document.getElementById("pane-pause-music");

let volm = parseFloat(localSettings.getItem("mvolume"));
let vol = parseFloat(localSettings.getItem("avolume"));
if (isNaN(vol)) vol = 1;
if (isNaN(volm)) volm = 1;
musicPlayerObj.volume = vol;
videoPlayerObj.volume = volm;
volumeobj.value = vol * 100;
changePos(volumeobj);
document.getElementById("setting-volumeInput").value = volumeobj.value;

videoPlayerObj.onvolumechange = function () {
    localSettings.setItem("mvolume", this.volume);
}

function secondToTime_int(second) {
    if (isNaN(second)) {
        second = 0;
    }
    let min = parseInt(second / 60) + "";
    let sec = parseInt(second % 60) + "";
    if (min.length == 1) min = "0" + min;
    if (sec.length == 1) sec = "0" + sec;
    return min + ":" + sec;
}

var mplayer = {
    trackEvents: true
}
function play_last_music(openGUI = false, isauto = false) {
    if (document.querySelector("#pane-last-music").hasAttribute("disabled")) return;
    document.querySelector("#pane-last-music").setAttribute("disabled", true);
    document.querySelector("#pane-next-music").setAttribute("disabled", true);

    if (playing_list.length <= 0) {
        if (myAudioStation.length <= 1)
            enterAudioStation(false);
        else {
            play_music_id(myAudioStation[myAudioStation.length - 2], openGUI);
            myAudioStation.splice(myAudioStation.length - 1, 1);
        }
        return;
    }
    let target_idx = playing_idx - 1;
    if (target_idx < 0) {
        target_idx = playing_list.length - 1;
    }

    play_idx_music(target_idx, openGUI);
}
function play_next_music(openGUI = false, isauto = false) {
    if (document.querySelector("#pane-next-music").hasAttribute("disabled")) return;
    document.querySelector("#pane-next-music").setAttribute("disabled", true);
    document.querySelector("#pane-last-music").setAttribute("disabled", true);
    if (playing_idx == -1 && playing_list.length > 0) {
        play_idx_music(0, openGUI);
        return;
    }
    if (orderType == 1 && isauto) {
        musicPlayerObj.currentTime = 0;
        musicPlayerObj.play();
        document.querySelector("#pane-next-music").removeAttribute("disabled");
        document.querySelector("#pane-last-music").removeAttribute("disabled");
        return;
    }
    if (playing_list.length <= 0) {

        enterAudioStation(false);
        return;
    }
    let target_idx = playing_idx;

    if (orderType == 3 && isauto) {// 0: 顺序; 1:单曲; 2:随机; 3:逆序
        target_idx = playing_idx - 1;

        if (target_idx < 0) {
            target_idx = playing_list.length - 1;
        }
    } else if (orderType == 2 && isauto) {
        target_idx = get_random(0, playing_list.length - 1);
        if (target_idx >= playing_idx) target_idx++;
        play_idx_music(target_idx);
    } else {
        target_idx = playing_idx + 1;
        if (target_idx >= playing_list.length) {
            target_idx = 0;
        }
    }
    play_idx_music(target_idx, openGUI);

}
function backToVoidState() {
    musicPlayerObj.pause();
    playing_idx = -1;
    change_music("无内容播放", "无内容播放", "", false, {}, false);
    oLRC.ms = []
    document.getElementById("pane-download-music").onclick = function () { }
    init_lrc_pane();
    musicPlayerObj.removeAttribute("src");
    changePauseBtnStatus(true);

}
function play_idx_music(target_idx = 0, openGUI = false, fromPlayingList = false) {
    if (playing_list.length <= 0) {
        if (fromPlayingList) {
            backToVoidState();
        } else {
            enterAudioStation(true);
        }
        return;
    }
    if (location.hash === "#station") location.hash = "";
    if (playing_idx == -1) {

    } else {
        try {
            if (playing_id == playing_list[target_idx].id) {
                musicPlayerObj.currentTime = 0;
                musicPlayerObj.play();
                document.querySelector("#pane-next-music").removeAttribute("disabled", true);
                document.querySelector("#pane-last-music").removeAttribute("disabled", true);
                return;
            }
        } catch (e) {
            playing_idx = -1;
        }
        // console.log(target_idx);

    }

    if (target_idx >= playing_list.length) {
        target_idx = 0;
    } else if (target_idx < 0) {
        target_idx = playing_list.length - 1;
    }
    try {
        playing_idx = target_idx;
        highlight_playing_list_ele();
        play_music_id(playing_list[target_idx]['id'], openGUI);
    } catch (e) {
        console.error(e);
    }

}
function highlight_playing_list_ele() {
    let ele = document.querySelectorAll("#playing-list-head .playing");
    for (var i = 0; i < ele.length; i++) {
        ele[i].classList.remove("playing");
    }
    ele = document.querySelector("#playing-list-" + playing_idx);
    if (ele != undefined) {
        ele.classList.add("playing");
    }
}
function pause_music() {
    if (musicPlayerObj.paused) {
        if (playing_idx < 0 && playing_list.length > 0) {
            // playing_idx = 0;
            play_idx_music(0);
        } else if (playing_list.length <= 0 && musicPlayerObj.src === "") {
            enterAudioStation();
        } else {
            musicPlayerObj.play();
        }
    } else {
        musicPlayerObj.pause();
    }
}
function cancelTrack() {
    mplayer.trackEvents = false;
    // mplayer.trackEvents = false;
}

function startTrack() {
    mplayer.trackEvents = true;
}
// musicPlayerObj.onre
// musicPlayerObj.one
let storedWidth = 0;
function updateWebProgress(width) {
    if (Math.abs(width - storedWidth) >= updateRate) {
        document.documentElement.style.setProperty(`--playing-progress`, width + "%");
        storedWidth = width;
    }
}
musicPlayerObj.ontimeupdate = function () {
    updateTime();
    if (mplayer.trackEvents) {
        let value = parseFloat(this.currentTime / this.duration * 1000);
        if (!isNaN(value)) {
            let width = parseFloat(this.currentTime / this.duration * 100);
            updateWebProgress(width);
            playerobj.value = value;
            changePos(playerobj);
        }
    } else {
        if (!isNaN(this.currentTime)) {
            let width = parseFloat(this.currentTime / this.duration * 100);
            updateWebProgress(width);
        }
    }
    choose_lrc(musicPlayerObj.currentTime);
}
musicPlayerObj.oncanplay = function () {
    updateTime();
    let duration = musicPlayerObj.duration;
    if (!isNaN(duration) && !(duration == Infinity)) {
        totalTimeObj.innerText = secondToTime_int(duration);
    }
}
musicPlayerObj.onpause = function () {
    changePauseBtnStatus(true);
}
musicPlayerObj.onplay = function () {
    changePauseBtnStatus(false);
}
musicPlayerObj.onerror = function (e) {
    changePauseBtnStatus(true);
    console.warn(e);
}
musicPlayerObj.onended = function () {
    play_next_music(false, true);
}

function changePauseBtnStatus(paused) {
    if (paused) {
        pauseMusicBTNObj.classList.remove("fa-pause");
        pauseMusicBTNObj.classList.add("fa-play");
    } else {
        pauseMusicBTNObj.classList.add("fa-pause");
        pauseMusicBTNObj.classList.remove("fa-play");
    }
}
musicPlayerObj.ondurationchange = function () {
    let duration = musicPlayerObj.duration;
    if (!isNaN(duration) && !(duration == Infinity)) {
        totalTimeObj.innerText = secondToTime_int(duration);
    }
}

var lastTimeTextSec = -1;
function updateTime() {
    // 时钟只显示到整秒，没必要每刻（每秒 4 次）都重写文本节点
    let sec = Math.floor(musicPlayerObj.currentTime);
    if (sec === lastTimeTextSec) return;
    lastTimeTextSec = sec;
    currentTimeObj.innerText = secondToTime_int(musicPlayerObj.currentTime);
}

function changePos(ele) {
    let Nvalue = parseInt(ele.value);
    let Nmax = parseInt(ele.max);
    let width = parseFloat(Nvalue / Nmax * 100) + "%";
    ele.style.backgroundSize = width + " 100%";
}

playerobj.onchange = function () {
    let time = parseInt(playerobj.value) / 1000 * musicPlayerObj.duration;
    if (!isNaN(time))
        musicPlayerObj.currentTime = time;
};
volumeobj.onchange = function () {
    changePos(this);
    let volumes = parseInt(volumeobj.value) / 100;
    musicPlayerObj.volume = volumes;
    localSettings.setItem("avolume", volumes);
};

function muteVolume(ele) {
    if (musicPlayerObj.muted) {
        musicPlayerObj.muted = false;
        ele.classList.remove("fa-volume-off")
        ele.classList.add("fa-volume-up")
    } else {
        musicPlayerObj.muted = true;
        ele.classList.remove("fa-volume-up")
        ele.classList.add("fa-volume-off")
    }
}
function change_playing_music_time(time) {
    try {
        musicPlayerObj.currentTime = parseFloat(time);
    } catch (e) {
        console.error(e);
    }
}
/* ---------------- 歌词渲染 ----------------
   原来：当前行靠扫 DOM（getElementsByClassName("lrc-active")）找、行高每次 getComputedStyle 重读、
   滚动动画没有生命周期、高亮行用 transition:all 动画 font-size/line-height 导致切行时整列表重排十几帧，
   JS 再去读 offsetTop/offsetHeight 与它互抢（所以才有 shrinkComp 那个补偿 hack）。
   现在：当前行与几何尺寸都记在状态里，切行只动两个元素、不读布局、只过渡颜色。 */
var lrcState = { idx: -1, buildToken: 0, activeH: 0 };
var lrcGeom = { lineH: 28, selLineH: 40, norFont: 16, selFont: 24, clientH: 0, padTop: 0, ready: false };
var lrcScrollRAF = 0;

/** 行高/容器尺寸/内边距只在构建、resize、设置变更时读一次——读它们会强制同步排版。 */
function lrcGeometry(force) {
    if (lrcGeom.ready && force !== true) return lrcGeom;
    let root = document.getElementById("lrc-show-root");
    if (root == null) return lrcGeom;
    try {
        let cs = getComputedStyle(root);
        let nor = parseFloat(cs.getPropertyValue("--norlineheight"));
        let sel = parseFloat(cs.getPropertyValue("--sellineheight"));
        let pad = parseFloat(cs.getPropertyValue("padding-top"));
        let norf = parseFloat(cs.getPropertyValue("--norfontsize"));
        let self = parseFloat(cs.getPropertyValue("--selfontsize"));
        if (nor > 0) lrcGeom.lineH = nor;
        if (sel > 0) lrcGeom.selLineH = sel;
        if (pad >= 0) lrcGeom.padTop = pad;
        if (norf > 0) lrcGeom.norFont = norf;
        if (self > 0) lrcGeom.selFont = self;
    } catch (e) { }
    lrcGeom.clientH = root.clientHeight;
    lrcGeom.ready = true;
    return lrcGeom;
}
/** 设置改动或窗口尺寸变化后必须让缓存失效。 */
function lrcInvalidateGeometry() {
    lrcGeom.ready = false;
}

function lrcCancelScroll() {
    if (lrcScrollRAF != 0) {
        cancelAnimationFrame(lrcScrollRAF);
        lrcScrollRAF = 0;
    }
}

/** 点击跳转用事件委托：原来每行一个 onclick，重建时产生 N 个闭包。 */
function lrcBindRootOnce() {
    let root = document.getElementById("lrc-show-root");
    if (root == null || root.getAttribute("data-lrc-bound") == "1") return;
    root.setAttribute("data-lrc-bound", "1");
    root.addEventListener("click", function (e) {
        let t = (e.target && e.target.closest) ? e.target.closest(".lrc-text") : null;
        if (t == null) return;
        let time = t.getAttribute("time");
        if (time != null) change_playing_music_time(time);
    });
}

/** 按当前设置把某一行的内容刷成最新数据（初始构建与罗马字补丁共用同一套逻辑，
 *  三种显示模式 old / replace / nowline 的行为与原来一致）。 */
function applyLrcLineDisplay(li, i) {
    let line = oLRC.ms[i];
    if (line == null || li == null) return;
    let text = li.querySelector(".lrc-text");
    if (text == null) return;
    // 'old' 模式会在行里额外放一个 romaji 元素：先去掉上一次的
    let old = li.querySelector(".lrc-romaji");
    if (old != null && old.parentNode != null) old.parentNode.removeChild(old);
    text.innerText = line.c;
    if (line.tkuro && line.tc != null) {
        if (SETTING_VAR.kuroWebVersion == 'old') {
            let romajiele = document.createElement("span");
            romajiele.classList.add("lrc-romaji");
            if (SETTING_VAR.kuroMode == 'furigana')
                romajiele.innerHTML = line.tc;
            else
                romajiele.innerText = line.tc;
            li.appendChild(romajiele);
        } else if (SETTING_VAR.kuroWebVersion == 'replace') {
            if (SETTING_VAR.kuroMode == 'furigana')
                text.innerHTML = line.tc;
            else
                text.innerText = line.tc;
        } else {
            text.setAttribute("default", line.c);
            text.setAttribute("romajilrc", line.tc);
            text.setAttribute("hasromaji", "true");
        }
    } else {
        text.removeAttribute("hasromaji");
        text.removeAttribute("default");
        text.removeAttribute("romajilrc");
    }
    if (line.c == "") text.innerHTML = "&nbsp;";
    text.setAttribute("time", line.t);
}

function init_lrc_pane() {
    let rrot = document.getElementById("lrc-show-root");
    if (rrot == null) return;
    // 重建前必须停掉上一首歌的滚动动画，否则它会拿着旧目标继续写 scrollTop
    lrcCancelScroll();
    lrcState.buildToken++;
    lrcState.idx = -1;
    lrcState.activeH = 0;
    rrot.innerHTML = "";
    let frag = document.createDocumentFragment();
    for (var i = 0; i < oLRC.ms.length; i++) {
        let ele = document.createElement("li");
        let textele = document.createElement("span");
        textele.classList.add("lrc-text");
        ele.classList.add("lrc");
        ele.appendChild(textele);
        ele.id = "lrc-" + i;
        applyLrcLineDisplay(ele, i);
        frag.appendChild(ele);
    }
    rrot.appendChild(frag); // 一次插入，不再逐行 append 到已在文档中的节点
    lrcBindRootOnce();
    lrcGeometry(true);
}
/** 行时间：优先用解析时算好的数值，兼容没有 tn 的旧数据。 */
function lrcTimeAt(i) {
    let m = oLRC.ms[i];
    if (m == null) return 0;
    if (typeof m.tn == "number") return m.tn;
    return parseFloat(m.t);
}
function choose_lrc(time, push = false) {
    try {
        var times = time + oLRC.offset;
    } catch (e) {
        return;
    }
    let n = oLRC.ms.length;
    if (n == 0) return;
    try {
        // 正常播放时时间单调递增，从上次的行号向后推进即可；
        // 只有时间倒退（拖动进度条、上一首）才需要从 0 重扫。
        let i = lrcState.idx;
        if (i < 0 || i > n - 1) i = 0;
        if (i > 0 && lrcTimeAt(i) > times) i = 0;
        while (i + 1 < n && lrcTimeAt(i + 1) <= times) i++;
        if (lrcTimeAt(0) > times) i = 0;
        hilightlrc(i, push);
    } catch (e) {
        console.error(e);
    }
}
/**
 * 高亮行允许换行，所以它的高度不再等于行高：这里量出「最终字号下的高度」并钉死在盒子上。
 * 好处是字号放大的那 200ms 里盒高不变，后面的歌词不会一帧一帧地重排（每次换行只量这一次）。
 * 量完后把字号按普通字号起跳、再放开，让过渡照常从 16px 放大到 24px。
 */
function lrcPinActiveHeight(ele) {
    if (ele == null) return 0;
    let g = lrcGeometry();
    let prevTransition = ele.style.transition;
    // 1) 关掉过渡 → 字号立刻是最终值 → 量到的是"最终字号下的换行高度"
    ele.style.transition = "none";
    ele.style.height = "auto";
    let h = Math.round(ele.getBoundingClientRect().height);
    // 2) 把高度钉死（动画期间盒高不变），然后在"无过渡"状态下把字号退回普通字号
    ele.style.height = h > 0 ? (h + "px") : "";
    ele.style.fontSize = g.norFont + "px";
    if (ele.offsetHeight < 0) { /* 读一次，强制应用上面这个普通字号 */ }
    // 3) 恢复过渡，再放开内联字号：过渡就会从普通字号平滑放大到高亮字号
    ele.style.transition = prevTransition;
    ele.style.fontSize = "";
    return h > 0 ? h : g.selLineH;
}

function hilightlrc(idx, push = false) {
    let n = oLRC.ms.length;
    if (n == 0) return;
    if (idx < 0) idx = 0;
    if (idx > n - 1) idx = n - 1;
    // 同一行且不是强制刷新：原来每刻都要扫一遍 DOM 才判断得出来
    if (lrcState.idx === idx && !push) return;
    let ele = document.getElementById("lrc-" + idx);
    if (ele == null) return;
    // 只摘掉记录里的那一行。原来遍历 getElementsByClassName 的实时集合、边删边遍历会漏删；
    // 而 push 路径根本不删旧类，于是可能两行同时高亮。
    if (lrcState.idx !== idx) {
        let prev = document.getElementById("lrc-" + lrcState.idx);
        if (prev != null) {
            prev.classList.remove("lrc-active");
            prev.style.height = "";     // 让上一行回到普通行高
            prev.style.fontSize = "";
            let ptext = prev.querySelector(".lrc-text");
            if (ptext != null && ptext.getAttribute("hasromaji") == "true")
                ptext.innerText = ptext.getAttribute("default");
        }
    }
    if (!ele.classList.contains("lrc-active")) ele.classList.add("lrc-active");
    let text = ele.querySelector(".lrc-text");
    if (text != null && text.getAttribute("hasromaji") == "true") {
        if (SETTING_VAR.kuroMode == 'furigana')
            text.innerHTML = text.getAttribute("romajilrc");
        else
            text.innerText = text.getAttribute("romajilrc");
    }
    lrcState.idx = idx;
    lrcState.activeH = lrcPinActiveHeight(ele);
    let g = lrcGeometry();
    // 居中位置直接算出来（高亮行的高度是刚量到的 activeH，可能因为换行比普通行高）：
    // 「容器上内边距 + 前面所有普通行 + 高亮行的一半 - 容器高度的一半」
    lrcScrollTo(g.padTop + idx * g.lineH + lrcState.activeH / 2 - g.clientH / 2);
}
/** 平滑滚动到指定位置。保留 scrollTop 方案：手动滚动/惯性滚动不能被破坏。 */
function lrcScrollTo(target) {
    let root = document.getElementById("lrc-show-root");
    if (root == null) return;
    lrcCancelScroll();
    let g = lrcGeometry();
    let n = oLRC.ms.length;
    // 可滚动量用算的（内容高 + 上下内边距 - 容器高）；高亮行可能因为换行比普通行高
    let activeH = lrcState.activeH > 0 ? lrcState.activeH : g.selLineH;
    let maxScroll = 2 * g.padTop + (n - 1) * g.lineH + activeH - g.clientH;
    if (!(maxScroll > 0)) maxScroll = 0;
    target = Math.round(target);
    if (target < 0) target = 0;
    if (target > maxScroll) target = maxScroll;
    let start = root.scrollTop;
    let distance = target - start;
    if (distance == 0) return;
    let token = lrcState.buildToken;
    let duration = Math.min(600, Math.max(250, Math.abs(distance) * 0.4));
    let startTime = null;
    function step(now) {
        // 换歌/重建过就作废这次动画，避免旧目标写到新内容上
        if (token !== lrcState.buildToken) {
            lrcScrollRAF = 0;
            return;
        }
        if (startTime == null) startTime = now;
        // easeOutCubic：先快后慢
        var t = Math.min(1, (now - startTime) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        root.scrollTop = start + distance * eased;
        if (t < 1) {
            lrcScrollRAF = requestAnimationFrame(step);
        } else {
            root.scrollTop = target;
            lrcScrollRAF = 0;
        }
    }
    lrcScrollRAF = requestAnimationFrame(step);
}
function change_music(title, singer, url = "", play = true, info = {}, openGUI = false) {
    document.getElementById("page-info-name").innerText = title;
    document.getElementById("page-info-singer").innerText = singer;
    document.getElementById("pane-music-info-name").innerText = title;
    document.getElementById("pane-music-info-singer").innerText = singer;
    if (url != "") show_msg(`正在播放：${singer} - ${title}`, 1000);
    if (url == "") {
        change_web_title(BAMBOOMUSIC.name);
    } else {
        change_web_title(`${title} - ${singer} - 正在播放 - ${BAMBOOMUSIC.name}`);
    }

    musicPlayerObj.src = url;

    if (info != undefined) {
        let id = info.id;
        let singerid = info.artistid;
        let album = info.album;
        // console.log(info.albumid)
        let albumid = info.albumid;
        let hasmv = info.hasMv;

        document.getElementById("music-lrc-info-text-name").innerText = title;
        let pic = info.pic;

        if (pic == null || SETTING_VAR.NetworkSavingMode) {
            document.getElementById("music-lrc-info-pic").src = "./static/img/default_cd.png";
            setMediaSession(title, singer, album, "./static/img/default_cd.png");
            pic = FALLBACK_BACKGROUND;
        } else {
            setMediaSession(title, singer, album, pic);
            document.getElementById("music-lrc-info-pic").src = pic;
        }
        if (backgroundImage != null)
            if (backgroundImage == "on") {
                document.getElementById("win-playing").style.backgroundImage = "url(" + encodeURI(pic) + ")";
            }

        // console.log(info);
        if (hasmv) {
            document.getElementById("music-lrc-info-tv").style.display = "inline-block";
            document.getElementById("music-lrc-info-tv").onclick = function () {
                if (hasmv == "" || hasmv == null || hasmv == 1) hasmv = id;
                watchVideo(hasmv, title, singer, singerid, albumid, true);
                showHideMusicPlayerPane(false);
                changeWindow('search');
            };
        } else {
            document.getElementById("music-lrc-info-tv").style.display = "none";
        }
        if (album != "" && album != undefined) {
            document.getElementById("music-lrc-info-text-album-root").style.display = "inline-block";
            document.getElementById("music-lrc-info-text-album").innerText = album;
            document.getElementById("music-lrc-info-text-album").onclick = function () {
                showHideMusicPlayerPane(false);
                // console.log(albumid)
                // list_singer_gui(singer, singerid, true);
                list_alarm_gui(singer, singerid, album, albumid, true);
            };
        } else {
            document.getElementById("music-lrc-info-text-album-root").style.display = "none";
        }
        document.getElementById("music-lrc-info-text-singer").innerText = singer;
        if (singer != "" && singer != undefined) {
            document.getElementById("music-lrc-info-text-singer-root").style.display = "inline-block";
            document.getElementById("music-lrc-info-text-singer").onclick = function () {
                showHideMusicPlayerPane(false);
                // list_singer_gui(singer, singerid, true);
                list_singer_gui(singer, singerid, true);
            };
            let singerobj = document.createElement("a");
            singerobj.innerText = singer;
            singerobj.classList.add("page-info-singer-href");
            // singerobj.onclick = function () {
            //     showHideMusicPlayerPane(false);
            //     list_singer_gui(singer, singerid, true);
            // }
            document.getElementById("page-info-singer").innerHTML = "";
            document.getElementById("page-info-singer").appendChild(singerobj);
        }

    } else {
        document.getElementById("music-lrc-info-text-singer").innerText = singer;
        document.getElementById("music-lrc-info-text-album-root").style.display = "none";
    }
    if (openGUI) {
        showHideMusicPlayerPane(true);
    }
    if (play) {
        musicPlayerObj.play().catch(reason => {
            console.error(reason);
            if (reason.name == 'NotAllowedError') {
                show_msg("根据浏览器播放规则，自动播放失败。请手动点击播放。", 5000);
            }
        });
    }
    document.querySelector("#pane-next-music").removeAttribute("disabled");
    document.querySelector("#pane-last-music").removeAttribute("disabled");

}

function setMediaSession(title, artist, album, pic) {
    if ('mediaSession' in navigator) {
        // 设置元数据（标题、艺术家等）
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            album: album,
            artwork: [{ src: pic, sizes: '300x300', type: 'image/jpg' }]
        });

    }
}

// 添加控制按钮事件
navigator.mediaSession.setActionHandler('play', () => { pause_music();/* 播放逻辑 */ });
navigator.mediaSession.setActionHandler('pause', () => { pause_music();/* 暂停逻辑 */ });
navigator.mediaSession.setActionHandler('previoustrack', () => { play_last_music()/* 上一首 */ });
navigator.mediaSession.setActionHandler('nexttrack', () => { play_next_music()/* 下一首 */ });