/**
 *
 * @module Css
 */

var FS = require("fs");
var Path = require("path");

/**
 * Add a folder as resource.
 * @example
 * <w:Resource>img</w:Resource>
 */
exports.compile = function(root) {
    var Tree = this.Tree;
    var filename = Tree.text(root).trim();
    var file = this.srcOrLibPath(filename);
    if (!FS.existsSync(file)) {
        this.fatal("Resource folder not found: \"" + filename + "\"!", -1, "<w:Resource>");
    }
    var stat = FS.statSync(file);
    if (!stat.isDirectory()) {
        this.fatal("This is not a folder: \"" + file + "\"!", -1, "<w:Resource>");
    }
    var files = FS.readdirSync(file);
    files.forEach(
        function(item) {
            root.extra.resources.push(filename + "/" + item);
        }
    );
    //root.extra.dependencies.push(filename);
    root.type = Tree.VOID;
    delete root.name;
    delete root.attribs;
    delete root.children;
};
