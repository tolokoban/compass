/**
 * Define a data binded in the current scope.  
 * 
 * @example {@lang xml}
 * <!--
 *   This will produce this data binding :
 *   parent.$data = {
 *     "context": [
 *       {"sens":["Vue", "Ouïe", "Odorat", "Goût", "Toucher"]},
 *       []
 *     ]
 *   }
 * -->
 * <w:Data name="context">
 *   <map>
 *     <item key="sens">
 *       <list>
 *         <item>Vue</item>
 *         <item>Ouïe</item>
 *         <item>Odorat</item>
 *         <item>Goût</item>
 *         <item>Toucher</item>
 *       </list>
 *     </item>
 *   </map>
 * </w:Data>
 * 
 * @module Data
 */

function parse(node) {
    
}

/**
 * @private
 */
exports.compile = function(root) {
    root.name = "div";
    this.Tree.addClass(root, "wtag-w:Data");
};
