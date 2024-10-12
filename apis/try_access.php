<?php
$verified = 0;
if (!empty($_GET['key'])) {
    $verified = 1;
    $session_key_file = dirname(__FILE__) . "/cache/session_key.txt.bamboomusic";
    include($session_key_file);
    if (urldecode($_GET['key']) == $session_key) {
        $verified = 2;
        setcookie("session", $_GET['key'], time() + 3600 * 24 * 30, "/");
    }
}
?>
<!DOCTYPE html>
<html lang="zh">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bamboo Music 竹子音乐</title>
    <script src="../static/js/checkie.js"></script>
    <link href="../static/css/element_style.css" rel="stylesheet" />
    <style>
        .app-root {
            width: calc(100% - 32px);
            height: calc(100% - 32px);
            background-color: rgb(30, 30, 30);
            color: white;
            position: absolute;
            top: 0;
            left: 0;
            padding: 16px 16px 16px 16px;
            user-select: none;
            -moz-user-select: none;
            -webkit-user-select: none;
        }

        .content {
            user-select: text;
            -moz-user-select: text;
            -webkit-user-select: text;
            position: absolute;
            top: 100px;
            left: 32px;
            overflow: auto;
            height: calc(100% - 192px);
            width: calc(100% - 72px);
        }

        .buttonbar {
            bottom: 0;
            right: 0;
            padding-right: 32px;
            padding-bottom: 32px;
            position: absolute;

        }
    </style>

</head>

<body>
    <div class="app-root">

        <h1>请输入API使用密码</h1>
        <div class="content">
            <form action="try_access.php" method="get">
                <input id="psw" class="input" name="key" />
                <button class="button-green" type="submit" id="allowbutton">确认</button>
            </form>
            <?php
            if ($verified == 1) {
                echo '<h1>密码错误，请重试。</h1>';
            } else if ($verified == 2) {
                echo '<h1>密码正确！您可以使用其功能！</h1>';
            }
            ?>
        </div>

    </div>
</body>

</html>