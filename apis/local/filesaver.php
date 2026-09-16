<?php
/*
 * 索引的写入端：扫描磁盘、生成 id、写记录，以及管理端的两个重建流程。
 *
 * id 用 md5(路径) 加一个冲突计数后缀，所以同一路径每次重建都得到同一个 id（前端收藏、播放列表
 * 都存了 id）。这里的 $GLOBALS['temp'] / $GLOBALS['ids'] 是一次重建过程中的登记表：
 * temp 是「路径 -> id」的记忆，ids 是「已用过的 id」集合，两者都必须跨函数共享。
 */
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/search_match.php';

$enableDetail = true;

$temp = [];
$ids = [];
function generateId($path)
{
    $wantId = md5($path);
    $i = 0;
    while (!empty($GLOBALS['ids'][$wantId . $i])) {
        $i++;
    }
    return $wantId . $i;
}

/**
 * 取路径对应的 id。$created 返回 true 表示这次是新登记的（调用方据此决定要不要写记录）。
 * 原来 getId2/saveFolder/saveCover 各自抄了一遍这段登记逻辑。
 */
function id_for_path($path, &$created)
{
    if (!empty($GLOBALS['temp'][$path])) {
        $created = false;
        return $GLOBALS['temp'][$path];
    }
    $id = generateId($path);
    $GLOBALS['temp'][$path] = $id;
    $GLOBALS['ids'][$id] = true;
    $created = true;
    return $id;
}
function getId2($path)
{
    $created = false;
    return id_for_path($path, $created);
}
function saveFolder($writer, $path, $cover = -1)
{
    $created = false;
    $id = id_for_path($path, $created);
    if ($created) {
        writeFileInfo($writer, $id, $path, "", $cover, "l");
    }
    return $id;
}
function saveCover($writer, $path)
{
    $created = false;
    $id = id_for_path($path, $created);
    if ($created) {
        writeFileInfo($writer, $id, $path, "", -1, "i");
    }
    return $id;
}
function searchAdditionHost()
{
    if (!$GLOBALS['enableDetail']) return;
    $list = $GLOBALS['filelist'];
    $id_list = $GLOBALS['all_id_lists'];
    $file = cache_path('list.txt.tmp');
    $openFile = fopen($file, "w");
    for ($i = 0; $i < count($id_list); $i++) {
        $id = $id_list[$i];
        $linea = $list[$id];
        $ftype = $linea['type'];
        $fname = $linea['name'];
        $fpath = $linea['path'];
        $fcover = $linea['cover'];
        $fextra = $linea['extra'];
        $filename = $fpath;
        $pathwithoutext = remove_ext($filename);
        $extra = "";

        if ($ftype == 'f') {
            $lrcPath = $pathwithoutext . '.lrc';
            if (file_exists($lrcPath)) {
                $t = fopen($lrcPath, "r");
                $timeLen = strlen("[00:00.00]");
                $linesUtf8 = []; // 存储已转为 UTF-8 的连续 [00:00.00] 行内容

                // 只读取开头的连续 [00:00.00] 行，遇到第一个非该格式的行就停止
                while (($line = fgets($t)) !== false) {
                    $line = rtrim($line, "\n\r\t\v\0");
                    if (substr($line, 0, $timeLen) == "[00:00.00]") {
                        $content = trim(substr($line, $timeLen));
                        if ($content !== '') {
                            // 立即转换为 UTF-8 并存储
                            $charset = mb_detect_encoding($content, array('UTF-8', 'GBK', 'GB2312'));
                            $charset = strtolower($charset);
                            if ($charset == 'cp936') $charset = 'GBK';
                            if ($charset != 'utf-8') {
                                $content = trim(iconv($charset, "UTF-8//IGNORE", $content));
                            }
                            $linesUtf8[] = $content;
                        }
                    } else {
                        // 遇到第一个非 [00:00.00] 的行，立即停止读取
                        break;
                    }
                }
                fclose($t);

                // 处理 $extra（完全保持原有逻辑，但使用已转换的 UTF-8 行）
                if (!empty($linesUtf8)) {
                    // 先取第一行
                    $extra_t = $linesUtf8[0];
                    // 如果存在第二行，则覆盖
                    if (isset($linesUtf8[1])) {
                        $extra_t = $linesUtf8[1];
                    }

                    // 原有过滤：相关人员 / 作词 / 作曲 清空 extra_t（此时已是 UTF-8）
                    if (substr($extra_t, 0, strlen("相关人员")) == "相关人员") {
                        $extra_t = "";
                    } else if (substr($extra_t, 0, strlen("作词")) == "作词") {
                        $extra_t = "";
                    } else if (substr($extra_t, 0, strlen("作曲")) == "作曲") {
                        $extra_t = "";
                    }
                    if ($extra_t != "") {
                        $extra = $extra_t;
                    }

                    // 查找专辑信息：从 extra 结束的下一行开始
                    // 如果使用了第二行（索引1），则从索引2开始；否则从索引1开始
                    $startIndex = isset($linesUtf8[1]) ? 2 : 1;
                    $album = '';
                    for ($j = $startIndex; $j < count($linesUtf8); $j++) {
                        $lineContent = $linesUtf8[$j]; // 已经是 UTF-8
                        // 匹配中英文冒号
                        if (preg_match('/^专辑[：:]\s*(.*)/u', $lineContent, $matches)) {
                            $album = trim($matches[1]);
                            // 无需再次转换，因为 $album 已经是 UTF-8
                            break;
                        }
                    }

                    // 追加专辑信息（用换行分隔）
                    if (!empty($album) && $album != "") {
                        if (!empty($extra) && $extra != "") {
                            $extra = "原专辑：" . $album . " | " . $extra;
                        } else {
                            $extra = "原专辑：" .  $album;
                        }
                    }
                }
            }
            writeFileInfo($openFile, $id, $fpath, $fname, $fcover, $ftype, $fextra, $extra);
        } else {
            writeFileInfo($openFile, $id, $fpath, $fname, $fcover, $ftype, $fextra, "");
        }
    }
    fclose($openFile);
    $tmp = cache_path('list.txt.tmp');
    if (file_exists($tmp)) {
        $live = cache_path('list.txt');
        if (file_exists($live)) unlink($live);
        rename($tmp, $live);
        // 索引指纹变了，快缓存与搜索键都必然失效；显式删一次，避免别的 worker 还拿着旧数据
        index_invalidate_fast_cache();
        search_keys_invalidate();
    }
}
/**
 * 全量重建：按 location.txt 里的根目录重新扫描磁盘。
 * 写临时文件再原子替换——原来是一上来就把线上索引 fopen(...,"w") 截断，扫描过程中一旦超时或
 * 出错（管理端限时 60 秒），前端就一直读到残缺索引。
 */
