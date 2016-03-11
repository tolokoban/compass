/**
 * Component x-md
 */

var Marked = require("./marked");
var S = require("string");

exports.tags = ["x-md"];
exports.priority = 0;

/**
 * Compile a node of the HTML tree.
 */
exports.compile = function(root, libs) {
    Marked.setOptions(
        {
            // Git Flavoured Markdown.
            gfm: true,
            // Use tables.
            tables: true
/*
            highlight: function (code, lang) {
                return Highlight.parseCode(code, lang, libs);
            }
*/
        }
    );

    var src = root.attribs.src,
        node,
        content,
        out;
    if (src) {
        // Loading form external file.
        if (!libs.fileExists(src)) {
            src += '.md';
        }
        if (!libs.fileExists(src)) {
            libs.fatal("File not found: \"" + src + "\"!");
        }
        libs.addInclude(src);
        node = libs.parseHTML(
            libs.readFileContent(src)
        );
        libs.compileChildren(node);
        content = libs.Tree.toString(node);
    } else {
        // Loading tag's content.
        root.type = libs.Tree.VOID;
        libs.compileChildren(root);
        content = libs.Tree.toString(root);
    }

    out = Marked(content);
    var tree = libs.parseHTML(out);

    root.name = "div";
    root.attribs = {"class": "x-md custom"};
    root.children = tree.children;
};
