/**
 *
 * @module Flex
 */

/**
 *
 * @example
 * <w:flex class="wide">
 *   <div>Hello</div>
 *   <div class="grow">world of</div>
 *   <div>madness!</div>
 * </w:flex>
 */
exports.compile = function(root) {
    var N = this.Tree;
    N.keepOnlyTagChildren(root);
    N.forEachChild(
        root,
        function(node) {
            var width = N.att(node, "flex-size");
            if (width) {
                delete node.attribs["flex-size"];
                node.attribs.style =
                    "flex:0 0 " + width + ";"
                    + (node.attribs.style || "");
            }
        }
    );
};
