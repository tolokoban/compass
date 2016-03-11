var FS = require("fs");
var Path = require("path");

var Chrono = require("./chrono");


/**
 * @param src {Source} - Source object mapped to the HTML file.
 * @param pathJS {string} - Destination path for Javascript.
 * @param pathCSS {stinrg} - Destination path for Cascading Style Sheets.
 * @param options {object} - Global options.
 *   * __verbatim__ {boolean}: If `true`, add more logs.
 */
module.exports = function(src, pathJS, pathCSS, options) {
    // The name without the `.html` extension can be used to find associated `.css` or `.ini` files.
    var nameWithoutExt = src.name().substr(0, src.name().length - 5);
    // If `nameWithoutExt` is in a subfolder, `backToRoot` must containt
    // as many `../` as there are subfolders in `nameWithoutExt`.
    var backToRoot = getBackToRoot(nameWithoutExt);
    var output = src.tag("output") || {};
    
};
