/**
 * @module List
 */

var Util = require("../util");

/**
 * Display a binded list. Items are clones of the chldren of the list.

 * @example
 * <ul>
 *   <w:list list="names" item="name">
 *     <li>{{name}}}</li>
 *   </w:list>
 * </ul>
 */
exports.compile = function(root) {
    this.Tree.keepOnlyTagChildren(root);
    if (!root.attribs) root.attribs = {};
    root.name = root.attribs.tag || "div";
    this.Tree.addClass(root, "wtag-list");
    var tplId, tpl;
    if (root.children > 1) {
        tplId = this.Tree.nextId();
        root.children = [
            {
                type: this.Tree.TAG,
                name: "div",
                attribs: {id: tplId},
                children: root.children
            }
        ];
        tpl = root.children[0];
    } else {
        tpl = root.children[0];
        if (!tpl.attribs) tpl.attribs = {};
        tplId = tpl.attribs.id;
        if (!tplId) {
            tplId = this.Tree.nextId();
            tpl.attribs.id = tplId;
        }
    }
    tpl.attribs.style = "display:none";
    tplId = tpl.attribs.id;
    root.extra.init.maker = Util.templatize(tpl);
    root.extra.init.tpl = tplId;
    Util.moveAttrib(root, "list");
    Util.moveAttrib(root, "item");
};
