<?php
include("./listfiles.php");


if (empty($_GET['id'])) {
    http_response_code(403);
    return;
}

$type = "img";
$value = $_GET['id'];
$res = getSongPath($value);
if ($res == false) {
    echo '{"code":404,"msg":"404 - 图片不存在"}';
    http_response_code(404);
    return;
}
// echo $res;


// 文件名
$filename = $res;
$location = $res;
// 文件路径

if (!is_file($location)) {
    echo '{"code":404,"msg":"404 - 图片不存在"}';
    http_response_code(404);
    return;
}
// 后缀

$extension = substr(strrchr($location, '.'), 1);
if ($extension != 'png' && $extension != 'jpg') {
    echo '{"code":404,"msg":"404 - 图片不存在"}';
    http_response_code(404);
    return;
}
$interval = 12000; //200分钟
if (isset($_SERVER['HTTP_IF_MODIFIED_SINCE'])) {
    // HTTP_IF_MODIFIED_SINCE即下面的: Last-Modified,文档缓存时间.
    // 缓存时间+时长.
    $c_time = strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) + $interval;
    // 当大于当前时间时, 表示还在缓存中... 释放304
    if ($c_time > time()) {
        header('HTTP/1.1 304 Not Modified');
        exit();
    }
}
header('Cache-Control:max-age=' . $interval);
header("Expires: " . gmdate("D, d M Y H:i:s", time() + $interval) . " GMT");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");

$mimeType = "image/" . $extension;
//; charset=gb2312
// $size = filesize($location);
$time = date('r', filemtime($location));

include("downloadlib.php");

header("Last-Modified: $time");
$obj = new FileDownload();
$obj->download($location, '', true, $mimeType, true);
