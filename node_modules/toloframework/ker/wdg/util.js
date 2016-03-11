/**
 * @module util
 */

var FS = require("fs");
var Tree = require("../../lib/htmltree");

/**
 * Split a text on semicolons (or `separatorChar`).
 * Semicolons with a preceding anti-slash or included in a string are not separators.
 * @example
 * splitter("a ; b;c  ;d") == ["a", "b", "c", "d"]
 * splitter("a \; b ; c") == ["a ; b", "c"]
 * splitter("'a;b';c) == ["'a;b'", "c"]
 */
exports.splitter = function(text, separatorChar) {
    if (typeof separatorChar === 'undefined') separatorChar = ';';

    var arr = [],
    i, c, 
    // 1: Out of any string
    // 2: In single quoted string.
    // 3: In double quotes string.
    // -1, -2, -3: After backslash.
    mode = 1,
    last = 0;
    for (i = 0 ; i < text.length ; i++) {
        c = text.charAt(i);
        switch (mode) {
            case 1:
                switch (c) {
                    case "\\":
                        mode = -mode; break;
                    case "'":
                        mode = 2; break;
                    case '"':
                        mode = 3; break;
                    case separatorChar:
                        arr.push(text.substr(last, i - last).trim());
                        last = i + 1;
                        mode = 1;
                        break;
                }
                break;
            case 2:
                switch (c) {
                    case "'":
                        mode = 1; break;
                    case "\\":
                        mode = -mode; break;
                }
                break;
            case 3:
                switch (c) {
                    case '"':
                        mode = 1; break;
                    case "\\":
                        mode = -mode; break;
                }
                break;
            default:
                mode = -mode;
        }
    }
    var buff = text.substr(last).trim();
    if (buff.length > 0) {
        arr.push(buff.trim());
    }
    return arr;
}

/**
 * @example
 * <w:foo fire="$score:{score + 1} ; $success:{score > 10} ; page:next"></w:foo>
 * <w:foo fire="{score + 1} ; {score > 10} ; next"
 *        fire-arg="{score + 1} ; {score > 10} ; next"></w:foo>
 */
exports.fireable = function(obj, root) {
    var attFire = Tree.att(root, "fire");
    var attFireArg = Tree.att(root, "fire-arg");
    if (attFire) {
        var fire = exports.splitter(attFire);
        var fireArg;
        if (attFireArg) {
            fireArg = splitter(attFireArg);
            if (fire.length != fireArg.length) {
                throw "Attribute \"fire\" and \"fire-arg\" are both list, "
                    + "but without the same number of items!";
            }
        } else {
            var i, item, pos, sig, arg;
            fireArg = [];
            for (i = 0 ; i < fire.length ; i++) {
                item = fire[i];
                pos = item.indexOf(":");
                if (pos > -1) {
                    sig = item.substr(0, pos);
                    arg = item.substr(pos + 1);
                    fire[i] = sig;
                } else {
                    arg = "";
                }
                fireArg.push(arg);
            }
        }
        delete root.attribs.fire;
        delete root.attribs["fire-arg"];
        root.extra.init.fire = fire;
        root.extra.init.fireArg = fireArg;
    }
};

/**
 * Compile  a  binding  expression  whose code  is  owned  by  attribute
 * `attributeName`.   As soon  as  this expression  changed, the  method
 * `attributeName` of the controller is called with the current value of
 * this expression.
 * @param {object} prj Project's object.
 * @param {object}  root Tree  node with an  attribute woning  a binding
 * expression.
 * @param {string} attributeName Name of  the attribute of the widget to
 * link with the same attribute in the controller.  
 * If  this  `attributeName` is  `null`  or  `undefined`, the  textual
 * content  of `root`  is  read and  the attribute  `val`  is used  in
 * controller. This is used by widget <w:Bind>, for example.
 * @param {string} typeFilter  [optional] Name of a  function with one
 * argument used to wrap the resulting expression.
 */
exports.bindable = function(prj, root, attributeName, typeFilter) {
    var att;
    if (!attributeName) {
        att = prj.Tree.text(root).trim();
        attributeName = "val";
    } else {
        att = prj.Tree.att(root, attributeName);
    }
    if (att !== undefined) {
        delete root.attribs[attributeName];
        var result = exports.parseBindingExpression(att);
        var code = result.code;
        if (typeof typeFilter === 'string') {
            code = typeFilter + "(" + code + ")";
        }
        root.extra.init["G$" + attributeName] = "function(){with(this){return " + result.code + "}}";
        root.extra.init["V$" + attributeName] = result.vars;
    }
};

/**
 * Turn an element into a template one. A template is an element you can clone at runtime.
 * @return javascript code of the anonymous creation function.
 * This function has two argument :
 * * __tpl__: ID of the template element or an DOM element.
 * * __id__: ID of the cloned element.
 */
