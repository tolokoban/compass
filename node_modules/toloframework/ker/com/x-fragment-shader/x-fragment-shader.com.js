/***************************************
 Component x-fragment-shader
 ***************************************/

var FS = require("fs");
var Path = require("path");

exports.tags = ["x-fragment-shader"];
exports.priority = 0;

/**
 * Compile a node of the HTML tree.
 */
exports.compile = function(root, libs) {
    var Tree = libs.Tree;
    var id = root.attribs.id;
    if (!id) {
        libs.fatal(
            "Missing 'id' attribute for the shader!",
                -1,
            "<x-fragment-shader>"
        );
    }
    id = id.trim();
    var filename = Tree.text(root).trim();
    var file = libs.htmPath(filename);
    if (!FS.existsSync(file)) {
        libs.fatal(
            "Shader file not found: \"" + filename + "\"!\nFull path: \"" + file + "\"",
                -1,
            "<x-fragment-shader>"
        );
    }
    var stat = FS.statSync(file);
    if (!stat.isFile) {
        libs.fatal("This is not a file: \"" + file + "\"!", -1, "<x-fragment-shader>");
    }
    libs.addInclude(filename);
    var content = FS.readFileSync(file).toString().trim();
    root.type = Tree.VOID;
    delete root.attribs;
    var script = Tree.createJavascript(content);
    script.attribs = {id: id, "type": "x-shader/x-fragment"};
    root.children = [script];
};
