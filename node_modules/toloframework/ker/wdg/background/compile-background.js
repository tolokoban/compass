/**
 *
 * @module Background
 */

var Util = require("../util");


/**
 *
 * @example
 * <w:Background src="img/menu/quetes.png"></w:Background>
 */
exports.compile = function(root) {
    var N = this.Tree;
    var style = N.att(root, "style") || "";
    var src = N.att(root, "src");
    if (!src) return;

    var file = this.srcOrLibPath(src);
    if (!file) {
        this.fatal("Unable to find image: " + src, this.ERR_FILE_NOT_FOUND, "<w:Background src='...'>");
    }
    root.extra.innerCSS = "#" + root.attribs.id + ".wtag-background{"
        + "background-image:url('../" + src + "');}\n";
    delete root.attribs.src;

    root.extra.resources.push(src);
};
