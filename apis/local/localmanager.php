<?php
/*
 * 管理端接口。所有操作都要带 psw（前端传 btoa(密码) 再 URL 编码）：
 *   -1 校验密码  1 读别名表  2 写别名表（POST body）  3 改密码  4 重扫磁盘重建索引  5 列出全部目录  7 重建额外信息
 * 注意 action=4 和 7 是重活（全盘扫描），HTTP 侧限时 60 秒。
 */
$manager_mode = true;
ini_set('max_execution_time', 60);
require_once __DIR__ . '/listfiles.php';
require_once __DIR__ . '/filesaver.php';
$action = 0;
if (empty($_GET['action'])) {
    http_response_code(403);
    // include('../../ErrorPages/404.html');
    exit(0);
}
$action = $_GET['action'];

if (empty($_GET['psw'])) {
    http_response_code(403);
    // include('../../ErrorPages/404.html');
    exit(0);
}
$config = null;
$configFile = cache_path('config.json');
if (is_file($configFile)) {
    $myfiles = fopen($configFile, "r") or send_error("无法写入配置文件。");
    $flengths = filesize($configFile);
    if ($flengths > 0) {
        $contentFs = fread($myfiles, $flengths);
    } else {
        $contentFs = '{}';
    }
    fclose($myfiles);
} else {
    $contentFs = '{}';
}
$config = json_decode($contentFs);
if (empty($config->psw)) {
    // echo json_encode($config);
    // exit();
    $defaultpsw = "admin";
    $salt = '19a1b0dd43fca26e6965bf12cadc22ebfe1c925c6821c1d6280f2183866b9735fhewhuwehfuhufhhhuehfuwefnewfduqnw98231ey723dh23hgr634g2r7h32fgergj98345hy745hy-64o64jyuh465yntuu4jhyu4he3uth453nmc2q3n2mq83s7ytvd87qxr72347h98tr534y7t42a2rhTtIRVs5wLG44OmntT4jl2DAKdc9f7Pexkcx8kjhupErbqduF0tANMqaSpN0nY0gmtwojN2xcDCAn8ly4rvMTv1Lfu6dm7xjMMT3JpxoJsjnB2HJfDT78NJTgyav0PSTw4KHLpVjUNTFyR11O32RhxrrjZ9giogoPuLuENJANqZYQ2P1NJjwoV0cTR1LSMQJ8duziN@$&[f,%e#Hzq)yB>V$i8f$oyK<kkJu;F1OW)-$8sx`yWMF^izrT2B:|^P4AnpZj0b=YP/M*c;f%Tt @I/KRo&:q;%FM3OvuN?n@pQg]<y;YY~EE=u6Oda?H7J~wG=(r:?HZP4Nu{Sv1pt_X>{FNC}qmn>+%k|jQZIR)E4EEJVTP+[adthh>it,<-y|o)0kb^xp+9g?';
    mt_srand(time());
    $randomidx = mt_rand(0, strlen($salt) - 30);
    $randomrdx = mt_rand($randomidx + 5, strlen($salt));
    $ransalt = substr($salt, $randomidx, $randomrdx);
    $config->psw = crypt(($defaultpsw), $ransalt);
    $config->salt = $ransalt;
    saveCFG();
}
$epsw = crypt((base64_decode(urldecode($_GET['psw']))), $config->salt);
if ($epsw != $config->psw) {
    echo '{"code":"403","msg":"密码错误。"}';
    exit(1);
}
$value = "";
if (!empty($_GET['value'])) {
    $value = $_GET['value'];
}
Header("content-type: text/json", true);
switch ($action) {
    case -1:
        //啥也没有
        echo '{"code":"200","msg":"操作成功。"}';
        break;
    case 4: //刷新缓存
        searchHost();
        echo '{"code":"200","msg":"操作成功。"}';
        break;
    case 7: //刷新缓存 / 额外信息
        // include("./listfiles.php");

        searchAdditionHost();
        echo '{"code":"200","msg":"操作成功。"}';
        break;
    case 5: //获取所有目录列表
        $result = array();
        $output = json_decode('{"code":"200","data":[]}');

        // echo json_encode($id_lists);
        foreach ($filelist as $id => $value) {
            if ($value['type'] == 'l') {
                //是目录
                $result[] = $value['path'];
            }
            # code...
        }
        $output->data = $result;
        echo json_encode($output);
        break;
    case 1: //获取所有目录别名列表
        loadPathNames();
        $output = json_decode('{"code":"200","data":[]}');
        $output->data = $GLOBALS['pathnames'];
        echo json_encode($output);
        break;
    case 2: //设置目录别名列表
        $POSTP = file_get_contents("php://input");
        // echo $POSTP;
        if (empty($POSTP)) {
            echo '{"code":"402","msg":"缺少参数。"}';
            break;
        }
        $value = urldecode($POSTP);
        if ($value == "") {
            echo '{"code":"402","msg":"缺少参数。"}';
            break;
        }
        try {
            $d = json_decode($value);
        } catch (\Exception $e) {
            echo '{"code":"500","msg":"Wrong JSON texts!"}';
            break;
        }
        if (!is_array($d)) {
            echo '{"code":"500","msg":"Wrong JSON texts!"}';
            break;
        }
        if (count($d) == 0) {
            // 一个输入框都没有就提交（目录列表为空等异常情况下会发生）会把整张别名表清空
            echo '{"code":"402","msg":"提交的别名列表为空，已忽略。"}';
            break;
        }
        // 记录格式（>path / |名字 / <）由 alias_encode_records() 统一编码：名字里的换行是
        // 唯一能凭空造出一条 >path 记录、把整张表写坏的输入（粘贴多行文本时会发生），
        // 编码函数负责剔除。
        $pairs = array();
        for ($i = 0; $i < count($d); $i++) {
            $line = $d[$i];
            if (!$line) continue;
            if (empty($line->path)) continue;
            if (empty($line->name)) continue;
            // 规范化路径，避免把双反斜杠写进别名表后匹配不上目录
            $apath = normalize_dir_path($line->path);
            if ($apath == "") continue;
            $pairs[] = array('path' => $apath, 'name' => (string)$line->name);
        }
        $res = alias_encode_records($pairs);
        backupNamesFile();
        $mywritefile = fopen(cache_path('names.txt'), "w") or send_error("无法写入文件。");
        fwrite($mywritefile, $res);
        fclose($mywritefile);
        echo '{"code":"200","msg":"操作成功。"}';
        break;
    case 3: //更改密码
        $value = base64_decode($value);
        if (strlen($value) >= 5) {
            $salt = 'wnqdhquwhewfnew3209834r9834f9hj34w9vjm4ch8gtm45c87l54xz8ki34jasdfghjklpouytrewqzxcvbnm92817493690765nuycd43udhy53h2s7kjy5jdm7432ymn723fhnwnqdhquwhewfnew3209834r9834f9hj34w9vjm4ch8gtm45c87l54xz8ki34jasdfghjklpouytrewqzxcvbnm92817493690765nuycd43udhy53h2s7kjy5jdm7432ymn723fhndsaeuwgtybxcummbzmnbzcemnbz3me76f32f916mxgrm31oewid21skt83m3edshrouie3yhdtuxh453h45yu';
            mt_srand(time());
            $randomidx = mt_rand(0, strlen($salt) - 30);
            $randomrdx = mt_rand($randomidx + 5, strlen($salt));
            $ransalt = substr($salt, $randomidx, $randomrdx);
            $config->psw = crypt(($value), $ransalt);
            $config->salt = $ransalt;
            echo '{"code":"200","msg":"操作成功。"}';
        } else {
            echo '{"code":"402","msg":"操作参数缺失。"}';
        }


        saveCFG();
        break;
    default:
        echo '{"code":"401","msg":"未知操作。"}';
}
// 覆盖别名表前先留一份带时间戳的副本（只保留最近 5 份），
// 这样即使某次提交写坏了，也能从上一份副本还原。
function backupNamesFile()
{
    $src = cache_path('names.txt');
    if (!is_file($src)) return;
    @copy($src, BAMBOO_CACHE_DIR . DIRECTORY_SEPARATOR . "names.txt.bak." . date("Ymd-His") . BAMBOO_FILES_SUFFIX);
    $olds = glob(BAMBOO_CACHE_DIR . DIRECTORY_SEPARATOR . "names.txt.bak.*" . BAMBOO_FILES_SUFFIX);
    if ($olds === false || count($olds) <= 5) return;
    sort($olds);
    for ($i = 0; $i < count($olds) - 5; $i++) {
        @unlink($olds[$i]);
    }
}
function saveCFG()
{
    $mywritefile = fopen(cache_path('config.json'), "w") or send_error("无法写入缓存列表。");
    $mywritefile2 = fopen(cache_path('salt'), "w") or send_error("无法写入缓存列表。");
    fwrite($mywritefile, json_encode($GLOBALS['config']));
    fwrite($mywritefile2, '<?php $salt=' . json_encode($GLOBALS['config']->salt) . ';?>');

    fclose($mywritefile);
    fclose($mywritefile2);
}
