<?php
include("./listfiles.php");
include("./libs.php");
Header("content-type: application/json", true);
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
$show_match = false;
if (!empty($_GET['show_match'])) {
    $show_match = $_GET['show_match'] == 'true';
}
$offset = 0;
$limit = 30;
if (!empty($_GET['offset'])) {
    $offset = (int)$_GET['offset'];
}
if (!empty($_GET['limit'])) {
    $limit = (int)$_GET['limit'];
}
$prefix = "";
if (!empty($_GET['prefix'])) {
    $prefix = $_GET['prefix'];
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
function fileListToData($searchValue, $show_match=false)
{
    $result = json_decode('{"data":{"total":30,"list":[]}}');
    $prefix = $GLOBALS['prefix'];
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

        if($show_match){
            $singer = str_replace($searchValue,"<em>$searchValue</em>",$singer);
        }
        
        if (strpos($filebasename, " - ") != false)
            $songname = substr($filebasename, strpos($filebasename, " - ") + 3);
        else $songname = $filebasename;

        if($show_match){
            $songname = str_replace($searchValue,"<em>$searchValue</em>",$songname);
        }

        // echo strpos($res, " - ");
        if ($cover != -1) {
            $line->pic = dirname($GLOBALS['url']) . "/cover.php?id=" . $cover;
        }
        if (!empty($songname)) {
            $line->name = $songname;
        }
        if (!empty($musicid)) {
            $line->id = $prefix . $musicid;
        }
        if (!empty($singer)) {
            $line->artist = $singer;
            $line->artistid = $prefix . base64_encode($singer);
        }
        if (!empty($pathid)) {
            $line->album = getDirAlName($filepath);
            $line->albumid = $prefix . $pathid;
        }
        // $result->data->songinfo = $line;
        $result->data->list[] = $line;
        // echo json_encode($line);
    }
    return $result;
}
function searchSong($value)
{
    //检测指正是否到达文件的未端
    searchFileByName($value, $GLOBALS['limit'], $GLOBALS['offset'], false);
    $data = fileListToData($value, $GLOBALS['show_match']);
    $data->data->total = $GLOBALS['total'];
    return $data;
    // echo json_encode($files);
    // 
    // // $result->data->lrclist = $lrc;
    // $result->data->total = $GLOBALS['total'];
    // $GLOBALS['result'] = $result;
}
$seed = 1;
if (!empty($_GET['seed'])) $seed = $_GET['seed'];
// echo strtotime("2022-17-12");
$seed = strtotime(date('Y-m-d')) . $seed;
$uri = $_SERVER['REQUEST_URI'];
$protocol = ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$url = $protocol . $_SERVER['HTTP_HOST'] . $uri;
// echo $offsets;
switch ($type) {
    case 'random':

        // echo $seed;
        // return;

        $result = json_decode('{"seed":"","data":{"total":30,"list":[]}}');
        $result->seed = $seed;
        $count = $value;
        if ($count <= 0 || $count >= 40) $count = 30;
        // echo $value == null;
        $tmp = $id_lists;
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
            $ress = getInfo($resid);
            // $res = getSongPath($value);
            $res = $ress['path'];
            if ($ress != false && $res != "") {
                $line = json_decode('{"id":0,"addition":"","artist":"","name":"","album":"","albumid":"","artistid":"","releaseDate":null}');
                $filewithoutext = substr($res, 0, strrpos($res, "."));
                $mvres = $filewithoutext . '.mp4';
                if (is_file($mvres)) {
                    $line->hasMv = 1;
                }


                if ($ress['cover'] != -1)
                    $line->pic = dirname($url) . '/cover.php?id=' . $ress['cover'];
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
                    $line->id = $prefix . $musicid;
                }
                if (!empty($singer)) {
                    $line->artist = $singer;
                    $line->artistid = $prefix . base64_encode($singer);
                }
                if (!empty($pathid)) {
                    $line->album = getDirAlName($filepath);
                    $line->albumid = $prefix . $pathid;
                }
                // $result->data->songinfo = $line;
                $result->data->list[] = $line;
                // echo json_encode($line);
            }
        }
        // saveId();
        // $result->data-
        $result->data->total = ($offset) * $count + 1;
        $html = json_encode($result);
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
        if ($lrc == "") {
            $lrc = "[00:00.00]歌曲：" . $filebasename . "\r\n[00:02.00]专辑：" . getDirAlName($filepath) . "\r\n[00:04.00]歌手：" . $singer . "\r\n[00:06.00]本歌曲暂无歌词";
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

        if ($cover != -1)
            $line->pic = dirname($url) . "/cover.php?id=" . $cover;
        if (!empty($songname)) {
            $line->name = $songname;
        }
        if (!empty($musicid)) {
            $line->id = $prefix . $musicid;
        }
        if (!empty($singer)) {
            $line->artist = $singer;
            $line->artistid = $prefix . base64_encode($singer);
        }
        if (!empty($pathid)) {
            $line->album = getDirAlName($filepath);
            $line->albumid = $prefix . $pathid;
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
        $limit = 12;
        $page = 0;
        searchFileByName($keyword, $limit, 1);

        $suggests = array();
        $count = 0;
        foreach ($files as $value) {
            $val = $value->filename;
            $singer = substr($val, 0, stripos($val, " - "));
            $songname = substr($val, stripos($val, " - ") + 3);
            if (stristr($singer, $keyword) != false) {
                $suggests[] = $singer;
            } else if (stristr($songname, $keyword) != false) {
                $suggests[] = $songname;
            } else {
                $suggests[] = $val;
            }
            // $suggests[] = $songname;

        }
        $suggests = array_unique($suggests);
        foreach ($suggests as $value) {
            $count++;
            if ($count > 10) break;
            $line->data[] = $value;
        }
        // saveId();
        echo json_encode($line);
        break;
    case 'album':
        $path = getSongPath($value);
        if ($path == false) {
            echo '{"code":404,"msg":"404 - 此专辑不存在"}';
            http_response_code(200);
            return;
        }
        // $page += 1;
        // $offset;
        searchForFolder(trim($path), $limit, $offset);
        $albumname = getDirAlName($path);
        // echo json_encode($files);

        // saveId();
        // $result->data->lrclist = $lrc;
        $resu = fileListToData($value, $show_match);
        $resu->total = $total;
        $resu->data->total = $total;
        $resu->data->name = $albumname;
        $resu->name = $albumname;
        $html = json_encode($resu);
        // http_response_code(200);
        break;
    case 'playlist':
        $result = json_decode('{"data":{"total":0,"list":[]}}');
        $file = fopen("../cache/location.txt.bamboomusic", "r");
        $keyword = "";
        //检测指正是否到达文件的未端
        $path = getSongPath($value);
        if ($path == false) {
            echo '{"code":404,"msg":"404 - 此列表不存在"}';
            http_response_code(200);
            return;
        }

        scanAllFile(trim($path), $keyword);
        fclose($file);
        // echo json_encode($files);
        foreach ($files as $valued) {
            // $line->data[] = $value->filename;
            $res = $valued->path;
            $line = json_decode('{"id":0,"addition":"","artist":"","name":"","album":"","albumid":"","artistid":"","releaseDate":null,"hasmv":0,"pic":null}');

            $filewithoutext = $valued->filename;

            $filebasename = basename($filewithoutext);
            $filepath = dirname($res);
            $cover = $valued->cover;
            if ($cover != -1) {
                $line->pic = dirname($url) . "/local/cover.php?id=" . $cover;
            }
            $musicid = $valued->id;
            $mvres = $filepath . '\\' . $filewithoutext . '.mp4';
            if (is_file($mvres)) {
                $line->hasMv = 1;
            }
            $pathid = getId($filepath);

            $singer = substr($filebasename, 0, strpos($filebasename, " - "));
            if (strpos($filebasename, " - ") != false)
                $songname = substr($filebasename, strpos($filebasename, " - ") + 3);
            else $songname = $filebasename;
            // echo strpos($res, " - ");
            if (!empty($songname)) {
                $line->name = $songname;
            }
            if (!empty($musicid)) {
                $line->id = $prefix . $musicid;
            }
            if (!empty($singer)) {
                $line->artist = $singer;
                $line->artistid = $prefix . base64_encode($singer);
            }
            if (!empty($pathid)) {
                $line->album = getDirAlName($filepath);
                $line->albumid = $prefix . $pathid;
            }
            // $result->data->songinfo = $line;
            $result->data->list[] = $line;
            // echo json_encode($line);
        }
        // saveId();
        // $result->data->lrclist = $lrc;
        $result->data->total = $total;
        $html = json_encode($result);
        // http_response_code(200);
        break;
    case 'mv':
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
                $filename = (str_replace("\\", "/", substr($res, strlen($ll->path))));
                $filename = substr($filename, 0, strripos($filename, ".")) . ".mp4";
                echo $ll->url . $filename;

                return;
            }
        }
        $html = dirname($url) . "/apis/local/getlocalmusic.php?type=mp4&id=" . $value;
        break;
    case 'url':

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

        $html = dirname($url) . "/getlocalmusic.php?id=" . $value . "&type=music&time=" . (int)(time() / 100);
        // echo $html;
        break;
    case 'singer':
        $resu = json_decode('{"data":{"list":[],"total":0}}');
        //不break，进入search
        $valued = base64_decode(str_replace(" ", "+", $value));
        if ($valued != false) {
            $value = $valued;
            $resu = searchSong($value);
            $resu->data->name = $value;
            $resu->data->total = $GLOBALS['total'];
            $html = json_encode($resu);
        } else {
            $html = json_encode($resu);
        }

        // saveId();

        break;
    case 'search':
        $result = searchSong($value);
        $html = json_encode($result);
        // saveId();

        break;
    case 'folder':
        $file = fopen("../cache/location.txt.bamboomusic", "r");
        $result = json_decode('{"data":{"list":[]}}');
        while (!feof($file)) {
            $path = trim(fgets($file));
            if (trim($path) == '') continue;
            // echo "<h1>$path</h1>";
            $line = json_decode('{"name":"","uname":"","userName":"","id":""}');
            $pathid = getId($path);
            $line->id = $prefix . $pathid;
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
    case 'searchAlbum':
        $resu = json_decode('{"data":{"list":[],"total":0,"pic":null}}');
        loadPathNames();
        $list = array();
        $count = 0;
        $skipcount = 0;
        $total = 1;
        $skipcount_2 = 0;
        if ($GLOBALS['pathnames'] != null) {
            foreach ($GLOBALS['pathnames'] as $vvalue) {

                $skipcount++;
                if ($skipcount < ($offset - 1) * $limit + 1) continue;
                $line = json_decode('{"name":"","id":"1"}');
                $ele = $vvalue;
                $pps = $ele->path;

                if ($ele->name == "") $ele->name = dirname($pps);
                $pid = getId($pps);
                if($pid == ""||$pid == null) continue;
                if (stristr($ele->name, $value) == false && $pid != $value) continue;
                $skipcount_2++;
                if ($skipcount_2 < ($offset - 1) * $limit + 1) continue;

                $count++;
                $line->id = $prefix . $pid;
                $line->name = $ele->name;
                $cover = 0;
                $tpath = getSongPath($pid);
                if (file_exists($tpath . '\\cover.jpg')) {
                    $cover = getId($tpath . '\\cover.jpg');
                } else if (file_exists($tpath . '\\cover.png')) {
                    $cover = getId($tpath . '\\cover.png');
                }
                if ($cover != 0)
                    $line->pic = "./apis/local/cover.php?id=" . $cover;
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
    default:
        echo '{"success":"fail","code":404,"message":"未知的参数","code":1}';
        http_response_code(200);
        return;
}
// saveId();

echo $html;
