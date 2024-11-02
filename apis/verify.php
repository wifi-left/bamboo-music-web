<?php
$verified = false;
$session_key_file = dirname(__FILE__) . "/cache/session_key.txt.bamboomusic";
if (is_file($session_key_file) == false) {
    $fout = fopen($session_key_file, "w+");
    fwrite($fout, "<?php\n\$session_key = \"\";");
    fclose($fout);
}
if (empty($_COOKIE['session'])) {
    $verified = false;
    $_COOKIE['session'] = "";
}



include($session_key_file);
if (!empty($_GET['key'])) {
    if (urldecode($_GET['key']) == $session_key) {
        $verified = true;
    }
}else if (urldecode($_COOKIE['session']) == $session_key || $session_key == "") {
    $verified = true;
} else {
    echo '{"success":"fail","msg":"<h1>您需要先得到验证才能使用此API。</h1><a href=\"./apis/try_access.php\" target=\"_blank\" class=\"url\">点击此处跳转验证界面。</a>","code":1}';
    // header("Location: ./try_access.php");

    exit(0);
}
