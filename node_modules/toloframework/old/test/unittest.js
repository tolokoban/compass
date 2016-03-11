/**
 * Unit test.
 */
require("colors");

var FS = require("fs");
var Path = require("path");

function pad(txt, size) {
    if (typeof size === 'undefined') size = 70;

    while (txt.length < size) {
        txt += ".";
    }
    return txt;
}


var Runtime = function() {};

/**
 * 
 */
Runtime.prototype.assert = function(input, expected, result) {
    var expectedRaw = JSON.stringify(expected);
    var resultRaw = JSON.stringify(result);
    if (expectedRaw !== resultRaw) {
        throw {
            type: "assert",
            expected: expected,
            result: result,
            msg: "    Input:    " + input.yellow.bold + "\n"
            + "    Expected: " + expectedRaw.yellow + "\n"
            + "    Result:   " + resultRaw.yellow
        };
    }
};

/**
 * 
 */
Runtime.prototype.assertOneArg = function(func, cases) {
    cases.forEach(
        function(item) {
            var input = item[0];
            var expected = item[1];
            this.assert(input, expected, func(input));
        }, this
    );
};

/**
 * Test equality of two variables `a` and `b`.
 */
Runtime.prototype.areEqual = function(a, b) {
    var i, key;

    if (typeof a != typeof b) return false;
    switch (typeof a) {
    case 'object':
        var isArrA = Array.isArray(a);
        var isArrB = Array.isArray(b);
        if (isArrA != !isArrB) return false;
        if (isArrA) {
            if (a.length != b.length) return false;
            for (i = 0 ; i < a.length ; i++) {
                if (!this.areEqual(a[i], b[i])) return false;
            }
        } else {
            for (key in a) {
                if (!this.areEqual(a[key], b[key])) return false;
            }
            for (key in b) {
                if (b[key] === undefined) continue;
                if (a[key] === undefined) return false;
            }
        }
    default:
        return a === b;
    }
    return true;
};

var casesPath = Path.join(Path.dirname(module.filename), "cases");
if (FS.existsSync(casesPath)) {
    var files = FS.readdirSync(casesPath);
    var runtime = new Runtime();
    files.forEach(
        function(filename) {
            if (Path.extname(filename) == '.js') {
                console.log(filename.substr(0, filename.length - 3).bold);
                var unit = require(Path.join(casesPath, filename));
                var key, fct, txt;
                for (key in unit) {
                    fct = unit[key];
                    if (typeof fct !== 'function') continue;
                    txt = pad("  " + key.replace(/_/g, ' '));
                    try {
                        fct.call(runtime);
                        txt += "OK.".green.bold;
                    } catch (x) {
                        switch (x.type) {
                        case 'assert':
                            txt += "Assert!".red.bold + "\n" + x.msg;
                            break;
                        default:
                            txt += "Exception!".red.bold + "\n" + JSON.stringify(x);
                            console.log(txt);
                            throw x;
                        }
                    }
                    console.log(txt);
                }
            }
        }
    );    
} else {
    console.log("Please make the 'cases' directory and put the unit test modules in it.");
}