exports.templatize = function(root) {
    var code = "id+='.';";

    Tree.walk(
        root,
        function(node) {
            if (!node.extra) return;
            var x = node.extra;
            if (!x.controller) return;
            var id = x.init.id;
            delete x.init.id;
            code += "$$('" + x.controller + "',{id:id+" + id;
            var key, val;
            for (key in x.init) {
                val = x.init[key];
                code += "," + key + ":" + JSON.stringify(val);
            }

            code += "});\n";
            delete node.extra;
        }
    );
    code = "function(tpl,id){" + code + "}";
    return code;
};


function defaultConverter(txt) {
    return txt;
}

/**
 * Remove an attribute from the DOM element and copy it to the controller attributes.
 * @param root htmlnode in which you want to move an attribute.
 * @param att name of the attribute.
 * @param converter
 * [optional] function that takes the attribute value as input and returns the value for the controller.
 * By default, we return the same string.
 */
exports.moveAttrib = function(root, att, converter) {
    if (!root.attribs) return undefined;
    if (!root.attribs[att]) return undefined;
    if (typeof converter !== 'function') converter = defaultConverter;
    var v = converter(root.attribs[att]);
    root.extra.init[att] = v;
    delete root.attribs[att];
    return v;
};


/**
 * Get size and type from a PNG, JPG, GIF or BMP file.
 * @return an object with three attributes:
 * * __type__: "PNG", "JPG" or "GIF".
 * * __width__: width in pixels.
 * * __height__: height in pixels.
 * @example
 * Util.getImageInfo("logo.png") == {type: "PNG", width: 320, height: 240}
 */
exports.getImageInfo = function(file) {
    var info = {type: null, width: 0, height: 0};
    if (FS.existsSync(file)) {
        var BUFF_SIZE = 24;
        var buffer = new Buffer(BUFF_SIZE);
        var fd = FS.openSync(file, "r");
        var header = FS.readSync(fd, buffer, 0, BUFF_SIZE, 0);
        FS.close(fd);
        if (buffer[1] == 80 && buffer[2] == 78 && buffer[3] == 71
            && buffer[4] == 13 && buffer[5] == 10
            && buffer[6] == 26 && buffer[7] == 10)
        {
            // This is a PNG file: http://www.w3.org/TR/PNG/
            info.type = 'PNG';
            if (buffer[12] == 0x49 && buffer[13] == 0x48 && buffer[14] == 0x44 && buffer[15] == 0x52) {
                info.width = (buffer[16] * 256 * 256 * 256) + (buffer[17] * 256 * 256)
                    + (buffer[18] * 256) + buffer[19];
                info.height = (buffer[20] * 256 * 256 * 256) + (buffer[21] * 256 * 256)
                    + (buffer[22] * 256) + buffer[23];
            }
        }
        if (buffer[0] == 0x47 && buffer[1] == 0x49 && buffer[2] == 0x46) {
            // This is a GIF file: http://www.w3.org/Graphics/GIF/spec-gif89a.txt
            info.type = "GIF";
            info.width = (buffer[7] * 256) + buffer[6];
            info.height = (buffer[9] * 256) + buffer[8];
            return info;
        }
        if (buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF && buffer[3] == 0xE0) {
            // This is a JPG file:
            info.type = "JPG";
            var size = buffer[4] * 256 + buffer[5];
            var idx = 4 + size;
            var jpegType;
            while (1) {
                //buffer = new Buffer(BUFF_SIZE);
                fd = FS.openSync(file, "r");
                header = FS.readSync(fd, buffer, 0, BUFF_SIZE, idx);
                FS.close(fd);
                if (header == 0) {
                    throw {fatal: "Unable to find JPEG dimension: " + file};
                }
                if (buffer[0] != 0xFF) {
                    throw {fatal: "Invalid JPEG format: " + file};
                }
                jpegType = buffer[1];
                if (jpegType == 0xC2 || jpegType == 0xC0) {
                    info.height = buffer[5] * 256 + buffer[6];
                    info.width = buffer[7] * 256 + buffer[8];
                    return info;
                }
                size = buffer[2] * 256 + buffer[3];
                idx += 2 + size;
            }
        }
    }
    return info;
};


/**
 * @return array with numerical part and textual unit.
 * @example
 * unit(".5rem") == [.5, "rem"]
 */
exports.unit = function(value) {
    value = ("" + value).trim();
    var idx, c, u;
    for (idx = 0 ; idx < value.length ; idx++) {
        c = value.charAt(idx);
        if ((c >= '0' && c <= '9') || c == '.' || c == '-') {
            continue;
        }
        u = value.substr(idx).trim();
        if (u.length == 0) u = "px";
        return [parseFloat(value.substr(0, idx)), u];
    }
    return [parseFloat(value), "px"];
};


