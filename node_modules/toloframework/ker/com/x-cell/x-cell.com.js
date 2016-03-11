/**
 * Component x-cell
 */

exports.tags = ["x-cell"];
exports.priority = 0;

/**
 * Called the  first time the  component is  used in the  complete build
 * process.
 */
exports.initialize = function(libs) {};

/**
 * Called after the complete build process is over (success or failure).
 */
exports.terminate = function(libs) {};

/**
 * Called the first time the component is used in a specific HTML file.
 */
exports.open = function(file, libs) {};

/**
 * Called after a specific HTML file  as been processed. And called only
 * if the component has been used in this HTML file.
 */
exports.close = function(file, libs) {};

/**
 * Compile a node of the HTML tree.
 */
exports.compile = function(root, libs) {
    // text-align.
    var centerH = 'center';
    // vertical-align.
    var centerV = 'middle';
    var align = (root.attribs.align || '').toUpperCase();
    if (align.indexOf('T') > -1) centerV = 'top';
    if (align.indexOf('B') > -1) centerV = 'bottom';
    if (align.indexOf('L') > -1) centerH = 'left';
    if (align.indexOf('R') > -1) centerH = 'right';
    delete root.attribs.align;

    root.name = 'div';
    root.attribs.style = 'display:table';
    root.children = [
        {
            type: libs.Tree.TAG,
            name: 'div',
            attribs: {
                style: 'display:table-cell;text-align:' + centerH
                     + ';vertical-align:' + centerV
            },
            children: root.children
        }
    ];
};
