<?php
/*
 * 按 id 输出封面图片。带 304 / Expires 缓存头（注意 downloadlib 里的 Cache-Control 会覆盖这里
 * 的 max-age，实际生效的是 1000 秒，这是现状，改前端行为前别动）。
 */
require_once __DIR__ . '/listfiles.php';

if (empty($_GET['id'])) {
    http_response_code(403);
    return;
}

$value = $_GET['id'];
$res = getSongPath($value);
if ($res == false) {
    // echo '{"code":404,"msg":"404 - 图片不存在"}';
    http_response_code(200);
    $mimeType = "image/png";
    header('Content-Type: ' . $mimeType);

    echo file_get_contents(dirname(__DIR__, 2) . "/static/img/unknown.png");
    return;
}
// echo $res;


// 文件路径
$location = $res;

if (!is_file($location)) {
    echo '{"code":404,"msg":"404 - 图片消失了！"}';
    http_response_code(404);
    return;
}
// 后缀

$extension = substr(strrchr($location, '.'), 1);
if ($extension != 'png' && $extension != 'jpg' && $extension != 'svg') {
    echo '{"code":404,"msg":"404 - 图片格式错误"}';
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

require_once __DIR__ . '/downloadlib.php';

$obj = new FileDownload();
$obj->download($location, '', true, $mimeType, true);
