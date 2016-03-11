/**
 * Component script
 */

exports.tags = ["script"];
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
 * 
 */
exports.compile = function(root, libs) {
    var src = root.attribs.src; 
    if (!src) return;
    if (src.substr(0, 5) == 'http:' || src.substr(0, 6) == 'https:') return;
    if (!libs.fileExists(src)) {
        libs.fatal("<script> File not found: \"" + src + "\"!");
    }
    src = libs.filePath(src);
    libs.addResourceFile(src, src, src);
};
