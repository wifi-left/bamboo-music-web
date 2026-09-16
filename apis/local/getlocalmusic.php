<?php
/*
 * 音频/视频流的实际发送端。local.php 的 type=url / type=mv 会签发这里的 URL：
 *   t = base64(crypt("<br>_<id>_<日期>_<随机数>", salt))
 * 校验通过后按 Range 请求切片发送（播放器拖动进度就靠这个）。token 用日期绑定，跨天失效。
 */
require_once __DIR__ . '/listfiles.php';
include(cache_path('salt'));
if (empty($_GET['id'])) {
    http_response_code(403);
    return;
}
$type = "music";
if (empty($_GET['r'])) {
    http_response_code(403);
    return;
}
if (empty($_GET['t'])) {
    http_response_code(403);
    return;
}
if (empty($_GET['d'])) {
    http_response_code(403);
    return;
}
if (empty($_GET['br'])) {
    http_response_code(403);
    return;
}
// echo $res;
$ran = $_GET['r'];
$value = $_GET['id'];
$br = $_GET['br'];
$time = crypt($br . "_" . $value . '_' . $_GET['d'] . $ran, $salt);
$requesttime = strtotime($_GET['d']);
$realtime = strtotime(date('Y-m-d'));
if (abs($realtime - $requesttime) >= 86400) {
    http_response_code(403);
    return;
}
if ($br == "mp3") $type = "mp3";
else if ($br == "flac") $type = "flac";
else if ($br == "mp4") $type = "mp4";
// 文件名
if ($time != base64_decode($_GET['t'])) {
    http_response_code(403);
    return;
}

$allowOringin = false;
if (substr($value, 0, 1) == 'D') {
    $allowOringin = true;
    $value = substr($value, 1);
}
if ($allowOringin) {
    header('Access-Control-Allow-Origin: *');
}
$res = getSongPath($value);
if ($res == false) {
    echo '{"code":404,"msg":"404 - 此歌曲不存在"}';
    http_response_code(404);
    return;
}

$filename = $res;

// 文件路径
$location = $res;
if ($type != 'music') {
    $filewithoutext = substr($res, 0, strrpos($res, "."));
    $location = $filewithoutext . '.' . $type;
    if (!is_file($location)) {
        $type = "mp3";
        $location = $filewithoutext . '.' . $type;
    }
}
if (!is_file($location)) {
    echo '{"code":404,"msg":"404 - 此歌曲不存在"}';
    http_response_code(404);
    return;
}
// 后缀

$extension = substr(strrchr($location, '.'), 1);
$mimeType = "text/plain";
if ($extension == "mp3") {
    $mimeType = "audio/mpeg";
} else if ($extension == "ogg") {
    $mimeType = "audio/ogg";
} else if ($extension == "mp4") {
    $mimeType = "audio/mp4";
} else if ($extension == "txt") {
    $mimeType = "text/plain";
} else if ($extension == "json") {
    $mimeType = "text/plain";
} else if ($extension == "lrc") {
    $mimeType = "text/plain";
    // echo $extension;
} else if ($extension == "jpg") {
    $mimeType = "image/jpeg";
} else if ($extension == "png") {
    $mimeType = "image/png";
} else if ($extension == "svg") {
    $mimeType = "image/svg";
}
//; charset=gb2312
// $size = filesize($location);
$time = date('r', filemtime($location));

header("Last-Modified: $time");

//$begin++;  如果不读取第一个字节
require_once __DIR__ . '/downloadlib.php';
header("Accept-Encoding: identity");
header('Accept-Ranges: bytes');

$obj = new FileDownload();
$obj->download($location, '', true, $mimeType, false);
