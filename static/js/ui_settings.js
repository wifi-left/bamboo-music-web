const SETTING_VAR = {}
const SETTING_ITEM = [
    {
        "name": "测试",
        "des": "测试用项目",
        "children": [
            {
                "name":"测试按钮",
                "des":"用于测试的没有作用的按钮",
                "type":"button",
                "value":"点我",
                onsave:function(){
                    alert(this.innerText)
                }
            },
            {
                "name":"编辑框测试",
                "type":"text",
                "value":"114514",
                "save-item":"debug.test"
            }
        ]
    },
    {
        "name": "音源选项",
        "des": "针对部分音源的选项。",
        "children": [
            {
                "name": "音质",
                // 必要
                "type": "select",
                // 必要
                "value": [
                    {
                        name: "高品质 2000kflac",
                        value: "2000kflac"
                    }, {
                        name: "中品质 320kmp3",
                        value: "320kmp3",
                        default: true
                    }, {
                        name: "流畅品质 128kmp3",
                        value: "128kmp3"
                    }
                ],
                "save-item": "MusicSourceQuality",
                "des": "对应音源若无对应品质歌曲可能导致播放失败或使用更低音质。"
            }
        ]
    },
    {
        "name": "通用设定",
        "des": "一些普通设定。",
        "children": [
            {
                "name": "播放列表",
                "type": "checkbox",
                "value": "false",
                "save-item": "enableListSaving",
                "des": "当关闭页面时，保存播放列表。"
            },
            {
                "name": "节约模式",
                "type": "checkbox",
                "value": "false",
                "save-item": "NetworkSavingMode",
                "des": "开启后，将不会加载专辑封面。"

            }, {
                "name": "歌词注音",
                "type": "checkbox",
                "value": "false",
                "save-item": "kuroshiro",
                "des": "需要刷新页面生效。<br/>开启后，可以查看日语歌词的罗马音注音。<br/>注音模块: Kuroshiro"
            }
        ]
    }
].concat(CUSTOM_SETTING);
function createCheckboxObj(select_state = false, onclick_event = null) {
    let option_obj = document.createElement("input");
    option_obj.className = "input"
    option_obj.type = "checkbox";
    // console.log(select_state)
    if (select_state == true) {
        // console.log(select_state)
        option_obj.setAttribute("checked", true);
    }
    option_obj.onclick = onclick_event;
    // console.log(onclick_event)
    return option_obj;
}
function createSelectorObj(selections = [], select_value = null, onchange_event = null) {
    let obj = document.createElement("select");
    for (let i = 0; i < selections.length; i++) {
        let t = selections[i];
        let name = t['name'];
        let value = t['value'];
        let is_default = t['default'];
        if (is_default != true) is_default = false;
        let op_obj = document.createElement("option");
        op_obj.className = "setting-select-option";
        op_obj.value = value;
        op_obj.innerText = name;
        if (is_default) op_obj.selected = true;
        obj.appendChild(op_obj);
    }
    // console.log(select_value)
    if (select_value != null)
        obj.value = select_value;
    obj.onchange = onchange_event;
    return obj;
}
function refresh_setting_items() {
    let father_obj = document.getElementById("setting-frame-father");
    father_obj.innerHTML = "";
    for (let i = 0; i < SETTING_ITEM.length; i++) {
        if (i > 0) {
            let hr = document.createElement("div");
            hr.className = "hr2";
            father_obj.appendChild(hr);
        }
        let t = SETTING_ITEM[i];
        let area_obj = document.createElement("div")
        area_obj.className = "setting-father-area";
        let title_obj = document.createElement("h2");
        title_obj.innerHTML = t['name'];
        title_obj.className = "setting-father-title";
        area_obj.appendChild(title_obj);
        if (t['des'] != undefined) {
            let des_obj = document.createElement("p");
            des_obj.className = "setting-father-des";
            des_obj.innerHTML = t['des'];
            area_obj.appendChild(des_obj);
        }
        let table_obj = document.createElement("table");
        table_obj.className = "setting-father-table";
        let tbody_obj = document.createElement("tbody");
        tbody_obj.className = "setting-father-tbody";
        for (let j = 0; j < t['children'].length; j++) {
            let tt = t['children'][j];
            let line_obj = document.createElement("tr");
            line_obj.className = "setting-tr"
            let tr1_obj = document.createElement("td");
            tr1_obj.className = "setting-table-th-left";

            let tr_title = document.createElement("p");
            tr_title.innerHTML = tt['name'];
            tr_title.className = "setting-tr-title";
            tr1_obj.appendChild(tr_title);
            if (tt['des'] != null) {
                let tr_des = document.createElement("span");
                tr_des.innerHTML = tt['des'];
                tr_des.className = "setting-tr-des";
                tr1_obj.appendChild(tr_des);
            }
            let tr2_obj = document.createElement("td");
            tr2_obj.className = "setting-table-th-right";
            let option_obj = null;
            let save_item = tt['save-item']
            switch (tt['type']) { //checkbox, input, button, url, select
                case 'checkbox':
                    var user_value = localSettings.getItem(tt['save-item'], tt['value']);
                    try {
                        user_value = JSON.parse(user_value);
                        if (user_value == 1) user_value = true;
                        // console.log(user_value)
                    } catch (e) {
                        console.warn(e);
                        user_value = false;
                    }
                    let clickevent = tt['onsave'];
                    if (clickevent == null) {
                        clickevent = function () {
                            let target = (this.checked ? true : false);
                            localSettings.setItem(save_item, target);
                            SETTING_VAR[save_item] = target;
                            console.log(save_item, target)
                        }
                    }
                    // console.log(user_value)
                    option_obj = createCheckboxObj(user_value, clickevent);
                    SETTING_VAR[save_item] = user_value;
                    tr2_obj.appendChild(option_obj);
                    // tr2_obj.classList.add("checkbox");
                    // tr1_obj.classList.add("checkbox");
                    line_obj.classList.add("checkbox");
                    break;
                case 'button':
                    option_obj = document.createElement("button");
                    option_obj.className = "button setting-tr-save";
                    option_obj.innerText = tt['value'];
                    option_obj.onclick = tt['onsave'];
                    tr2_obj.appendChild(option_obj);
                    break;
                case 'url':
                    option_obj = document.createElement("url");
                    option_obj.className = "button-green setting-tr-save";
                    option_obj.innerText = tt['value'];
                    option_obj.href = tt['href'];
                    save_btn.onclick = tt['onsave'];
                    tr2_obj.appendChild(option_obj);
                    // tr2_obj.appendChild(option_obj);
                    break;
                case 'select':
                    var user_value = localSettings.getItem(tt['save-item'], null);
                    let onchange_ev = tt['onsave'];
                    if (onchange_ev == null) {
                        onchange_ev = function () {
                            let target = this.value;
                            localSettings.setItem(save_item, target);
                            SETTING_VAR[save_item] = target;
                            // console.log(save_item,target);
                        }
                    }
                    option_obj = createSelectorObj(tt['value'], user_value, onchange_ev)
                    SETTING_VAR[save_item] = user_value;
                    tr2_obj.appendChild(option_obj);
                    break;
                default:
                    option_obj = document.createElement("input");
                    option_obj.className = "input"
                    option_obj.type = tt['type'];
                    option_obj.value = tt['value'];
                    var user_value = localSettings.getItem(tt['save-item'], null);
                    if (user_value != null) {
                        option_obj.value = user_value;
                    }
                    tr2_obj.appendChild(option_obj);
                    let save_btn = document.createElement("button");
                    save_btn.className = "button-green setting-tr-save";
                    save_btn.innerText = "保存";
                    if (tt['onsave'] != null) {
                        save_btn.onclick = tt['onsave'];
                    } else {
                        save_btn.onclick = function () {
                            let target = option_obj.value;
                            localSettings.setItem(save_item, target);
                            // console.log(save_item,target);
                            SETTING_VAR[save_item] = target;
                        }
                    }
                    tr2_obj.appendChild(save_btn)
                    SETTING_VAR[save_item] = user_value;
                    break;
            }
            if (option_obj != null) {
                option_obj.classList.add("setting-tr-option");
            }
            line_obj.appendChild(tr1_obj);
            line_obj.appendChild(tr2_obj);
            tbody_obj.appendChild(line_obj)

        }
        table_obj.appendChild(tbody_obj);
        area_obj.appendChild(table_obj)
        father_obj.appendChild(area_obj)
    }
}
refresh_setting_items();
/* <table>
  <thead>
    <tr>
      <th>列标题1</th>
      <th>列标题2</th>
      <th>列标题3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>行1，列1</td>
      <td>行1，列2</td>
      <td>行1，列3</td>
    </tr>
    <tr>
      <td>行2，列1</td>
      <td>行2，列2</td>
      <td>行2，列3</td>
    </tr>
  </tbody>
</table> */