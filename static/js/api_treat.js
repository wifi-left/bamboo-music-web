// ============================================================
// API 数据处理层
// 负责把后端返回的数据（搜索/专辑/收藏/推荐）渲染成列表 UI
// ============================================================

// ---------- 公共渲染工具 ----------

// 规范化一条歌曲数据，补充默认值
function normalizeLineData(linedata) {
    let hasaudio = linedata['hasAudio'];
    if (hasaudio == undefined) hasaudio = true;
    let addition = linedata['addition'];
    let warning = linedata['warning'];
    if (warning == undefined) warning = "";
    if (addition == undefined) addition = "";
    let pic = linedata['pic'];
    if (pic == null || pic == "" || SETTING_VAR.NetworkSavingMode) {
        pic = "./static/img/default_cd.png";
    }
    // 收藏夹数据使用 singer 字段，API 数据使用 artist 字段
    let singer = linedata['artist'] !== undefined ? linedata['artist'] : linedata['singer'];
    let singerid = linedata['artistid'] !== undefined ? linedata['artistid'] : linedata['singerid'];
    if (singer == undefined) singer = "未知";
    return {
        id: linedata['id'],
        name: linedata['name'],
        singer,
        singerid,
        album: linedata['album'],
        albumid: linedata['albumid'],
        releasedata: linedata['releaseDate'],
        hasaudio,
        hasmv: linedata['hasMv'],
        addition,
        warning,
        pic
    };
}

// 创建"加载中"占位元素
function createLoadingTodeal() {
    let loading_todeal = document.createElement("div");
    loading_todeal.classList.add("loading_todeal");
    loading_todeal.innerHTML = `<div class="loader" style="width:12px;height:12px;"></div><b class="unable-sel" style="margin-left:16px;font-size:16px;">正在缓冲中...</b>`;
    return loading_todeal;
}

// 移除列表内残留的"加载中"占位元素
function removeLoadingTodeal(rootObj) {
    try {
        rootObj.removeChild(rootObj.querySelector(".loading_todeal"));
    } catch (e) { }
}

// 在列表尾部追加"空结果 / 没有更多"提示
function appendListEndHint(rootObj, keysLength, total, page, clean, emptyMsg = "很抱歉，什么都没有找到。") {
    if (keysLength == 0) {
        if (clean) {
            let ele = document.createElement("div");
            ele.innerHTML = `<span class="text-not-found-error">${emptyMsg}</span>`;
            rootObj.appendChild(ele);
        } else {
            let ele = document.createElement("div");
            ele.classList.add("list-no-more");
            ele.innerHTML = "<span>没有更多了。</span>";
            rootObj.appendChild(ele);
        }
    } else if (page * PAGESIZE >= total) {
        let ele = document.createElement("div");
        ele.classList.add("list-no-more");
        ele.innerHTML = "<span>没有更多了。</span>";
        rootObj.appendChild(ele);
    }
}

// 创建列表左侧封面图
function createLeftPart(pic) {
    let leftpart = document.createElement("div");
    leftpart.classList.add("left-part");
    let imgele = document.createElement("img");
    imgele.classList.add("list-left-img");
    // 懒加载/异步解码：原来列表一插入就把所有封面（含屏幕外的）全部请求一遍
    imgele.loading = "lazy";
    imgele.decoding = "async";
    imgele.src = pic;
    leftpart.appendChild(imgele);
    return leftpart;
}

// 在父节点上追加"标题：值"一行，值可以是文本或链接
function appendInfoLine(parent, label, value, valueClass, onclick = null) {
    if (value == undefined || value == "") return;
    let line = document.createElement("div");
    line.classList.add("list-line-ele");
    line.innerHTML = `<span class='small-gray-text'>${label}：</span>`;
    let valueobj = document.createElement(valueClass);
    valueobj.className = (valueClass == "a" ? "album-name" : "release-date");
    valueobj.innerText = value;
    if (onclick != null) valueobj.onclick = onclick;
    line.appendChild(valueobj);
    parent.appendChild(line);
}