/**
 * A data binding expression is a simple language to test content of data.
 * @example
 * foo
 * foo = 7
 * foo == 7
 * foo != 7
 * foo == bar
 * foo + bar
 * foo == 'bar'
 * (width > 100) && (width < 100)
 * @result {object} object with two attributes:
 * * `code`: code of the getter.
 * * `vars`: array of needed binded data.
 */
exports.parseBindingExpression = function(code) {
    var tokens = exports.tokenize(code);
    var tree;
    try {
        var checker = new SemanticChecker(tokens);
        tree = checker.tree();
    } catch (x) {
        if (!Array.isArray(x)) {
            // For real coding exceptions in `util.js`.
            throw x;
        }
        var err = x[1].bold + "\n\n" + code + "\n";
        var i, tkn = tokens[x[0]];
        if (tkn) {
            for (i = 0 ; i < tkn[2] ; i++) {
                err += " ";
            }
            err += "^\n";
        }
        console.log(err.white.redBG);
        throw {
            fatal: err
        };
    }

    optimizeTree(tree);
    var result = {code: "", vars: []};
    compileTree(tree, result);
    return result;
};

function compileTree(tree, result) {
    switch (tree.T) {
        case 'OP':
            var of = operationFunction[tree.V];
            result.code += of[0];
            compileTree(tree.L, result);
            result.code += of[1];
            compileTree(tree.R, result);
            result.code += of[2];
            break;
        case '-':
            result.code += "NEG(";
            compileTree(tree.R, result);
            result.code += ")";
            break;
        case '!':
            result.code += "!";
            compileTree(tree.R, result);
            break;
        case "ID":
            if (result.vars.indexOf(tree.V) < 0) {
                result.vars.push(tree.V);
            }
            result.code += "data('" + tree.V + "')";
            break;
        case "()":
            compileTree(tree.V, result);
            break;
        default:
            result.code += tree.V;
    }
}



function optimizeTree(tree) {

}

/**
 * Exp := ExpBody, ExpTail*
 * ExpBody := Block | NUMBER | STRING | ID | Neg | Not
 * Block := "(", Exp, ")"
 * Neg := SUB, Exp
 * Not := NOT, Exp
 * ExpTail := OPE, Exp
 */
function SemanticChecker(tokens) {
    this._tokens = tokens;
    this._index = -1;
    this._tree = null;
    this._stack = [];
    if (!this.checkExp()) {
        throw [0, "This is not a understandable expression!"];
    }
    if (this.tkn() !== null) {
        throw [this._index, "Unexpected end of expression! Maybe you forgot a \"(\" somewhere."];
    }
}

/**
 * @return A new tree's node from a given token.
 */
SemanticChecker.prototype.tokenToNode = function(tkn) {
    var node = {T: tkn[0], V: tkn[1]}, ope;
    switch (tkn[0]) {
        case "NUMBER":
            node.V = parseFloat(tkn[1]);
            break;
        case "OP":
            ope = tkn[1].substr(0, 2);
            node.V = ope;
            node.P = tokenPriorities[ope];
            if (!node.P) node.P = -1;
            break;
        case "(":
            node.V = null;
            break;
    }
    return node;    
};

/**
 * Convert given token into a node and add this node to the current tree.
 */
SemanticChecker.prototype.addTokenToTree = function(tkn) {
    if (!tkn) return;
    var node = this.tokenToNode(tkn);
    this.addNodeToTree(node);
};

SemanticChecker.prototype.addNodeToTree = function(node) {
    if (!this._tree) {
        this._tree = node;
        return;
    }

    var tree = this._tree;

    if (node.T != 'OP') {
        // Add a leaf or a unitary operation.
        while (tree.R) {
            tree = tree.R;
        }
        tree.R = node;
    } else {
        // Add an opération with a priority.
        //   (+)                (+)
        //   / \   +  (*) ->    / \
        //  3   7              3  (*)
        //                        /
        //                       7
        if (node.P > tree.P) {
            while (tree.R && tree.R.T == 'OP' && node.P > tree.R.P) {
                tree = tree.R;
            }
            node.L = tree.R;
            tree.R = node;        
        } else {
            node.L = tree;
            this._tree = node;
        }
    }
};

/**
 * @return Syntaxical tree.
 */
SemanticChecker.prototype.tree = function() {
    return this._tree;
};

/**
 * @return Current token or `null`.
 */
SemanticChecker.prototype.tkn = function() {
    if (this._index < this._tokens.length) {
        return this._tokens[this._index];
    }
    return null;
};

/**
 * @return Next token.
 */
SemanticChecker.prototype.next = function() {
    if (this._index < this._tokens.length) {
        this._index++;
    } else {
        return null;
    }
    return this.tkn();
};

