<?php
/*
 * 一次性维护脚本：修复目录别名表 ../cache/names.txt.bamboomusic 中的路径。
 *
 * 背景：manager/index.html 的 js_H() 曾把路径里的反斜杠转义成双反斜杠再写进 HTML 属性，
 * 于是别名表里的路径变成 E:\\NEWDOWNLOAD\\ANIMATE，而索引 list.txt 里是 E:\NEWDOWNLOAD\ANIMATE，
 * getDirAlName() 的精确比较与 strstr 比较都会失败，所有别名失效。
 *
 * 本脚本只做路径规范化（名字原样保留），不做任何猜测；文件已规范时不写入任何内容。
 * 仅限命令行运行：
 *     F:\PHP-Runtime\php.exe apis\local\repair_names.php
 */
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit(1);
}

chdir(__DIR__);
require_once(__DIR__ . "/listfiles.php");

$namesFile = cache_path('names.txt');

if (!is_file($namesFile)) {
    echo "找不到 {$namesFile}，无需修复。\n";
    exit(0);
}

// 索引里的目录集合，和站点读到的是同一份
$knownDirs = array();
foreach ($GLOBALS['filelist'] as $info) {
    if (isset($info['type']) && $info['type'] === 'l') {
        $knownDirs[$info['path']] = true;
    }
}

$raw = file_get_contents($namesFile);
$records = alias_parse_text($raw); // 用 bootstrap.php 里那份解析，不再自己写一遍格式

$out = array();
$seen = array();
$fixed = 0;
$dups = array();
$missing = array();
foreach ($records as $rec) {
    $path = normalize_dir_path($rec->path);
    if ($path === "") continue;
    if ($path !== $rec->path) $fixed++;
    if (isset($seen[$path])) {
        $dups[] = $path;
        continue;
    }
    $seen[$path] = true;
    if (!isset($knownDirs[$path])) $missing[] = $path;
    $out[] = array('path' => $path, 'name' => $rec->name);
}
$new = alias_encode_records($out);

echo "解析到别名记录：" . count($records) . " 条\n";
echo "路径需要规范化：" . $fixed . " 条\n";
echo "合并重复路径：" . count($dups) . " 条\n";
echo "索引里找不到的路径：" . count($missing) . " 条\n";
foreach ($missing as $m) echo "    [!] " . $m . "\n";
echo "索引中目录 " . count($knownDirs) . " 个，待写回记录 " . count($out) . " 条\n";

if ($new === $raw) {
    echo "文件已是规范形式，未做任何写入。\n";
    exit(0);
}

$backup = BAMBOO_CACHE_DIR . DIRECTORY_SEPARATOR . "names.txt.corrupt-" . date("Ymd-His") . BAMBOO_FILES_SUFFIX;
if (!copy($namesFile, $backup)) {
    echo "备份失败，已中止，未修改原文件。\n";
    exit(1);
}
if (file_put_contents($namesFile, $new) === false) {
    echo "写入失败！原文件已备份在 {$backup}\n";
    exit(1);
}

echo "原文件已备份为 {$backup}\n";
echo "已写回 " . count($out) . " 条记录。\n";
