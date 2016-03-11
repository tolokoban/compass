/**
 *
 * @module Css
 */

var FS = require("fs");

/**
 * Include a CSS file.
 * @example
 * <w:Css>custom_style.css</w:Css>
 */
exports.compile = function(root) {
    var Tree = this.Tree;
    var filename = Tree.text(root).trim();
    var file = this.srcOrLibPath(filename);
    if (!FS.existsSync(file)) {
        this.fatal("Include file not found: \"" + filename + "\"!", -1, "<w:include>");
    }
    var stat = FS.statSync(file);
    if (!stat.isFile) {
        this.fatal("This is not a file: \"" + file + "\"!", -1, "<w:include>");
    }
    root.extra.dependencies.push(filename);
    var content = FS.readFileSync(file).toString().trim();
    root.type = Tree.VOID;
    delete root.name;
    delete root.attribs;
    delete root.children;
    root.extra.innerCSS = content;
};
