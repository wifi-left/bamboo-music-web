const default_page = "search";
const PAGESIZE = 20;
const BAMBOOMUSIC = {
    version: "v1.1"
}
// audio: 普通
// playlist: 播放列表（比如专辑） 
// video: 视频
const DEFAULT_FALLBACK = { data: { total: 0, list: [] } };
const localUrlRoot = "./apis/local/";
const videoUrlRoot = "./apis/video/";
const onlineAUrlRoot = "./apis/onlinea/";
const onlineBUrlRoot = "./apis/onlineb/";
const FALLBACK_BACKGROUND = "./static/img/default.jpg";
const search_types = [
    { "name": "音频", "id": "audio", "type": "audio" },
    { "name": "专辑", "id": "album", "type": "playlist" },
    { "name": "视频", "id": "video", "type": "video" },
    { "name": "在线A", "id": "onlinea", "type": "audio" },
    { "name": "在线B", "id": "onlineb", "type": "audio" }
]

// 建议词补全，${KEY}替代搜索内容
function get_api_suggest_key(type) {
    switch (type) {
        case 'audio':
        // console.log(type);
        case 'album':
            return localUrlRoot + "local.php?type=suggestKey&value=${KEY}";
        case 'video':
            return videoUrlRoot + "video.php?type=suggestKey&value=${KEY}";
        case 'onlinea':
            return onlineBUrlRoot + "main.php?type=suggestKey&value=${KEY}"
        case 'onlineb':
            return onlineBUrlRoot + "main.php?type=suggestKey&value=${KEY}"
    }
    return localUrlRoot + "local.php?type=suggestKey&value=${KEY}";
}

const allow_Kuroshiro = true;
const Kuroshiro_lib_url = "/kuromoji";

// 传入搜索词
function get_api_url(key, typeid, page) {
    key = encodeURIComponent(key);
    if (typeid == 'audio') {
        return localUrlRoot + `local.php?type=search&value=${key}&offset=${page}&limit=${PAGESIZE}`;
    } else if (typeid == 'video') {
        return videoUrlRoot + `video.php?type=searchAlarm&value=${key}&offset=${page}&limit=${PAGESIZE}`;
    } else if (typeid == 'album') {
        return localUrlRoot + `local.php?type=searchAlarm&value=${key}&offset=${page}&limit=${PAGESIZE}`;
    } else if (typeid == 'onlinea') {
        return onlineAUrlRoot + `onlinea.php?type=search&value=${key}&offset=${page}&limit=${PAGESIZE}`;
    } else if (typeid == 'onlineb') {
        return onlineBUrlRoot + `main.php?type=search&value=${key}&offset=${page}&limit=${PAGESIZE}`;
    }
    return localUrlRoot + `local.php?type=searchAlarm&value=&offset=${page}&limit=${PAGESIZE}`;
}

function get_api_play_url(id, type) {
    if (id != undefined) {
        id = "" + id;
        switch (id.substring(0, 2)) {
            case 'A_':
                switch (type) {
                    case 'music':
                        return (`${onlineAUrlRoot}onlinea.php?type=url&value=${id}`);
                    case 'video':
                        return (`${onlineAUrlRoot}videourl.php?type=mv&value=${id}`);
                }
            case 'B_':
                switch (type) {
                    case 'music':
                        return (`${onlineBUrlRoot}main.php?type=url&value=${id}`);
                    case 'video':
                        return (`${onlineBUrlRoot}main.php?type=mv&value=${id}`);
                }
            case 'V_':
                return (`${videoUrlRoot}video.php?type=url&value=${id}`);
            default:
                switch (type) {
                    case 'music':
                        return (`${localUrlRoot}local.php?type=url&value=${id}`);
                    case 'video':
                        return (`${localUrlRoot}local.php?type=mv&value=${id}`);
                }
        }
    }

}

