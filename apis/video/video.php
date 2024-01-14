<?php
include("./listfiles.php");
include("./libs.php");
// $l2ulist = array();
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
    // echo $contentF;
    // exit(0);
}
Header("content-type: text/json", true);
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
$offset = 0;
$limit = 10;
if (!empty($_GET['offset'])) {
    $offset = (int)$_GET['offset'];
}
if (!empty($_GET['limit'])) {
    $limit = (int)$_GET['limit'];
}
// $limit = 10;
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
if (substr($value, 0, 2) == 'V_') {
    $value = substr($value, 2);
}
function searchSong($value)
{
    $result = json_decode('{"data":{"total":0,"list":[]}}');
    $file = fopen("../cache/vlocation.txt.bamboomusic", "r");
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
        $line = json_decode('{"id":0,"addition":"","artist":"","name":"","album":"","albumid":"","pic":"","artistid":"","releaseDate":null,"hasMv":1,"hasAudio":0}');
        $filewithoutext = substr($res, 0, strrpos($res, "."));
        $mvres = $filewithoutext . '.mp3';
        if (is_file($mvres)) {
            $line->hasAudio = 1;
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
            $line->pic = "./apis/video/cover.php?id=" . $cover;
        }
        if (!empty($songname)) {
            $line->name = $songname;
        }
        if (!empty($musicid)) {
            $line->id = 'V_' . $musicid;
        }
        if (!empty($singer)) {
            $line->artist = $singer;
            $line->artistid = 'V_' . base64_encode($singer);
        }
        if (!empty($pathid)) {
            $line->album = getDirAlName($filepath);
            $line->albumid = 'V_' . $pathid;
        }
        // $result->data->songinfo = $line;
        $result->data->list[] = $line;
        // echo json_encode($line);
    }
    // $result->data->lrclist = $lrc;
    $result->data->total = $GLOBALS['total'];
    $GLOBALS['result'] = $result;
}
$seed = 1;
if (!empty($_GET['seed'])) $seed = $_GET['seed'];
// echo strtotime("2022-17-12");
$seed = strtotime(date('Y-m-d')) . $seed;
// echo $offsets;
switch ($type) {
    case 'random':
        // echo $seed;
        // return;

        $result = json_decode('{"seed":"","total":30,"data":{"total":30,"list":[]}}');
        $result->seed = $seed;
        $count = $value;
        // echo $value == null;
        $tmp = $idcaches->all_ids;
        if (count($tmp) <= 0) {
            $result->total = count($tmp);
            echo (json_encode($result));
            return;
        }
        if ($count == null || $count == "" || $count == 0) $count = 10;
        for ($iii = 0; $iii < $count; $iii++) {
            if ($GLOBALS['seed'] != 0) mt_srand($seed + $iii * $iii * 11);

            $rdnum = mt_rand(0, count($tmp) - 1);
            $resid = $tmp[$rdnum];
            // echo $idcaches_OBJ['1'];
            // return;
            // echo json_encode($idcaches_OBJ);
            // return;
            if (!is_numeric($resid)) echo $resid;
            $res = getSongPath($resid);
            // $res = getSongPath($value);
            if ($res != false && $res != "") {
                $line = json_decode('{"id":0,"addition":"","artist":"","name":"","album":"","albumid":"","artistid":"","releaseDate":null,"hasMv":1,"hasAudio":0}');
                $filewithoutext = substr($res, 0, strrpos($res, "."));
                $mvres = $filewithoutext . '.mp3';
                if (is_file($mvres)) {
                    $line->hasAudio = 1;
                }
                $filebasename = basename($filewithoutext);
                $filepath = dirname($res);
                $musicid = $resid;
                $pathid = getId($filepath);
                $singer = substr($filebasename, 0, strpos($filebasename, " - "));
                if ($singer == "") $singer = "匿名";
                if (strpos($filebasename, " - ") != false)
                    $songname = substr($filebasename, strpos($filebasename, " - ") + 3);
                else $songname = $filebasename;
                // echo strpos($res, " - ");
                if (!empty($songname)) {
                    $line->name = $songname;
                }
                if (!empty($musicid)) {
                    $line->id = 'V_' . $musicid;
                }
                if (!empty($singer)) {
                    $line->artist = $singer;
                    $line->artistid = 'V_' . base64_encode($singer);
                }
                if (!empty($pathid)) {
                    $line->album = getDirAlName($filepath);
                    $line->albumid = 'V_' . $pathid;
                }
                // $result->data->songinfo = $line;
                $result->data->list[] = $line;
                // echo json_encode($line);
            }
        }
        // saveId();
        // $result->data-
        $html = json_encode($result);
        break;
    case 'getid':
        $html = getSongPath($value);
        if ($html == false) {
            $html = json_decode('{"code":404,"msg":"404 - 此歌曲不存在"}');
            $html->msg = "404 - $value 不存在！";
            echo json_encode($html);
            http_response_code(200);
            return;
        }
        break;
    case 'info':
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
        $mvres = $filewithoutext . '.mp3';
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


        $line = json_decode('{"id":0,"addition":"","artist":"","name":"","album":"","albumid":"","artistid":"","releaseDate":null,"pic":null,"hasMv":1,"hasAudio":0}');
        $line->hasMv = 1;
        if (!is_file($mvres)) {
            $line->hasAudio = 0;
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
        if ($cover != -1) {
            $line->pic = "./apis/video/cover.php?id=" . $cover;
        }
        if (!empty($songname)) {
            $line->name = $songname;
        }
        if (!empty($musicid)) {
            $line->id = 'V_' . $musicid;
        }
        if (!empty($singer)) {
            $line->artist = $singer;
            $line->artistid = 'V_' . base64_encode($singer);
        }
        if (!empty($pathid)) {
            $line->album = getDirAlName($filepath);
            $line->albumid = 'V_' . $pathid;
        }

        $result->data->info = $line;
        if ($getLrc)
            $result->data->lrc = $lrc;
        $html = json_encode($result);
        break;
    case 'suggestKey':
        $line = json_decode('{"code":200,"data":[]}');
        $keyword = $value;
        //检测指正是否到达文件的未端
        loadPathNames();
        $list = array();
        $count = 0;
        $limit = 10;
        if ($GLOBALS['pathnames'] != null) {
            foreach ($GLOBALS['pathnames'] as $vvalue) {
                $count++;
                $ele = $vvalue;
                $pps = $ele->path;

                if ($ele->name == "") $ele->name = dirname($pps);
                $pid = getId($pps);
                if (stristr($ele->name, $value) == false && $pid != $value) continue;
                $list[] = $ele->name;
                if ($count >= $limit) {
                    break;
                }
            }
            $line->data = $list;
        }
        // saveId();
        echo json_encode($line);
        break;
    case 'playlist':
    case 'album':
        $result = json_decode('{"total":0,"list":[]}');
        $file = fopen("../cache/vlocation.txt.bamboomusic", "r");
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
        // echo json_encode($files);
        foreach ($files as $valued) {
            // $line->data[] = $value->filename;
            $res = $valued->path;
            $line = json_decode('{"id":0,"addition":"","artist":"","name":"","album":"","albumid":"","albumpic":"","artistid":"","releaseDate":null,"pic":null,"hasMv":1,"hasAudio":0}');
            $filewithoutext = $valued->filename;
            $filebasename = basename($filewithoutext);
            $filepath = dirname($res);
            $musicid = $valued->id;
            $pathid = getId($filepath);
            $cover = -1;
            $mvres = $filepath . '\\' . $filewithoutext . '.mp3';
            $line->hasMv = 1;
            if (is_file($mvres)) {
                $line->hasAudio = 1;
            }
            $cover = $valued->cover;
            if ($cover != -1) {
                $line->pic = "./apis/video/cover.php?id=" . $cover;
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
                $line->id = 'V_' . $musicid;
            }
            if (!empty($singer)) {
                $line->artist = $singer;
                $line->artistid = 'V_' .  base64_encode($singer);
            }
            if (!empty($pathid)) {
                $line->album = getDirAlName($filepath);
                $line->albumid = 'V_' . $pathid;
            }
            // $result->data->songinfo = $line;
            $result->list[] = $line;
            // echo json_encode($line);
        }
        // saveId();
        // $result->data->lrclist = $lrc;
        $result->total = $total;
        $resu = json_decode('{"data":{}}');
        $resu->data = $result;
        $html = json_encode($resu);
        // http_response_code(200);
        break;
    case 'audio':
        $res = getSongPath($value);
        if ($res == false) {
            echo '{"code":404,"msg":"404 - 此歌曲不存在"}';
            http_response_code(200);
            return;
        }
        $l2ulist = loadPath2Url();
        for ($i = 0; $i < count($l2ulist); $i++) {
            $ll = $l2ulist[$i];
            if (substr($res, 0, strlen($ll->path)) == $ll->path) {
                // echo ;
                // break;
                echo $ll->url . (str_replace("\\", "/", substr($res, strlen($ll->path))));
                return;
            }
        }
        $html = "./apis/video/getlocalmusic.php?type=music&id=" . $value;
        break;
    case 'url':

        $res = getSongPath($value);
        if ($res == false) {
            echo '{"code":404,"msg":"404 - 此歌曲不存在"}';
            http_response_code(200);
            return;
        }
        $l2ulist = loadPath2Url();
        for ($i = 0; $i < count($l2ulist); $i++) {
            $ll = $l2ulist[$i];
            if (substr($res, 0, strlen($ll->path)) == $ll->path) {
                // echo ;
                // break;
                echo $ll->url . (str_replace("\\", "/", substr($res, strlen($ll->path))));
                return;
            }
        }
        $html = "./apis/video/getlocalmusic.php?id=" . $value . "&type=video";
        // echo $html;
        break;
    case 'singer':
        $resu = json_decode('{"data":{"list":[],"total":0}}');
        //不break，进入search
        $valued = base64_decode(str_replace(" ", "+", $value));
        if ($valued != false)
            $value = $valued;
        searchSong($value);
        $resu->data->list = $result->data->list;
        $resu->data->total = $result->data->total;
        $html = json_encode($resu);
        // saveId();

        break;
    case 'search':
        searchSong($value);
        $html = json_encode($result);
        // saveId();

        break;
    case 'folder':
        $file = fopen("../cache/vlocation.txt.bamboomusic", "r");
        $result = json_decode('{"data":{"list":[]}}');
        while (!feof($file)) {
            $path = trim(fgets($file));
            if (trim($path) == '') continue;
            // echo "<h1>$path</h1>";
            $line = json_decode('{"name":"","uname":"","userName":"","id":""}');
            $pathid = getId($path);
            $line->id = 'V_' . $pathid;
            $line->name = getDirAlName(trim($path));
            $line->uname = "Local";
            $line->userName = "Local";
            $result->data->list[] = $line;
            // scanAllFile(trim($path), $keyword);
        }
        // saveId();

        $html = json_encode($result);
        fclose($file);
        // saveId();
        break;
    case 'searchAlarm':
        $resu = json_decode('{"data":{"list":[],"total":0,"pic":null}}');
        loadPathNames();
        $list = array();
        $count = 0;
        $skipcount = 0;
        $total = 1;
        if ($GLOBALS['pathnames'] != null) {
            foreach ($GLOBALS['pathnames'] as $vvalue) {

                $skipcount++;
                if ($skipcount < ($offset - 1) * $limit + 1) continue;
                $count++;
                $line = json_decode('{"name":"","id":"1"}');
                $ele = $vvalue;
                $pps = $ele->path;

                if ($ele->name == "") $ele->name = dirname($pps);
                $pid = getId($pps);
                if (stristr($ele->name, $value) == false && $pid != $value) continue;
                $line->id = 'V_' . $pid;
                $line->name = $ele->name;
                $cover = 0;
                $tpath = getSongPath($pid);
                if (file_exists($tpath . '\\cover.jpg')) {
                    $cover = getId($tpath . '\\cover.jpg');
                } else if (file_exists($tpath . '\\cover.png')) {
                    $cover = getId($tpath . '\\cover.png');
                }
                if ($cover != 0)
                    $line->pic = "./apis/video/cover.php?id=" . $cover;
                $list[] = $line;
                if ($count >= $limit) {
                    $total = ($offset) * $limit + 1;
                    break;
                }
            }
            $resu->data->list = $list;
            $resu->data->total = $total;
            $resu->type = "playlist";
        }
        echo json_encode($resu);
        break;
    case 'files':
        $result = json_decode('{"data":{"total":0,"list":[]}}');
        $file = fopen("../cache/vlocation.txt.bamboomusic", "r");
        $keyword = "";
        //检测指正是否到达文件的未端

        while (!feof($file)) {
            $path = fgets($file);
            // echo "<h1>$path</h1>";
            scanAllFile(trim($path), $keyword);
        }
        // saveId();

        fclose($file);
        // echo json_encode($files);
        foreach ($files as $valued) {
            // $line->data[] = $value->filename;
            $res = $valued->path;
            $line = json_decode('{"id":0,"addition":"","artist":"","name":"","album":"","albumid":"","artistid":"","releaseDate":null,"hasMv":1,"hasAudio":0}');
            $filewithoutext = $valued->filename;
            $filebasename = basename($filewithoutext);
            $filepath = dirname($res);
            $musicid = $valued->id;
            $pathid = getId($filepath);
            $singer = substr($filebasename, 0, strpos($filebasename, " - "));
            if (strpos($filebasename, " - ") != false)
                $songname = substr($filebasename, strpos($filebasename, " - ") + 3);
            else $songname = $filebasename;
            // echo strpos($res, " - ");
            if (!empty($songname)) {
                $line->name = $songname;
                $line->songName = $songname;
            }
            if (!empty($musicid)) {
                $line->id = 'V_' . $musicid;
            }
            if (!empty($singer)) {
                $line->artist = $singer;
                $line->artistid = 'V_' . base64_encode($singer);
            }
            if (!empty($pathid)) {
                $line->album = getDirAlName($filepath);
                $line->albumid = 'V_' . $pathid;
            }
            // $result->data->songinfo = $line;
            $result->data->list[] = $line;
            // echo json_encode($line);
        }
        // saveId();
        // $result->data->lrclist = $lrc;
        $result->data->total = $total;
        $html = json_encode($result);
        break;
    default:
        echo '{"success":"fail","code":404,"message":"未知的参数","code":1}';
        http_response_code(200);
        return;
}
// saveId();

echo $html;
