# Bamboo Music Manager
竹子音乐 - 音乐框架

## 开始使用
### 初始化设置（需要文件访问权限）
本框架自带本地API，您可以在 `apis/cache/location.txt.bamboomusic` 设置地址

格式为：
```
地址1
地址2
地址3
```

您还需要修改 `static/js/default_settings.js`，将下面代码改为您的api：
```JavaScript
const search_types = [
    { "name": "音频", "id": "audio", "type": "audio" },
    { "name": "专辑", "id": "album", "type": "playlist" },
    { "name": "视频", "id": "video", "type": "video" },
    { "name": "在线B", "id": "onlineb", "type": "audio" }
]
```
注释：
1. 这里的ID请尽量不重复，每个ID对应下面的api方法，如搜索提示词：
   ```JavaScript
   function get_api_suggest_key(type) {
       switch (type) {
           case 'audio':
           // console.log(type);
           case 'album':
               return localUrlRoot + "local.php?type=suggestKey&value=${KEY}";
           case 'video':
               return videoUrlRoot + "video.php?type=suggestKey&value=${KEY}";
           case 'onlinea':
               return onlineAUrlRoot + "suggest.php?value=${KEY}"
           case 'onlineb':
               return onlineBUrlRoot + "main.php?type=suggestKey&value=${KEY}"
       }
       return localUrlRoot + "local.php?type=suggestKey&value=${KEY}";
   }
   ```
   这里 `case` 后面的就是ID名称。
2. `name` 为搜索选项提示名称
3. `type` 为类型，貌似不是必须的？
4. 如果您没有新的API，可以修改为：
   ```JavaScript
   const search_types = [
       { "name": "音频", "id": "audio", "type": "audio" },
       { "name": "专辑", "id": "album", "type": "playlist" }
   ]
   ```

### 环境搭建
#### 服务器
本人在本地测试使用的IIS，您可以自己选择其他工具。

您需要将后缀为 `.bamboomusic` 的文件或者将路径 `apis/cache` 禁止访问，避免私密信息外露。

**本项目可以不用放在网站根目录。**

将 `.php` 后缀绑定为 PHP 的MINE类型后缀，并且与PHP挂钩。

#### PHP环境
本地环境使用 `PHP 8`，您也可以使用 `PHP 7` 或更高版本。

建议您启用下列PHP扩展：
```ini
extension=curl
extension=fileinfo
extension=gettext
extension=mbstring
extension=exif
extension=openssl
```

### 网页端设置
然后在网页端访问 `manager/index.html`，默认密码为 `admin`，进入管理界面后记得修改密码。

点击 `刷新缓存`，等待刷新成功。

点击 `设置别名`，为你的文件夹设置名称，这将会显示为专辑名称。

设置完毕后点击 `确定` 即可保存。

歌曲文件名形式为 `歌手 - 歌曲名.mp3`

歌词文件名与歌曲相同，仅后缀改为 `.lrc`，如：

`莫文蔚 - 这世界那么多人.mp3`
`莫文蔚 - 这世界那么多人.lrc`

lrc 请尽量使用 `GB2312` 或者是 `UTF-8`

目前仅支持同一时间段一行歌词（老式歌词，如果要翻译请将翻译行时间设置为下一行的歌词时间），如：

```lrc
[00:31.40] 愛しき心君が為 永久に咲く花
[00:39.69] 爱恋之心 只因为你 花朵不绝盛放
[00:39.69] ほら ゆらゆら 風吹かれ
[00:43.90] 随风飘摇
[00:43.90] ほら ふわふわ 舞い上がる
[00:48.25] 轻然飞舞
[00:48.25] ほら ひらひら
[00:50.99] 翩然飞往
```

### 新增自建 API
请参考初始化设置修改 `static/js/default_settings.js`

**API请求要求：**
1. 获取播放链接的URL返回结果必须是链接（可以是相对链接）
2. 返回结果是多个播放列表的结果需要在JSON根节点写入： `"type":"playlist"`
3. 返回内容存储在JSON根节点 `data` 内，并且有总数量（可以是 `当前已知数量+1` 代表未知总数，但有下一页），如返回播放列表：
   ```JSON
   {
     "data": {
       "list": [
         {
           "name": "番剧 《偶像大师 灰姑娘女孩》系列 & U149",
           "id": 783,
           "pic": "./apis/local/cover.php?id=784"
         }
       ],
       "total": 21,
       "pic": null
     },
     "type": "playlist"
   }
   ```
4. 返回内容如果是普通数据，数据必须包含 `id` `artist` `name` `album`，剩下的 `albumid` `artistid` `pic` `releaseDate` `addition` 是可选项目。如：
   ```JSON
   {
     "data": {
       "total": 5,
       "list": [
         {
           "id": 1898,
           "addition": "",
           "artist": "莫文蔚",
           "name": "外面的世界",
           "album": "其他音乐",
           "albumid": 1592,
           "pic": "",
           "artistid": "6I6r5paH6JSa",
           "releaseDate": null
         },
         {
           "id": 1899,
           "addition": "",
           "artist": "莫文蔚",
           "name": "如果没有你",
           "album": "其他音乐",
           "albumid": 1592,
           "pic": "",
           "artistid": "6I6r5paH6JSa",
           "releaseDate": null
         },
         {
           "id": 1900,
           "addition": "",
           "artist": "莫文蔚",
           "name": "盛夏的果实",
           "album": "其他音乐",
           "albumid": 1592,
           "pic": "",
           "artistid": "6I6r5paH6JSa",
           "releaseDate": null
         },
         {
           "id": 1901,
           "addition": "",
           "artist": "莫文蔚",
           "name": "这世界那么多人",
           "album": "其他音乐",
           "albumid": 1592,
           "pic": "",
           "artistid": "6I6r5paH6JSa",
           "releaseDate": null
         },
         {
           "id": 1952,
           "addition": "",
           "artist": "黄品源&莫文蔚",
           "name": "那么爱你为什么",
           "album": "其他音乐",
           "albumid": 1592,
           "pic": "",
           "artistid": "6buE5ZOB5rqQJuiOq+aWh+iUmg==",
           "releaseDate": null
         }
       ]
     }
   }
   ```
   解释：
   1. `id`：音乐播放ID，必须
   2. `addition`：附加信息，可选
   3. `artist`：歌手，必须
   4. `name`：歌曲名称，必须
   5. `album`：专辑名称，必须
   6. `artistid`：歌手ID，可选
   7. `albumid`：专辑ID，可选
   8. `pic`：图片，需要直链（可以相对链接），可选
   9. `releaseDate`：出版日期，可选
   10. `hasMv`：是否有视频，视频ID与音频相同，默认为 `0` 或 `false`。
   11. `hasAudio`：是否有音频，可选，默认为 `1` 或 `true`。
5. 提示词返回数据格式应类似于：
   ```JSON
   {
     "data": [
       "莫文蔚",
       "黄品源&莫文蔚"
     ]
   }
   ```