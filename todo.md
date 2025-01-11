```HTML
<h2>音质设定（仅针对部分支持音源）</h2>
<button class="button" onclick="setMusicSourceQuality('2000kflac')">高品质 FLAC(不定)</button>
<button class="button" onclick="setMusicSourceQuality('320kmp3')">中品质 MP3(320k)</button>
<button class="button" onclick="setMusicSourceQuality('128kmp3')">流畅品质 MP3(128k)</button>
<h2>音量设置</h2>
<p>提示：此处的音量设置并非实时与进度条同步</p>
<input class="input setting-input" id="setting-volumeInput" /><span>%</span>
<button class="button-green" onclick="saveVolume()">保存</button>

<h2>歌词注音</h2>
<button class="button" onclick="enableKuromaji(1)">开启罗马音标注</button>
<button class="button" onclick="enableKuromaji(0)">关闭罗马音标注（推荐）</button>
<h2>播放页样式</h2>
<h3>背景</h3>
<span>支持CSS语法（Background）</span>
<input class="input setting-input" id="setting-background-image" /><button class="button"
    onclick="saveBackgroundImage()">保存</button><br />
<span>预设：</span><button class="button" onclick="saveBackgroundImageSample('on')">使用专辑封面<button><button
    class="button" onclick="saveBackgroundImageSample('')">无背景</button><br />
<h3>歌词</h3>
<span>普通歌词颜色：</span><input class="input setting-input" id='norlrccolor' type='text' /><input
    type="color" class="input"
    onchange="document.getElementById('norlrccolor').value = this.value;" /><br />
<span>普通歌词行高（间距）：</span><input class="input setting-input" id='norlineheight'type='text' /><br />
<span>普通歌词字体大小：</span><input class="input setting-input" id='norfontsize' type='text' ><br />
<span>选中歌词颜色：</span><input class="input setting-input" id='sellrccolor' type='text' /><input
    type="color" class="input"
    onchange="document.getElementById('sellrccolor').value = this.value;" /><br />
<span>选中歌词行高（间距）：</span><input class="input setting-input" id='sellineheight'type='text' /><br />
<span>选中歌词字体大小：</span><input class="input setting-input" id='selfontsize' type='text' ><br />
<button class="button-green" onclick="saveLrcConfig();">保存歌词设置</button>
<div class="lrc-line-show">
    预览 Line Normal Text
</div>
<div class="lrc-line-sel-show">
    预览 Line Selected
</div>
<h2>播放列表</h2>
<p>当关闭页面时：</p>
<button class="button" onclick="enableListSave(1)">保存记录</button>
<button class="button" onclick="enableListSave(0)">不保存记录</button>
<div class="hr"></div>
<h2>节约模式</h2>
<p>启用选项后，将不显示专辑图片。</p>
<button class="button" onclick="enableNetworkSaving(1)">启用</button>
<button class="button" onclick="enableNetworkSaving(0)">禁用</button>

```