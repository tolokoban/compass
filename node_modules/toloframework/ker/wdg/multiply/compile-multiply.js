/**
 *
 * @module Multiply
 */

/**
 * 
 * @example
 * <w:Multiply src="red; green; blue">
 *   <w.button class="{{src}}">This is {{src}}!</w:button>
 * </w:Multiply>
 */
exports.precompile = function(root) {
    var N = this.Tree;
    root.type = N.VOID;
    var vars = {};
    var count = 0;
    if (!root.attribs || root.attribs.length == 0) {
        root.children = [];
        this.fatal("No attribute found!", -1, "<w:Multiply>");
        return;
    }
    var key, val;
    for (key in root.attribs) {
        if (key == 'id') continue;
        val = "" + root.attribs[key];
        vars[key] = val.split(/[ \t]*;[ \t]*/);
        count = Math.max(count, vars[key].length);
    }
    var content = "";
    N.forEachChild(
        root,
        function(node) {
            content += N.toString(node).trim();
        }
    );
    root.children = [];
    var out, i;
    for (i = 0 ; i < count ; i++) {
        out = this.Template.text(
            content,
            function(name) {
                if (name in vars) {
                    var arr = vars[name];
                    return arr[i % arr.length];
                } else {
                    return "{{" + name + "}}";
                }
            }
        ).out;
        root.children = root.children.concat(
            N.parse(out).children
        );
    }
    delete root.attribs;
    delete root.name;
};
