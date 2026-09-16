<?php
/*
 * 索引/搜索的兼容入口。
 *
 * 原来这个文件把「三个数据类 + 全局状态 + 索引解析 + 查询辅助 + 别名表 + 搜索」全塞在一起，
 * 并且在被 include 的那一刻就把 2.5MB 索引解析进内存。现在职责拆到了：
 *   bootstrap.php   缓存路径、数据类、记录编解码
 *   cache_index.php 索引加载（含 opcache 常量数组快缓存）与 id 查询
 *   alias.php       目录别名表
 *   search.php      索引扫描（列目录、搜关键词）
 *
 * 本文件保留原来的入口语义：被 include 时就把索引读进那组全局变量（local.php、cover.php、
 * getlocalmusic.php、localmanager.php、repair_names.php 都不需要改 include 方式）。
 * $GLOBALS['manager_mode'] 必须在 include 本文件之前设置（管理端刷新额外信息依赖它收集全部 id）。
 */

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/cache_index.php';
require_once __DIR__ . '/alias.php';
require_once __DIR__ . '/search.php';

$files = array();
$limit = 30;
$offset = 1;
$count = 0;
$total = 0;
$totalcount = 0;

$id_finder = null;
$filelist = [];
$id_lists = [];
$all_id_lists = [];

if (!is_dir(BAMBOO_CACHE_DIR)) {
    mkdir(BAMBOO_CACHE_DIR);
    if (!is_dir(BAMBOO_CACHE_DIR)) {
        send_error("无法创建缓存目录。");
    }
}
loadLists();

function loadLists()
{
    $save_all_ids = !empty($GLOBALS['manager_mode']);
    $data = index_load($save_all_ids);
    $GLOBALS['filelist'] = $data[0];
    $GLOBALS['id_lists'] = $data[1];
    $GLOBALS['all_id_lists'] = $save_all_ids ? $data[2] : array();
    $GLOBALS['id_finder'] = $data[3];
}
