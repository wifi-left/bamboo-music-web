function deal_data_search_playlist(data, clean = true) {
    // TODO
    try {
        s_total = data.data.total;
        if (clean)
            listRootObj.innerHTML = "";
        let keys = data.data.list;
        for (var i in keys) {
            let liele = document.createElement("li");
            // 存储信息
            let linedata = keys[i];
            let id = linedata['id'];
            let name = linedata['name'];
            let singer = linedata['artist'];
            let singerid = linedata['artistid'];
            let releasedata = linedata['releaseData'];
            let addition = linedata['addition'];
            if (singer == undefined) {
                singer = "未知";
            }
            let pic = linedata['pic'];
            if (pic == null || pic == "") {
                pic = "./static/img/default_cd.png";
            }
            liele.setAttribute("singer", singer);
            liele.setAttribute("singerid", singerid);
            liele.setAttribute("album", name);
            liele.setAttribute("albumid", id);
            liele.setAttribute("releasedata", releasedata);
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
            let singerele = document.createElement("div");
            let dataele = document.createElement("div");
            let additionele = document.createElement("div");
            nameele.classList.add("list-line-ele");
            singerele.classList.add("list-line-ele");
            dataele.classList.add("list-line-ele");
            additionele.classList.add("list-line-ele");

            nameele.innerHTML = ``;
            singerele.innerHTML = `<span class='small-gray-text'>相关人员：</span>`;
            dataele.innerHTML = `<span class='small-gray-text'>出版时间：</span>`;
            additionele.innerHTML = `<span class='small-gray-text'>附加信息：</span>`;
            let songnameobj = document.createElement("a");
            songnameobj.classList.add("album-name");
            songnameobj.classList.add("song-name");
            songnameobj.innerText = name;
            songnameobj.onclick = function () {
                btn_seeAlbum(this);
            }
            let singernameobj = document.createElement("a");
            singernameobj.classList.add("singer-name");
            singernameobj.innerText = singer;
            singernameobj.onclick = function () {
                btn_seeSinger(this);
            }
            let dataobj = document.createElement("span");
            dataobj.classList.add("release-date");
            dataobj.innerText = releasedata;
            let additionobj = document.createElement("span");
            additionobj.classList.add("adition-msg");
            additionobj.innerText = addition;
            // 添加文本
            additionele.appendChild(additionobj);
            nameele.appendChild(songnameobj);
            singerele.appendChild(singernameobj);
            dataele.appendChild(dataobj);
            // 添加对象
            rightpart.appendChild(nameele);
            rightpart.appendChild(singerele);
            if (releasedata != undefined && releasedata != "")
                rightpart.appendChild(dataele);
            if (addition != undefined && addition != "")
                rightpart.appendChild(additionele);

            // 控制按钮
            let actionbar = document.createElement("div");
            actionbar.classList.add("action-bar");
            let actioncode = ``;
            actioncode += `<button title="详情" class="button fa fa-info-circle" onclick="btn_seeAlbum(this);"></button>`;
            actioncode += `<button title="添加到收藏" class="button fa fa-star" onclick="btn_addStar(this,'playlist');"></button>`;
            actioncode += `<button title="分享" class="button btn-add-list fa fa-share" onclick="btn_shareURL(this);"></button>`;

            actionbar.innerHTML = actioncode;

            rightpart.appendChild(actionbar);

            liele.appendChild(leftpart);
            liele.appendChild(rightpart);
            // 添加成员
            listRootObj.appendChild(liele);
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

        } else
            if (s_page * PAGESIZE >= s_total) {
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
    if (clean) {
        listRootObj.scrollTop = 0;
    }
    try {
        listRootObj.removeChild(listRootObj.querySelector(".loading_todeal"));
    } catch (e) {
    }
}

function deal_data_search(data, clean = true, nomore = false) {
    // searchButtonObj.removeAttribute("disabled");
    try {
        s_total = data.data.total;
        if (nomore) {
            s_total = 1;
        }
        if (clean)
            listRootObj.innerHTML = "";
        if (data.type == 'playlist') {
            deal_data_search_playlist(data, clean);
            searchButtonObj.removeAttribute("disabled");
            return;
        }
        let keys = data.data.list;
        for (var i in keys) {
            let liele = document.createElement("li");
            // 存储信息
            let linedata = keys[i];
            let id = linedata['id'];
            let name = linedata['name'];
            let singer = linedata['artist'];
            let singerid = linedata['artistid'];
            let album = linedata['album'];
            let albumid = linedata['albumid'];
            let releasedata = linedata['releaseData'];
            let hasaudio = linedata['hasAudio'];
            if (hasaudio == undefined) hasaudio = true;
            let hasmv = linedata['hasMv'];
            let addition = linedata['addition'];

            let pic = linedata['pic'];
            if (pic == null || pic == "") {
                pic = "./static/img/default_cd.png";
            }
            liele.setAttribute("songid", id);
            liele.setAttribute("songname", name);
            liele.setAttribute("singer", singer);
            liele.setAttribute("singerid", singerid);
            liele.setAttribute("album", album);
            liele.setAttribute("albumid", albumid);
            liele.setAttribute("releasedata", releasedata);
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
            if (hasaudio) {
                songnameobj.onclick = function () {
                    btn_playMusic(this, true);
                }
            } else {
                if (hasmv) {
                    songnameobj.onclick = function () {
                        btn_watchVideo(this);
                    }
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
            additionobj.classList.add("adition-msg");
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
                if (hasmv) {
                    actioncode += `<button title="观看MV" class="button btn-add-list fa fa-tv" onclick="btn_watchVideo(this);"></button>`;
                }
                actioncode += `<button title="添加到收藏" class="button fa fa-star" onclick="btn_addStar(this,'music');"></button>`;

            } else {
                if (hasmv) {
                    actioncode += `<button title="观看MV" class="button btn-add-list fa fa-tv" onclick="btn_watchVideo(this);"></button>`;
                    actioncode += `<button title="添加到收藏" class="button fa fa-star" onclick="btn_addStar(this,'video');"></button>`;
                }
            }

            actioncode += `<button title="分享" class="button btn-add-list fa fa-share" onclick="btn_shareURL(this);"></button>`;
            actionbar.innerHTML = actioncode;

            rightpart.appendChild(actionbar);

            liele.appendChild(leftpart);
            liele.appendChild(rightpart);
            // 添加成员
            listRootObj.appendChild(liele);
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

        } else
            if (s_page * PAGESIZE >= s_total) {
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
    if (clean) {
        listRootObj.scrollTop = 0;
    }
    try {
        listRootObj.removeChild(listRootObj.querySelector(".loading_todeal"));
    } catch (e) {
    }
}
function api_search(key, type, page = 1, clean = true) {
    if (key.substring(0, 1) == ':') {
        if (key.length <= 1) {
            listRootObj.innerHTML = "";
            var errele = document.createElement("div");
            errele.innerHTML = `<p>请输入正确的格式：</p><span>:&lt;歌曲ID&gt;</span>`;
            listRootObj.appendChild(errele);
            return;
        } else {
            play_music_id(key.substring(1), true);
            return;
        }
    }
    if (JSON.parse(searchButtonObj.getAttribute("disabled")) == true) {
        return;
    }
    if (key == "" && type == 'audio') {
        type = "random";
    }
    // location.hash = `search=${encodeURI(key)}&type=${encodeURI(searchTypeSelector.value)}`;
    searchButtonObj.setAttribute("disabled", "true");
    s_searchkey = key;
    s_type = type;
    s_page = page;
    if (clean) {
        searchLoadingPaneObj.style.display = 'inline-block';
        listRootObj.scrollTop = 0;
    } else {
        var loading_todeal = document.createElement("div");
        loading_todeal.classList.add("loading_todeal");
        loading_todeal.innerHTML = `<div class="loader" style="width:12px;height:12px;"></div><b class="unable-sel" style="margin-left:16px;font-size:16px;">正在缓冲中...</b>`
        listRootObj.appendChild(loading_todeal);
    }
    suggestKeyRootObj.style.display = "none";
    let url = "";
    if (s_type == "random") {
        url = get_api_default_list(page);
    } else {
        url = get_api_url(key, type, page);
    }
    if (url == false) {
        let data = get_api_content(key, type, page);
        // $(searchLoadingPaneObj).hide();
        searchLoadingPaneObj.style.display = 'none';

        deal_data_search(data, clean);
        searchButtonObj.removeAttribute("disabled");
    }
    $.fetch(url, "json").then(data => {

        searchLoadingPaneObj.style.display = 'none';
        if (data.success == 'fail') {
            listRootObj.innerHTML = "";
            var errele = document.createElement("div");
            errele.innerHTML = `<h1>服务器出现错误！</h1><span>${data.msg}</span>`;
            listRootObj.appendChild(errele);
            searchButtonObj.removeAttribute("disabled");
            try {
                listRootObj.removeChild(listRootObj.querySelector(".loading_todeal"));
            } catch (e) {
            }
        } else {
            deal_data_search(data, clean);
            searchButtonObj.removeAttribute("disabled");
        }
    }).catch(error => {
        if (clean) {
            console.error(error);
            listRootObj.innerHTML = "";
            var errele = document.createElement("div");
            errele.innerHTML = `<h1>服务器出现错误！</h1><span>${error.message}</span>`;
            listRootObj.appendChild(errele);
        } else {
            try {
                listRootObj.removeChild(listRootObj.querySelector(".loading_todeal"));
            } catch (e) {
            }
        }
        searchButtonObj.removeAttribute("disabled");
        searchLoadingPaneObj.style.display = 'none';

    });
}

function loadSuggestVideos(songid, albumid = undefined) {
    if (v_cooldown) return;
    v_total = -1;
    v_playlistid = albumid;
    v_vid = songid;
    v_page = 1;
    document.getElementById("video-player-suggest-list").innerHTML = "";
    if (albumid == undefined) {
        document.getElementById("video-player-suggest-list").innerHTML = `<span class="small-gray-text">无推荐内容</span>`;
    } else {
        try {

            let url = get_api_suggest_url(songid, albumid, "video", 1);
            if (url == undefined) {
                document.getElementById("video-player-suggest-list").innerHTML = `<span class="small-gray-text">无推荐内容</span>`;
                return;
            }
            var loading_todeal = document.createElement("div");
            loading_todeal.classList.add("loading_todeal");
            loading_todeal.innerHTML = `<div class="loader" style="width:12px;height:12px;"></div><b class="unable-sel" style="margin-left:16px;font-size:16px;">正在缓冲中...</b>`
            document.getElementById("video-player-suggest-list").appendChild(loading_todeal);
            v_cooldown = true;
            $.fetch(url, "json").then(data => {
                deal_data_suggest_video(data);
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
}

function deal_data_suggest_video(data, clean = true) {
    let addcount = 0;
    let listRootObj = document.getElementById("video-player-suggest-list");
    try {
        let data_ = data.data;
        let keys = data_.list;
        v_total = data_.total;
        // s_total = data.data.total;
        if (clean)
            listRootObj.innerHTML = "";
        if (data.type == 'playlist') {
            deal_data_search_playlist(data);
            return;
        }
        for (var i in keys) {
            let liele = document.createElement("li");
            // 存储信息
            let linedata = keys[i];
            let id = linedata['id'];
            if (v_vid == id) {
                liele.classList.add("playing")
            }
            let hasmv = linedata['hasMv'];
            if (!hasmv) continue;
            addcount++;
            let name = linedata['name'];
            let singer = linedata['artist'];
            let singerid = linedata['artistid'];
            let album = linedata['album'];
            let albumid = linedata['albumid'];
            let releasedata = linedata['releaseData'];
            let addition = linedata['addition'];

            let pic = linedata['pic'];
            if (pic == null || pic == "") {
                pic = "./static/img/default_cd.png";
            }
            liele.setAttribute("songid", id);
            liele.setAttribute("songname", name);
            liele.setAttribute("singer", singer);
            liele.setAttribute("singerid", singerid);
            liele.setAttribute("album", album);
            liele.setAttribute("albumid", albumid);
            liele.setAttribute("releasedata", releasedata);
            if (releasedata == "") releasedata = undefined;
            if (album == "") album = undefined;
            // 显示信息
            // 左侧：图片
            // 右侧：信息
            let rightpart = document.createElement("div");
            rightpart.classList.add("right-part");
            let nameele = document.createElement("div");
            let singerele = document.createElement("div");
            let dataele = document.createElement("div");
            let additionele = document.createElement("div");
            nameele.classList.add("list-line-ele");
            singerele.classList.add("list-line-ele");
            dataele.classList.add("list-line-ele");
            additionele.classList.add("list-line-ele");
            dataele.innerHTML = `${album != undefined ? `<span class='small-gray-text'>合集：</span><span
            class="album-name"></span><br />`: ""}${releasedata != undefined ? `<span class='small-gray-text'>时间：</span><span class="release-date"></span>` : ""}`;
            additionele.innerHTML = `<b>简介：</b>`;
            // if(vid)
            singerele.innerHTML = `<span class='small-gray-text'>相关人员：</span>`;
            let songnameobj = document.createElement("b");
            songnameobj.classList.add("song-name");
            songnameobj.innerText = name;
            let singernameobj = document.createElement("span");
            singernameobj.classList.add("singer-name");
            singernameobj.innerText = singer;
            let additionobj = document.createElement("span");
            additionobj.classList.add("adition-msg");
            additionobj.innerText = addition;
            // 添加文本
            additionele.appendChild(additionobj);
            nameele.appendChild(songnameobj);
            singerele.appendChild(singernameobj);
            // 添加对象
            rightpart.appendChild(nameele);
            rightpart.appendChild(singerele);
            if (addition != undefined && addition != "")
                rightpart.appendChild(additionele);
            if (album != undefined)
                dataele.querySelector(".album-name").innerText = album;
            if (releasedata != undefined)
                dataele.querySelector(".release-date").innerText = releasedata;
            if ((releasedata != undefined && releasedata != "") || (album != undefined && album != ""))
                rightpart.appendChild(dataele);


            // 控制按钮
            liele.appendChild(rightpart);
            // 添加成员
            liele.onclick = function () {
                btn_watchVideo(this, true, false);
            }
            listRootObj.appendChild(liele);
        }
        if (keys.length == 0) {
            if (clean) {
                let ele = document.createElement("div");
                ele.innerHTML = `<span class="text-not-found-error">无法找到相关视频</span>`
                listRootObj.appendChild(ele);
            } else {
                let ele = document.createElement("div");
                ele.classList.add("list-no-more");
                ele.innerHTML = "<span>没有更多了。</span>"
                listRootObj.appendChild(ele);
            }

        } else
            if (v_page * PAGESIZE >= v_total) {
                let ele = document.createElement("div");
                ele.classList.add("list-no-more");
                // console.log(v_page * PAGESIZE, v_total);
                ele.innerHTML = "<span>没有更多了。</span>"
                listRootObj.appendChild(ele);
            } else {
                if (addcount < PAGESIZE / 2) {
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
            }
        // console.log(keys)
    } catch (e) {
        var errele = document.createElement("div");
        errele.innerHTML = `<h1>出现错误！</h1><span>${e}</span>`;
        listRootObj.appendChild(errele);
        console.error(e);
    }
    if (clean) {
        listRootObj.scrollTop = 0;
    }
    try {
        listRootObj.removeChild(listRootObj.querySelector(".loading_todeal"));
    } catch (e) {
    }
}

function api_suggestKey(key, type = undefined) {
    suggest_idx++;

    if (type == undefined) {
        type = searchTypeSelector.value;
    }
    if (suggest_idx >= 1000000) suggest_idx = 0;
    let sidcache = suggest_idx;
    nowsel = -1;
    suggestKeyRootObj.style.display = "inline-block";
    autoFillObj.innerHTML = `<li><span style="margin-left:38px;font-weight:bold;">加载中...</span></li>`;
    if (key.substring(0, 1) == ':') {

        autoFillObj.innerHTML = "";
        autoFillObj, innerHTML = "";
        let ele = document.createElement("li");
        if (key.length == 1) {
            ele.textContent = "播放歌曲ID为您后面输入的歌曲";
        } else {
            ele.textContent = "播放歌曲ID为【" + key.substring(1) + "】的歌曲";
        }
        ele.onclick = function () {
            auto_search(key);
        }
        autoFillObj.appendChild(ele);
        return;
    }
    let uurl = get_api_suggest_key(type);
    $.fetch(uurl.replace("${KEY}", encodeURIComponent(key)), "json").then(data => {
        try {
            if (sidcache != suggest_idx) return;
            autoFillObj.innerHTML = "";
            let keys = data.data;
            if (key == "") {
                let ele = document.createElement("li");
                ele.classList.add("fa");
                ele.classList.add("fa-info");
                ele.innerHTML = "<b style='margin-left:8px;'>您可以通过输入:来播放指定ID的歌曲。</b>";
                autoFillObj.appendChild(ele);
            }
            for (var i in keys) {
                let ele = document.createElement("li");
                ele.textContent = keys[i];
                ele.onclick = function () {
                    auto_search(this.innerText);
                }
                autoFillObj.appendChild(ele);
            }
            if (keys.length == 0) {
                let ele = document.createElement("li");
                ele.classList.add("fa");
                ele.classList.add("fa-close");
                ele.textContent = " 未找到内容";
                autoFillObj.appendChild(ele);
            }
            // console.log(keys)
        } catch (e) {
            console.error(e);
        }
    }).catch(error => {
        console.error(error);
    });
}

var PromptTimeoutId = -1;
function show_msg(message, timeout = 0, raw = false) {
    if (raw) {
        promptBlockTitleObj.innerHTML = message;
    } else {
        promptBlockTitleObj.innerText = message;
    }
    $(promptBlockObj).fadeIn(200);
    if (timeout > 0) {
        PromptTimeoutId = setTimeout(function () {
            $(promptBlockObj).fadeOut(200);
            PromptTimeoutId = -1;
        }, timeout);
    }
}

function api_list_alarm(albumid, type, clean = true, page = 1) {
    if (l_cooldown == true) {
        console.log("Cooldown...");
        return; // 冷却中
    }
    l_type = type;
    l_playlistid = albumid;
    l_cooldown = true;
    l_page = page;
    if (clean) {
        document.getElementById("playlist-item-head").innerHTML = "";
    }

    try {
        let url = get_api_alarm_list(albumid, l_page, type);
        $.fetch(url, "json").then(data => {
            deal_data_playlist_content(data, clean);
        }).catch(e => {
            console.error(e);
            deal_data_playlist_content(DEFAULT_FALLBACK, clean);
            l_cooldown = false;
        })
    } catch (e) {
        console.error(e);
        l_cooldown = false;
    }
}
function deal_data_playlist_content(data, clean = true) {
    let listRootObj = document.getElementById("playlist-item-head");
    try {
        l_total = data.data.total;
        let keys = data.data.list;
        for (var i in keys) {
            let liele = document.createElement("li");
            // 存储信息
            let linedata = keys[i];
            let id = linedata['id'];
            let name = linedata['name'];
            let singer = linedata['artist'];
            let singerid = linedata['artistid'];
            let album = linedata['album'];
            let albumid = linedata['albumid'];
            let releasedata = linedata['releaseData'];
            let hasaudio = linedata['hasAudio'];
            if (hasaudio == undefined) hasaudio = true;
            let hasmv = linedata['hasMv'];
            let addition = linedata['addition'];

            let pic = linedata['pic'];
            if (pic == null || pic == "") {
                pic = "./static/img/default_cd.png";
            }
            liele.setAttribute("songid", id);
            liele.setAttribute("songname", name);
            liele.setAttribute("singer", singer);
            liele.setAttribute("singerid", singerid);
            liele.setAttribute("album", album);
            liele.setAttribute("albumid", albumid);
            liele.setAttribute("releasedata", releasedata);
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
                    if (hasmv) {
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
            additionobj.classList.add("adition-msg");
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
                if (hasmv) {
                    actioncode += `<button title="观看MV" class="button btn-add-list fa fa-tv" onclick="btn_watchVideo(this);"></button>`;
                }
                actioncode += `<button title="添加到收藏" class="button fa fa-star" onclick="btn_addStar(this,'music');"></button>`;

            } else {
                if (hasmv) {
                    actioncode += `<button title="观看MV" class="button btn-add-list fa fa-tv" onclick="btn_watchVideo(this);"></button>`;
                    actioncode += `<button title="添加到收藏" class="button fa fa-star" onclick="btn_addStar(this,'video');"></button>`;
                }
            }

            actioncode += `<button title="分享" class="button btn-add-list fa fa-share" onclick="btn_shareURL(this);"></button>`;
            actionbar.innerHTML = actioncode;

            rightpart.appendChild(actionbar);

            liele.appendChild(leftpart);
            liele.appendChild(rightpart);
            // 添加成员
            listRootObj.appendChild(liele);
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

        } else
            if (l_page * PAGESIZE >= l_total) {
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
    if (clean) {
        listRootObj.scrollTop = 0;
    }
    try {
        listRootObj.removeChild(listRootObj.querySelector(".loading_todeal"));
    } catch (e) {
    }
    l_cooldown = false;
}

// api_search("", search_types[0]['id']);
function defaultThing() {
    s_page = 1;
    var loading_todeal = document.createElement("div");
    loading_todeal.classList.add("loading_todeal");
    loading_todeal.innerHTML = `<div class="loader" style="width:12px;height:12px;"></div><b class="unable-sel" style="margin-left:16px;font-size:16px;">正在缓冲中...</b>`
    listRootObj.appendChild(loading_todeal);
    suggestKeyRootObj.style.display = "none";
    api_search("", "random", 1, true);
}
defaultThing();
// 显示点东西吧！
