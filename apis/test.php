<?php
function strToHexBuffer($str)
{
    // 将字符串转换为字节数组
    $bytes = unpack("C*", $str);
    // 定义输出数组，用于存储16进制的buffer元素
    $output = array();
    // 循环遍历字节数组，将每个字节转换为16进制，并添加到输出数组中
    foreach ($bytes as $byte) {
        // 使用sprintf函数格式化16进制，并在前面补0（如果需要）
        $hex = sprintf("%02x", $byte);
        // 使用pack函数将16进制转换为二进制，并添加到输出数组中
        $output[] = pack("H*", $hex);
    }
    // 返回输出数组
    return $output;
}
$bufkey = strToHexBuffer('yeelion');
$bufkeylen = count($bufkey);
// 调用函数，得到返回值（16进制的buffer数组）

function buildParams($id, $format)
{
    $params = "corp=kuwo&p2p=1&type=convert_url2&format=$format&rid=$id";
    $bufstr = strToHexBuffer($params);
    $bufstrlen = count($bufstr);
    $output = $bufstr;
    $bufkeylen = $GLOBALS['bufkeylen'];
    $bufkey = $GLOBALS['bufkey'];
    for ($i = 0; $i < $bufstrlen; $i++) {
        $output[$i] = 0;
    }
    $i = 0;
    while ($i < $bufstrlen) {
        $j = 0;
        while ($j < $bufkeylen && $i < $bufstrlen) {
            $output[$i] = $bufkey[$j] ^ $bufstr[$i];
            $i++;
            $j++;
        }
    }
    //print_r($output);
    $string = implode($output);

    // 将字符串用base64方式编码
    $encoded = base64_encode($string);
    return $encoded;
}
echo buildParams($_GET['id'],$_GET['format']);