function searchHost()
{
    $reader = fopen(cache_path('location.txt'), "r");
    $tmpFile = cache_path('list.txt.tmp');
    $openFile = fopen($tmpFile, "w");
    while (!feof($reader)) {
        $path = fgets($reader);
        searchLocalFiles(trim($path), $openFile);
    }
    fclose($openFile);
    fclose($reader);
    if (file_exists($tmpFile)) {
        $live = cache_path('list.txt');
        if (file_exists($live)) unlink($live);
        rename($tmpFile, $live);
        index_invalidate_fast_cache();
        search_keys_invalidate();
    }
}
function writeFileInfo($writer, $id, $path, $name = "", $cover = -1, $type = 'f', $hasmv = "", $extra = "")
{
    // 格式在 bootstrap.php 的 index_encode_record() 里定义，读端用同一张标签表
    fwrite($writer, index_encode_record($id, $path, $name, $cover, $type, $hasmv, $extra));
}
function remove_ext($path)
{
    $parent = dirname($path);
    $basen = basename($path);
    $idx = strripos($basen, ".");
    if ($idx == false) {
        return $path;
    } else {
        return $parent . "\\" . substr($basen, 0, $idx);
    }
}
function searchLocalFiles($path, $writer)
{
    if (!is_dir($path)) {
        return;
    }
    $arr = scandir($path);
    $cover = -1;
    if (file_exists($path . '\\cover.jpg')) {
        $cover = saveCover($writer, $path . '\\cover.jpg');
    } else if (file_exists($path . '\\cover.png')) {
        $cover = saveCover($writer, $path . '\\cover.png');
    }
    saveFolder($writer, $path, $cover);

    foreach ($arr as $value) {
        //过滤掉当前目录和上级目录
        if ($value !== "." && $value !== "..") {
            //判断是否是文件夹
            if (is_dir($path . '\\' . $value)) {
                $tresult = searchLocalFiles($path . '\\' . $value, $writer); //继续遍历
            } else {
                $extra = "";
                $filename = $path . '\\' . $value;
                $coverd = $cover;

                $flag = false;
                $pathwithoutext = remove_ext($filename);
                // echo $pathwithoutext . "\n";
                if (fnmatch("*.mp3", $filename)) {
                    $flag = true;
                }
                if (file_exists($pathwithoutext . '.jpg')) {
                    $coverd = saveCover($writer, $pathwithoutext . '.jpg');
                } else if (file_exists($pathwithoutext . '.png')) {
                    $coverd = saveCover($writer, $pathwithoutext . '.png');
                }
                if (!$flag)
                    continue;
                $id = getId2($path . '\\' . $value, 2);
                // $file = new localfileinfo();
                // $file->path = $value;
                // $file->type = 0;
                // $file->cover = $cover;
                // $result[] = $file;
                //a.b
                $end = strrpos($value, ".");
                $name = $value;
                if ($end > 0) {
                    $name = substr($value, 0, $end);
                }
                $hasMv = 0;
                if (file_exists($pathwithoutext . '.mp4')) {
                    $hasMv = 1;
                }
                // if($GLOBALS['enableDetail']) if (file_exists($pathwithoutext . '.lrc')) {
                //     $t = fopen($pathwithoutext . '.lrc', "r");
                //     $timelen = strlen("[00:00.00]");
                //     $extra = "";
                //     $line = fgets($t);
                //     if (substr($line, 0, $timelen) == "[00:00.00]") {
                //         $line = fgets($t);
                //         if (substr($line, 0, $timelen) == "[00:00.00]") {
                //             $extra = substr($line, $timelen);
                //             $charset = mb_detect_encoding($extra, array('UTF-8', 'GBK', 'GB2312'));
                //             $charset = strtolower($charset);
                //             if ('cp936' == $charset) {
                //                 $charset = 'GBK';
                //             }
                //             if ("utf-8" != $charset) {
                //                 $extra = trim(iconv($charset, "UTF-8//IGNORE", $extra));
                //                 if (substr($extra, 0, strlen("相关人员")) == "相关人员") {
                //                     $extra = "";
                //                 }
                //             }
                //         }
                //     }
                //     fclose($t);
                // }
                writeFileInfo($writer, $id, $filename, $name, $coverd, 'f', $hasMv, $extra);
            }
        }
    }
}
