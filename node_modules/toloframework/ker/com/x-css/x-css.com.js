/**
 * Component x-css
 */

exports.tags = ["x-css", "w:css"];
exports.priority = 0;

/**
 * Compile a node of the HTML tree.
 */
exports.compile = function(root, libs) {
    var T = libs.Tree;
    var cssFilename = T.text(root).trim();
    if (!libs.fileExists(cssFilename)) {
        cssFilename += ".css";
    }
    if (!libs.fileExists(cssFilename)) {
        libs.fatal("<" + root.tag + ">: CSS filename not found: \"" + cssFilename + "\"!");
    }
    libs.addInnerCSS(libs.readFileContent(cssFilename));
    root.type = T.VOID;
    delete root.text;
    delete root.children;
};
