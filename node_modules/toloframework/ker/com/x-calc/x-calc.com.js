/**
 * Component x-calc
 */

var rxVarName = /^[a-zA-Z_$][a-zA-Z_$0-9]*/;


exports.tags = ["x-calc"];
exports.priority = 0;

/**
 * Compile a node of the HTML tree.
 */
exports.compile = function(root, libs) {
    var content = libs.Tree.text(root),
    out = '',
    cursor = 0,
    index = 0,
    match;

    while (index < content.length) {
        index = content.indexOf('$', index);
        if (index < 0) {
            index = content.length;
        } else {
            out += content.substr(cursor, index - cursor);
            cursor = index;
            index++;
            match = rxVarName.exec(content.substr(index));
            if (match) {
                out += libs.getVar(match[0]);
                index += match[0].length;
                cursor = index;
            }
        }
    }
    out += content.substr(cursor, index - cursor);
    try {
        eval("with(Math){out=(" + out + ")}");
    }
    catch (ex) {
        libs.fatal("Exception while trying to calc \"" + content + "\"!");
    }
    root.type = libs.Tree.TEXT;
    root.text = out;
};
