<?php

/**  php下载类,支持断点续传
 *   download: 下载文件
 *   setSpeed: 设置下载速度
 *   getRange: 获取header中Range
 */

class FileDownload
{

    /** 下载
     * @param String  $file   要下载的文件路径
     * @param String  $name   文件名称,为空则与下载的文件名称一样
     * @param boolean $reload 是否开启断点续传
     */
    public function download($file, $name = '', $reload = true, $contenttype = "application/octet-stream", $notitle = true)
    {
        $fp = @fopen($file, 'rb');
        if ($fp) {
            if ($name == '') {
                $name = basename($file);
            }
            // $header_array = get_headers($file, true);
            //var_dump($header_array);die;
            // 下载本地文件，获取文件大小
            // if (!$header_array) {
            $file_size = filesize($file);
            // } else {
            // $file_size = $header_array['Content-Length'];
            // }
            $ranges = $this->getRange($file_size);
            $ua = $_SERVER["HTTP_USER_AGENT"]; //判断是什么类型浏览器
            header('Cache-Control: public, must-revalidate, max-age=1000');
            header('Content-Type: ' . $contenttype);

            $encoded_filename = urlencode($name);
            $encoded_filename = str_replace("+", "%20", $encoded_filename);

            //解决下载文件名乱码
            if (!$notitle) {
                if (preg_match("/MSIE/", $ua) ||  preg_match("/Trident/", $ua)) {
                    header('Content-Disposition: filename="' . $encoded_filename . '"');
                } else if (preg_match("/Firefox/", $ua)) {
                    header('Content-Disposition: filename*="utf8\'\'' . $name . '"');
                } else if (preg_match("/Chrome/", $ua)) {
                    header('Content-Disposition: filename="' . $encoded_filename . '"');
                } else {
                    header('Content-Disposition: filename="' . $encoded_filename . '"');
                }
            }

            // header('Content-Disposition: attachment; filename="' . $name . '"');
            // echo json_encode($ranges);
            // return;
            $offset = 0;
            $target = $file_size - 1;
            if ($reload && $ranges != null) { // 使用续传
                header('HTTP/1.1 206 Partial Content');

                // 剩余长度
                // header(sprintf('Content-Length: %u', (($ranges['end'] - $ranges['start']) + 1)));

                // range信息
                header(sprintf('Content-Range: bytes %u-%u/%u', $ranges['start'], $ranges['end'], $file_size));

                // fp指针跳到断点位置
                // echo json_encode($ranges) . "<br/>";
                // return;
                fseek($fp, sprintf('%u', $ranges['start']));
                $offset = $ranges['start'];
                $target = $ranges['end'];
            } else {
                // file_put_contents('test.log','2222',FILE_APPEND);
                header('HTTP/1.1 200 OK');
                header('Content-Length: ' . $file_size);
            }

            $speed = 4096;
            while (!feof($fp) && $offset <= $target) {
                //echo fread($fp, round($this->_speed*1024,0));
                //echo fread($fp, $file_size);
                if ($target - $offset <= $speed) {
                    $tmp = fread($fp, $target - $offset + 1);
                    $offset += $target - $offset;
                    if ($tmp === false) break;
                    echo $tmp;
                    break;
                } else {
                    $tmp = fread($fp, $speed);
                    $offset += $speed;
                    if ($tmp === false) break;
                    echo $tmp;
                }

                ob_flush();
            }

            ($fp != null) && fclose($fp);
        } else {
            return '';
        }
    }

    /** 获取header range信息
     * @param  int   $file_size 文件大小
     * @return Array
     */
    private function getRange($file_size)
    {
        if (empty($_SERVER['HTTP_RANGE'])) {
            return null;
        }
        $begin = 0;
        $end = $file_size - 1;
        if (strpos($_SERVER['HTTP_RANGE'], ",") != false) {
            return null;
        }
        if (preg_match('/bytes=\h*(\d+)-(\d*)[\D.*]?/i', $_SERVER['HTTP_RANGE'], $matches)) {
            // 读取文件，起始节点
            $begin = intval($matches[1]);

            // 读取文件，结束节点
            if (!empty($matches[2])) {
                $end = intval($matches[2]);
            }
            if ($end >= $file_size) $end = $file_size - 1;

            $range = (array('start', 'end'));
            $range['start'] = $begin;
            $range['end'] = $end;
            return $range;
        }
        return null;
    }
}

// $obj = new FileDownload();
// $obj->download('http://down.golaravel.com/laravel/laravel-master.zip','', true);
