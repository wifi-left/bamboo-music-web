<?php
include("./listfiles.php");
include("../onlinea/libs.php");
Header("content-type: text/json", true);
function loadPath2Url()
{
    if (is_file("../cache/location2url.json.bamboomusic")) {
        $myfile = fopen("../cache/location2url.json.bamboomusic", "r") or send_error("无法读取文件列表。");
        $flength = filesize("../cache/location2url.json.bamboomusic");
        if ($flength > 0) {
            $contentF = fread($myfile, $flength);
        } else {
            $contentF = '[]';
        }
        fclose($myfile);
    } else {
        $contentF = '[]';
    }
    return json_decode($contentF);
}
if (empty($_GET['type'])) {
    echo '{"success":"fail","code":404,"message":"缺少请求参数。","code":1}';
    return;
}
if (empty($_GET['value'])) {
    $value = "";
} else {
    $value = $_GET['value'];
}
$type = $_GET['type'];
if ($type == 'url')
    include("../onlinea/url.php");
$offset = 0;
$limit = 10;
if (!empty($_GET['offset'])) {
    $offset = (int)$_GET['offset'];
}
if (!empty($_GET['limit'])) {
    $limit = (int)$_GET['limit'] / 3;
}
$format = "mp3";
if (!empty($_GET['format'])) {
    $format = $_GET['format'];
}
function wSearchAlbum($value, $limit, $offsets)
{
    $value = str_replace("B_", "", $value);

    $text = (fetchURL2("http://music.163.com/api/album/$value?limit=$limit&offset=$offsets", false));
    if ($text == false) return;

    $json = json_decode($text);
    $result = json_decode('{"data":{"list":[]},"total":0}');
    if (empty($json->album->songs)) {
        echo $text;
        // echo "empty";
        return;
    }
    if (!empty($json->album->size)) {
        $result->data->total = $json->album->size;
    }
    $songsarr = $json->album->songs;
    for ($i = 0; $i < count($songsarr); $i++) {
        $line = json_decode('{"id":0,"addition":"","artist":"","name":"","album":"","albumid":"","artistid":"","releaseDate":null}');
        $song = $songsarr[$i];
        if (!empty($song->name)) {
            $line->name = "[在线B] " . $song->name;
        }
        if (!empty($song->id)) {
            $line->id = 'B_' . $song->id;
        }
        if (!empty($song->fee)) {
            if ($song->fee == 1) {
                $line->addition = "[可能无法播放]";
            }
        }
        if (!empty($song->artists)) {
            $artistname = "";
            $artistid = "";
            for ($j = 0; $j < count($song->artists); $j++) {
                $tmp = $song->artists[$j];
                $artistid = $song->artists[0]->id;
                $artistname = $artistname . ($artistname == "" ? "" : "&") . $tmp->name;
            }
            $line->artist = $artistname;
            $line->artistid = 'B_' . $artistid;
        }
        if (!empty($song->album)) {
            $album = $song->album;
            if (!empty($album->name)) {
                $line->album = $album->name;
            }
            if (!empty($album->id)) {
                $line->albumid = 'B_' . $album->id;
            }
            if (!empty($album->picUrl)) {
                $line->pic = $album->picUrl;
            }
            if (!empty($album->publishTime)) {
                $line->releaseDate = timeToTime($album->publishTime);
            }
        }
        $result->data->list[] = $line;
    }
    return json_encode($result);
}
function wSongurl($value)
{
    $value = str_replace("B_", "", $value);
    $text = (fetchURL2("https://music.163.com/api/song/enhance/player/url?id=&ids=[$value]&br=320000", false, ""));
    $datas = json_decode($text)->data;
    $html = $datas[0]->url;
    if ($html == "" || $html == null) {
        echo '{"success":"fail","msg":"歌曲不存在！","code":5}';
        http_response_code(404);
    }
    return $html;
}
function wSongInfo($value)
{
    $value = str_replace("B_", "", $value);
    $result = json_decode('{"data":{"lrc":"","info":{}}}');
    $tmp = json_decode(fetchURL2("http://music.163.com/api/song/lyric?os=pc&id=$value&lv=-1&kv=-1&tv=-1", false, ""));
    if (empty($tmp->lrc)) {
        echo '{"success":"fail","msg":"404 - 歌曲不存在","code":1}';
        http_response_code(404);
        return;
    }
    $lrcori1 = "";
    $lrctran = "";
    if (!empty($tmp->lrc->lyric))
        $lrcori1 = ($tmp->lrc->lyric);
    if (!empty($tmp->tlyric->lyric))
        $lrctran = ($tmp->tlyric->lyric);
    $lrcori = LRCTOOBJ($lrcori1);
    $lrctrans = LRCTOOBJ($lrctran);
    $lrc = mergeTranslate($lrcori, $lrctrans);
    $lrctext = OBJtoTextLrc($lrc);
    $song = json_decode(fetchURL("http://music.163.com/api/song/detail/?ids=[$value]", false, ""))->songs[0];
    $line = json_decode('{"id":0,"addition":"","artist":"","name":"","album":"","albumid":"","artistid":"","releaseDate":null}');
    if (!empty($song->name)) {
        $line->name = $song->name;
        // $line->songName = $song->name;
    }
    if (!empty($song->id)) {
        // $line->rid = $song->id;
        $line->id = "B_" . $song->id;
        // $line->musicrid = "B_" . $song->id;
    }
    if (!empty($song->fee)) {
        if ($song->fee == 1) {
            $line->addition = "[可能无法播放]";
        }
    }
    if (!empty($song->artists)) {
        $artistname = "";
        $artistid = "";
        if (count($song->artists) > 0) {
            $artistid = "B_" . $song->artists[0]->id;
        }
        for ($j = 0; $j < count($song->artists); $j++) {
            $tmp = $song->artists[$j];
            $artistname = $artistname . ($artistname == "" ? "" : "&") . $tmp->name;
        }
        $line->artist = $artistname;
        $line->artistid = $artistid;
    }
    if (!empty($song->album)) {
        $album = $song->album;
        if (!empty($album->name)) {
            $line->album = $album->name;
        }
        if (!empty($album->id)) {
            $line->albumid = "B_" . $album->id;
        }
        if (!empty($album->picUrl)) {
            $line->pic = $album->picUrl;
        }
        if (!empty($album->publishTime)) {
            $line->releaseDate = timeToTime($album->publishTime);
        }
    }
    $result->data->info = $line;
    $result->data->lrc = $lrctext;
    $html = json_encode($result);
    return $html;
}
function songinfo($id)
{
    $url = "https://www.kuwo.cn/newh5/singles/songinfoandlrc?musicId=$id&httpsStatus=1";
    $res = (fetchURL($url));
    $output = json_decode('{"data":{"info":{"id":0,"name":"Unknown","artist":"Unkown","releaseDate":null,"pic":null},"lrc":""}}');
    $output->data->info->id = $id;
    if ($res != false) {
        $res = json_decode($res);
        $lrctext = OBJtoTextLrc($res->data->lrclist);
        $output->data->lrc = $lrctext;
        $output->data->info->album = $res->data->songinfo->album;
        $output->data->info->artist = $res->data->songinfo->artist;
        $output->data->info->artistid = $res->data->songinfo->artistId;
        $output->data->info->albumid = $res->data->songinfo->albumId;
        $output->data->info->name = $res->data->songinfo->songName;
        $output->data->info->pic = $res->data->songinfo->pic;
    }
    return $output;
}
function songurl($id)
{
    $url = getMusicUrlUrl($id, $GLOBALS['format']);
    $return = fetchURL($url, false, "", 8, "curl/8.0.1", true);
    $a = strpos($return, "url=") + 4;
    $b =  strpos($return, "\r\n", $a);
    $length = $b - $a;
    $out = substr($return, $a, $length);
    return $out;
}
// $url = str_replace("\~", "%7E", $url);
$headers = "";
$value = urldecode($value);
if ($type != 'alarm') {
    if ($offset < 1) $offset = 1;
    if ($limit < 1) $offset = 10;
} else {
    if ($offset < 0) $offset = 0;
    if ($limit < 1) $offset = 10;
}

