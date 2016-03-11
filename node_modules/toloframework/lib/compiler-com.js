var FS = require("fs");
var Libs = require("./compiler-com-libs");
var Path = require("path");
var Tree = require("./htmltree");
var Fatal = require("./fatal");
var Utils = require("./pathutils");
var Source = require("./source");

var Components = [];
var TagRegExps = [];

/**
 * Loading and sorting all components.
 */
exports.loadComponents = function(prj) {
    var pathes = [prj.srcPath("com")];
    prj.getExtraModulesPath().forEach(
        function(extraModulePath) {
            pathes.push(Path.join(extraModulePath, "com"));
        }
    );
    pathes.push(prj.libPath("com"));

    Components = [];
    TagRegExps = [];
    // Store  here all  found components  to prevent  from loading  them
    // twice  if there  are in  several folders.   The first  folder has
    // priority.
    var foundComponents = [];
    
    pathes.forEach(function (path) {
        var components = [];
        Utils.findFilesByExtension(path, ".com.js").forEach(function (comPath) {
            var name = Path.relative(path, comPath);
            var id = Path.basename(comPath);
            id = id.substr(0, id.length - 7);
            
            if (foundComponents.indexOf(name) > -1) {
                // Already loaded.
                return;
            }
            foundComponents.push(name);

            //console.log("com> ", comPath.bold);
            var com;
            try {
                com = require(comPath);
            }
            catch (ex) {
                Fatal.bubble(ex, comPath);
            }
            com.$ = { path: comPath, name: name, id: id };

            // Look for relative CSS file.
            var cssName = com.$.name.substr(0, com.$.name.length - 3) + ".css";
            var cssPath = prj.srcOrLibPath(Path.join("com", cssName));            
            if (FS.existsSync(cssPath)) {
                com.$.css = FS.readFileSync(cssPath).toString();
                //console.info("Component CSS: ", cssPath);
            }

            // Look for resource. In a folder with the name of the component.
            var resPath = comPath.substr(0, comPath.length - 3);
            if (FS.existsSync(resPath)) {
                com.$.res = Path.join('com', Path.relative(path, resPath));
            }

            if (typeof com.tags === 'undefined') {
                Fatal.fire(
                    "Missing the mandatory attribute \"tags\"!",
                    "Bad Component Definition",
                    comPath
                );
            }
            if (typeof com.priotity !== 'number') com.priotity = 0;
            if (typeof com.compile !== 'function') {
                Fatal.fire(
                    "Missing the mandatory function \"compile(root libs)\"!",
                    "Bad Component Definition",
                    comPath
                );
            }
            components.push(com);
        });
        components.sort(function(a, b) {
            return b.priotity - a.priotity;
        });
        components.forEach(function(item) {
            Components.push(item);
        });
    });
    // Precompile all regular expressions used to match the tag.
    Components.forEach(function (com) {
        var filters = com.tags;
        if (!Array.isArray(filters)) {
            filters = [filters];
        }
        var regexps = [];
        filters.forEach(function (filter) {
            try {
                var rx = new RegExp("^" + filter + "$", "i");
                regexps.push(rx);
            }
            catch (ex) {
                Fatal.fire(
                    "Bad regexp for component " + com.$.path + "\n" + ex,
                    "Tags was defined as " + JSON.stringify(com.tags)
                );
            }
        });
        TagRegExps.push(regexps);
    });
};


/**
 * @param {string} tagName Name of the HTML tag element.
 * @return {object|null} First component registered for this `tagName`.
 */
exports.getCompilerForTag = function(tagName) {
    var i, k, rx, regexps, component, cssFile;
    for (i = 0; i < Components.length; i++) {
        regexps = TagRegExps[i];
        for (k = 0; k < regexps.length; k++) {
            rx = regexps[k];
            if (rx.test(tagName)) {
                component = Components[i];
                return component;
            }
        }
    }
    return null;
};

/**
 * To be uptodate, an HTML page must be more recent that all its dependencies.
 */
function isHtmlFileUptodate(source) {
    var dependencies = source.tag("dependencies") || [];
    var i, dep, file, prj = source.prj(),
    stat,
    mtime = source.modificationTime();
    for (i = 0 ; i < dependencies.length ; i++) {
        dep = dependencies[i];
        file = prj.srcOrLibPath(dep);
        if (file) {
            stat = FS.statSync(file);
            if (stat.mtime > mtime) return false;
        }
    }
    return source.isUptodate();
}
