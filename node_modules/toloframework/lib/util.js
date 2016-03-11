/**
 * @module util
 */

var PathUtils = require("./pathutils");
var UglifyJS = require("uglify-js");
var Less = require("less");
var Path = require("path");
var FS = require("fs");

/**
 * @param {string} js Script you want to zip.
 * @return zipped script.
 */
exports.zipJS = function(js) {
    try {
        return UglifyJS.minify(js, {fromString: true}).code;
    } catch (x) {
        throwUglifyJSException(js, x);
    }
};

/**
 * Apply LESS expansion on CSS content.
 * @param {string} name name used for error reporting.
 * @param {string} content CSS content with LESS syntax.
 * @param {bool} compression if `true`, the result must be compressed.
 * @return CSS after compilation.
 */
exports.lessCSS = function(name, content, compression) {
    var options = {
        paths         : ["."],            // .less file search paths
        outputDir     : ".",              // output directory, note the '/'
        optimization  : 9,                // optimization level
        filename      : name,             // root .less file
        compress      : compression,      // compress?
        yuicompress   : compression       // use YUI compressor?
    };
    var result = "";
    var parser = new Less.Parser(options);
    parser.parse(
        content,
        function ( error, cssTree ) {
            if ( error ) {
                Less.writeError( error, options );
                return;
            }

            // Create the CSS from the cssTree
            var cssString = cssTree.toCSS( {
                compress   : options.compress,
                yuicompress: options.yuicompress
            } );

            result = cssString;
        }
    );
    return result;
};

/**
 * Return a copy of an array after removing all doubles.
 * @param {array} arrInput array of any comparable object.
 */
exports.removeDoubles = function(arrInput) {
    var arrOutput = [];
    var map = {};
    arrInput.forEach(
        function(itm) {
            if (itm in map) return;
            map[itm] = 1;
            arrOutput.push(itm);
        }
    );
    return arrOutput;
};

/**
 * Remove all files and directories found in `path`, but not `path` itself.
 */
exports.cleanDir = function(path, preserveGit) {
    if (typeof preserveGit === 'undefined') preserveGit = false;
    path = Path.resolve(path);
    
    if (preserveGit) {
        // We must delete the content of this folder but preserve `.git`.
        // The `www` dir, for instance, can be use as a `gh-pages` branch.
        var files = FS.readdirSync(path);
        files.forEach(function (filename) {
            if (filename == '.git') return;
            var filepath = Path.join(path, filename);
            var stat = FS.statSync(filepath);
            if (stat.isDirectory()) {
                PathUtils.rmdir(filepath);
            } else {
                FS.unlink(filepath);
            }
        });
    } else {
        // Brutal clean: remove dir and recreate it.
        PathUtils.rmdir(path);
        PathUtils.mkdir(path);
    }
};

/**
 * @class Dependencies
 */
var Resources = function(data){
    this.clear();
    this.data(data);
};

/**
 * Set/Get the list of dependencies.
 */
Resources.prototype.data = function(data) {
    if (typeof data === 'undefined') {
        var copy = [];
        this._data.forEach(
            function(itm) {
                copy.push(itm);
            }
        );
        return copy;
    }
    this.clear();
    if (Array.isArray(data)) {
        data.forEach(
            function(itm) {
                this.add(itm);
            }, this
        );
    }
};

/**
 * Remove all the dependencies.
 */
Resources.prototype.clear = function() {
    this._data = [];
    this._map = {};
};

/**
 * Add a dependency.
 * @param {string/array} item As an array, it is the couple `[source, destination]`.
 * If the `source` is the same as the `destination`, just pass one string.
 */
Resources.prototype.add = function(item) {
    var key = item;
    if (Array.isArray(item)) {
        key = item[0];
    }
    if (this._map[key]) return;
    this._map[key] = 1;
    this._data.push(item);
};

/**
 * Loop on the dependencies.
 */
Resources.prototype.forEach = function(f, that) {
    this._data.forEach(
        function(itm, idx, arr) {
            f(itm, idx, arr);
        }, that
    );
};


exports.Resources = Resources;


function throwUglifyJSException(js, ex) {
    var msg = ex.message + "\n";
    msg += "  line: " + ex.line + "\n";
    msg += "  col.: " + ex.col + "\n";
    msg += "----------------------------------------"
        + "----------------------------------------\n";
    var content = js;
    var lines = content.split("\n"),
    lineIndex, indent = '',
    min = Math.max(0, ex.line - 1 - 2),
    max = ex.line;
    for (lineIndex = min ; lineIndex < max ; lineIndex++) {
        msg += lines[lineIndex].trimRight() + "\n";
    }
    for (lineIndex = 0 ; lineIndex < ex.col ; lineIndex++) {
        indent += ' ';
    }
    msg += "\n" + indent + "^\n";
    throw {
        fatal: msg,
        src: "util.zipJS"
    };
}
