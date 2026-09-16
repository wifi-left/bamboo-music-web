<?php
/*
 * 搜索的匹配与打分原语。
 *
 * 搜索要解决的四件事，都放在这里：
 *  1. 分词：空格和 | 都是分隔符，多个词取交集（原来只有 | 能分词，空格被当成子串的一部分）。
 *  2. 归一化：半角/全角、大小写、各种分隔符（× ・ - / _ 等）统一，这样「guilty idol」能搜到
 *     「Guilty×Idol」，「ＬＯＶＥ」能搜到「Love」。归一化键按索引指纹缓存成一份文件，
 *     索引一变（刷新缓存 / 换目录）自动失效重建。
 *  3. 打分：精确 > 前缀 > 词首 > 子串，歌名权重高于专辑别名高于 LRC 附加信息，名字短的略优先；
 *     按分数排序后分页，最相关的不再淹没在文件顺序里。
 *  4. 容错回退：精确命中不足一页时才跑一趟子序列匹配（允许跳字），所以「Gilty Idol」「guiltyidol」
 *     也能命中，代价只在这时才付出。
 *
 * 不变式：原来能搜到的，现在一定还能搜到——每行除了比对归一化键，仍然做一次原来的原始子串匹配。
 */

require_once __DIR__ . '/bootstrap.php';

const SEARCH_FIELD_NAME = 100;    // 字段优先级：歌名 > 专辑别名 > LRC 附加信息
const SEARCH_FIELD_ALBUM = 50;
const SEARCH_FIELD_EXTRA = 20;
const SEARCH_SCORE_ID = 100000;   // id 精确命中（原来 $cid === $term 也算命中）
const SEARCH_BACKFILL_TRIGGER = 1; // 一条精确命中都没有时（=0）才跑容错回退

/** 归一化检索键：半角/全角统一 + 小写 + 分隔符折叠成空格。*/
function search_normalize_key($s)
{
    if ($s === null || $s === "") return "";
    $s = (string)$s;
    if (function_exists('mb_convert_kana')) {
        $s = mb_convert_kana($s, "KVas", "UTF-8"); // 半角假名→全角、全角字母数字→半角
    }
    $s = mb_strtolower($s, "UTF-8");
    // × ✕ ✖ ・ ･ ／ - – — − _ \ | : ： ～ 等统一成空格
    $s = preg_replace('/[\x{00d7}\x{2715}\x{2716}\x{ff58}\x{fe58}\x{30fb}\x{ff65}\x{2043}\x{2010}-\x{2015}\x{ff0d}\x{2212}\x{002d}\x{005f}\x{002f}\x{005c}\x{007c}\x{003a}\x{ff1a}\x{301c}\x{ff5e}\x{007e}]+/u', ' ', $s);
    $s = preg_replace('/[\x{3000}\s]+/u', ' ', $s);
    return trim($s);
}

/** 查询分词：空格与 | 都算分隔符，最多 8 个词（防止超长查询拖慢扫描）。*/
function search_tokenize($value)
{
    $terms = array();
    foreach (preg_split('/[\s|]+/u', (string)$value) as $t) {
        if ($t === "") continue;
        $terms[] = $t;
        if (count($terms) >= 8) break;
    }
    return $terms;
}

function search_keys_file()
{
    return cache_path('search.keys');
}

/** 指纹要同时含索引和别名表：专辑别名变了，专辑检索键也就变了。*/
function search_keys_meta()
{
    $idx = cache_path('list.txt');
    $names = cache_path('names.txt');
    return array(@filemtime($idx), @filesize($idx), @filemtime($names), @filesize($names));
}

function search_keys_invalidate()
{
    $f = search_keys_file();
    if (is_file($f)) @unlink($f);
    if (function_exists('opcache_invalidate')) @opcache_invalidate($f, true);
}

/** 为索引里每首歌预计算三个归一化键：歌名 / LRC 附加信息 / 专辑别名。*/
function search_keys_build()
{
    $keys = array();
    foreach ($GLOBALS['id_lists'] as $id) {
        $info = $GLOBALS['filelist'][$id];
        $keys[$id] = array(
            search_normalize_key($info['name']),
            search_normalize_key($info['trueextra']),
            search_normalize_key(getDirAlName(dirname($info['path']))),
        );
    }
    return $keys;
}

