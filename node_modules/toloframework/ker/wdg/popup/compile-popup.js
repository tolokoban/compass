/**
 * @module Popup
 */

/**
 * Contain all the popup messages you need to display in the application.
 * 
 * A popup stays open for 5 seconds. You can close it at any time by clicking it.
 * 
 * The global signal __@popup__ trigger the show of a message. See examples.
 * 
 * @example
 * <w:popup>
 *   <msg name="welcome">Welcome to miami!</msg>
 *   <msg name="added">New record has been added.</msg>
 *   <err name="bad-login">This account is unknown!</err>
 * </w:popup>
 * <w:button fire="@popup:welcome>Start</w:button>
 * 
 * @example
 * WTag.popup("added");
 */
exports.compile = function(root) {
    var children = [];
    var Tree = this.Tree;
    root.name = "div";
    Tree.addClass(root, "wtag-popup");
    Tree.forEachChild(
        root,
        function(child) {
            var tag = child.name;
            if (tag == 'msg' || tag == 'err') {
                var name = child.attribs.name;
                if (name) {
                    child.name = "div";
                    Tree.addClass(child, tag);
                    children.push(child);
                }
            }
        }
    );
    root.children = children;
};
