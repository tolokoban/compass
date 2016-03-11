/**
 * Component x-widget
 */
exports.tags = ["x-widget"];
exports.priority = 0;

var ID = 0;

/**
 * Compile a node of the HTML tree.
 */
exports.compile = function(root, libs) {
    var name = root.attribs.name;
    if (!name || name.length == 0) {
        libs.fatal("[x-widget] Missing attribute \"name\"!");
    }
    var id = root.attribs.id || (name + ID++);
    var src = (root.attribs.src || "").trim();
    root.attribs = {
        id: id,
        style: "display:none"
    };
    var args = null;
    if (src.length > 0) {
        if (!libs.fileExists(src)) {
            libs.fatal("File not found: \"" + src + "\"!");
        }
        libs.addInclude(src);
        args = libs.readFileContent(src);
    }
    if (!args) {
        args = libs.Tree.text(root).trim();
    }
    if (args.charAt(0) != '{' && args.charAt(0) != '[') {
        try {
            args = JSON.parse(args);
        }
        catch (ex) {
            // This is a string.
            args = JSON.stringify(args);
        }
    }
    root.children = [];
    root.name = "div";
    delete root.autoclose;

    libs.require(name);
    libs.require("x-widget");
    libs.addInitJS(
        "try{"
        + "require('x-widget')('" + id + "','" + name + "'," + args + ")"
        + "}catch(x){console.error('Unable to initialize " + name + "!', x)}"
    );
};
