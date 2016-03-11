/**
 *
 * @module Scroll
 */


/**
 * 
 * @example
 * <w:Scroll></w:Scroll>
 */
exports.compile = function(root) {
    this.Tree.att(root, "style", "oveflow:auto;");
    //this.Tree.keepOnlyTagChildren(root);
};
