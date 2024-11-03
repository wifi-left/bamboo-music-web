// const musicPlayerObj = document.getElementById("music-player-audio");
// var mplayerobj = document.getElementById("musicurl");
const volumeobj = document.getElementById("volume-set");
const playerobj = document.getElementById("play-progress");
const currentTimeObj = document.getElementById("player-time-current");
const totalTimeObj = document.getElementById("player-time-total");

const videoPlayerObj = document.getElementById("mui-player");
const pauseMusicBTNObj = document.getElementById("pane-pause-music");

var isIphone = false;
isIphone = function () {
    //获取浏览器navigator对象的userAgent属性（浏览器用于HTTP请求的用户代理头的值）
    var info = navigator.userAgent;
    //通过正则表达式的test方法判断是否包含“Mobile”字符串
    var isPhone = /mobile/i.test(info);
    //如果包含“Mobile”（是手机设备）则返回true
    return isPhone;
}();

// let muted = false;
let volm = parseFloat(localStorage.getItem("mvolume"));
let vol = parseFloat(localStorage.getItem("avolume"));
if (isNaN(vol)) vol = 1;
if (isNaN(volm)) volm = 1;
musicPlayerObj.volume = vol;
videoPlayerObj.volume = volm;
volumeobj.value = vol * 100;
// console.log(vol);
changePos(volumeobj);
document.getElementById("setting-volumeInput").value = volumeobj.value;

