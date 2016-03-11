/**
 * @module Clickable
 */

var Util = require("../util");

/**
 * Clickable is not a button. It only gives its children the ability to fire events when clicked.
 * In fact, it is not a real DOM element, so giving it CSS classes is useless.
 * 
 * @example
 *
 * @param fire Name of the signal to trigger when user clicks on the button.
 * To add an argument, put it in the "fire-arg" attribute or add it to
 * this one separated by a colon (ex: `fire="edit:27"`).
 * @param fire-arg Argument to fire with the signal.
 * @param enabled 
 */
module.exports.compile = function(root) {
    this.Tree.keepOnlyTagChildren(root);
    Util.fireable(this, root);
    Util.bindable(this, root, "enabled", "B");
/*
    // This is not a real DOM element.
    root.type = this.Tree.VOID;
    delete root.name;
    delete root.attribs;
    delete root.extra.init.id;
    var ids = [], Tree = this.Tree;
    this.Tree.forEachChild(
        root,
        function(node) {
            ids.push(node.attribs.id);
            Tree.addClass(node, "wtag-clickable");
        }
    );
    root.extra.init.ids = ids;
*/
};
