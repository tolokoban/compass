/**
 * @module compile-html
 */

var FS = require("fs");
var Path = require("path");
var Source = require("./source");
var Tree = require("./htmltree");
var Util = require("./util");
var CompilerJS = require("./compiler-js");
var CompilerCSS = require("./compiler-css");
var Template = require("./template");


/**
 * Compile an HTML file if it is not uptodate.
 * @param {Project} prj Project object.
 * @param {string} filename name of the HTML file without the full path.
 * @see project~Project
 */
module.exports.compile = function(prj, filename) {
    var source = new Source(prj, filename);

    if (!isHtmlFileUptodate(source)) {
        console.log("Compiling " + filename.yellow);
        var root = Tree.parse(source.read());
        source.tag("resources", []);
        source.tag("dependencies", []);
        lookForStaticJavascriptAndStyle(root, source);
        expandWidgets(root, source);
        initControllers(root, source);
        zipInnerScriptsAndStyles(root, source);
        cleanupTreeAndStoreItInTag(root, source);
        var resources = new Util.Resources(source.tag("resources"));
        source.tag("resources", resources.data());
    }
    compileDependantScripts(root, source);
    compileDependantStyles(root, source);
    source.tag("dependencies", Util.removeDoubles(source.tag("dependencies")));
    source.tag("innerMapCSS", null);
    source.save();
    return source;
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

/**
 * Remove all `extra` properties in the tree and store it in tag __`tree`__.
 */
function cleanupTreeAndStoreItInTag(root, source) {
    Tree.walk(
        root,
        function(node) {
            delete node.extra;
            if (node.children && node.children.length == 0) {
                delete node.children;
            }
            if (node.attribs) {
                var count = 0, key;
                for (key in node.attribs) {
                    count++;
                }
                if (count == 0) {
                    delete node.attribs;
                }
            }
        }
    );
    source.tag("tree", root);
}

/**
 * Work on following tags:
 * ```
 * <script src="foo.js"></script>
 * <script>Hello world!</script>
 * <link href="mystyle.css" rel="stylesheet" type="text/css" />
 * <style>body {background: orange;}</style>
 * ```
 */
function lookForStaticJavascriptAndStyle(root, source) {
    var innerJS = "";
    var innerCSS = "";
    var outerJS = [];
    var outerCSS = [];
    source.tag("outerJS", outerJS);
    source.tag("outerCSS", outerCSS);
    Tree.walk(
        root,
        null,
        function(node, parent) {
            if (node.type !== Tree.TAG) return;
            var src;
            switch (node.name) {
                case "script":
                    src = Tree.att(node, "src");
                    if (typeof src === 'string' && src.length > 0) {
                        // outer script.
                        if (src.substr(0, 5) != "http:" && src.substr(0, 6) != "https:") {
                            outerJS.push(src);
                            Tree.removeChild(parent, node);
                        } else {
                            console.log("Remote Javascript dependence: " + src.magenta);
                        }
                    } else {
                        // Inner script.
                        innerJS += Tree.text(node).trim() + "\n";
                        Tree.removeChild(parent, node);
                    }
                    break;
                case "style":
                    innerCSS += Tree.text(root);
                Tree.removeChild(parent, node);
                    break;
                case "link":
                    if (Tree.att("rel") && Tree.att("rel").toLowerCase() == "stylesheet") {
                        src = Tree.att("href").trim();
                        if (typeof src === 'string' && src.length > 0) {
                            outerCSS.push(src);
                        }
                    }
                    break;
            }
        }
    );
    source.tag("innerJS", innerJS);
    source.tag("innerCSS", innerCSS);
}

/**
 * All elements  with the namespace `w:`  are widgets. If the  HTML file
 * contains, for instance,  the widgets `<w:foo>` and  `<w:bar>`, we put
 * `["wdg/foo/compile-foo.js",  "wdg/bar/compile-bar.js"]` into  the tag
 * __`dependencies`__.
 *
 * Then we eventually add the content of `root.extra.css` to the tag __`innerCSS`__.
 */
function expandWidgets(root, source) {
    var prj = source.prj();
    var availableWidgets = prj.getAvailableWidgetCompilers();
    Tree.walk(
        root,
        null,
        // Top-down.
        function (node, parent) {
            if (node.type === Tree.TAG) {
                if (node.name.substr(0, 2) == 'w:') {
                    var widgetName = node.name.substr(2).toLowerCase();
                    var widget = availableWidgets[widgetName];
                    if (!widget) {
                        prj.fatal(
                            "Unknown widget: \"" + widgetName + "\"!",
                            prj.ERR_WIDGET_NOT_FOUND
                        );
                    }
                    precompileWidget(node, source, widget);
                }
            }
        }
    );

    Tree.normalizeChildren(root, true);

    Tree.walk(
        root,
        // Bottom-up.
        function (node, parent) {
            if (node.type === Tree.TAG) {
                if (node.name.substr(0, 2) == 'w:') {
                    var widgetName = node.name.substr(2).toLowerCase();
                    var widget = availableWidgets[widgetName];
                    if (!widget) {
                        prj.fatal(
                            "Unknown widget: \"" + widgetName + "\"!",
                            prj.ERR_WIDGET_NOT_FOUND
                        );
                    }
                    compileWidget(node, source, widget);
                }
            }
        }
    );
}

/**
 * Compile the widget.
 */
function precompileWidget(root, source, widget) {
    try {
        genericCompileWidget(root, source, widget, "precompile");
    }
    catch (ex) {
        console.log(
            (
                "Fatal error during widget's precompilation:\n" 
                    + Path.join(
                        widget.path,
                        "/compile-" + widget.name + ".js"
                    )
            ).err()
        );
        throw ex;
    }
}

/**
 * Compile the widget.
 */
function compileWidget(root, source, widget) {
    try {
        genericCompileWidget(root, source, widget, "compile");
    }
    catch (ex) {
        console.log(
            (
                "Fatal error during widget's compilation:\n" 
                    + Path.join(
                        widget.path,
                        "/compile-" + widget.name + ".js"
                    )
            ).err()
        );
        throw ex;
    }
}

function genericCompileWidget(root, source, widget, functionName) {
    if (typeof root.name !== 'string') return;
    if (root.name.substr(0, 2) != "w:") return;
    var prj = source.prj();
    var dependencies = source.tag("dependencies");
    var resources = source.tag("resources");
    var outerJS = source.tag("outerJS");
    var innerCSS = source.tag("innerCSS");
    var innerMapCSS = source.tag("innerMapCSS") || {};
    if (functionName === 'compile') {
        // We change the tag name only on Bottom-Up traversal.
        root.name = "div";
    }
    Tree.addClass(root, "custom wtag-" + widget.name);
    root.extra = {dependencies: [], resources: []};
    var id = Tree.att(root, "id") || Tree.nextId();
    Tree.att(root, "id", id);
    root.extra.init = {id: id};
    var controller = "wtag." + widget.name.substr(0, 1).toUpperCase()
        + widget.name.substr(1).toLowerCase();
    if (prj.srcOrLibPath("mod/" + controller + ".js")) {
        root.extra.controller = controller;
        outerJS.push("mod/" + controller + ".js");
        outerJS.push("require.js");
    }
    // Looking for extra CSS.
    FS.readdirSync(widget.path).forEach(
        function(filename) {
            if (Path.extname(filename) !== '.css') return;
            if (filename.substr(0, widget.name.length + 1) !== widget.name + "-") return;
            var file = Path.resolve(Path.join(widget.path, filename));
            if (file in innerMapCSS) return;
            innerMapCSS[file] = 1;
            var content = FS.readFileSync(file).toString();
            console.log("inner CSS: " + filename.yellow);
            innerCSS += Util.lessCSS(file, content, false);
            dependencies.push("wdg/" + widget.name + "/" + filename);
        }
    );
    // Compilation.
    var compiler = widget.compiler;
    if (compiler && typeof compiler[functionName] === 'function') {
        // There is a transformer: we will call it.
        try {
            compiler[functionName].call(prj, root);
            dependencies.push("wdg/" + widget.name + "/compile-" + widget.name + ".js");
            root.extra.resources.forEach(
                function(itm) {
                    resources.push(itm);
                }
            );
            root.extra.dependencies.forEach(
                function(itm) {
                    dependencies.push(itm);
                }
            );
            if (typeof root.extra.innerCSS === 'string') {
                if (innerCSS.indexOf(root.extra.innerCSS) < 0) {
                    innerCSS += root.extra.innerCSS;
                }
            }
            if (typeof root.extra.css === 'string') {
                if (innerCSS.indexOf(root.extra.css) < 0) {
                    innerCSS += root.extra.css;
                }
            }
        }
        catch (ex) {
            if (ex.fatal) {
                throw ex;
            } else {
                prj.fatal(
                    "" + ex,
                    prj.ERR_WIDGET_TRANSFORMER,
                    widget.path
                );
            }
        }
    }
    source.tag("innerCSS", innerCSS);
    source.tag("innerMapCSS", innerMapCSS);

    if (functionName == 'compile') {
        // For Bottom-Up traversal, we have to check if another pass is needed or not.
        var deepness = 64;
        var nextNodeToCompile;
        var currentWidgetName;
        var currentWidget;
        var availableWidgets = prj.getAvailableWidgetCompilers();
        while (null != (nextNodeToCompile = needsWidgetCompilation(root))) {
            expandWidgets(nextNodeToCompile, source);
            deepness--;
            if (deepness < 1) {
                prj.fatal(
                    "Too much recursions for widget \"" + widget.name + "\"!",
                    prj.ERR_WIDGET_TOO_DEEP,
                    widget.path
                );
            }
        }
    }
}

/**
 * @return the first node with the namespace `w:`, or null.
 */
function needsWidgetCompilation(root) {
    if (root.type == Tree.TAG && root.name && root.name.substr(0, 2) == 'w:') {
        return root;
    }
    if (!root.children) return null;
    var i, node, result;
    for (i = 0 ; i < root.children.length ; i++) {
        node = root.children[i];
        result = needsWidgetCompilation(node);
        if (result) return result;
    }
    return null;
}

/**
 * Initialize controllers by adding script in the __`innerJS`__ tag.
 */
function initControllers(root, source) {
    var innerJS = source.tag("innerJS")
        + "function addListener(e,l){"
        + "if(window.addEventListener){\n"
        + "window.addEventListener(e,l,false)}else{\n"
        + "window.attachEvent('on' + e, l)}}"
        + "\naddListener('DOMContentLoaded',\n"
        + "    function() {\n"
        + "        document.body.parentNode.$data = {};\n"
        + "        // Attach controllers.\n";
    var outerJS = source.tag("outerJS") || [];
    var extraCSS = "";
    var app = null;
    // Add core JS for application config and internationalisation.
    outerJS.push("mod/$.js");
    Tree.walk(
        root,
        function(node) {
            if (node.name == "body" && node.attribs && node.attribs.app) {
                app = node.attribs.app;
                outerJS.push("mod/" + app + ".js");
                outerJS.push("require.js");
                delete node.attribs.app;
            }
            var item = node.extra;
            if (!item) return;
            if (item.controller) {
                var ctrlFilename = "mod/" + item.controller + ".js";
                innerJS += "        require('" + item.controller.toLowerCase() + "')(";
                if (typeof item.init === 'object') {
                    innerJS += "{";
                    var sep = '', key, val;
                    for (key in item.init) {
                        val = item.init[key];
                        if (typeof val === 'string' && val.substr(0, 9) == 'function(') {
                            // This is a function: we don't want to stringify it.
                        } else {
                            val = JSON.stringify(val);
                        }
                        innerJS += sep;
                        sep = ', ';
                        innerJS += key + ": " + val;
                    }
                    innerJS += "}";
                }
                innerJS += ");\n";
            }
            if (item.css) {
                extraCSS += item.css;
            }
        }
    );
    if (app) {
        innerJS += "        window.APP = require('" + app + "')\n"
            + "        if (typeof APP.start === 'function') "
            + "setTimeout(APP.start);";
    }
    innerJS += "    }\n);\n";
    source.tag("innerJS", innerJS);
    source.tag("outerJS", outerJS);
}

/**
 * Look for all TEXT nodes and eventually replace double curlies.
 */
function expandDoubleCurlies(root, source) {
    Tree.walk(
        root,
        null,
        // Top-Down walk for databindings.
        function(node)  {
            if (node.type !== Tree.TEXT) return;
            if (typeof node.text !== 'string') return;
            var text = node.text;
            if (text.trim().length == 0) return;
            expandDoubleCurliesInTextNode(node);
        }
    );
}

/**
 * Write tags __`zipJS`__ and __`zipCSS`__.
 */
function zipInnerScriptsAndStyles(root, source) {
    source.tag("zipJS", Util.zipJS(source.tag("innerJS")));
    source.tag("outerJS", Util.removeDoubles(source.tag("outerJS")));
    source.tag("outerCSS", Util.removeDoubles(source.tag("outerCSS")));
}

/**
 * Compile dependant JS scripts in cascade.
 */
function compileDependantScripts(root, source) {
    var needed = {};
    var jobs = [];
    var prj = source.prj();
    var file;
    source.tag("outerJS").forEach(
        function(file) {
            jobs.push(file);
        }
    );
    while (jobs.length > 0) {
        file = jobs.pop();
        if (file in needed) continue;
        var srcJS = source.create(file);
        try {
            CompilerJS.compile(srcJS);
            needed[file] = srcJS;
            srcJS.tag("needs").forEach(
                function(item) {
                    jobs.push(item);
                }
            );
        }
        catch (ex) {
            if (ex.fatal) {
                throw ex;
            } else {
                throw ex;

                prj.fatal(ex, -1, file);
            }
        }
    }

    // Save __`linkJS`__ tag.
    var linkJS = [], key;
    for (key in needed) {
        linkJS.push(key);
    }
    source.tag("linkJS", Util.removeDoubles(linkJS));
}

/**
 * Compile dependant CSS styles in cascade.
 */
function compileDependantStyles(root, source) {
    var needed = {};
    var jobs = [];
    var prj = source.prj();
    var file;
    // Add CSS from JS classes.
    source.tag("linkJS").forEach(
        function(item) {
            var srcJS = source.create(item);
            var css = srcJS.tag("css");
            if (css) {
                jobs.push(css);
            }
        }
    );
    // Add
    source.tag("outerCSS").forEach(
        function(file) {
            jobs.push(file);
        }
    );
    while (jobs.length > 0) {
        file = jobs.pop();
        if (file in needed) continue;
        var srcCSS = source.create(file);
        try {
            CompilerCSS.compile(srcCSS);
            needed[file] = srcCSS;
        }
        catch (ex) {
            prj.fatal(ex, -1, file);
        }
    }

    // Save __`linkCSS`__ tag.
    var linkCSS = [], key;
    for (key in needed) {
        linkCSS.push(key);
    }
    source.tag("linkCSS", Util.removeDoubles(linkCSS));
}