// 构建歌曲操作按钮区（根据是否有音频/视频生成不同按钮）
function buildSongActionHtml(d, starMode = false) {
    let code = ``;
    if (d.hasaudio) {
        code += `<button title="添加到播放列表" class="button btn-add-list fa fa-plus-circle" onclick="btn_addtoList(this);"></button>`;
        code += `<button title="立即播放" class="button btn-play fa fa-play-circle" onclick="btn_playMusic(this,false);">`;
        if (d.hasmv) {
            code += `<button title="观看MV" class="button btn-add-list fa fa-tv" onclick="btn_watchVideo(this);"></button>`;
        }
        code += `<button title="${starMode ? "添加到其他收藏夹" : "添加到收藏"}" class="button fa fa-star" onclick="btn_addStar(this,'music');"></button>`;
    } else if (d.hasmv) {
        code += `<button title="观看MV" class="button btn-add-list fa fa-tv" onclick="btn_watchVideo(this);"></button>`;
        code += `<button title="添加到收藏" class="button fa fa-star" onclick="btn_addStar(this,'video');"></button>`;
    }
    code += `<button title="分享" class="button btn-add-list fa fa-share" onclick="btn_shareURL(this);"></button>`;
    if (starMode) {
        code += `<button title="从收藏夹删除" class="button fa fa-trash" onclick="btn_removeStar(this,'music');"></button>`;
    }
    return code;
}

// 创建一个歌曲条目 <li>（搜索/专辑详情/收藏夹通用）
function createSongListItem(linedata, opts = {}) {
    const d = normalizeLineData(linedata);
    const starMode = opts.starMode || false;
    const starid = opts.starid;

    let liele = document.createElement("li");
    // 批量选择框（仅批量操作模式下显示）
    let batchSelect = document.createElement("input");
    batchSelect.type = "checkbox";
    batchSelect.className = "batch-select";
    batchSelect.setAttribute("aria-label", "选择这首歌曲");
    batchSelect.onclick = function (e) {
        e.stopPropagation();
        let li = this.closest("li");
        if (li != null) li.classList.toggle("selected", this.checked);
    };
    liele.appendChild(batchSelect);

    // 存储信息（供按钮回调读取）
    liele.setAttribute("songid", d.id);
    liele.setAttribute("songname", d.name);
    liele.setAttribute("singer", d.singer);
    liele.setAttribute("singerid", d.singerid);
    liele.setAttribute("album", d.album);
    liele.setAttribute("albumid", d.albumid);
    liele.setAttribute("releasedata", d.releasedata);
    liele.setAttribute("hasmv", d.hasmv);
    if (starMode) liele.setAttribute("starid", starid);

    // 左侧：封面
    liele.appendChild(createLeftPart(d.pic));

    // 右侧：信息
    let rightpart = document.createElement("div");
    rightpart.classList.add("right-part");

    let nameele = document.createElement("div");
    nameele.classList.add("list-line-ele");
    let songnameobj = document.createElement("b");
    songnameobj.classList.add("song-name");
    songnameobj.innerText = d.name;
    songnameobj.onclick = function () {
        if (d.hasaudio)
            btn_playMusic(this, true);
        else if (d.hasmv)
            btn_watchVideo(this);
    };
    nameele.appendChild(songnameobj);
    rightpart.appendChild(nameele);

    let singerele = document.createElement("div");
    singerele.classList.add("list-line-ele");
    singerele.innerHTML = `<span class='small-gray-text'>相关人员：</span>`;
    let singernameobj = document.createElement("a");
    singernameobj.classList.add("singer-name");
    singernameobj.innerText = d.singer;
    singernameobj.onclick = function () {
        btn_seeSinger(this);
    };
    singerele.appendChild(singernameobj);
    rightpart.appendChild(singerele);

    appendInfoLine(rightpart, "专辑", d.album, "a", function () {
        btn_seeAlbum(this);
    });
    appendInfoLine(rightpart, "出版时间", d.releasedata, "span");

    if (d.addition != "" || d.warning != "") {
        let additionele = document.createElement("div");
        additionele.classList.add("list-line-ele");
        additionele.innerHTML = `<span class='small-gray-text'>附加信息：</span>`;
        let additionobj = document.createElement("span");
        additionobj.classList.add("addition-msg");
        additionobj.innerText = d.addition;
        additionobj.title = d.addition;
        additionele.appendChild(additionobj);
        if (d.addition != "" && d.warning != "") {
            additionele.appendChild(document.createElement("br"));
        }
        let warningobj = document.createElement("span");
        warningobj.classList.add("warning-msg");
        warningobj.innerText = d.warning;
        additionele.appendChild(warningobj);
        rightpart.appendChild(additionele);
    }

    // 控制按钮
    let actionbar = document.createElement("div");
    actionbar.classList.add("action-bar");
    actionbar.innerHTML = buildSongActionHtml(d, starMode);
    rightpart.appendChild(actionbar);

    liele.appendChild(rightpart);
    return liele;
}

