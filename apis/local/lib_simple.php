<?php
function send_error($error)
{
    echo '{"code":500,"msg":"500 - ' . $error . '"}';
    http_response_code(500);
    exit(0);
}
?>