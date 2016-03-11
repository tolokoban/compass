/**
 * On ne documente que les exports.
 * 
 */

var TreeWalker = require("./tree-walker");
var UglifyJS = require("uglify-js");
var Markdown = require("./tfw-md");
var JSON = require("./tolojson");

var declarations = {};
var tw = new TreeWalker();
var lastComments = undefined;
var rxTag = /^[ \t]*@([a-zA-Z]+)[ \t]*/;
var rxParam = /^(\{[^\}]*\})?[ \t]*([\w$_][\w$_0-9\.]*)[ \t-]*/;

function removeCommentStart(line) {
    var n = line.length;
    var i = 0;
    while (i < n && line.charAt(i) <= ' ') i++;
    if (i >= n) return "";
    while (i < n && line.charAt(i) == '*') i++;
    if (i >= n) return "";
    if (line.charAt(i) == ' ') i++;
    return line.substr(i);
}

function comments(node) {
    var com = node.start.comments_before;
    if (!Array.isArray(com) || com.length == 0) return undefined;
    com = com[com.length - 1].value.trim();
    var lines = com.split("\n");
    var tags = {$summary: "", $full: ""};
    var tag = "$summary";
    var firstLine = true;
    lines.forEach(
        function(line) {
            line = removeCommentStart(line);
            if (firstLine) {
                if (line.length == 0) return;
                line = line.trim();
            }
            firstLine = false;
            var m = line.match(rxTag);
            var item;
            if (m) {
                line = line.substr(m[0].length);
                tag = "$" + m[1].toLowerCase();
                if (typeof tags[tag] === 'undefined') {
                    tags[tag] = [];
                }
                if (tag == '$param') {
                    m = line.match(rxParam);
                    item = {content: ""};
                    if (m) {
                        if (typeof m[1] === 'string') {
                            item.type = m[1].substr(1, m[1].length - 2).trim();
                        }
                        item.name = m[2].trim();
                        line = line.substr(m[0].length);
                    }
                    tags[tag].push(item);
                } else {
                    tags[tag].push("");
                }
            }
            if (tag == '$summary' && line.trim() == '') {
                // Fin du summary, on passe en full description.
                tags.$full = tags.$summary;
                tag = '$full';
            } else {
                line += "\n";
                item = tags[tag];
                if (typeof item === 'string') {
                    tags[tag] += line;
                }
                else if (Array.isArray(item)) {
                    var arr = item;
                    item = item[arr.length - 1];
                    if (typeof item === 'string') {
                        arr[arr.length - 1] += line;
                    }
                    else if (typeof item.content === 'string') {
                        item.content += line;
                    }
                }
            }
        }
    );
    if (Array.isArray(tags.$example)) {
        // Préparer les exemples pour un highlight Javascript.
        var i, example;
        for (i = 0 ; i < tags.$example.length ; i++) {
            example = tags.$example[i].trim();
            tags.$example[i] = "```js\n" + example + "\n```";
        }
    }
    var key, val;
    for (key in tags) {
        val = tags[key];
        if (typeof val === 'string') {
            tags[key] = Markdown.toHTML(val.trim());
        }
        else if (Array.isArray(val)) {
            val.forEach(
                function(itm, idx) {
                    if (typeof itm === 'string') {
                        val[idx] = Markdown.toHTML(itm.trim());
                    }
                    else if (typeof itm.content === 'string') {
                        itm.content = Markdown.toHTML(itm.content.trim());
                    }
                }
            );
        }
    }
    return tags;
}

function getArgs(node) {
    var args = [];
    var argnames = node.argnames;
    if (Array.isArray(argnames)) {
        argnames.forEach(
            function(arg) {
                args.push(arg.name);
            }
        );
    }
    return args;
}

function getFunction(node) {
    var name = node.name;
    var com = comments(node);
    if (typeof com === 'undefined' || com.length == 0) {
        com = lastComments;
    }
    return {
        TYPE: "Function",
        name: name,
        comments: com,
        args: getArgs(node)
    };
}

function parseFunction(node) {
    var obj = getFunction(node.value);
    declarations[node.name.name] = obj;
}

function parseMethod(node) {
    var name = node.body.left.expression.expression.name;
    var dec = declarations[name];
    if (dec) {
        dec.TYPE = "Class";
        if (typeof dec.methods !== 'object') {
            dec.methods = {};
        }
        var method = node.body.left.property;
        dec.methods[method] = {
            comments: comments(node),
            args: getArgs(node.body.right)
        };
    }
}

function parseVar(tree) {
    var actions = {
        "[VarDef]value/[Function]": parseFunction
    };
    tree.definitions.forEach(
        function(node) {
            tw.action(node, actions);
        }
    );
}

function parseModuleExports(node) {
    var exports = {
        comments: comments(node) || lastComments
    };
    declarations.exports = exports;
    var right = node.body.right;
    if (right.TYPE == "SymbolRef") {
        exports.value = declarations[right.name];
        return;
    }
}

function parseExportsAtt(node) {
    if (typeof declarations.exports !== 'object'
        || declarations.exports.TYPE != 'Object')
    {
        declarations.exports = {
            TYPE: "Object",
            attributes: {}
        };
    }
    var name = node.body.left.property;
    var exports = {
        comments: comments(node),
        value: undefined
    };
    declarations.exports.attributes[name] = exports;
    var right = node.body.right;
    if (right.TYPE == "SymbolRef") {
        exports.value = declarations[right.name];
        return;
    }
    if (right.TYPE == "Function") {
        exports.value = {
            TYPE: "Function",
            args: getArgs(right)
        };
    }
}

function parseAttribute(node) {
    var objName = node.body.left.expression.name;
    var attName = node.body.left.property;
    var f = node.body.right;
    if (f.TYPE == 'Function') {
        var dec = declarations[objName];
        if (typeof dec.statics !== 'object') {
            dec.statics = {};
        }
        dec.statics[attName] = getFunction(f);
        if (typeof dec.statics[attName].comments !== 'object') {
            var com = comments(node) || lastComments;
            dec.statics[attName].comments = com;
        }
    }
}

module.exports = function(code) {
    declarations = {};
    var tree = UglifyJS.parse(code);
    var items = tree.body;
    var actions = {
        "[Var]definitions": parseVar,
        "[SimpleStatement]body/[Assign]left/[Dot]expression/[Dot][property=prototype]": parseMethod,
        "[SimpleStatement]body/[Assign][operator==]left/[Dot][property=exports]expression/[SymbolRef][name=module]": parseModuleExports,
        "[SimpleStatement]body/[Assign][operator==]left/[Dot]expression/[name=exports]": parseExportsAtt,
        "[SimpleStatement]body/[Assign][operator==]left/[Dot]expression/[SymbolRef]": parseAttribute
    };
    items.forEach( function(node) { 
        lastComments = comments(node);
        tw.action(node, actions); 
    } );
    return {
        exports: declarations.exports
    };
};
