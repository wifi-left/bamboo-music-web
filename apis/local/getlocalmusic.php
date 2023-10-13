<?php
include("./listfiles.php");
if (empty($_GET['id'])) {
    http_response_code(403);
    return;
}
$type = "music";
if (!empty($_GET['type'])) {
    $type = $_GET['type'];
}
$value = $_GET['id'];
$res = getSongPath($value);
if ($res == false) {
    echo '{"code":404,"msg":"404 - 此歌曲不存在"}';
    http_response_code(404);
    return;
}
// echo $res;


// 文件名
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
include("downloadlib.php");

$obj = new FileDownload();
$obj->download($location, '', true, $mimeType, false);
