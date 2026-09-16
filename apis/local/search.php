<?php
/*
 * 索引扫描：按目录列歌、按关键词搜歌。
 *
 * 这两个函数是请求里唯一 O(n) 扫描索引的地方（n = 9985 首歌），匹配语义、分页算术
 * （$GLOBALS['total'] / $GLOBALS['totalcount'] 的用法）都与原来逐行一致——前端靠 $total 判断
 * “没有更多了”，多报 1 的策略是有意的，别顺手改成真实总数。
 *
 * 相对原来的改动只有热路径：循环边界、$vv、$filelist/$id_lists 的引用都提到循环外，
 * 别名查找交给 getDirAlName() 的哈希表（原来每扫一行要两趟扫 377 条别名）。
 */

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/search_match.php';

function searchForFolder($folder, $limit, $offset)
{
    $flist = $GLOBALS['filelist'];
    $filecount = 0;
    $count = 0;
    $id_lists = $GLOBALS['id_lists'];
    $res = [];
    $albumname = getDirAlName($folder);
    $total_ids = count($id_lists);

    for ($i = 0; $i < $total_ids; $i++) {
        $cid = $id_lists[$i];
        if ($flist[$cid]['type'] == 'f') {
            // l for folder;
            // i for image;
            // f for file;
            if ($count >= $limit) {
                $count++;
                break;
            }
            if (stripos($flist[$cid]['path'], $folder) !== false) {
                $filecount++;
                if ($filecount <= ($offset - 1) * $limit) continue;
                $count++;
                $finfo = new fileinfo();
                $finfo->path = $flist[$cid]['path'];
                $finfo->filename = $flist[$cid]['name'];
                $finfo->id = $cid;
                $finfo->cover = $flist[$cid]['cover'];
                $finfo->extra = $flist[$cid]['extra'];
                $finfo->trueextra = $flist[$cid]['trueextra'];
                $finfo->albumname = $albumname;

                $res[] = $finfo;
            }
        }
    }

    $GLOBALS['total'] = $limit * ($offset - 1) + $count;
    $GLOBALS['files'] = $res;
}

/** 把一条命中记录放进结果列表（字段赋值与原实现逐项一致）。*/
function search_collect_item($cid, $info, $albumname)
{
    $finfo = new fileinfo();
    $finfo->path = $info['path'];
    $finfo->filename = $info['name'];
    $finfo->id = $cid;
    $finfo->cover = $info['cover'];
    $finfo->extra = $info['extra'];
    $finfo->trueextra = $info['trueextra'];
    $finfo->albumname = $albumname;
    $GLOBALS['files'][] = $finfo;
}

