/**
 * Component x-row
 *
 * This is a flexible layout based on `display: table`.
 * Children are put on a line which ca be horizontal, vertical, in the larger or in the narrower side.
 */

exports.tags = ["x-row"];
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
    // `N` is just a shortcut for `libs.Tree`.
    var N = libs.Tree;
    // Default anchor.
    // T: Top, R: Right, B: Bottom and L: Left.
    var anchorParent = root.attribs.anchor || '';
    // We use CSS media queries to deal with the device's orientation.
    N.addClass(root, 'x-row');
    // Children have to be compiled first becvause they can create new cells.
    libs.compileChildren(root);
    // Cells to add to the finale row.
    // In order to deal with __orientation__ _wide_ or _narrow_, we must
    // nest two `<div>`.  If we want to make a  vertical line, the first
    // `<div>` will be `display: table-row` and the second one `display:
    // table-cell`. Otherwise, in cas of an horizontal row, we will have
    // `display: table-cell` and `display: block`.
    var cells = [];
    // Defined anchor for each cell.
    var cellsAnchors = [];
    // Defined weight for  each cell. By defautl a cell  weight is equal
    // to 1. Weights are used to set relative sizes.
    var cellsWeights = [];
    var totalWeight = 0;
    // Consequent  test items  are in  the same  cell. So  we need  this
    // variable to merge them.
    var currentCell = N.tag("div");
    // Push `currentCell` to `cells` if `currentCell` is not empty.
    function flushCurrentCell() {
        if (currentCell.children.length > 0) {
            cells.push(currentCell);
            currentCell = N.tag("div");
            cellsWeights.push(1);
            totalWeight++;
        }
    }
    // Loop on each children to transform them into cells.
    root.children.forEach(function (child) {
        // Used in case of VERBATIM.
        var node;
        // Cell anchor. Tag's attribute `cell-anchor`.
        var anchor;
        // Cell weight. Tag's attribute `cell-weight`.
        var weight;

        switch (child.type) {
            case N.TEXT:
            case N.ENTITY:
                if (currentCell.children.length > 0 || child.text.trim() != '') {
                    // Never put an empty text as first currentCell's child.
                    currentCell.children.push(child);
                }
                break;
            case N.TAG:
                flushCurrentCell();
                anchor = child.attribs["cell-anchor"] || undefined;
                weight = parseFloat(child.attribs["cell-weight"] || 1);
                totalWeight += weight;
                cellsWeights.push(weight);
                cells.push(child);
                break;
            case N.VERBATIM:
                flushCurrentCell();
                node = libs.parseHTML(child.text);
                cells.push(node);
                break;
        }
    });
    flushCurrentCell();

    // Computing sizes.
    var sizes = [];
    var total = 10000;
    var size;
    var weight;
    var k;
    for (k = 0; k < cells.length; k++) {
        weight = cellsWeights[k];
        size = Math.floor(.5 + weight * total / totalWeight);
        sizes.push(size / 100);
        total -= size;
        totalWeight -= weight;
    }

    root.name = 'div';
    root.children = [];
    cells.forEach(function (cell, idxCell) {
        var div1 = N.tag('div');
        div1.attribs["class"] = anchor2class(cellsAnchors[idxCell], anchorParent);
        var div2 = N.tag('div');
        div2.children.push(cell);
        div1.children.push(div2);
        root.children.push(div1);
        // Setting individual cells' sizes.
        div1.attribs.style = 'height:' + sizes[idxCell] + '%';
        div2.attribs.style = 'width:' + sizes[idxCell] + '%';
    });
};


var classes = [
    '', 'T', 'R', 'TR',
    'B', 'TB', 'RB', 'TRB',
    'L', 'TL', 'RL', 'TRL',
    'BL', 'TBL', 'RBL', 'TRBL',
];


function anchor2class(anchor, anchorParent) {
    if (typeof anchor === 'undefined') anchor = anchorParent;
    if (typeof anchorParent === 'undefined') anchorParent = '';
    anchorParent = anchorParent.trim().toUpperCase();
    // This is a bitwise number.
    var classIndex = 0;
    if (anchorParent.indexOf('T')) classIndex += 1;
    if (anchorParent.indexOf('R')) classIndex += 2;
    if (anchorParent.indexOf('B')) classIndex += 4;
    if (anchorParent.indexOf('L')) classIndex += 8;
    return classes[classIndex];
}