/**
 * Get back on the previous token.
 */
SemanticChecker.prototype.back = function() {
    if (this._index > 0) {
        this._index--;
    }
    return this._tokens[this._index];
};

/**
 * Exp := ExpBody, ExpTail*
 */
SemanticChecker.prototype.checkExp = function() {
    if (!this.checkExpBody()) return false;
    while (this.checkExpTail()) {}
    return true;
}

/**
 * ExpBody := Block | NUMBER | STRING | ID | Neg | Not
 */
SemanticChecker.prototype.checkExpBody = function() {
    var tkn = this.next();
    switch (tkn[0]) {
        case "NUMBER":
        case "STRING":
        case "ID":
            this.addTokenToTree(tkn);
            return true;
        case "OP":
            if (tkn[1] != '-' && tkn[1] != '!') {
                throw [this._index, "Missing left operand!"];
            }
            tkn[0] = tkn[1];
            this.addTokenToTree(tkn);
            if (!this.checkExp()) {
                throw [this._index, "Missing unary operand!"];
            }
            return true;
        case "(":
            this._stack.push(this._tree);
            this._tree =  null;
            this.checkExp();
            tkn = this.next();
            if (!tkn || tkn[0] != ')') {
                throw [this._index, "Missing \")\"!"];
            }
            this._tree = {T: "()", V: this._tree};
            var current = this._stack.pop();
            if (current) {
                while (current.R) {
                    current = current.R;
                }
                current.R = this._tree;
                this._tree = current;
            }
            return true;
    }
    throw [this._index, "Invalid expression!"];
};

/**
 * ExpTail := OPE, Exp
 */
SemanticChecker.prototype.checkExpTail = function() {
    var tkn = this.next();
    if (!tkn) return false;
    if (tkn[0] != 'OP') {
        this.back();
        return false;
    }
    this.addTokenToTree(tkn);
    this.checkExp();
    return true;
}

/**
 * Return a list of token from a text code.
 * Each token is a list of three elements:
 * * (string) type of token
 * * (string) value of the token in the code.
 * * (integer) position of the token in the code.
 */
exports.tokenize = function(code) {
    var buff = code;
    var tokens = [];
    var name, rx;
    var found, result, cursor = 0, skip;
    while (buff.length > 0) {
        found = false;
        for (name in tokenTypes) {
            rx = tokenTypes[name];
            result = buff.match(rx);
            if (result) {
                if (name != "SPC") {
                    tokens.push([name, result[0], cursor]);
                }
                skip = result[0].length;
                buff = buff.substr(skip);
                cursor += skip;
                found = true;
                break;
            }
        }
        if (!found) {
            var err = "Unexpected char in:\n" + code + "\n", i;
            for (i = 0 ; i < cursor ; i++) {
                err += " ";
            }
            err += "^\n";
            console.error("========================================");
            console.error(err);
            throw {fatal: err};
        }
    }
    tokens.push(null);  // Add terminator.
    return tokens;
}

var tokenTypes = {
    SPC: /^[\t\n\r ]+/,
    ID: /^[_a-zA-Z][\w$\d]*/,
    "(": /^\(/,
    ")": /^\)/,
    NUMBER: /^(\d+(\.\d+)?|\.\d+)/,
    STRING: /^('(\\'|[^'])*'|"(\\"|[^"])*")/,
    OP: /^([\+\-\*/%]|<=|>=|[<>]|!=+|=+|&+|\|+|!)/,
    IF: /^\?/,
    ELSE: /^:/
};

var operationFunction = {
    "+": ["ADD(", ",", ")"],
    "-": ["SUB(", ",", ")"],
    "*": ["MUL(", ",", ")"],
    "/": ["DIV(", ",", ")"],
    "%": ["MOD(", ",", ")"],
    "^": ["POW(", ",", ")"],
    "=": ["(", "==", ")"],
    "==": ["(", "==", ")"],
    "!=": ["(", "!=", ")"],
    ">": ["(", ">", ")"],
    ">=": ["(", ">=", ")"],
    "<": ["(", "<", ")"],
    "<=": ["(", "<=", ")"],
    "&": ["(", "&&", ")"],
    "&&": ["(", "&&", ")"],
    "|": ["(", "||", ")"],
    "||": ["(", "||", ")"]
};

var tokenPriorities = {};
[
    ["|", "||"],
    ["&", "&&"],
    ["=", "==", "!=", ">", ">=", "<", "<="],
    ["+", "-"],
    "*", "/", "%", "^"
].forEach(
    function(item, index) {
        if (Array.isArray(item)) {
            item.forEach(
                function(subitem) {
                    tokenPriorities[subitem] = index;
                }
            );
        } else {
            tokenPriorities[item] = index;
        }
    }
);