function searchFileByName($value, $limit = 15, $offset = 1, $suggestMode = true, $complete = false)
{
    $enforceReal = false;
    if ($suggestMode) $enforceReal = true;
    $GLOBALS['total'] = $limit * ($offset - 1);
    $count = 0;
    if ($suggestMode) $offset = 1;
    if ($offset <= 0) $offset = 1;

    $id_lists = $GLOBALS['id_lists'];
    $filelist = $GLOBALS['filelist'];
    $total_ids = count($id_lists);
    $pageStart = ($offset - 1) * $limit;
    $skipAlbumSuggest = false; // 本页被截断时不追加专辑建议（对应原来的提前 return）

    if ($complete) {
        // type=singer：歌手精确匹配，保持原语义（不分词、不打分、按索引顺序）
        for ($i = 0; $i < $total_ids; $i++) {
            if ($count >= $limit) {
                $GLOBALS['total']++;
                return;
            }
            $cid = $id_lists[$i];
            $info = $filelist[$cid];
            $albumname = getDirAlName(dirname($info['path']));
            $flag = false;
            $singer = substr($info['name'], 0, strpos($info['name'], " - "));
            $singer = str_replace("、", "&", $singer);
            $value = str_replace("、", "&", $value);
            $idx = stripos($singer, "&");
            if ($singer == "") $singer = "匿名";
            if ($singer == $value) {
                $flag = true;
            } else if ($idx != false) {
                $singers = explode("&", $singer, 20);
                for ($j = 0; $j < count($singers); $j++) {
                    if ($singers[$j] == $value) {
                        $flag = true;
                        break;
                    }
                }
            }
            if (!$flag) continue;
            $GLOBALS['totalcount']++;
            if ($GLOBALS['totalcount'] <= $pageStart) continue;
            search_collect_item($cid, $info, $albumname);
            $count++;
            $GLOBALS['total']++;
        }
    } else {
        $terms = search_tokenize($value);
        $query = trim((string)$value);
        if (count($terms) === 0 || $query === "") {
            // 空查询 = 列出全部（前端「全部歌曲」）：保持原来的索引顺序与提前退出
            for ($i = 0; $i < $total_ids; $i++) {
                if ($count >= $limit) {
                    $GLOBALS['total']++;
                    return;
                }
                $cid = $id_lists[$i];
                $info = $filelist[$cid];
                $albumname = getDirAlName(dirname($info['path']));
                $GLOBALS['totalcount']++;
                if ($GLOBALS['totalcount'] <= $pageStart) continue;
                search_collect_item($cid, $info, $albumname);
                $count++;
                $GLOBALS['total']++;
            }
        } else {
            // 有查询词：全量扫描打分，按相关性排序后取当前页
            $keys = search_keys_load();
            $matches = array();
            foreach ($id_lists as $cid) {
                $info = $filelist[$cid];
                $albumname = getDirAlName(dirname($info['path']));
                // 逐元素取值：整条 $keys[$cid] 取出来会把常量数组里的子数组物化一份，白白多几次分配
                $score = search_score_row(
                    $cid,
                    $info,
                    $albumname,
                    isset($keys[$cid][0]) ? $keys[$cid][0] : "",
                    isset($keys[$cid][1]) ? $keys[$cid][1] : "",
                    isset($keys[$cid][2]) ? $keys[$cid][2] : "",
                    $terms,
                    $query
                );
                if ($score > 0) $matches[$cid] = $score;
            }
            // 一条精确命中都没有时才跑容错回退（拼错、缺空格、分隔符不一致），代价只在这时付出
            if (count($matches) < SEARCH_BACKFILL_TRIGGER) {
                foreach ($id_lists as $cid) {
                    if (isset($matches[$cid])) continue;
                    $score = search_fuzzy_row(isset($keys[$cid][0]) ? $keys[$cid][0] : "", $terms);
                    if ($score > 0) $matches[$cid] = $score;
                }
            }
            $totalMatches = count($matches);
            if ($totalMatches > 0) {
                arsort($matches); // PHP 8 排序稳定：同分保持原索引顺序，分页结果可复现
                $pageIds = array_slice(array_keys($matches), $pageStart, $limit);
                foreach ($pageIds as $cid) {
                    $info = $filelist[$cid];
                    $albumname = getDirAlName(dirname($info['path']));
                    search_collect_item($cid, $info, $albumname);
                    $count++;
                }
            }
            $shown = $pageStart + $count;
            // 前端用 total 判断「没有更多了」：沿用原来的「已展示 + 还有剩余则多报 1」
            $GLOBALS['total'] = $shown + ($shown < $totalMatches ? 1 : 0);
            $GLOBALS['totalcount'] = $shown;
            $skipAlbumSuggest = ($shown < $totalMatches);
        }
    }

    if ($suggestMode && !$skipAlbumSuggest) {
        // 遍历专辑：搜索建议里也要带上专辑名
        $skipcount = 0;
        $skipcount_2 = 0;
        loadPathNames();
        $suggestTerms = search_tokenize($value); // 与搜索一致：多词 AND、顺序无关
        if ($GLOBALS['pathnames'] != null) {
            foreach ($GLOBALS['pathnames'] as $vvalue) {
                $skipcount++;
                if ($skipcount < $pageStart + 1) continue;
                $ele = $vvalue;
                $pps = $ele->path;

                if ($ele->name == "") $ele->name = dirname($pps);
                // 专辑名建议也走和搜索一致的匹配规则（分词 AND + 归一化 + 容错），而不是原始子串
                if (!search_terms_hit($ele->name, $suggestTerms)) continue;
                $skipcount_2++;
                if ($skipcount_2 < $pageStart + 1) continue;
                $finfo = new fileinfo();
                $svalue = $ele->name;
                $finfo->filename = $svalue;
                $GLOBALS['files'][] = $finfo;
                $count++;
                $GLOBALS['total']++;
            }
        }
    }
}