$page = (int)$offset - 1;
$offsets = ((int)$offset - 1) * ((int)$limit);
$html = "";
$result = json_decode('{}');
if (substr($value, 0, 6) == 'MUSIC_') {
    $value = substr($value, 6);
}
function searchSong($value)
{
    $offsets = $GLOBALS['offsets'];
    $result = json_decode('{"data":{"total":0,"list":[]}}');
    $file = fopen("../cache/location.txt.bamboomusic", "r");
    $keyword = $value;
    //检测指正是否到达文件的未端

    while (!feof($file)) {
        $path = fgets($file);
        // echo "<h1>$path</h1>";
        scanAllFile(trim($path), $keyword);
    }
    // saveId();

    fclose($file);
    // echo json_encode($files);
    foreach ($GLOBALS['files'] as $valued) {
        // $line->data[] = $value->filename;
        $res = $valued->path;
        $line = json_decode('{"id":0,"addition":"","artist":"","name":"","album":"","albumid":"","pic":"","artistid":"","releaseDate":null}');
        $filewithoutext = substr($res, 0, strrpos($res, "."));
        $mvres = $filewithoutext . '.mp4';
        if (is_file($mvres)) {
            $line->hasMv = 1;
        }
        $filebasename = basename($filewithoutext);
        $filepath = dirname($res);
        $musicid = $valued->id;
        $cover = $valued->cover;
        $pathid = getId($filepath);
        $singer = substr($filebasename, 0, strpos($filebasename, " - "));
        if ($singer == "") $singer = "匿名";
        if (strpos($filebasename, " - ") != false)
            $songname = substr($filebasename, strpos($filebasename, " - ") + 3);
        else $songname = $filebasename;
        // echo strpos($res, " - ");
        if ($cover != -1) {
            $line->pic = "./apis/local/cover.php?id=" . $cover;
        }
        if (!empty($songname)) {
            $line->name = "[存储] " . $songname;
        }
        if (!empty($musicid)) {
            $line->id = $musicid;
        }
        if (!empty($singer)) {
            $line->artist = $singer;
            $line->artistid = base64_encode($singer);
        }
        if (!empty($pathid)) {
            $line->album = getDirAlName($filepath);
            $line->albumid = $pathid;
        }
        // $result->data->songinfo = $line;
        $result->data->list[] = $line;
        // echo json_encode($line);
    }
    $value = urlencode($value);
    $limit = $GLOBALS['limit'];
    $offset = $GLOBALS['page'];
    $url = "https://search.kuwo.cn/r.s?pn=$offset&rn=$limit&all=$value&ft=music&newsearch=1&alflac=1&itemset=web_2013&client=kt&cluster=0&vermerge=1&rformat=json&encoding=utf8&show_copyright_off=1&pcmp4=1&ver=mbox&plat=pc&vipver=MUSIC_9.2.0.0_W6&devid=11404450&newver=1&issubtitle=1&pcjson=1";
    $res = fetchURL($url);
    //abslist
    if ($res != false) {
        $res = json_decode($res);
        $lists = $res->abslist;
        for ($i = 0; $i < count($lists); $i++) {
            $line = json_decode('{"id":0,"name":"Unknown","artist":"Unkown","releaseDate":null,"pic":null}');
            $line->name = "[在线A] " . $lists[$i]->NAME;
            $line->artist = $lists[$i]->ARTIST;
            $line->artistid = $lists[$i]->ARTISTID;
            $line->album = $lists[$i]->ALBUM;
            $line->albumid = $lists[$i]->ALBUMID;
            $line->pic = $lists[$i]->ALBUMID;
            $id = $lists[$i]->MUSICRID;
            if (substr($id, 0, 6) == 'MUSIC_') {
                $id = substr($id, 6);
            }
            $line->id = "O_" . $id;
            $result->data->list[] = $line;
        }
    }
    $text = (fetchURL2("http://music.163.com/api/search/pc?s=$value&limit=$limit&offset=$offsets&type=1", false));
    if ($text != false) {
        $json = json_decode($text);
        if (!empty($json->result->songs)) {
            if (!empty($json->result->songCount)) {
                $result->data->total = $json->result->songCount;
            }
            $songsarr = $json->result->songs;
            for ($i = 0; $i < count($songsarr); $i++) {
                $line = json_decode('{"id":"0","addition":"","artist":"","name":"","album":"","albumid":"","pic":"","artistid":"","releaseDate":null}');
                $song = $songsarr[$i];
                if (!empty($song->name)) {
                    $line->name = "[在线B] " . $song->name;
                }
                if (!empty($song->id)) {
                    $line->id = "B_" . $song->id;
                }
                if (!empty($song->fee)) {
                    if ($song->fee == 1) {
                        $line->addition = "[可能无法播放]";
                        $line->name .= "§c[可能无法播放]§r";
                    }
                }
                if (!empty($song->artists)) {
                    $artistname = "";
                    $artistid = "";
                    for ($j = 0; $j < count($song->artists); $j++) {
                        $tmp = $song->artists[$j];
                        $artistid = 'B_' . $song->artists[0]->id;
                        $artistname = $artistname . ($artistname == "" ? "" : "&") . $tmp->name;
                    }
                    $line->artist = $artistname;
                    $line->artistid = $artistid;
                }
                if (!empty($song->album)) {
                    $album = $song->album;
                    if (!empty($album->name)) {
                        $line->album = $album->name;
                    }
                    if (!empty($album->id)) {
                        $line->albumid = 'B_' . $album->id;
                    }
                    if (!empty($album->picUrl)) {
                        $line->pic = $album->picUrl;
                    }
                    if (!empty($album->publishTime)) {
                        $line->releaseDate = timeToTime($album->publishTime);
                    }
                }
                $result->data->list[] = $line;
            }
        }
    }
    $result->data->total = count($result->data->list) + 1;
    // $result->data->lrclist = $lrc;
    $GLOBALS['result'] = $result;
}
$seed = 1;
if (!empty($_GET['seed'])) $seed = $_GET['seed'];
// echo strtotime("2022-17-12");
$seed = strtotime(date('Y-m-d')) . $seed;
// echo $offsets;
switch ($type) {
    case 'info':
        if (substr($value, 0, 2) == 'O_') {
            $value = substr($value, 2);
            $html = json_encode(songinfo($value));
        } else if (substr($value, 0, 2) == 'B_') {
            $value = substr($value, 2);
            $html = (wSongInfo($value));
        } else {
            $result = json_decode('{"data":{"info":{}}}');
            $getLrc = true;
            if (!empty($_GET['lrc'])) {
                if ($_GET['lrc'] == 'false') {
                    $getLrc = false;
                }
            }
            $res = getSongPath($value);
            if ($res == false) {
                echo '{"code":404,"msg":"404 - 此歌曲不存在"}';
                http_response_code(200);
                return;
            }
            $filewithoutext = substr($res, 0, strrpos($res, "."));
            $lrcres = $filewithoutext . '.lrc';
            $mvres = $filewithoutext . '.mp4';
            if ($getLrc) {
                if (is_file($lrcres)) {
                    $lrctext = file_get_contents($lrcres);

                    $charset = mb_detect_encoding($lrctext, array('UTF-8', 'GBK', 'GB2312'));
                    $charset = strtolower($charset);
                    if ('cp936' == $charset) {
                        $charset = 'GBK';
                    }
                    $lrcstr = $lrctext;
                    if ("utf-8" != $charset) {
                        $lrcstr = iconv($charset, "UTF-8//IGNORE", $lrctext);
                    }
                    // return $str; 
                } else {
                    $lrcstr = "";
                }
                $lrc = ($lrcstr);
            }


            $line = json_decode('{"id":0,"addition":"","artist":"","name":"","album":"","albumid":"","artistid":"","releaseDate":null,"pic":null}');
            if (is_file($mvres)) {
                $line->hasMv = 1;
            }
            $filebasename = basename($filewithoutext);
            $filepath = dirname($res);
            $musicid = getId($res);
            $pathid = getId($filepath);
            $singer = substr($filebasename, 0, strpos($filebasename, " - "));
            if ($singer == "") {
                $singer = "匿名";
            }
            if (strpos($filebasename, " - ") != false)
                $songname = substr($filebasename, strpos($filebasename, " - ") + 3);
            else $songname = $filebasename;
            // echo strpos($res, " - ");
            $cover = -1;
            if (file_exists($filepath . "\\" . "cover.png")) {
                $cover = getId($filepath . "\\" . "cover.png");
            } else if (file_exists($filepath . "\\" . "cover.jpg")) {
                $cover = getId($filepath . "\\" . "cover.jpg");
            }
            $uri = $_SERVER['REQUEST_URI'];
            $protocol = ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
            $url = $protocol . $_SERVER['HTTP_HOST'] . $uri;
            if ($cover != -1)
                $line->pic = dirname($url) . "/cover.php?id=" . $cover;
            else
                $line->pic = dirname(dirname(dirname($url))) . "/static/img/default_cd_old_.png";
            if (!empty($songname)) {
                $line->name = $songname;
            }
            if (!empty($musicid)) {
                $line->id = $musicid;
            }
            if (!empty($singer)) {
                $line->artist = $singer;
                $line->artistid = base64_encode($singer);
            }
            if (!empty($pathid)) {
                $line->album = getDirAlName($filepath);
                $line->albumid = $pathid;
            }

            $result->data->info = $line;
            if ($getLrc)
                $result->data->lrc = $lrc;
            $html = json_encode($result);
        }
        break;
    case 'album':
        if (substr($value, 0, 2) == 'B_') {
            $value = substr($value, 2);
            $html = (wSearchAlbum($value, $limit, $offsets));
        } else {
            $result = json_decode('{"total":0,"list":[]}');
            $file = fopen("../cache/location.txt.bamboomusic", "r");
            $keyword = "";
            //检测指正是否到达文件的未端
            $path = getSongPath($value);
            if ($path == false) {
                echo '{"code":404,"msg":"404 - 此专辑不存在"}';
                http_response_code(200);
                return;
            }
            // $page += 1;
            // $offset;
            scanAllFile(trim($path), $keyword);
            fclose($file);
            $albumname = "";
            // echo json_encode($files);
            foreach ($files as $valued) {
                // $line->data[] = $value->filename;
                $res = $valued->path;
                $line = json_decode('{"id":0,"addition":"","artist":"","name":"","album":"","albumid":"","albumpic":"","artistid":"","releaseDate":null,"pic":null}');
                $filewithoutext = $valued->filename;
                $filebasename = basename($filewithoutext);
                $filepath = dirname($res);
                $musicid = $valued->id;
                $pathid = getId($filepath);
                $cover = -1;
                $mvres = $filepath . '\\' . $filewithoutext . '.mp4';
                if (is_file($mvres)) {
                    $line->hasMv = 1;
                }
                $cover = $valued->cover;
                if ($cover != -1) {
                    $line->pic = "./apis/local/cover.php?id=" . $cover;
                }
                $singer = substr($filebasename, 0, strpos($filebasename, " - "));
                if (strpos($filebasename, " - ") != false)
                    $songname = substr($filebasename, strpos($filebasename, " - ") + 3);
                else $songname = $filebasename;
                // echo strpos($res, " - ");
                if (!empty($songname)) {
                    $line->name = $songname;
                }
                if (!empty($musicid)) {
                    $line->id = $musicid;
                }
                if (!empty($singer)) {
                    $line->artist = $singer;
                    $line->artistid = base64_encode($singer);
                }
                if (!empty($pathid)) {
                    $line->album = getDirAlName($filepath);
                    $albumname = $line->album;
                    $line->albumid = $pathid;
                }
                // $result->data->songinfo = $line;
                $result->list[] = $line;
                // echo json_encode($line);
            }
            // saveId();
            // $result->data->lrclist = $lrc;
            $result->total = $total;
            $result->name = $albumname;
            $resu = json_decode('{"data":{}}');
            $resu->data = $result;
            $html = json_encode($resu);
            // http_response_code(200);
        }
        break;
    case 'url':
        if (substr($value, 0, 2) == 'O_') {
            $value = substr($value, 2);
            $html = songurl($value);
        } else if (substr($value, 0, 2) == 'B_') {
            $value = substr($value, 2);
            $html = (wSongurl($value));
        } else {
            $res = getSongPath($value);
            if ($res == false) {
                echo '{"code":404,"msg":"404 - 此歌曲不存在"}';
                http_response_code(404);
                return;
            }
            $l2ulist = loadPath2Url();
            for ($i = 0; $i < count($l2ulist); $i++) {
                $ll = $l2ulist[$i];
                if (substr($res, 0, strlen($ll->path)) == $ll->path) {
                    // echo ;
                    // break;
                    echo ($ll->url . (str_replace("\\", "/", substr($res, strlen($ll->path)))));

                    return;
                }
            }
            $uri = $_SERVER['REQUEST_URI'];

            $protocol = ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";

            $url = $protocol . $_SERVER['HTTP_HOST'] . $uri;
            $html = dirname($url) . "/getlocalmusic.php?id=" . $value . "&type=music";
            // echo $html;
        }
        break;
    case 'search':
        searchSong($value);
        $html = json_encode($result);
        // saveId();

        break;
    default:
        echo '{"success":"fail","code":404,"message":"未知的参数","code":1}';
        http_response_code(200);
        return;
}
// saveId();

echo $html;
