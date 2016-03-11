/**
 * Component x-img2css
 *
 * Add image to the resources.
 */
var Path = require("path");

exports.tags = ["img"];
exports.priority = 0;

/**
 * Compile a node of the HTML tree.
 */
exports.compile = function(root, libs) {
    var src = root.attribs['src'];
    if (typeof src === 'string') {
        if (libs.fileExists(src)) {
            src = Path.join(libs.dirname(), src);
            console.log("Image: " + src.cyan);
            libs.addResourceFile(src, src, src);
        }
    }
};
