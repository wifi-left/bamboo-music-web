<?php
/*
 * apis/local 的公共基础设施。
 *
 * 这里放三样东西：
 *  1. 缓存目录/文件路径的单一来源。原来 "../cache/xxx.bamboomusic" 这样的字面量散在 6 个文件里共 37 处，
 *     而且都是相对 CWD 的，一旦工作目录变了就全断。
 *  2. 索引记录与别名表记录的编解码。同一个磁盘格式原来有 4 处各自独立的实现（读索引、写索引、读别名、
 *     写别名），改格式要同时改 4 个地方。
 *  3. 三个数据类。
 *
 * 注意：本文件不做任何 I/O，被包含时只声明常量和函数。
 */

// 允许维护/测试脚本在包含本文件前先定义它，把缓存目录指到别处（见 repair_names.php、CLI 重建测试）
if (!defined('BAMBOO_CACHE_DIR')) {
    define('BAMBOO_CACHE_DIR', dirname(__DIR__) . DIRECTORY_SEPARATOR . 'cache');
}
if (!defined('BAMBOO_FILES_SUFFIX')) {
    define('BAMBOO_FILES_SUFFIX', '.bamboomusic');
}

require_once __DIR__ . '/lib_simple.php';

/** 缓存文件名 -> 绝对路径。名字就是原来 xxx.bamboomusic 里 xxx 那部分。 */
function cache_path($name)
{
    return BAMBOO_CACHE_DIR . DIRECTORY_SEPARATOR . $name . BAMBOO_FILES_SUFFIX;
}

class fileinfo
{
    public $filename = "";
    public $path = "";
    public $id = 0;
    public $cover = -1;
    public $extra = "";
    public $trueextra = "";
    public $albumname = "";
}
class pathinfo
{
    public $path = "";
    public $name = "";
}
class localfileinfo
{
    public $path = "";
    public $type = 0; //0 is file; 1 is folder
    public $cover = -1; // For dir
}

/** opcache 是否真的在生效（CLI 需要 opcache.enable_cli=1）。只在生效时才值得用常量数组缓存。*/
if (!function_exists('opcache_constant_arrays_enabled')) {
    function opcache_constant_arrays_enabled()
    {
        if (!function_exists('opcache_get_status')) return false;
        $status = @opcache_get_status(false);
        return is_array($status) && !empty($status['opcache_enabled']);
    }
}

/*
 * 索引记录格式（../cache/list.txt.bamboomusic），每条记录 8 行，行首标签决定这一行是什么：
 *
 *   >id
 *   |文件地址
 *   /名字
 *   ,封面
 *   .类型      l 目录 / i 图片 / f 文件
 *   ]hasmv
 *   [extra
 *   <
 *
 * 读写两端共用下面这张表，别在别处再写一遍标签含义。
 * 注意每条记录以 CRLF 结尾，读取时用 substr($line, 1, strlen($line) - 3) 去掉标签和 CRLF。
 */
const BAMBOO_INDEX_TAGS = array(
    '|' => 'path',
    '/' => 'name',
    ',' => 'cover',
    '.' => 'type',
    ']' => 'extra',
    '[' => 'trueextra',
);

/** 拼出索引里的一条记录（写入端唯一实现）。*/
function index_encode_record($id, $path, $name = "", $cover = -1, $type = 'f', $hasmv = "", $extra = "")
{
    return ">" . $id . "\r\n"
        . "|" . $path . "\r\n"
        . "/" . $name . "\r\n"
        . "," . $cover . "\r\n"
        . "." . $type . "\r\n"
        . "]" . $hasmv . "\r\n"
        . "[" . transform_br($extra) . "\r\n"
        . "<\r\n";
}

/*
 * 从索引文件流式解析出全部记录，返回 array($filelist, $id_lists, $all_id_lists, $id_finder)。
 * 只解析、不落盘，字段与默认值和原来 loadLists() 完全一致（type/cover 没有对应行时保持整数默认值）。
 * $save_all_ids 为 true 时同时收集全部 id（管理端的“刷新额外信息”需要）。
 */
