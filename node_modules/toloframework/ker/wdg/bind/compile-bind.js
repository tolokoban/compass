/**
 * @module Bind
 */

var Util = require("../util.js");

/**
 * Bind the content of a SPAN on a data.
 * @example
 * <p>Hello <w:bind>name</w:bind>!</p>
 * <p>Hello <span>&lt;b&gt;Bob&lt;/b&gt;</span>!</p>
 * @example
 * <p>Hello <w:bind type="html">name</w:bind>!</p>
 * <p>Hello <span><b>Bob</b></span>!</p>
 */
module.exports.compile = function(root) {
    Util.bindable(this, root);
    var type = this.Tree.att(root, "type");
    if (type) {
        delete root.attribs.type;
        if (type.trim().toLowerCase() == 'html') {
            root.extra.init.type = "html";
        }
    }
    root.name = "span";
};
