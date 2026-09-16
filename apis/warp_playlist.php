<?php
Header("content-type: application/json", true);

$data = json_decode('{"data":{"list":[],"total":1},"type":"playlist"}');

if (empty($_GET['value'])) {
    $value = "";
} else {
    $value = $_GET['value'];
}
$a_line = json_decode('{"name":"","id":""}');
$a_line->name = '列表【' . $value . '】';
$a_line->id = $value;
$data->data->list[] = $a_line;

echo json_encode($data);
