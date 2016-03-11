/**
 * Component x-code
 */
var Highlight = require("./highlight");

var LANGUAGES = ['js', 'css', 'html', 'xml'];


exports.tags = ["x-code"];
exports.priority = 0;

/**
 * Called the  first time the  component is  used in the  complete build
 * process.
 */
exports.initialize = function(libs) {};

/**
 * Called after the complete build process is over (success or failure).
 */
exports.terminate = function(libs) {};

/**
 * Called the first time the component is used in a specific HTML file.
 */
exports.open = function(file, libs) {};

/**
 * Called after a specific HTML file  as been processed. And called only
 * if the component has been used in this HTML file.
 */
exports.close = function(file, libs) {};

/**
 * Compile a node of the HTML tree.
 */
exports.compile = function(root, libs) {
    var src = root.attribs.src;
    var code = '';

    if (src) {
        if (!libs.fileExists(src)) {
            src += '.js';
        }
        if (!libs.fileExists(src)) {
            libs.fatal("File not found: \"" + src + "\"!");
        }
        libs.addInclude(src);
        code = libs.readFileContent(src);
    } else {
        code = libs.Tree.text(root);
    }
    code = code.trim();
    var highlightedCode = Highlight.parseCode(code, 'js', libs);
    root.type = libs.Tree.VOID;
    delete root.attribs;
    delete root.name;
    libs.Tree.text(root, highlightedCode.trim());
};
