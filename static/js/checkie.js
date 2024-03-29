try { eval("()=>{}") } catch (e) { location.href = "./updatebrowser.html" }
try { eval("let a = \"111\"") } catch (e) { location.href = "./updatebrowser.html" }
try { eval("var a = `111`") } catch (e) { location.href = "./updatebrowser.html" }
// 兼容老版本 Chrome
if (String.prototype.replaceAll == undefined) {
    String.prototype.replaceAll = function (searchString, replaceString, ignoreCase) {
        if (RegExp.prototype.isPrototypeOf(searchString)) {
            return this.replace(searchString, replaceString);
        } else {
            return this.replace(new RegExp(searchString, (ignoreCase ? "gmi" : "gm")), replaceString);
        }
    }
    console.log("已定义自定义 replaceAll")
}