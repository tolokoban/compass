/**
 *
 * @module Img
 */

var Util = require("../util");


/**
 *
 * @example
 * <w:Img src="img/menu/quetes.png"></w:Img>
 */
exports.compile = function(root) {
    var N = this.Tree;
    var style = N.att(root, "style") || "";
    var src = N.att(root, "src");
    var file = this.srcOrLibPath(src);
    if (!file) {
        this.fatal("Unable to find image: " + src, this.ERR_FILE_NOT_FOUND, "<w:Img src='...'>");
    }
    var info = Util.getImageInfo(file);
    var width = N.att(root, "width");
    var height = N.att(root, "height");
    var ratio = info.width > 0 && info.height > 0 ? info.width / info.height : 1;
    if (width) {
        width = Util.unit(width);
        delete root.attribs.width;
    }
    if (height) {
        height = Util.unit(height);
        delete root.attribs.height;
    }
    if (width && !height) {
        height = [width[0] / ratio, width[1]];
    }
    else if (!width && height) {
        width = [height[0] * ratio, height[1]];
    }
    if (!width) {
        width = [info.width, "px"];
    }
    if (!height) {
        height = [info.height, "px"];
    }
    root.extra.innerCSS = "#" + root.attribs.id + ".wtag-img:not(.expand){width:" 
        + width[0] + width[1]
        + ";height:" 
        + height[0] + height[1] + "}\n"
        + "#" + root.attribs.id + ".wtag-img{"
        + "background-image:url('../" + src + "');}\n";
    delete root.attribs.src;

    root.extra.resources.push(src);

    var directionsW = ["left", "right", "width"];
    var directionsH = ["top", "bottom", "height"];
    N.forEachChild(
        root,
        function (node) {
            var style = N.att("node", "style") || "";
            directionsW.forEach(
                function(dir) {
                    var v = N.att(node, dir);
                    if (v === undefined || v === null) return;
                    delete node.attribs[dir];
                    v = parseFloat(v) / 100;
                    v *= width[0];
                    style = dir + ":" + v + width[1] + ";" + style;
                } 
            );
            directionsH.forEach(
                function(dir) {
                    var v = N.att(node, dir);
                    if (v === undefined || v === null) return;
                    delete node.attribs[dir];
                    v = parseFloat(v) / 100;
                    v *= height[0];
                    style = dir + ":" + v + height[1] + ";" + style;
                } 
            );
            style = "position:absolute;" + style;
            N.att(node, "style", style);
        }
    );
};
