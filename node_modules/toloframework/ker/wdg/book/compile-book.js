/**
 *
 * @module Book
 */


/**
 * Display one child element at the time and provide nice transition between pages.
 * @example
 * <w:Book data="page">
 *   <w:Img book-page="first" src="tiger.png"></w:Img>
 *   <w:Img book-page="second" src="elephant.png"></w:Img>
 * </w:Book>
 */
exports.compile = function(root) {
    var N = this.Tree;
    var children = [];
    var pages = {};
    var prj = this;
    N.keepOnlyTagChildren(root);
    N.forEachChild(
        root,
        function(child) {
            if (child.type != N.TAG) return;
            var page = N.att(child, "book-page");
            delete child.attribs["book-page"];
            if (!page) {
                prj.fatal("Every child of <w:book> must have a 'book-page' attribute!");
            }
            var id = N.att(child, "id");
            if (!id) {
                id = N.nextId();
                N.att(child, "id", id);
            }
            pages[page] = id;
        }
    );
    root.extra.init.pages = pages;
    var data = N.att(root, "data");
    if (typeof data === 'string') {
        delete root.attribs.data;
        root.extra.init.data = data;
    }
};

