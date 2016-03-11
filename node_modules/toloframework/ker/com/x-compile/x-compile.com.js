/**
 * Component x-compile
 *
 * Complile an HTML file and replace the tag with an hyperlink.
 *
 * ```
 * <x-compile src="millers_puzzle/millers_puzzle.html">The Miller's Puzzle</x-compile>
 * ```
 *
 * The previous example will be turned into:
 * `<a href="millers_puzzle/millers_puzzle.html">The Miller's Puzzle</a>`
 */

exports.tags = ["x-compile"];

/**
 * Compile a node of the HTML tree.
 */
exports.compile = function(root, libs) {
    var src = root.attribs.src;
    if (!src) {
        libs.fatal("<x-compile> missed its mandatory attribute `src`!");
    }
    if (!libs.fileExists(src)) {
        libs.fatal("File not found: \"" + src + "\"!");
    }
    libs.compileHTML(src);
    root.name = "a";
    root.attribs = {href: src};
};