// 创建一个专辑/播放列表条目 <li>（搜索专辑结果专用）
function createPlaylistListItem(linedata) {
    const d = normalizeLineData(linedata);

    let liele = document.createElement("li");
    liele.setAttribute("singer", d.singer);
    liele.setAttribute("singerid", d.singerid);
    liele.setAttribute("album", d.name);
    liele.setAttribute("albumid", d.id);
    liele.setAttribute("releasedata", d.releasedata);

    // 左侧：封面
    liele.appendChild(createLeftPart(d.pic));

    // 右侧：信息
    let rightpart = document.createElement("div");
    rightpart.classList.add("right-part");

    let nameele = document.createElement("div");
    nameele.classList.add("list-line-ele");
    let songnameobj = document.createElement("a");
    songnameobj.classList.add("album-name");
    songnameobj.classList.add("song-name");
    songnameobj.innerText = d.name;
    songnameobj.onclick = function () {
        btn_seeAlbum(this);
    };
    nameele.appendChild(songnameobj);
    rightpart.appendChild(nameele);

    let singerele = document.createElement("div");
    singerele.classList.add("list-line-ele");
    singerele.innerHTML = `<span class='small-gray-text'>相关人员：</span>`;
    let singernameobj = document.createElement("a");
    singernameobj.classList.add("singer-name");
    singernameobj.innerText = d.singer;
    singernameobj.onclick = function () {
        btn_seeSinger(this);
    };
    singerele.appendChild(singernameobj);
    rightpart.appendChild(singerele);

    appendInfoLine(rightpart, "出版时间", d.releasedata, "span");

    if (d.addition != "" || d.warning != "") {
        let additionele = document.createElement("div");
        additionele.classList.add("list-line-ele");
        additionele.innerHTML = `<span class='small-gray-text'>附加信息：</span>`;
        let additionobj = document.createElement("span");
        additionobj.classList.add("addition-msg");
        additionobj.innerText = d.addition;
        additionobj.title = d.addition;
        additionele.appendChild(additionobj);
        if (d.addition != "" && d.warning != "") {
            additionele.appendChild(document.createElement("br"));
        }
        let warningobj = document.createElement("span");
        warningobj.classList.add("warning-msg");
        warningobj.innerText = d.warning;
        additionele.appendChild(warningobj);
        rightpart.appendChild(additionele);
    }

    // 控制按钮
    let actionbar = document.createElement("div");
    actionbar.classList.add("action-bar");
    actionbar.innerHTML = `<button title="详情" class="button fa fa-info-circle" onclick="btn_seeAlbum(this);"></button>`
        + `<button title="添加到收藏" class="button fa fa-star" onclick="btn_addStar(this,'playlist');"></button>`
        + `<button title="分享" class="button btn-add-list fa fa-share" onclick="btn_shareURL(this);"></button>`;
    rightpart.appendChild(actionbar);

    liele.appendChild(rightpart);
    return liele;
}

// ---------- 渲染函数 ----------

