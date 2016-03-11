/**
 * @module Input
 */

var Util = require("../util");

/**
 * @example
 * <w:input data="name" valid="@popup:welcome"></w:input>
 */
module.exports.compile = function(root) {
    Util.fireable(this, root);
    root.name = "input";
    root.extra.init.data = root.attribs.data;
};
