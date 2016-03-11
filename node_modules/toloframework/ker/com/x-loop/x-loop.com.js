/*
 Component x-loop

 All attributes with a preceding `$` are variables with several values separated by `;`.
 If you need to use `;` in your values, use the `sep` attribute to specify something else than `;`.

 All  variables do  not  need to  have  the same  number  of values.  The
 `x-loop` will iterate as many times  as the maximum number of values for
 a variable. A  rotation is used for other variables.  Hence, if you have
 `$a="1;2;3"` and  `$b="X;Y"`, you get  3 iterations with `1X`,  `2Y` and
 `3X`.

 You can specify ranges instead of list of values.

 @example
 <x-loop $angle="45;135;225;315" $text="NE;SE;SW;NW">
 <tag:g>
 <att:transform>rotate(<$angle/>)</att:transform>
 <rect height="20" x="-20" y="-160" width="40" fill="#000" stroke="none"/>
 <text x="0" y="-145"><$text/></text>
 </tag:g>
 </x-loop>

 */

exports.tags = ["x-loop"];
exports.priority = 0;

var RX_RANGE2 = /(-?(\.\d+|\d+(\.\d+)?)):(-?(\.\d+|\d+(\.\d+)?))/;
var RX_RANGE3 = /(-?(\.\d+|\d+(\.\d+)?)):(-?(\.\d+|\d+(\.\d+)?)):(-?(\.\d+|\d+(\.\d+)?))/;


/**
 * Compile a node of the HTML tree.
 */
exports.compile = function(root, libs) {
    var N = libs.Tree,
    children = [],
    vars = [],
    seed,
    sep = ';',
    current;
    N.trimLeft(root);
    seed = JSON.stringify(root.children);
    // Parse attributes and find variables.
    N.forEachAttrib(root, function (key, val) {
        if (key == 'sep') {
            sep = val;
        }
        else if (key.substr(0, 1) == '$') {
            var variable = {name: key.substr(1), tmp: val};
            vars.push(variable);
        }
        else {
            libs.fatal("Unknown attribute in tag \"" + root.name + "\": \"" + key + "\"!");
        }
    });
    // Split the value and compute the number of iterations.
    // Each variable of the array `vars` is an object with these attributes:
    // * __name__: name of the variable (without the preceding `$`)
    // * __values__: array of the values of this variable.
    var iterationsCount = 0;
    vars.forEach(function (variable) {
        variable.values = [];
        var m = RX_RANGE3.exec(variable.tmp) || RX_RANGE2.exec(variable.tmp);
        if (m) {
            // This is a range.
            var start = parseFloat(m[1]);
            var end = parseFloat(m[4]);
            var step = m.length > 7 ? Math.abs(parseFloat(m[7])) : 1;

            if (end < start) {
                while (start >= end) {
                    variable.values.push(start);
                    start -= step;
                }
            } else {
                while (start <= end) {
                    variable.values.push(start);
                    start += step;
                }
            }
        } else {
            // Simple list, to split according to `sep`.
            variable.tmp.split(sep).forEach(function (v) {
                variable.values.push(v);
            });
        }
        delete variable.tmp;
        iterationsCount = Math.max(iterationsCount, variable.values.length);
    });
    if (vars.length == 0) {
        libs.fatal("<x-loop> needs at least one variable!\nVariables are attributes starting with a '$'.");
    }

    for (var i=0; i<iterationsCount; i++) {
        // Setting all variables in current scope.
        vars.forEach(function (variable) {
            libs.setVar(variable.name, variable.values[i % variable.values.length]);
        });
        // Adding a new child from the seed.
        current = JSON.parse(seed);
        current.forEach(function (child) {
            libs.compile(child);
        });
        children.push({children: current});
    }

    delete root.attribs;
    delete root.name;
    root.type = N.VOID;
    root.children = children;
};