// 渲染专辑搜索结果的列表
function deal_data_search_playlist(data, clean = true) {
    try {
        s_total = data.data.total;
        if (clean)
            listRootObj.innerHTML = "";
        let keys = data.data.list;
        // 批量插入：逐行 appendChild 到文档中的节点会一行一次样式失效，反正最后只渲染一次
        let nodes = [];
        for (let i = 0; i < keys.length; i++) {
            nodes.push(createPlaylistListItem(keys[i]));
            let hr = document.createElement("div");
            hr.classList.add("pretty-hr");
            nodes.push(hr);
        }
        appendAll(listRootObj, nodes);
        appendListEndHint(listRootObj, keys.length, s_total, s_page, clean, "很抱歉，什么都没有找到。请重试或者更换关键词。");
    } catch (e) {
        var errele = document.createElement("div");
        errele.innerHTML = `<h1>出现错误！</h1><span>${e}</span>`;
        listRootObj.appendChild(errele);
        console.error(e);
    }
    if (clean) {
        listRootObj.scrollTop = 0;
    }
    removeLoadingTodeal(listRootObj);
}

// 渲染歌曲搜索结果列表
function deal_data_search(data, clean = true, nomore = false) {
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
        // 批量插入：逐行 appendChild 到文档中的节点会一行一次样式失效
        let nodes = [];
        for (let i = 0; i < keys.length; i++) {
            nodes.push(createSongListItem(keys[i]));
            let hr = document.createElement("div");
            hr.classList.add("pretty-hr");
            nodes.push(hr);
        }
        appendAll(listRootObj, nodes);
        appendListEndHint(listRootObj, keys.length, s_total, s_page, clean, "很抱歉，什么都没有找到。请重试或者更换关键词。");
    } catch (e) {
        var errele = document.createElement("div");
        errele.innerHTML = `<h1>出现错误！</h1><span>${e}</span>`;
        listRootObj.appendChild(errele);
        console.error(e);
    }
    if (clean) {
        listRootObj.scrollTop = 0;
    }
    removeLoadingTodeal(listRootObj);
}

// 发起搜索请求
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
    searchButtonObj.setAttribute("disabled", "true");
    s_searchkey = key;
    s_type = type;
    s_page = page;
    if (clean) {
        searchLoadingPaneObj.style.display = 'inline-block';
        listRootObj.scrollTop = 0;
    } else {
        listRootObj.appendChild(createLoadingTodeal());
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
            removeLoadingTodeal(listRootObj);
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
            removeLoadingTodeal(listRootObj);
        }
        searchButtonObj.removeAttribute("disabled");
        searchLoadingPaneObj.style.display = 'none';

    });
}

// ---------- 视频推荐 ----------

// 加载相关视频推荐（第一页）
function loadSuggestVideos(songid, albumid = undefined) {
    if (v_cooldown) return;
    v_total = -1;
    v_playlistid = albumid;
    v_vid = songid;
    v_page = 1;
    let suggestList = document.getElementById("video-player-suggest-list");
    suggestList.innerHTML = "";
    if (albumid == undefined) {
        suggestList.innerHTML = `<span class="small-gray-text">无推荐内容</span>`;
        return;
    }
    try {
        let url = get_api_suggest_url(songid, albumid, "video", 1);
        if (url == undefined) {
            suggestList.innerHTML = `<span class="small-gray-text">无推荐内容</span>`;
            return;
        }
        suggestList.appendChild(createLoadingTodeal());
        v_cooldown = true;
        $.fetch(url, "json").then(data => {
            deal_data_suggest_video(data);
            v_cooldown = false;
        }).catch(e => {
            console.error(e);
            suggestList.innerHTML = `<li class="small-gray-text">出现错误：${e.message}</li>`;
            v_cooldown = false;
            return;
        });
    } catch (e) {
        console.error(e);
        suggestList.innerHTML = `<li class="small-gray-text">出现错误：${e.message}</li>`;
        v_cooldown = false;
        return;
    }
}