function search_keys_write($file, $meta, $keys)
{
    $tmp = $file . '.tmp';
    $body = "<?php\n// 由 search_match.php 生成（搜索用归一化检索键），删除它只是让下一次搜索重建。\nreturn "
        . var_export(array('meta' => $meta, 'keys' => $keys), true) . ";\n";
    if (@file_put_contents($tmp, $body) === false) return;
    if (!@rename($tmp, $file)) {
        @unlink($tmp);
        return;
    }
    if (function_exists('opcache_invalidate')) @opcache_invalidate($file, true);
}

/**
 * 载入归一化键（每个请求一次）。
 * opcache 生效时用常量数组文件（include 是共享内存里的零拷贝）；没生效就现算——这时写文件
 * 反而更慢（要先编译几 MB 的字面量），所以干脆不落盘。
 */
function search_keys_load()
{
    static $keys = null;
    if ($keys !== null) return $keys;
    $file = search_keys_file();
    $fast = opcache_constant_arrays_enabled();
    if ($fast && is_file($file)) {
        $data = null;
        try {
            $data = @include $file;
        } catch (\Throwable $e) {
            $data = null;
        }
        if (is_array($data) && isset($data['meta'], $data['keys']) && $data['meta'] === search_keys_meta()) {
            $keys = $data['keys'];
            return $keys;
        }
        if (function_exists('opcache_invalidate')) @opcache_invalidate($file, true);
    }
    $keys = search_keys_build();
    if ($fast) search_keys_write($file, search_keys_meta(), $keys);
    return $keys;
}

/**
 * 单个字段对单个词的得分。0 表示没命中。
 * 分档：整字段相等 8 > 前缀 6 > 词首 4 > 子串 2 > 只命中原始串 1，再加上字段优先级
 * （歌名 +100、专辑别名 +50、LRC 附加信息 +20）。
 * 这样「歌名里只是子串」也一定排在「专辑别名完全相同」前面——否则一个正好叫 love 的专辑
 * 会把名字里含 love 的歌全压下去。归一化键只用于 ≥2 字符的词：像 "-m" 折叠成 "m" 这种
 * 单字符片段走原来的子串匹配即可，否则会把整库都捞进来。
 */
function search_score_field($rawText, $keyText, $rawTerm, $keyTerm, $fieldBonus)
{
    $tier = 0;
    if (strlen($keyTerm) >= 2 && $keyText !== "") {
        $pos = strpos($keyText, $keyTerm);
        if ($pos !== false) {
            if ($keyText === $keyTerm) $tier = 8;
            else if ($pos === 0) $tier = 6;
            else if (substr($keyText, $pos - 1, 1) === ' ') $tier = 4;
            else $tier = 2;
        }
    }
    if ($tier === 0) {
        if ($rawTerm === "" || $rawText === "") return 0;
        if (stripos($rawText, $rawTerm) === false) return 0;
        $tier = 1;
    }
    return $tier + $fieldBonus;
}

/** 整行打分：所有词都命中才算命中（AND，和原来一致），返回总分；0 表示不命中。*/
function search_score_row($cid, $info, $albumname, $nameKey, $extraKey, $albumKey, $terms, $query)
{
    if ($query !== "" && (string)$cid === $query) return SEARCH_SCORE_ID;
    $score = 0;
    foreach ($terms as $t) {
        $tk = search_normalize_key($t);
        $s = search_score_field($info['name'], $nameKey, $t, $tk, SEARCH_FIELD_NAME);
        if ($s === 0) {
            // 歌名没命中才看专辑别名和附加信息；歌名只要命中（哪怕只是子串 +100）就必然
            // 高于另外两个字段的最高档（58 / 28），所以这里可以省掉两次查找
            $sa = search_score_field($albumname, $albumKey, $t, $tk, SEARCH_FIELD_ALBUM);
            if ($sa > $s) $s = $sa;
            $se = search_score_field($info['trueextra'], $extraKey, $t, $tk, SEARCH_FIELD_EXTRA);
            if ($se > $s) $s = $se;
        }
        if ($s === 0) return 0;
        $score += $s;
    }
    // 同分档下歌名短的更像用户要找的那首（只作为最后的名次微调）
    $penalty = (int)(strlen($nameKey) / 12);
    $score -= ($penalty > 9 ? 9 : $penalty);
    return $score > 0 ? $score : 1;
}

