/**
 * Component x-layout
 *
 * Absolute CSS positionning using `calc()`.
 * Example:
 * ```
 * <x-layout orientation='wide'>
 *   <x-layout-fill>
 *     <img src="background.png"/>
 *   </x-layout-fill>
 *   <div cell-ratio='3/4'>Hello world</div>
 *   <x-layout-horizontal>
 *     <button>Backward</button>
 *     <div cell-weight='2'>Title</div>
 *     <button>Foreward</button>
 *   </x-layout-horizontal>
 * </x-layout>
 * ```
 *
 * There are four possible orientations :
 * * __horizontal__: from left to right.
 * * __vertical__: from top to bottom.
 * * __wide__: if the device is  in portrait orientation, this is like
     __vertical__, otherwise this is like __horizontal__.
 * * __narrow__: the opposite of __wide__.
 *
 * Children are aligned side by side in the orientation defined by the direct parent.
 * There are special elements that impact the layout :
 * * __x-layout-fill__: this element  is not aligned side  by side. It
     takes  the  whole   parent  space.  This  is   usefull  to  apply
     backgrounds images.
 * * __x-layout-horizontal__, __x-layout-vertical__, __x-layout-wide__, __x-layout-narrow__:
     this  element is  aligned like  any element,  but it  alignes its
     children in a specific direction.
 *
 * You can control the space and position of each layout's child by using these attributes:
 * * __cell-weight__: by default, an element has a weight of 1. If all
     children has the same weight, they  will have the same size : the
     size of the parent divided by the number of children. But you can
     use this attribute to give more or less space to some children.
 * * __cell-ratio__: you can force an  element to keep a ratio between
     width  and   height.  This  is   usefull  to  get   squares,  for
     example.  The value  can be  a real  number, or  a fraction  like
     `16/9`.  If  this   attribute  is  set,  you  must   not  have  a
     __cell_weight__ attribute.
 */


/**
 * @return {string} Next ID to be used as a CSS classname.
 */
var nextId = (function() {
    var id = -1;
    return function() {
        id++;
        return 'x-layout-' + id;
    };
})();


exports.tags = ["x-layout"];
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
    // Children have to be compiled first becvause they can create new cells.
    libs.compileChildren(root);
    // Final cells.
    // Elements are objects with three attributes:
    // * __node__: final TAG.
    // * __portrait__: CSS for the _portrait_ mode.
    // * __landspace__: CSS for the _landscape_ mode.
    var cells = [];
    // Look for orientation. Possible values are :
    // `horizontal`,  `vertical`,  `wide` (`horizontal`  in  landscape
    // mode and  `vertical`otherwise) and `narrow` (opposite  value of
    // `wide`).
    var orientation = root.attribs.orientation || 'wide';
    // Four functions can be called depending on `orientation`.
    var fun;
    switch (orientation.trim().toLowerCase()) {
    case 'horizontal': fun = horizontal; break;
    case 'vertical':   fun = vertical;   break;
    case 'wide':       fun = wide;       break;
    case 'narrow':     fun = narrow;     break;
    default:
        libs.fatal(
            '[x-layout] Allowed values for attribute `orientation` are "wide", "narrow", "horizontal" and "vertical". But not "' 
                + orientation + '"!\nDefault value is "wide".'
);
    }
    fun(libs, root.children, cells, {
        portrait:  { left: 0, top: 0, width: '100vw', height: '100vh' },
        landscape: { left: 0, top: 0, width: '100vw', height: '100vh' }
    });

    var className = nextId();
    root.name = 'div';
    N.addClass(root, className);
    libs.addInnerCSS(
        '.' + className + '{position:absolute;left:0;top:0;width:100%;height:100%}'
    );
    root.children = cells;
};


function horizontal(libs, nodes, cells, dims) {
    var info = parseChildren(libs, nodes);
    var totalWeight = info.totalWeight;
    var children = info.nodes;
    var totalFixedSizes = {
        portrait:  computeFixedSize(children, dims.portrait.height ),
        landscape: computeFixedSize(children, dims.landscape.height)
    };
    ['portrait', 'landscape'].forEach(function (orientation) {
        var width = dims[orientation].width;
        var totalFixedSize = totalFixedSizes[orientation];
        var freeSize = totalFixedSize != '' ? '(' + width + ' - (' + totalFixedSizes + '))' : width;
        var x = '';
        children.forEach(function (child) {
            var size = child.size;
            if (typeof size === 'undefined') {
                // `size` is defined only if it has a `ratio` attribute.
                // otherwise, we have to compute it with the `weight`.
                var weight = parseFloat(child.weight || 1);
                if (isNaN(weight)) weight = 1;
                size = freeSize + '*' + weight + '/' + totalWeight;
            }
            var className = nextId();
            libs.Tree.addClass(child, className);
            libs.addInnerCSS(
                '.' + className 
                    + '{position:absolute;left:calc('
                    + x + ');top:0;width:calc('
                    + size + ');height:100%}'
            );
            cells.push(child);
            if (x == '') {
                x = size;
            } else {
                x = x + ' + (' + size + ')';
            }
        });
    });
}


function vertical(libs, nodes, cells, dims) {
}


function wide(libs, nodes, cells, dims) {
}