// 加载更多视频推荐（滚动加载下一页）
function loadMoreSuggestVideos() {
    if (v_cooldown) return;
    v_cooldown = true;
    v_page = v_page + 1;
    let suggestList = document.getElementById("video-player-suggest-list");
    let url = get_api_suggest_url(v_vid, v_playlistid, "video", v_page);
    if (url == undefined) {
        suggestList.innerHTML = `<span class="small-gray-text">无推荐内容</span>`;
        return;
    }
    suggestList.appendChild(createLoadingTodeal());
    $.fetch(url, "json").then(data => {
        deal_data_suggest_video(data, false);
        v_cooldown = false;
    }).catch(e => {
        console.error(e);
        suggestList.innerHTML = `<li class="small-gray-text">出现错误：${e.message}</li>`;
        v_cooldown = false;
        return;
    });
}

// 渲染视频推荐列表
function deal_data_suggest_video(data, clean = true) {
    let addcount = 0;
    let listRootObj = document.getElementById("video-player-suggest-list");
    try {
        let data_ = data.data;
        let keys = data_.list;
        v_total = data_.total;
        if (clean)
            listRootObj.innerHTML = "";
        if (data.type == 'playlist') {
            deal_data_search_playlist(data);
            return;
        }
        for (var i in keys) {
            let linedata = keys[i];
            let d = normalizeLineData(linedata);
            let liele = document.createElement("li");
            if (v_vid == d.id) {
                liele.classList.add("playing")
            }
            if (!(d.hasmv != "" && d.hasmv != null && d.hasmv != false)) continue;
            addcount++;
            let album = d.album;
            let releasedata = d.releasedata;
            if (releasedata == "") releasedata = undefined;
            if (album == "") album = undefined;
            liele.setAttribute("songid", d.id);
            liele.setAttribute("songname", d.name);
            liele.setAttribute("singer", d.singer);
            liele.setAttribute("singerid", d.singerid);
            liele.setAttribute("album", d.album);
            liele.setAttribute("albumid", d.albumid);
            liele.setAttribute("releasedata", d.releasedata);
            liele.setAttribute("hasmv", d.hasmv);

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
            singerele.innerHTML = `<span class='small-gray-text'>相关人员：</span>`;
            let songnameobj = document.createElement("b");
            songnameobj.classList.add("song-name");
            songnameobj.innerText = d.name;
            let singernameobj = document.createElement("span");
            singernameobj.classList.add("singer-name");
            singernameobj.innerText = d.singer;
            let additionobj = document.createElement("span");
            additionobj.classList.add("addition-msg");
            additionobj.innerText = d.addition;
            additionobj.title = d.addition;
            additionele.appendChild(additionobj);
            if (d.addition != "" && d.warning != "") {
                let br = document.createElement("br");
                additionele.appendChild(br);
            }
            let warningobj = document.createElement("span");
            warningobj.classList.add("warning-msg");
            warningobj.innerText = d.warning;
            additionele.appendChild(warningobj);
            nameele.appendChild(songnameobj);
            singerele.appendChild(singernameobj);
            rightpart.appendChild(nameele);
            rightpart.appendChild(singerele);
            if (d.addition != "" || d.warning != "")
                rightpart.appendChild(additionele);
            if (album != undefined)
                dataele.querySelector(".album-name").innerText = album;
            if (releasedata != undefined)
                dataele.querySelector(".release-date").innerText = releasedata;
            if ((releasedata != undefined && releasedata != "") || (album != undefined && album != ""))
                rightpart.appendChild(dataele);

            liele.appendChild(rightpart);
            liele.onclick = function () {
                btn_watchVideo(this, true, false);
            }
            listRootObj.appendChild(liele);
            let hr = document.createElement("div");
            hr.classList.add("pretty-hr");
            listRootObj.appendChild(hr);
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
        } else if (v_page * PAGESIZE >= v_total) {
            let ele = document.createElement("div");
            ele.classList.add("list-no-more");
            ele.innerHTML = "<span>没有更多了。</span>"
            listRootObj.appendChild(ele);
        } else {
            if (addcount < PAGESIZE / 2) {
                try {
                    loadMoreSuggestVideos();
                } catch (e) {
                    console.error(e);
                    listRootObj.innerHTML = `<li class="small-gray-text">出现错误：${e.message}</li>`;
                    v_cooldown = false;
                    return;
                }
            }
        }
    } catch (e) {
        var errele = document.createElement("div");
        errele.innerHTML = `<h1>出现错误！</h1><span>${e}</span>`;
        listRootObj.appendChild(errele);
        console.error(e);
    }
    if (clean) {
        listRootObj.scrollTop = 0;
    }
    removeLoadingTodeal(listRootObj);
}

