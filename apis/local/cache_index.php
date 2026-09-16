<?php
/*
 * 索引的加载与查询。
 *
 * 索引（list.txt.bamboomusic，2.5MB / 85736 行）原来在每次请求 include 时都要
 * 完整解析一遍：实测 18.6ms，type=status、每一张封面、每一个音频 range 请求都要付一次。
 *
 * 这里做两件事：
 *  1. 把解析结果再缓存成一份 PHP 数组文件（list.cache.bamboomusic）。opcache 生效时 include 它是
 *     0.002ms（opcache 把数组以不可变常量数组放在共享内存里，零解析零拷贝）；不生效时 include 一个
 *     几 MB 的数组字面量反而比解析更慢（22ms），所以只在检测到 opcache 生效时才使用和生成它。
 *  2. 缓存用 list.txt 的 mtime+size 做校验，索引一变就自动失效；管理端的刷新流程还会显式删一次。
 *
 * 注意：opcache 缓存的是不可变常量数组，加载后只能读不能写（写会触发整数组深拷贝）。
 */

require_once __DIR__ . '/bootstrap.php';

/** 当前索引文件的指纹。*/
function index_file_meta($file)
{
    return array(@filemtime($file), @filesize($file));
}

function index_invalidate_fast_cache()
{
    $cacheFile = cache_path('list.cache');
    if (is_file($cacheFile)) @unlink($cacheFile);
    if (function_exists('opcache_invalidate')) @opcache_invalidate($cacheFile, true);
}

function index_write_fast_cache($cacheFile, $meta, $data, $save_all_ids)
{
    $payload = array(
        'meta' => $meta,
        'has_all_ids' => $save_all_ids,
        'filelist' => $data[0],
        'id_lists' => $data[1],
        'all_id_lists' => $data[2],
    );
    $tmp = $cacheFile . '.tmp';
    $body = "<?php\n// 由 cache_index.php 生成，删除它只是让下一次请求回退到解析索引。\nreturn " . var_export($payload, true) . ";\n";
    if (@file_put_contents($tmp, $body) === false) return;
    if (!@rename($tmp, $cacheFile)) {
        @unlink($tmp);
        return;
    }
    if (function_exists('opcache_invalidate')) @opcache_invalidate($cacheFile, true);
}

/**
 * 取出索引：array($filelist, $id_lists, $all_id_lists, $id_finder)。
 * $save_all_ids 为 true 时需要全部 id（管理端刷新额外信息用）。
 * 索引文件不存在时返回空数据，和原来的行为一致（静默降级）。
 */
function index_load($save_all_ids = false)
{
    $file = cache_path('list.txt');
    if (!is_file($file)) {
        return array(array(), array(), array(), null);
    }
    $meta = index_file_meta($file);
    $cacheFile = cache_path('list.cache');

    if (opcache_constant_arrays_enabled() && is_file($cacheFile)) {
        $cached = null;
        try {
            $cached = @include $cacheFile;
        } catch (\Throwable $e) {
            $cached = null;
        }
        if (
            is_array($cached) && isset($cached['meta'], $cached['filelist'], $cached['id_lists'])
            && $cached['meta'] === $meta
            && (!empty($cached['has_all_ids']) || !$save_all_ids)
        ) {
            return array(
                $cached['filelist'],
                $cached['id_lists'],
                $save_all_ids ? $cached['all_id_lists'] : array(),
                index_build_id_finder($cached['filelist']),
            );
        }
        // 缓存过期：下一次 include 必须是新编译的，否则会拿到 opcache 里的旧版本
        if (function_exists('opcache_invalidate')) @opcache_invalidate($cacheFile, true);
    }

    $data = index_parse_file($file, $save_all_ids);

    if (opcache_constant_arrays_enabled()) {
        index_write_fast_cache($cacheFile, $meta, $data, $save_all_ids);
    }
    return $data;
}

function getId($file)
{
    if (empty($GLOBALS['id_finder'][$file]))
        return false;
    return $GLOBALS['id_finder'][$file];
}
function getInfo($id)
{
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
