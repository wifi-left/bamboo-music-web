<?php
class fileinfo
{
    public $filename = "";
    public $path = "";
    public $id = 0;
    public $cover = -1;
    public $extra = "";
    public $trueextra = "";
    public $albumname = "";
}
class localfileinfo
{
    public $path = "";
    public $type = 0; //0 is file; 1 is folder
    public $cover = -1; // For dir
}
$files = array();
$limit = 30;
$offset = 1;
$count = 0;
$total = 0;
$totalcount = 0;

include_once("./lib_simple.php");


$id_finder = null;
$filelist = [];
$id_lists = [];
$all_id_lists = [];

if (!is_dir("../cache")) {
    mkdir("../cache");
    if (!is_dir("../cache")) {
        send_error("无法创建缓存目录。");
    }
}
$hasLoadedFileList = false;
loadLists();
// echo json_encode($filelist);
function loadLists()
{
    if (!is_file("../cache/list.txt.bamboomusic")) {
        // send_error("请在配置中刷新缓存。");
        return;
    }
    $file = fopen("../cache/list.txt.bamboomusic", "r") or send_error("无法读取文件列表。");
    //检测指正是否到达文件的未端
    $flist = array();
    $all_ids = array();
    $id_finder = [];
    $ids = [];
    $save_all_ids = false;
    if (!empty($GLOBALS['manager_mode'])) {
        $save_all_ids = $GLOBALS['manager_mode'];
    }
    while (!feof($file)) {
        /*
        文件结构：

        >id
        |文件地址
        /名字
        ]额外信息
        ,封面
        .类型
        <

        */
        $line = fgets($file);
        $id = substr($line, 1, strlen($line) - 3);
        if (substr($line, 0, 1) != '>') {
            continue;
        }
        $ftype = 0;
        $fpath = "";
        $fname = "";
        $fcover = 0;
        $linea = [];
        $fextra = "";
        $ftrueextra = "";
        while (!feof($file)) {

            $nline = fgets($file);
            $content = substr($nline, 1, strlen($nline) - 3);
            $ntype = substr($nline, 0, 1);
            if ($ntype == '|') {
                //文件地址
                $fpath = $content;
            } else if ($ntype == ',') {
                //封面
                $fcover = $content;
            } else if ($ntype == '/') {
                //名字
                $fname = $content;
            } else if ($ntype == ']') {
                //拼音
                $fextra = $content;
            } else if ($ntype == '.') {
                //类型
                $ftype = $content;
            } else if ($ntype == '[') {
                //类型
                $ftrueextra = $content;
            } else {
                break;
            }
        }
        $linea['type'] = $ftype;
        $linea['name'] = $fname;
        $linea['path'] = $fpath;
        $linea['cover'] = $fcover;
        $linea['extra'] = $fextra;
        $linea['trueextra'] = $ftrueextra;
        // $linea['id'] = $id;
        $flist[$id] = $linea;
        $id_finder[$fpath] = $id;
        if ($ftype == 'f')
            $ids[] = $id;
        if ($save_all_ids)
            $all_ids[] = $id;
    }
    if ($save_all_ids)
        $GLOBALS['all_id_lists'] = $all_ids;
    $GLOBALS['id_lists'] = $ids;
    $GLOBALS['filelist'] = $flist;
    $GLOBALS['id_finder'] = $id_finder;
}
function searchForFolder($folder, $limit, $offset)
{
    $GLOBALS['hasLoadedFileList'] = true;
    $flist = $GLOBALS['filelist'];
    $filecount = 0;
    $count = 0;
    $id_lists = $GLOBALS['id_lists'];
    $res = [];
    $albumname = getDirAlName($folder);

    for ($i = 0; $i < count($id_lists); $i++) {
        $cid = $id_lists[$i];
        if ($flist[$cid]['type'] == 'f') {
            // l for folder;
            // i for image;
            // f for file;
            if ($count >= $limit) {
                $count++;
                break;
            }
            // echo $flist[$cid]['path'] . "\r\n";
            if (stripos($flist[$cid]['path'], $folder) !== false) {
                $filecount++;
                if ($filecount <= ($offset - 1) * $limit) continue;
                $count++;
                $finfo = new fileinfo();
                $finfo->path = $flist[$cid]['path'];
                $value = $flist[$cid]['name'];
                // $value = str_replace(strrchr($value, "."), "", $value);
                // $finfo->filename = substr($value, strrpos($value, '/') + 1);
                $finfo->filename = $value;
                $finfo->id = $cid;
                $finfo->cover = $flist[$cid]['cover'];
                $finfo->extra = $flist[$cid]['extra'];
                $finfo->trueextra = $flist[$cid]['trueextra'];
                $finfo->albumname = $albumname;

                $res[] = $finfo;
            }
        }
    }

    $GLOBALS['total'] = $limit * ($offset - 1) + $count;
    $GLOBALS['files'] = $res;
}
function getId($file)
{ // Return the id of the file. false for undefined
    if (empty($GLOBALS['id_finder'][$file]))
        return false;
    $id = $GLOBALS['id_finder'][$file];
    return $id;
}
function getInfo($id)
{ // Return the info of the provided id. false for undefined
    if (empty($GLOBALS['filelist'][$id]))
        return false;
    return $GLOBALS['filelist'][$id];
}
function getSongPath($id)
{
    if (empty($GLOBALS['filelist'][$id]))
        return false;
    return $GLOBALS['filelist'][$id]['path'];
}