// ---------- 随机电台 ----------

function enterAudioStation(openGUI = true) {
    if (location.hash !== "#station")
        show_msg("随机电台模式", 2000);
    location.hash = "station";
    hashChanged = true;
    random_Song(openGUI);
}
function random_Song(openGUI = false) {
    let seed = new Date().getTime() % 10000;
    let url = get_api_default_list(seed, 1);
    fetchi(url, "text", function (text) {
        let data = {};
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error(e);
            throw e;
        }
        let id = data.data.list[0].id;
        if (myAudioStation.length >= 10) myAudioStation.splice(0, 1);
        myAudioStation.push(id);
        play_music_id(id, openGUI);
    }, function (e) {
        show_msg("进入随机电台模式失败：" + e.message, 2000);
    });
}

// ---------- 搜索建议词 ----------

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
        } catch (e) {
            console.error(e);
        }
    }).catch(error => {
        console.error(error);
    });
}

// ---------- 专辑 / 播放列表 / 收藏夹内容 ----------

function api_list_alarm(albumid, type, clean = true, page = 1) {
    if (l_cooldown == true) {
        console.log("Cooldown...");
        return; // 冷却中
    }

    if (type == 'star') {
        if (clean) {
            document.getElementById("playlist-item-head").scrollTo(0, 0);
            document.getElementById("playlist-item-head").innerHTML = "";
        }
        treat_star_detail(albumid, type, clean, page);
        return;
    }
    l_type = type;
    l_playlistid = albumid;
    l_cooldown = true;
    l_page = page;
    // 收藏夹专属的工具（排序/重命名/筛选/批量）在专辑、歌手、搜索结果里要收起来
    setStarToolsVisible(false);
    if (clean) {
        document.getElementById("playlist-item-head").scrollTo(0, 0);
        MusicListLoadingPaneObj.style.display = "inline-block";
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
            MusicListLoadingPaneObj.style.display = "none";

        })
    } catch (e) {
        console.error(e);
        l_cooldown = false;
        MusicListLoadingPaneObj.style.display = "none";

    }
}

// 渲染专辑 / 播放列表 / 歌手 内容列表
function deal_data_playlist_content(data, clean = true) {
    let listRootObj = document.getElementById("playlist-item-head");
    try {
        l_total = data.data.total;
        let keys = data.data.list;
        // 批量插入：逐行 appendChild 到文档中的节点会一行一次样式失效
        let nodes = [];
        for (let i = 0; i < keys.length; i++) {
            nodes.push(createSongListItem(keys[i]));
            let hr = document.createElement("div");
            hr.classList.add("pretty-hr");
            nodes.push(hr);
        }
        appendAll(listRootObj, nodes);
        appendListEndHint(listRootObj, keys.length, l_total, l_page, clean, "很抱歉，什么都没有找到。请重试或者更换关键词。");
    } catch (e) {
        var errele = document.createElement("div");
        errele.innerHTML = `<h1>出现错误！</h1><span>${e}</span>`;
        listRootObj.appendChild(errele);
        console.error(e);
    }
    if (clean) {
        listRootObj.scrollTop = 0;
    }
    removeLoadingTodeal(listRootObj);
    l_cooldown = false;
    MusicListLoadingPaneObj.style.display = "none";
}

// 进入页面时的默认加载
function defaultThing() {
    s_page = 1;
    listRootObj.appendChild(createLoadingTodeal());
    suggestKeyRootObj.style.display = "none";
    api_search("", "random", 1, true);
}
defaultThing();