function narrow(libs, nodes, cells, dims) {
}


/**
 * @param {array} nodes array of elements to align.
 * @param {number} referenceSize for row in horizontal orientation, `referenceSize` is it's height.
 *
 * The weight defined a relative size, but a ratio force a fixed size.
 * This  function compute  the  fixed sizes  returning  the total  and
 * setting the fixed size on the `size` attribute of each node.
 */
function computeFixedSize(nodes, referenceSize) {
    var fixedSize = "";
    nodes.forEach(function (node) {
        var ratio = node.attribs['cell-ratio'];
        if (typeof ratio === 'undefined') return;
        var size = referenceSize + '*' + ratio;
        if (fixedSize != '') fixedSize += '+';
        fixedSize += size;
        node.size = size;
    });
    return fixedSize;
}

/**
 * @return `{totalWeight: ..., nodes: [...]}`
 */
function parseChildren(libs, nodes) {
    var totalWeight = 0;
    var children = [];
    nodes.forEach(function (node) {
        if (node.type != libs.Tree.TAG) return;
        node.cls = nextId();
        children.push(node);
        if (node.name.toLowerCase() == 'x-layout-fill') {
            // A weight of zero means that the cell must fill the whole parent.
            node.weight = 0;
            return;
        }
        // Weight   are  used   to  give   relatives  sizes   to  each
        // cell. Default weight is __1__.
        var weight = parseInt(node.attribs["cell-weight"] || 1);
        if (isNaN(weight)) {
            libs.fatal('Attribute `cell-weight` must be a number, but not "' 
                       + node.attribs["cell-weight"] + '"!');
        }
        // Ratio is the _width_ divided by the _height_.
        // For a square, `ratio=1`.
        // If you specify a `ratio`, you can't specify a `weight`.
        var ratio = node.attribs['cell-ratio'];
        if (typeof ratio === 'string') {
            if (typeof node.attribs["cell-weight"] !== 'undefined') {
                libs.fatal("Attributes `cell-weight` and `cell-ratio` are exclusives!");
            }
            node.ratio = ratio.trim();            
        } else {
            totalWeight += weight;
            node.weight = weight;
        }
    });

    return {totalWeight: totalWeight, nodes: children};
}


function calcToString(expr) {
    // `type` can be: +, *, /, or a unit (px, mm, vh, vw, %, '', ...).
    var typeOrUnit = expr[0];
    var k, atom, out = '';
    if (typeOrUnit == '+' || typeOrUnit == '*') {
        for (k = 1; k < expr.length; k++) {
            atom = expr[k];
            if (k < 2) {
                out += calcToString(atom);
            } else {
                if (typeOrUnit == '+') {
                    // WARNING! We have to deal with minus sign !!!!
                    out += ' + ' + calcToString(atom);
                } else {
                    out += typeOrUnit + calcToString(atom);
                }
            }
        }
    } else if (typeOrUnit == '/') {
        out = calcToString(expr[1]) + "/" + calcToString(expr[2]);
    } else {
        out = expr[1] + typeOrUnit;
    }
    return out;
}

function Calc(number, unit) {
    if (typeof unit === 'undefined') unit = '';
    this.expr = [unit, parseFloat(number)];
}

function clone(v) {
    return JSON.parse(JSON.stringify(v));
}

Calc.prototype.add = function(number, unit) {
    number = parseFloat(number);
    var expr = this.expr;
    var typeOrUnit = expr[0];
    var k, atom;
    if (typeOrUnit == '+') {
        for (k = 1; k < expr.length; k++) {
            atom = expr[k];
            if (unit === atom[0]) {
                // Same units: we can add numbers.
                atom[1] += number;
                return this;
            }
        }
        // Incompatible units: let's add to the end.
        expr.push([unit, number]);
    }
    else if (typeOrUnit == '*' || typeOrUnit == '/') {
        this.expr = ['+', clone(expr), [unit, number]];
    }
    else {
        if (unit === typeOrUnit) {
            // Same units: we can add numbers.
            expr[1] += number;
        } else {
            // Different units, we keep an addition.
            this.expr = ['+', clone(expr), [unit, number]];
        }
    }
    return this;
};

Calc.prototype.mul = function(number, unit) {
    number = parseFloat(number);
    var expr = this.expr;
    var typeOrUnit = expr[0];
    var k, atom;
    if (typeOrUnit == '+') {
        for (k = 1; k < expr.length; k++) {
            atom = expr[k];
            if (unit === atom[0]) {
                // Same units: we can add numbers.
                atom[1] += number;
                return this;
            }
        }
        // Incompatible units: let's add to the end.
        expr.push([unit, number]);
    }
    else if (typeOrUnit == '*' || typeOrUnit == '/') {
        this.expr = ['+', clone(expr), [unit, number]];
    }
    else {
        if (unit === typeOrUnit) {
            // Same units: we can add numbers.
            expr[1] += number;
        } else {
            // Different units, we keep an addition.
            this.expr = ['+', clone(expr), [unit, number]];
        }
    }
    return this;
};

Calc.prototype.div = function(number, unit) {

    return this;
};

Calc.prototype.toString = function() {
    return calcToString(this.expr);
};


exports.Calc = Calc;
