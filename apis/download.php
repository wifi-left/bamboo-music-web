<html>

<head>
    <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,minimum-scale=1,maximum-scale=1">
    <title>下载歌曲</title>
</head>

<body>
    <?php
    if (empty($_GET['url'])) {
        echo "<h1>请求参数错误。应该包含URL。</h1>";
        return;
    }
    if (empty($_GET['filename'])) {
        echo "<h1>请求参数错误。应该包含名字。</h1>";
        return;
    }
    $url = base64_decode($_GET['url']);
    // echo $url;
    $flag = true;
    $filename = urldecode(base64_decode($_GET['filename']));

    // return;
    ?>
    <h1 style="-webkit-user-select: none; -moz-user-select: none; user-select: none;">名称：</h1>
    <p><?php echo $filename; ?></p>
    <h1 style="-webkit-user-select: none; -moz-user-select: none; user-select: none;">下载地址：</h1>
    <a target="_blank" id="url" href='#' download="<?php echo $filename; ?>.mp3">加载中</a>
    <h1>歌词</h1>
    <a target="_blank" id="lrcdown" href='#' download="<?php echo $filename; ?>.lrc">暂无歌词</a>
    <br />
    <br />
    <textarea style="width: 100%; height:400px;" id="lrcshow"></textarea>
    <script>
        var url = `<?php echo $url; ?>`;
        document.getElementById("url").innerHTML = url;
        document.getElementById("url").href = url;
        var lrc = localStorage.getItem("songlrc");

        if (lrc == undefined) {
            lrc = "[00:00.00] 未在缓存中找到歌词";
        } else {
            lrc = JSON.parse(lrc);
            lrc = JsonToLrc(lrc['ms']);
        }
        var aFileParts = [lrc]; // 一个包含 DOMString 的数组
        var oMyBlob = new Blob(aFileParts, {
            type: 'text/plain'
        });
        var lrcUrl = URL.createObjectURL(oMyBlob);
        document.getElementById("lrcdown").href = lrcUrl;
        document.getElementById("lrcdown").innerText = lrcUrl;
        lrcshow.value = lrc;

        function to_string(s) {
            return "" + s;
        }

        function round(s) {
            return Math.round(s);
        }

        function toLrcTime(second) {
            var result = "";
            var tHour = 0,
                tMin = 0;
            var tSec = round(second * 100); //初始化变量，四舍五入秒数。
            tMin = parseInt(tSec / 6000);
            tSec = parseInt(tSec % 6000) / 100; //先乘100再取余，最后除以100。
            tHour = parseInt(tMin / 60);
            tMin = parseInt(tMin % 60);

            if (tHour > 0) {
                //判断有没有1小时
                if (tHour < 10) result = result + "0"; //小时
                result = result + to_string(tHour);
                result = result + ":";
                if (tMin < 10) result = result + "0"; //分钟
                result = result + to_string(tMin);
                result = result + ":";
                if (tSec < 10) result = result + "0"; //秒
                result = result + to_string(tSec);
                if (parseInt(tSec * 100) % 100 == 0) result = result + ".0";
                if (parseInt(tSec * 100) % 10 == 0) result = result + "0";
            } else {
                if (tMin < 10) result = result + "0"; //分钟
                result = result + to_string(tMin);
                result = result + ":";
                sresult = to_string(tSec);
                if (tSec < 10) sresult = "0" + sresult; //秒
                if (sresult.length <= 3) sresult = sresult + ".0";
                if (sresult.length <= 4) sresult = sresult + "0";
                result = result + sresult;
            }
            return result;
        }

        function JsonToLrc(json) {
            var result = "";
            for (var i = 0; i < json.length; i++) {
                try {
                    var nl = json[i];
                    result += (result == "" ? "" : "\r\n") + "[" + toLrcTime(nl.t) + "]" + nl.c;
                } catch (e) {
                    showMsg(e, "error");
                }
            }
            return result;

        }
    </script>
</body>

</html>