videoPlayerObj.onvolumechange = function () {
    localStorage.setItem("mvolume", this.volume);
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
    let target_idx = playing_idx;

    target_idx = playing_idx - 1;

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
    document.getElementById("pane-download-music").onclick = function(){}
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
    //TODO: LRC
    // console.log(114)
    updateTime();
    if (mplayer.trackEvents) {
        let value = parseFloat(this.currentTime / this.duration * 1000);
        if (!isNaN(value)) {
            let width = parseFloat(this.currentTime / this.duration * 100);
            updateWebProgress(width);
            // document.getElementById("player-progress-displayer").style.backgroundSize = width + " 100%";
            playerobj.value = value;
            // playerobj.style.backgroundSize = width + " 100%";
            changePos(playerobj);
            // currentTimeObj.innerText = secondToTime_int(this.currentTime);
        }
    } else {
        if (!isNaN(this.currentTime)) {
            let width = parseFloat(this.currentTime / this.duration * 100);
            updateWebProgress(width);

            // document.getElementById("player-progress-displayer").style.backgroundSize = width + " 100%";
            // playerobj.style.backgroundSize = width + " 100%";
            // document.getElementById("player-progress-displayer").width = width;

        }
    }
    choose_lrc(musicPlayerObj.currentTime);
}
musicPlayerObj.oncanplay = function () {
    updateTime();
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
    // changePauseBtnStatus(true);
    play_next_music(false, true);
    // console.warn(e);
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
musicPlayerObj.oncanplay = function () {
    let duration = musicPlayerObj.duration;
    if (!isNaN(duration) && !(duration == Infinity)) {
        totalTimeObj.innerText = secondToTime_int(duration);
    }
}
musicPlayerObj.ondurationchange = function () {
    let duration = musicPlayerObj.duration;
    if (!isNaN(duration) && !(duration == Infinity)) {
        totalTimeObj.innerText = secondToTime_int(duration);
    }
}

function updateTime() {
    // let duration = musicPlayerObj.duration;
    // if (!isNaN(duration)) {
    //     totalTimeObj.innerText = secondToTime_int(duration);
    // }
    currentTimeObj.innerText = secondToTime_int(musicPlayerObj.currentTime);
}

function changePos(ele) {
    let Nvalue = parseInt(ele.value);
    let Nmax = parseInt(ele.max);
    let width = parseFloat(Nvalue / Nmax * 100) + "%";
    // document.documentElement.style.setProperty(`--playing-progress`, width);

    ele.style.backgroundSize = width + " 100%";
}

playerobj.onchange = function () {
    // changePos(this);

    let time = parseInt(playerobj.value) / 1000 * musicPlayerObj.duration;
    if (!isNaN(time))
        musicPlayerObj.currentTime = time;
    // mplayer.changeTime();
};
volumeobj.onchange = function () {
    changePos(this);
    let volumes = parseInt(volumeobj.value) / 100;
    musicPlayerObj.volume = volumes;
    // mui-player
    localStorage.setItem("avolume", volumes);
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
function init_lrc_pane() {
    let rrot = document.getElementById("lrc-show-root");
    rrot.innerHTML = "";
    for (var i = 0; i < oLRC.ms.length; i++) {
        let ele = document.createElement("li");
        let textele = document.createElement("span");
        textele.classList.add("lrc-text");
        textele.innerText = oLRC.ms[i].c;
        let hasRomaji = oLRC.ms[i].tkuro;
        let romajiLRC = null;
        if (hasRomaji) {
            romajiLRC = oLRC.ms[i].tc;
            let romajiele = document.createElement("span");
            romajiele.classList.add("lrc-romaji");
            romajiele.innerText = romajiLRC;
            ele.appendChild(romajiele);
        }
        if (oLRC.ms[i].c == "") textele.innerHTML = "&nbsp;";
        textele.setAttribute("time", oLRC.ms[i].t);
        textele.onclick = function () {
            change_playing_music_time(this.getAttribute("time"));
        }
        ele.classList.add("lrc");
        ele.appendChild(textele);
        ele.id = "lrc-" + i;
        rrot.appendChild(ele);
    }
}
function choose_lrc(time, push = false) {
    try {
        var times = time + oLRC.offset;
        // logdata(time)
    } catch (e) {
        return;
    }
    var i = 0;
    if (oLRC.ms.length == 0) return;
    try {
        var tmp = parseFloat(oLRC.ms[0].t);
        while (i < oLRC.ms.length && tmp <= times) {
            i++;
            if (i < oLRC.ms.length) tmp = parseFloat(oLRC.ms[i].t);
        }
        // logdata(i);
        i -= 1;
        if (i == -1) i = 0;

        hilightlrc(i, push);
    } catch (e) {
        // logdata(e);
        console.error(e);
    }
}
function hilightlrc(idx, push = false) {
    var ele = document.getElementsByClassName("lrc-active");
    if (!push) for (var i = 0; i < ele.length; i++) {
        if (ele[i].id == 'lrc-' + idx) return;
        if (ele[i].id == 's-lrc-' + idx) return;
        ele[i].classList.remove("lrc-active");
    }
    var ch = LRC_root_obj.clientHeight;
    // 显示到： bh/2;
    var schheight = document.getElementById("lrc-show-root").scrollHeight;
    // ScrolltoEx(document.getElementById("lrycishow"), (idx) / oLRC.ms.length * (schheight - bh / 2 + 80) - bh / 2 + 160);

    try {
        document.getElementById("lrc-" + idx).classList.add("lrc-active");
    } catch (e) {
        // console.error(e);
    }
    ScrolltoEx(document.getElementById("lrc-show-root"), (lrc_normal_line_height) * idx + lrc_normal_line_height / 2);
}

var timer = 0;
function ScrolltoEx(ele, y) {
    if (isIphone) {
        ele.scroll({
            top: y,
            behavior: "smooth"
        });
    } else {
        ScrolltoEx_JS(ele, y);
    }

}
function ScrolltoEx_JS(ele, x) {
    if (ele.scrollHeight == undefined) {
        ele.scrollTop = x;
        return;
    }
    try {
        if (timer != 0) {
            try {
                clearInterval(timer);
                timer = 0;
            } catch (e) {
                // logdata(e);
                logdata(e);
            }
        }
        var mb = Math.round(x);
        if (mb < 0) mb = 0;
        if (mb > ele.scrollHeight) mb.ele.scrollHeight;
        var g = Math.round(Math.abs(x - ele.scrollTop) / 30);
        // logdata(g);
        if (g <= 0) g = 1;
        var tl = 0;
        timer = setInterval(function () {
            //让滚动条到顶部的距离自动缩减到0;
            // ele.scrollTop = document.body.scrollTop = Math.floor(Ontop - 200);//兼容性设置;
            //设置定时器
            // logdata(ele.scrollTop,mb)
            tl++;
            if (tl >= 50) {
                ele.scrollTop = mb;
                clearInterval(timer);
                timer = 0;
            } else if (Math.abs(ele.scrollTop - mb) <= g / 2) {
                ele.scrollTop = mb;
                clearInterval(timer);
                timer = 0;
            } else {
                // if (g < 16 && tt%2==0) g++,tt=1;
                // else tt++;
                if (ele.scrollTop > mb) ele.scrollTop = ele.scrollTop - g; else ele.scrollTop = ele.scrollTop + g;
            }
        }, 10);
    } catch (e) {
        ele.scrollTop = x;
    }
}
function change_music(title, singer, url = "", play = true, info = {}, openGUI = false) {
    document.getElementById("page-info-name").innerText = title;
    document.getElementById("page-info-singer").innerText = singer;
    document.getElementById("pane-music-info-name").innerText = title;
    document.getElementById("pane-music-info-singer").innerText = singer;
    if (url != "") show_msg(`正在播放：${singer} - ${title}`, 1000);
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

        if (pic == null || NetworkSavingMode) {
            document.getElementById("music-lrc-info-pic").src = "./static/img/default_cd.png";
            pic = FALLBACK_BACKGROUND;
        } else {
            document.getElementById("music-lrc-info-pic").src = pic;
        }
        if (backgroundImage == "on") {
            document.getElementById("win-playing").style.backgroundImage = "url(" + encodeURI(pic) + ")";
        }
        // console.log(info);
        if (hasmv) {
            document.getElementById("music-lrc-info-tv").style.display = "inline-block";
            document.getElementById("music-lrc-info-tv").onclick = function () {
                watchVideo(id, title, singer, singerid, albumid, true);
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