/**
 * 子序列匹配（允许跳字）：返回 1~2 的分数，0 表示不匹配。
 * 必须找出「最紧凑的那次出现」——贪心地从第一个字符开始匹配会锁死在前面偶然出现的部分匹配上
 * （例如 "idol" 会先咬住 "guilty" 里的 i，然后被判跳字过多而漏掉真正的 idol）。
 * 做法：只在 词长+允许跳字数 的窗口内尝试每个起点，取跳字最少的结果。
 */
function search_subseq_score($hay, $need)
{
    $nl = strlen($need);
    $hl = strlen($hay);
    if ($nl === 0 || $hl === 0 || $nl > $hl) return 0;
    $maxGaps = (int)($nl * 0.4);     // 跳字超过词长的 40% 视为噪音
    $window = $nl + $maxGaps;
    $first = $need[0];
    $best = 0;
    for ($s = 0; $s + $nl <= $hl; $s++) {
        if ($hay[$s] !== $first) continue;
        $end = $s + $window;
        if ($end > $hl) $end = $hl;
        $j = 1;
        $last = $s;
        $gaps = 0;
        for ($i = $s + 1; $i < $end && $j < $nl; $i++) {
            if ($hay[$i] === $need[$j]) {
                $gaps += ($i - $last - 1);
                $last = $i;
                $j++;
            }
        }
        if ($j < $nl || $gaps > $maxGaps) continue;
        $score = 1 + 1 / (1 + $gaps);
        if ($score > $best) {
            $best = $score;
            if ($gaps === 0) break;   // 已经最优
        }
    }
    return $best;
}

/**
 * 一段原始文本是否「命中」某个词——用和搜索完全相同的规则（归一化键 + 原始子串 + 容错子序列）。
 * suggestKey 取提示词、以及专辑名建议扫描都用它：原来这两处用 stristr 做原始子串过滤，会把搜索
 * 已经找到的归一化/模糊命中又丢掉，于是打错字时提示词是空的。
 */
function search_term_hit($rawText, $term)
{
    if ($term === null || $term === "") return true; // 空查询：和搜索一致，全部算命中
    if ($rawText === null || $rawText === "") return false;
    $rawText = (string)$rawText;
    $tk = search_normalize_key($term);
    $key = $tk === "" ? "" : search_normalize_key($rawText);
    if (strlen($tk) >= 2 && $key !== "" && strpos($key, $tk) !== false) return true;
    if (stripos($rawText, $term) !== false) return true;
    if (strlen($tk) < 2 || $key === "") return false;
    return search_subseq_score($key, $tk) > 0;
}

/**
 * 所有词都命中才算命中（顺序无关），与 searchFileByName 的 AND 语义一致。
 * 取提示词必须用它而不是把整串关键词当一个词：否则「东方 17」这种词序和歌曲名里相反的多词查询，
 * 搜索能搜到、提示词却是空的（因为整串要求字面连续）。
 */
function search_terms_hit($rawText, $terms)
{
    if (count($terms) === 0) return true;
    foreach ($terms as $t) {
        if (!search_term_hit($rawText, $t)) return false;
    }
    return true;
}

/** 容错回退打分：所有词都能在歌名里按序找到（允许跳字）才算命中。分数远低于精确命中。*/
function search_fuzzy_row($nameKey, $terms)
{
    if ($nameKey === "" || $nameKey === null) return 0;
    $total = 0;
    foreach ($terms as $t) {
        $tk = search_normalize_key($t);
        if (strlen($tk) < 2) return 0; // 单字符片段不做容错，否则整库都会被捞进来
        $s = search_subseq_score($nameKey, $tk);
        if ($s <= 0) return 0;
        $total += $s;
    }
    return $total;
}