function index_parse_file($file, $save_all_ids = false)
{
    $filelist = array();
    $id_lists = array();
    $all_id_lists = array();
    $id_finder = array();
    $handle = fopen($file, "r");
    if (!$handle) {
        return array($filelist, $id_lists, $all_id_lists, $id_finder);
    }
    while (!feof($handle)) {
        $line = fgets($handle);
        if ($line === false) break;
        if (substr($line, 0, 1) !== '>') continue;
        $id = substr($line, 1, strlen($line) - 3);
        $record = array('type' => 0, 'name' => "", 'path' => "", 'cover' => 0, 'extra' => "", 'trueextra' => "");
        while (!feof($handle)) {
            $nline = fgets($handle);
            if ($nline === false) break;
            $ntype = substr($nline, 0, 1);
            if (!isset(BAMBOO_INDEX_TAGS[$ntype])) break;
            $field = BAMBOO_INDEX_TAGS[$ntype];
            $value = substr($nline, 1, strlen($nline) - 3);
            if ($field === 'trueextra') $value = transform_back_br($value);
            $record[$field] = $value;
        }
        $filelist[$id] = $record;
        $id_finder[$record['path']] = $id;
        if ($record['type'] === 'f') $id_lists[] = $id;
        if ($save_all_ids) $all_id_lists[] = $id;
    }
    fclose($handle);
    return array($filelist, $id_lists, $all_id_lists, $id_finder);
}

/** path => id 的反查表（按文件顺序，同路径后来者覆盖，和原来逐行赋值一致）。*/
function index_build_id_finder($filelist)
{
    $id_finder = array();
    foreach ($filelist as $id => $record) {
        $id_finder[$record['path']] = $id;
    }
    return $id_finder;
}

/** 从 / 到 \ 的转义，给 extra 字段用（读取端对应 transform_back_br）。*/
function transform_br($text)
{
    return str_replace("\n", "\\n", str_replace("\\", "\\\\", $text));
}
function transform_back_br($text)
{
    return str_replace("\\n", "\n", str_replace("\\\\", "\\", $text));
}

/*
 * 别名表格式（../cache/names.txt.bamboomusic）：记录之间用 CRLF 相连，每条是
 *   >路径
 *   |名字
 *   <
 * 路径和名字里出现的换行会被去掉：这是唯一能伪造出记录、把整张表写坏的输入（管理端 action=2 收的是
 * 用户提交的文本）。反斜杠不做转义——表里的名字是给人看的目录别名，转义会改变已有数据的字面值。
 */
function alias_clean_field($value)
{
    return str_replace(array("\r", "\n"), "", $value);
}

function alias_encode_records($pairs)
{
    $chunks = array();
    foreach ($pairs as $pair) {
        $chunks[] = ">" . alias_clean_field($pair['path']) . "\r\n|" . alias_clean_field($pair['name']) . "\r\n<";
    }
    return count($chunks) == 0 ? "" : implode("\r\n", $chunks);
}

/*
 * 解析别名表文本，返回 pathinfo 对象数组（保持类的属性顺序，管理端会把它们原样 json_encode 出去）。
 * 按行拆分而不是按 CRLF 长度截断：手工编辑过的 LF 文件也能正确读出。
 */
function alias_parse_text($raw)
{
    $result = array();
    $current = null;
    foreach (preg_split("/\r\n|\n|\r/", $raw) as $line) {
        if ($line === "") continue;
        $tag = substr($line, 0, 1);
        $value = substr($line, 1);
        if ($tag === '>') {
            $current = new pathinfo();
            $current->path = $value;
        } else if ($tag === '|' && $current !== null) {
            $current->name = $value;
        } else if ($tag === '<' && $current !== null) {
            $result[] = $current;
            $current = null;
        }
    }
    return $result;
}
