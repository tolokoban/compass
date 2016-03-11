/**
 *
 * @module Visible
 */

var Util = require("../util.js");


/**
 * Show/Hide content depending on data.
 * @example
 * <w:Visible if="fuel < 50">Fuel is very low!</w:Visible>
 */
exports.compile = function(root) {
    Util.bindable(this, root, "if", "B");
};
