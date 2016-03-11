/**
 * ToloJSON can parse JSON with comments, and can stringify JSON with indentation and comments.
 * This is useful for configuration files.
 */

function stringify(js, indent, indentUnit) {
    if (typeof indent === 'undefined') indent = '';
    if (typeof indentUnit === 'undefined') indentUnit = '  ';
    var t = typeof js;
    if (t === 'string') {
        return JSON.stringify(js);
    }
    if (t === 'number') {
        return js;
    }
    if (t === 'boolean') {
        return js ? "true" : "false";
    }
    var out = '', txt, small, lastIndent;
    if (Array.isArray(js)) {
        out = '[';
        txt = JSON.stringify(js);
        small = txt.length < 40;
        if (!small) out += "\n" + indent;
        js.forEach(
            function(itm, idx) {
                if (idx > 0) {
                    out += "," + (small ? " " : "\n" + indent);
                }
                out += stringify(itm, indent + indentUnit);
            }
        );
        out += ']';
        return out;
    }
    if (t === 'object') {
        lastIndent = indent;
        indent += indentUnit;
        out = '{';
        txt = JSON.stringify(js);
        small = txt.length < 40;
        if (!small) out += "\n" + indent;
        var k, v, idx = 0;
        for (k in js) {
            v = js[k];
            if (idx > 0) {
                out += "," + (small ? " " : "\n" + indent);
            }
            out += JSON.stringify(k) + ": " + stringify(v, indent);
            idx++;
        }
        out += (small ? "" : "\n" + lastIndent) + '}';
        return out;
    }
    return '"<' + t + '>"';
}


exports.parse = function(json) {
    return JSON.parse(json);
};

exports.stringify = function(js, indent) {
    if (typeof indent === 'undefined') indent = false;
    if (indent === false) {
        return JSON.stringify(js);
    }
    return stringify(js, '', indent);
};