function get_api_info(id, type) {
    if (id != undefined) {
        id = "" + id;
        switch (id.substring(0, 2)) {
            case 'A_':
                return (`${onlineAUrlRoot}onlinea.php?type=info&value=${id}`);
            case 'B_':
                return (`${onlineBUrlRoot}main.php?type=info&value=${id}`);
            case 'V_':
                return (`${videoUrlRoot}video.php?type=info&value=${id}`);
            default:
                return (`${localUrlRoot}local.php?type=info&value=${id}`);
        }
    }
    return (`${localUrlRoot}local.php?type=info&value=${id}`);
}

function get_api_content(key, typeid, offset) {
    return { "data": { "total": 0, "list": [] } };
}

function get_api_suggest_url(sid, albumid, type, pageid) {
    albumid = "" + albumid;
    try {
        if (albumid.substring(0, 2) == 'A_' || albumid.substring(0, 2) == 'B_') return "./apis/none.php";
    } catch (e) {
        console.warn(e);
    }
    if (type == 'video') {
        if (albumid.substring(0, 2) == 'V_') return `${videoUrlRoot}video.php?type=album&value=${albumid}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`;
        return (`${localUrlRoot}local.php?type=album&value=${albumid}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`);
    }
}

function get_api_alarm_list(albumid, pageid, type = "playlist") {
    try {
        albumid = "" + albumid;
        switch (albumid.substring(0, 2)) {
            case 'A_':
                switch (type) {
                    case 'album':
                        return (`${onlineAUrlRoot}album.php?type=album&value=${albumid}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`);
                    case 'playlist':
                        return (`${onlineAUrlRoot}playlist.php?type=playlist&value=${albumid}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`);
                    case 'singer':
                        return (`${onlineAUrlRoot}singer.php?type=singer&value=${encodeURIComponent(albumid)}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`);
                    case 'keyword':
                        return (`${onlineAUrlRoot}search.php?type=search&value=${encodeURIComponent(albumid)}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`);
                }
            case 'B_':
                switch (type) {
                    case 'album':
                        return (`${onlineBUrlRoot}main.php?type=album&value=${albumid}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`);
                    case 'playlist':
                        return (`${onlineBUrlRoot}main.php?type=playlist&value=${albumid}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`);
                    case 'singer':
                        return (`${onlineBUrlRoot}main.php?type=singer&value=${encodeURIComponent(albumid)}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`);
                    case 'keyword':
                        return (`${onlineBUrlRoot}main.php?type=search&value=${encodeURIComponent(albumid)}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`);
                }
            case 'V_':
                switch (type) {
                    case 'album':
                        return (`${videoUrlRoot}video.php?type=album&value=${albumid}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`);
                    case 'playlist':
                        return (`${videoUrlRoot}video.php?type=playlist&value=${albumid}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`);
                    case 'singer':
                        return (`${videoUrlRoot}video.php?type=singer&value=${encodeURIComponent(albumid)}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`);
                    case 'keyword':
                        return (`${videoUrlRoot}video.php?type=search&value=${encodeURIComponent(albumid)}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`);
                }
            default:
                switch (type) {
                    case 'album':
                        return (`${localUrlRoot}local.php?type=album&value=${albumid}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`);
                    case 'playlist':
                        return (`${localUrlRoot}local.php?type=playlist&value=${albumid}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`);
                    case 'singer':
                        return (`${localUrlRoot}local.php?type=singer&value=${encodeURIComponent(albumid)}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`);
                    case 'keyword':
                        return (`${localUrlRoot}local.php?type=search&value=${encodeURIComponent(albumid)}&offset=${pageid}&stype=${type}&limit=${PAGESIZE}`);
                }
        }

    } catch (e) {
        console.error(e);
        return "";
    }
}

function get_api_default_list(page = 0, count = PAGESIZE) {
    return `${localUrlRoot}local.php?type=random&value=${count}&seed=${page}&offset=${page}`;
}