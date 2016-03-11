var FS = require("fs");
var Path = require("path");
var Esprima = require("esprima");

function stringify(js, indent) {
    if (typeof indent === 'undefined') indent = '';
    var t = typeof js;
    if (t === 'string') {
        return '"' + js + '"';
    }
    if (t === 'number') {
        return js;
    }
    if (t === 'boolean') {
        return js ? "true" : "false";
    }
    var out = '';
    if (Array.isArray(js)) {
        out = '[';
        js.forEach(
            function(itm, idx) {
                if (idx > 0) {
                    out += ",\n" + indent;
                }
                out += stringify(itm, indent + '  ');
            }
        );
        out += ']';
        return out;
    }
    if (t === 'object') {
        out = '{';
        var k, v, idx = 0;
        for (k in js) {
            v = js[k];
            if (idx > 0) {
                out += ",\n" + indent;
            }
            out += k + ": " + stringify(v, indent + '  ');
            idx++;
        }
        out += '}';
        return out;
    }
    return '<' + t + '>';
}

var code = FS.readFileSync(Path.join(__dirname, "test-code.js"));
var tree = Esprima.parse(code, {comment: true, range: true});
console.log(stringify(tree));


