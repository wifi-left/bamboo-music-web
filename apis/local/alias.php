<?php
/*
 * 目录别名表（自定义专辑名）。
 *
 * 别名表的路径必须和索引里的目录路径逐字相同，否则匹配不上（历史上被双反斜杠写坏过一次，
 * 导致 377 个别名全部失效，normalize_dir_path() 就是为此而生的）。
 *
 * getDirAlName() 原来每次调用都要两趟扫完整张别名表，而搜索是「每一行调用一次」——最坏
 * 9985 行 × 754 次比较。这里改成先用哈希表精确命中，没命中才走原来的 strstr 兜底趟，并把
 * 结果记下来；实际只有 357 个不同的目录，于是 141ms 的搜索降到个位数毫秒。
 */

require_once __DIR__ . '/bootstrap.php';

$pathnames = null;              // pathinfo 对象数组，管理端 action=1 会原样 json_encode 出去
$pathnames_map = null;          // 路径 => 同一个 pathinfo 对象（精确匹配用，O(1)）
$dirname_alias_memo = array();  // 目录路径 => 别名（含 strstr 兜底结果，避免重复扫表）

// 把误写成双反斜杠的路径合并回单个反斜杠（UNC 前缀除外，末尾分隔符也去掉）
function normalize_dir_path($path)
{
    $path = trim($path);
    if ($path === "") return "";
    $isUnc = (substr($path, 0, 2) === "\\\\");
    $path = preg_replace('/\\\\{2,}/', '\\\\', $path);
    if ($isUnc) $path = "\\" . $path;
    if (strlen($path) > 3) $path = rtrim($path, "\\/");
    return $path;
}

/** 建立精确匹配用的哈希表。同一路径重复出现时保留先出现的那条，和原来第一趟循环的语义一致。*/
function alias_build_map($list)
{
    $map = array();
    foreach ($list as $item) {
        if (!isset($map[$item->path])) $map[$item->path] = $item;
    }
    return $map;
}

function loadPathNames()
{
    if ($GLOBALS['pathnames'] !== null) return; // 每个请求只解析一次（原来每次调用都会重解析一遍）
    $namesFile = cache_path('names.txt');
    $legacyFile = cache_path('names.json');
    if (is_file($namesFile)) {
        $raw = @file_get_contents($namesFile);
        if ($raw === false) send_error("无法读取ID缓存列表。");
        $list = alias_parse_text($raw);
        $GLOBALS['pathnames'] = $list;
        $GLOBALS['pathnames_map'] = alias_build_map($list);
    } else if (is_file($legacyFile)) { // 兼容旧版本
        $content = @file_get_contents($legacyFile);
        if ($content === false || $content === "") $content = '[]';
        $list = json_decode($content);
        $GLOBALS['pathnames'] = $list;
        $GLOBALS['pathnames_map'] = is_array($list) ? alias_build_map($list) : null;
    }
}

function getDirAlName($dir)
{
    if ($GLOBALS['pathnames'] == null) loadPathNames();
    if ($GLOBALS['pathnames'] == null) return ($dir);
    if (isset($GLOBALS['pathnames_map'][$dir])) {
        $ele = $GLOBALS['pathnames_map'][$dir]; // 与 $pathnames 里是同一个对象，改名字会同步过去
        if ($ele->name == "") $ele->name = dirname($ele->path);
        return $ele->name;
    }
    if (array_key_exists($dir, $GLOBALS['dirname_alias_memo'])) {
        return $GLOBALS['dirname_alias_memo'][$dir];
    }
    // 兜底：第一条 path 是 $dir 子串的记录（顺序敏感，保持原样）
    foreach ($GLOBALS['pathnames'] as $value) {
        $ele = $value;
        $pps = $ele->path;
        if (strstr($dir, $pps)) {
            if ($ele->name == "") $ele->name = dirname($pps);
            $GLOBALS['dirname_alias_memo'][$dir] = $ele->name;
            return $ele->name;
        };
    }
    $GLOBALS['dirname_alias_memo'][$dir] = $dir;
    return ($dir);
}