$pathnames = null;
function loadPathNames()
{
    if (is_file("../cache/names.json.bamboomusic")) {
        $myfile = fopen("../cache/names.json.bamboomusic", "r") or send_error("无法读取ID缓存列表。");
        $flength = filesize("../cache/names.json.bamboomusic");
        if ($flength > 0) {
            $content = fread($myfile, $flength);
        } else {
            $content = '[]';
        }
        fclose($myfile);
        $GLOBALS['pathnames'] = json_decode($content);
    }
}
function getDirAlName($dir)
{
    if ($GLOBALS['pathnames'] == null)
        loadPathNames();
    foreach ($GLOBALS['pathnames'] as $value) {
        $ele = $value;
        $pps = $ele->path;
        if ($dir == $pps) {
            if ($ele->name == "") $ele->name = dirname($pps);
            return $ele->name;
        };
    }
    foreach ($GLOBALS['pathnames'] as $value) {
        $ele = $value;
        $pps = $ele->path;
        if (strstr($dir, $pps)) {
            if ($ele->name == "") $ele->name = dirname($pps);
            return $ele->name;
        };
    }
    return ($dir);
}
function searchFileByName($value, $limit = 15, $offset = 1, $suggestMode = true, $complete = false)
{
    $enforceReal = false;
    if ($suggestMode) $enforceReal = true;
    $GLOBALS['total'] = $limit * ($offset - 1);
    $count = 0;
    if ($suggestMode) $offset = 1;
    if ($offset <= 0) $offset = 1;

    for ($i = 0; $i < count($GLOBALS['id_lists']); $i++) {
        // echo $count;
        if ($count >= $limit) {
            $GLOBALS['total']++;
            return;
        }
        $cid = $GLOBALS['id_lists'][$i];
        $info = $GLOBALS['filelist'][$cid];
        $albumname = "";
        $albumname = getDirAlName(dirname($info['path']));
        $flag = false;
        $flagcount = 0;
        // echo json_encode($info);
        // return;
        // echo $info['name'];
        $vv = array($value);
        // echo $info['name'];
        if ($complete) {
            $singer = substr($info['name'], 0, strpos($info['name'], " - "));
            $singer = str_replace("、", "&", $singer);
            $value = str_replace("、", "&", $value);
            $idx = stripos($singer, "&");
            if ($singer == "") $singer = "匿名";
            if ($singer == $value) {
                $flag = true;
            } else if ($idx != false) {

                $singers = explode("&", $singer, 20);
                for ($j = 0; $j < count($singers); $j++) {
                    if ($singers[$j] == $value) {
                        $flag = true;
                        // print($singers[$j] . "|" . $value . "\r\n");
                        // $flagcount++;
                        break;
                    }
                }
            }
        } else {
            if ($value == "") $flag = true;
            if (!$enforceReal) {
                $vv = explode("|", $value, 4);
            }

            for ($j = 0; $j < count($vv); $j++) {
                if (stripos($info['name'], $vv[$j]) !== false) $flag = true;
                if (stripos($info['trueextra'], $vv[$j]) !== false) $flag = true;
                if (!$flag) if (($cid === $vv[$j])) $flag = true;
                // echo getDirAlName(dirname($info['path']));

                if (!$flag) {
                    if (!$suggestMode)
                        if ((stripos($albumname, $vv[$j])) !== false) $flag = true;
                }
                if ($flag) {
                    $flagcount++;
                    $flag = false;
                    continue;
                };
            }
            if ($flagcount >= count($vv)) {
                $flag = true;
            } else {
                $flag = false;
            }
        }

        // echo $value;
        if ($flag) {
            // echo getDirAlName(dirname($info['path']));
            // echo "gg";
            $GLOBALS['totalcount']++;
            if ($GLOBALS['totalcount'] <= ($offset - 1) * $limit) {
                continue;
            }

            $finfo = new fileinfo();
            $finfo->path = $info['path'];
            $svalue = $info['name'];
            $finfo->filename = $svalue;
            $finfo->id = $cid;
            $finfo->cover = $info['cover'];
            $finfo->extra = $info['extra'];
            $finfo->trueextra = $info['trueextra'];
            $finfo->albumname = $albumname;
            $GLOBALS['files'][] = $finfo;
            $count++;
            $GLOBALS['total']++;
            // echo " | " . $info['name'] . " " . $count;
        }
    }

    if ($suggestMode) {
        // 遍历专辑
        $skipcount = 0;
        $skipcount_2 = 0;
        // echo "1";
        loadPathNames();
        // $total = 0;
        if ($GLOBALS['pathnames'] != null) {
            // echo 1;
            foreach ($GLOBALS['pathnames'] as $vvalue) {
                $skipcount++;
                if ($skipcount < ($offset - 1) * $limit + 1) continue;
                $ele = $vvalue;
                $pps = $ele->path;

                if ($ele->name == "") $ele->name = dirname($pps);
                if (stristr($ele->name, $value) == false) continue;
                $skipcount_2++;
                if ($skipcount_2 < ($offset - 1) * $limit + 1) continue;
                // $cover = 0;
                $finfo = new fileinfo();
                $svalue = $ele->name;
                $finfo->filename = $svalue;
                $GLOBALS['files'][] = $finfo;
                $count++;
                $GLOBALS['total']++;
            }
        }
    }
    $GLOBALS['count'] = $count;
}
