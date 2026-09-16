<?php
/*
 * 本地音源的对外接口。$type 决定返回什么，全部走 GET。
 *
 * 响应格式是前端契约的一部分，改动前先读 README 的接口章节。几个看着像 bug 但**故意如此**的点：
 *   - 逻辑上的 404 也返回 HTTP 200：前端 $.fetch 遇到非 2xx 会重试 3 次、每次间隔 2 秒。
 *   - $total 故意比真实数量多报，前端用它判断「没有更多了」。
 *   - hasMv 只在 extra == 1 时出现，视频推荐面板靠它过滤。
 *   - pic 用 dirname($url) 拼绝对地址，跟随请求的 Host 头（支持子目录部署）。
 *   - $value 会被 rawurldecode 第二次解码。
 */
require_once __DIR__ . '/listfiles.php';
$saltFile = cache_path('salt');
if (!file_exists($saltFile)) {
    $mywritefile2 = fopen($saltFile, "w") or send_error("无法写入缓存列表。");
    fwrite($mywritefile2, '<?php $salt="bamboomusic";?>');
    fclose($mywritefile2);
}
include($saltFile);

function loadPath2Url()
{
    $file = cache_path('location2url.json');
    if (is_file($file)) {
        $myfile = fopen($file, "r") or send_error("无法读取文件列表。");
        $flength = filesize($file);
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
    Header("content-type: application/json", true);

    echo '{"success":"fail","code":404,"message":"缺少请求参数。","code":1}';
    return;
}
if (empty($_GET['value'])) {
    $value = "";
} else {
    $value = $_GET['value'];
}
// echo $value;
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
$br = "mp3";
if (!empty($_GET['br'])) {
    $br = $_GET['br'];
    if ($br == '128kmp3') $br = "mp3";
    if ($br == '320kmp3') $br = "mp3";
    else if ($br == '2000kflac') $br = "flac";
}
// $url = str_replace("\~", "%7E", $url);

$value = rawurldecode($value);
if ($type != 'alarm') {
    if ($offset < 1) $offset = 1;
    if ($limit < 1) $offset = 10;
} else {
    if ($offset < 0) $offset = 0;
    if ($limit < 1) $offset = 10;
}

$html = "";
$result = json_decode('{}');
if (substr($value, 0, 6) == 'MUSIC_') {
    $value = substr($value, 6);
}
function fileListToData($searchValue, $show_match = false)
{
    static $lineTemplate = null;
    if ($lineTemplate === null) {
        // 每行原来是 json_decode 一次这个骨架再逐字段赋值；decode 一次、clone 出来即可，
        // 属性顺序不变，所以 JSON 输出字节不变。
        $lineTemplate = json_decode('{"id":0,"addition":"","artist":"","name":"","album":"","albumid":"","pic":"","artistid":"","releaseDate":null}');
    }
    $result = json_decode('{"data":{"total":30,"list":[]}}');
    $prefix = $GLOBALS['prefix'];
    foreach ($GLOBALS['files'] as $valued) {
        // $line->data[] = $value->filename;
        $res = $valued->path;
        $line = clone $lineTemplate;
        $filewithoutext = substr($res, 0, strrpos($res, "."));

        $filebasename = basename($filewithoutext);
        $filepath = dirname($res);
        $musicid = $valued->id;
        if ($valued->extra == 1) {
            $line->hasMv = $musicid;
        }

        $cover = $valued->cover;
        $pathid = getId($filepath);
        $singer = substr($filebasename, 0, strpos($filebasename, " - "));

        if ($singer == "") $singer = "匿名";
        if (!empty($valued->trueextra))
            $line->addition = $valued->trueextra;

        if ($show_match) {
            $singer = str_replace($searchValue, "<em>$searchValue</em>", $singer);
        }

        if (strpos($filebasename, " - ") != false)
            $songname = substr($filebasename, strpos($filebasename, " - ") + 3);
        else $songname = $filebasename;

        if ($show_match) {
            $songname = str_replace($searchValue, "<em>$searchValue</em>", $songname);
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
            $line->album = $valued->albumname;
            $line->albumid = $prefix . $pathid;
        }
        // $result->data->songinfo = $line;
        $result->data->list[] = $line;
        // echo json_encode($line);
    }
    return $result;
}
function searchSong($value, $complete = false)
{
    //检测指正是否到达文件的未端
    searchFileByName($value, $GLOBALS['limit'], $GLOBALS['offset'], false, $complete);
    $data = fileListToData($value, $GLOBALS['show_match']);
    $data->data->total = $GLOBALS['total'];
    return $data;
    // echo json_encode($files);
    // 
    // // $result->data->lrclist = $lrc;
    // $result->data->total = $GLOBALS['total'];
    // $GLOBALS['result'] = $result;
}
$seed = 0;
if (!empty($_GET['seed'])) $seed = $_GET['seed'];
// echo strtotime("2022-17-12");
if ($seed != 0) $seed = strtotime(date('Y-m-d')) . $seed;
$uri = $_SERVER['REQUEST_URI'];
$protocol = ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$url = $protocol . $_SERVER['HTTP_HOST'] . $uri;
// echo $offsets;
function getLocalMusicUrl($value, $redirect = false, $br = "mp3")
{
    $res = getSongPath($value);
    if ($res == false) {
        Header("content-type: application/json", true);

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
    $ran = time() . "" . mt_rand(0, 65535);
    return dirname($GLOBALS['url']) . "/getlocalmusic.php?id=" . ($redirect ? "D" : "") . $value . "&type=music&d=" . date('Y-m-d') . "&t=" . base64_encode(crypt($br . "_" . ($redirect ? "D" : "") . $value . "_" . date('Y-m-d') . $ran, $GLOBALS['salt'])) . "&r=" . $ran . "&br=" . $br;
}
$redirect = false;
switch ($type) {
    case 'status':
        $count = count($filelist);
        Header("content-type: application/json", true);

        echo '{"success":"ok","code":200,"status":"ok","total_songs":"' . $count . '"}';

        break;
    case 'random_url':
        header('Cache-Control:no-cache,must-revalidate');
        header('Pragma:no-cache');
        header("Expires:0");
        header('Access-Control-Allow-Origin: *');

        $redirect = true;
    case 'random':
        // echo $seed;
        // return;
        Header("content-type: application/json", true);

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
            if ($redirect) {
                $rurl = getLocalMusicUrl($resid, $redirect);
                header("Location: $rurl");
                echo "Redirected to " . $rurl;
                return;
            }
            // $res = getSongPath($value);
            $res = $ress['path'];
            if ($ress != false && $res != "") {
                $line = json_decode('{"id":0,"addition":"","artist":"","name":"","album":"","albumid":"","artistid":"","releaseDate":null}');
                $filewithoutext = substr($res, 0, strrpos($res, "."));
                $mvres = $filewithoutext . '.mp4';



                if ($ress['cover'] != -1)
                    $line->pic = dirname($url) . '/cover.php?id=' . $ress['cover'];
                $filebasename = basename($filewithoutext);
                $filepath = dirname($res);
                $musicid = $resid;
                if (is_file($mvres)) {
                    $line->hasMv = $musicid;
                }
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
                if (!empty($ress['trueextra']))
                    $line->addition = $ress['trueextra'];
                // $result->data->songinfo = $line;
                $result->data->list[] = $line;
                // echo json_encode($line);
            }
        }
        // $result->data-
        $result->data->total = ($offset) * $count + 1;

        $html = json_encode($result);
        break;
    case 'info':
        Header("content-type: application/json", true);

        $result = json_decode('{"data":{"info":{}}}');
        $getLrc = true;
        if (!empty($_GET['lrc'])) {
            if ($_GET['lrc'] == 'false') {
                $getLrc = false;
            }
        }
        $res = getInfo($value);
        if ($res == false) {
            echo '{"code":404,"msg":"404 - 此歌曲不存在"}';
            http_response_code(200);
            return;
        }
        $filewithoutext = substr($res['path'], 0, strrpos($res['path'], "."));
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
        if ($res['extra'] > 0) {
            $line->hasMv = $res['extra'];
        }
        $filebasename = basename($filewithoutext);

        $filepath = dirname($res['path']);
        $musicid = getId($res['path']);
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
        $cover = $res['cover'];
        // if($line->)
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
        if (!empty($res['trueextra']))
            $line->addition = $res['trueextra'];
        $result->data->info = $line;
        if ($getLrc)
            $result->data->lrc = $lrc;
        $html = json_encode($result);
        break;
    case 'suggestKey':
        Header("content-type: application/json", true);

        $line = json_decode('{"code":200,"data":[]}');
        $keyword = $value;
        //检测指正是否到达文件的未端
        $limit = 12;
        $page = 0;
        searchFileByName($keyword, $limit, 1);
        $terms = search_tokenize($keyword);

        $suggests = array();
        $count = 0;
        foreach ($files as $value) {
            $val = $value->filename;
            $dx = stripos($val, " - ");
            if ($dx != false) {
                $singer = substr($val, 0, stripos($val, " - "));
                $songname = substr($val, stripos($val, " - ") + 3);
            } else {
                $singer = "";
                $songname = $val;
            }

            $addition = $value->trueextra;
            $albumname = $value->albumname;
            // 用和搜索一致的规则（分词 AND、顺序无关、归一化 + 容错）判断这段文本是否命中关键词，
            // 否则搜索已经找到的命中会在这里被原始子串过滤掉：打错字时提示词是空的，
            // 「东方 17」这种词序与歌名相反的多词查询也是空的。空字段不参与（建议项不能是空字符串）。
            if ($singer !== "" && search_terms_hit($singer, $terms)) {
                $suggests[] = $singer;
            } else if (search_terms_hit($songname, $terms)) {
                $suggests[] = $songname;
            } else if ($addition !== "" && search_terms_hit($addition, $terms)) {
                $suggests[] = $addition;
            } else if ($albumname !== "" && search_terms_hit($albumname, $terms)) {
                $suggests[] = $albumname;
            } else if (search_terms_hit($val, $terms)) {
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
        echo json_encode($line);
        break;
    case 'album':
        Header("content-type: application/json", true);

        $path = getSongPath($value);
        if ($path == false) {
            echo '{"code":404,"msg":"404 - 此专辑不存在"}';
            http_response_code(200);
            return;
        }
        // loadPathNames();

        // $page += 1;
        // $offset;
        searchForFolder(trim($path), $limit, $offset);
        $albumname = getDirAlName($path);
        // echo json_encode($files);

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
        Header("content-type: application/json", true);

        $result = json_decode('{"data":{"total":0,"list":[]}}');
        //检测指正是否到达文件的未端
        $path = getSongPath($value);
        if ($path == false) {
            echo '{"code":404,"msg":"404 - 此列表不存在"}';
            http_response_code(200);
            return;
        }

        // 按目录 id 列出该目录（含子目录）下的歌曲。这里原来调用的 scanAllFile() 只存在于
        // apis/video，在 apis/local 里从来没有过定义，所以这个接口一直是 500。
        searchForFolder(trim($path), $limit, $offset);
        foreach ($files as $valued) {
            // $line->data[] = $value->filename;
            $res = $valued->path;
            $line = json_decode('{"id":0,"addition":"","artist":"","name":"","album":"","albumid":"","artistid":"","releaseDate":null,"hasmv":0,"pic":null}');

            $filewithoutext = $valued->filename;

            $filebasename = basename($filewithoutext);
            $filepath = dirname($res);
            $cover = $valued->cover;
            if ($cover != -1) {
                // 原来是 dirname($url) . "/local/cover.php"，多一层 local，指向不存在的路径
                $line->pic = dirname($url) . "/cover.php?id=" . $cover;
            }
            $musicid = $valued->id;
            $mvres = $filepath . '\\' . $filewithoutext . '.mp4';
            if (is_file($mvres)) {
                $line->hasMv = $musicid;
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
            // $valued 是 fileinfo 对象，不能当数组取值（PHP 8 会直接抛错），原来写成 $valued['trueextra']
            if (!empty($valued->trueextra))
                $line->addition = $valued->trueextra;
            // $result->data->songinfo = $line;
            $result->data->list[] = $line;
            // echo json_encode($line);
        }
        // $result->data->lrclist = $lrc;
        $result->data->total = $total;
        $html = json_encode($result);
        // http_response_code(200);
        break;
    case 'mv':
        Header("content-type: application/json", true);

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
        $html = getLocalMusicUrl($value, false, "mp4");
        break;
    case 'url':
        Header("content-type: text/plain", true);

        $html = getLocalMusicUrl($value, false, $br);
        // echo $html;
        break;
    case 'listen':
        Header("content-type: application/json", true);

        Header("Location: ../../index.html?musicid=$value", true, 302);
        return;
        break;
    case 'singer':
        Header("content-type: application/json", true);

        $resu = json_decode('{"data":{"list":[],"total":0}}');
        //不break，进入search
        $valued = base64_decode(str_replace(" ", "+", $value));
        if ($valued != false) {
            $value = $valued;
            $resu = searchSong($value, true);
            $resu->data->name = $value;
            $resu->data->total = $GLOBALS['total'];
            $html = json_encode($resu);
        } else {
            $html = json_encode($resu);
        }


        break;
    case 'search':
        Header("content-type: application/json", true);

        $result = searchSong($value);
        $html = json_encode($result);

        break;
    case 'folder':
        Header("content-type: application/json", true);

        $file = fopen(cache_path('location.txt'), "r");
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
        }

        $html = json_encode($result);
        fclose($file);
        break;
    case 'searchAlarm':
    case 'searchAlbum':
        Header("content-type: application/json", true);

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
                if ($pid == "" || $pid == null) continue;
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
        Header("content-type: application/json", true);

        echo '{"success":"fail","code":404,"message":"未知的参数"}';
        http_response_code(200);
        return;
}

echo $html;
