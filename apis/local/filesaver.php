<?php
// include("./pinyinlib.php");


/*
文件结构：

>id
|文件地址
/名字
]拼音
,封面
.类型
<

*/
$temp = [];
$ids = [];
$idx = 0;
function generateId($path)
{
    $wantId = md5($path);
    $i = 0;
    while (!empty($GLOBALS['ids'][$wantId . $i])) {
        $i++;
    }
    return $wantId . $i;
}
function getId2($path)
{
    if (empty($GLOBALS['temp'][$path])) {
        // new id
        $id = generateId($path);
        $GLOBALS['temp'][$path] = ($id);
        $GLOBALS['ids'][$id] = true;
    }
    return $GLOBALS['temp'][$path];
}
function saveFolder($writer, $path, $cover = -1)
{
    if (empty($GLOBALS['temp'][$path])) {
        // new id
        $id = generateId($path);
        $GLOBALS['temp'][$path] = ($id);
        $GLOBALS['ids'][$id] = true;
        writeFileInfo($writer, ($id), $path, "", $cover, "l");
    }
    return $GLOBALS['temp'][$path];
}
function saveCover($writer, $path)
{
    if (empty($GLOBALS['temp'][$path])) {
        // new id
        $id = generateId($path);
        $GLOBALS['temp'][$path] = ($id);
        $GLOBALS['ids'][$id] = true;
        writeFileInfo($writer, ($id), $path, "", -1, "i");
    }
    return $GLOBALS['temp'][$path];
}
function searchHost()
{
    $reader = fopen("../cache/location.txt.bamboomusic", "r");
    $file = "../cache/list.txt.bamboomusic";
    //打开文件
    $openFile = fopen($file, "w");
    //测试写入并换行
    while (!feof($reader)) {
        $path = fgets($reader);
        // echo "<h1>$path</h1>";
        searchLocalFiles(trim($path), $openFile);
    }
    // saveId();

    fclose($openFile);
    fclose($reader);
}
function writeFileInfo($writer, $id, $path, $name = "", $cover = -1, $type = 'f', $extra = "")
{
    /*
    >id
    |文件地址
    /名字
    ,封面
    .类型
    <
    */
    $out = ">$id\r\n|$path\r\n/$name\r\n,$cover\r\n.$type\r\n]$extra\r\n<\r\n";
    fwrite($writer, $out);
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
                writeFileInfo($writer, $id, $filename, $name, $coverd, 'f', $hasMv);
            }
        }
    }
}
