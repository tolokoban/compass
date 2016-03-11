/**
 * A HtmlNode has the following attributes:
 * * __type__:
 *   * __VOID__, __EMPTY__: this is a fake node, it will just aggregate nodes in the __children__ attribute.
 *   * __TAG__, __ELEMENT__: an element of the DOM.
 *   * __TEXT__: a text without any tag arround it.
 * * __name__: the name of the element if this node is a DOM element.
 * * __attribs__: an object of all the element attributes, if this node is a DOM element.
 * * __text__: the content of the text element if this node is a text element.
 * * __children__: an array of the children nodes.
 * * __extra__: an object for free information addition.
 *
 * @module node
 */

var id = 1;

/**
 * Not a real element. Just a list of elements.
 * Must contain `children`.
 */
exports.ROOT = 0;
exports.VOID = 0;

/**
 * DOM element tag.
 * Has an attribute *name*.
 * @const
 */
exports.TAG = 1;
exports.ELEMENT = 1;


/**
 * HTML text node.
 * Has an attribute *text*.
 * @const
 */
exports.TEXT = 2;

/**
 * HTML CDATA section.
 * @example
 * <![CDATA[This a is a CDATA section...]]>
 * @const
 */
exports.CDATA = 3;

/**
 * @example
 * <?xml-stylesheet href="default.css" title="Default style"?>
 */
exports.PROCESSING = 4;

/**
 * HTML comment.
 * @example
 * <-- This is a comment -->
 * @const
 */
exports.COMMENT = 5;

/**
 * @const
 */
exports.DOCTYPE = 6;

/**
 * @const
 */
exports.TYPE = 7;

/**
 * Example: `&amp;`, `&lt;`, ...
 */
exports.ENTITY = 8;

/**
 * Put the `text` attribute verbatim, without any transformation, nor parsing.
 */
exports.VERBATIM = 98;

/**
 * Every children is a diffrent HTML file. Usefull to generate several pages.
 */
exports.PAGES = 99;

/**
 * @return a deep copy of `root`.
 */
exports.clone = function(root) {
    return JSON.parse(JSON.stringify(root));
};

/**
 * Return the next incremental id.
 */
exports.nextId = function() {
    return "W" + (id++);
};

/**
 * @param {object} root root of the tree we want to look in.
 * @param {string} name name of the searched TAG. Must be in lowercase.
 * @return the first TAG node with the name `name`.
 */
exports.getElementByName = function(root, name) {
    if (!root) return null;
    if (root.name && root.name.toLowerCase() === name.toLowerCase()) return root;
    if (Array.isArray(root.children)) {
        var i, node;
        for (i = 0 ; i < root.children.length ; i++) {
            node = exports.getElementByName(root.children[i], name);
            if (node !== null) return node;
        }
    }
    return null;
};

/**
 * Remove `child` from the children's list of `parent`.
 */
exports.removeChild = function(parent, child) {
    if (Array.isArray(parent.children)) {
        var i, node;
        for (i = 0 ; i < parent.children.length ; i++) {
            node = parent.children[i];
            if (node === child) {
                parent.children.splice(i, 1);
                break;
            }
        }
    }
};

exports.trim = function(root) {
    var children = root.children;
    function isEmpty(node) {
        if (node.type != exports.TEXT) return false;
        if (!node.text) return false;
        if (node.text.trim().length == 0) return true;
        return false;
    }
    while (children.length > 0 && isEmpty(children[0])) {
        children.shift();
    }
    while (children.length > 0 && isEmpty(children[children.length - 1])) {
        children.pop();
    }
    if (children.length > 0) {
        if (children[0].type == exports.TEXT) {
            children[0].text = children[0].text.trimLeft();
        }
        if (children[children.length - 1].type == exports.TEXT) {
            children[children.length - 1].text = children[children.length - 1].text.trimRight();
        }
    }
};

exports.trimLeft = function(root) {
    var children = root.children;
    function isEmpty(node) {
        if (node.type != exports.TEXT) return false;
        if (!node.text) return false;
        if (node.text.trim().length == 0) return true;
        return false;
    }
    while (children.length > 0 && isEmpty(children[0])) {
        children.shift();
    }
    if (children.length > 0) {
        if (children[0].type == exports.TEXT) {
            children[0].text = children[0].text.trimLeft();
        }
    }
};

exports.trimRight = function(root) {
    var children = root.children;
    function isEmpty(node) {
        if (node.type != exports.TEXT) return false;
        if (!node.text) return false;
        if (node.text.trim().length == 0) return true;
        return false;
    }
    while (children.length > 0 && isEmpty(children[children.length - 1])) {
        children.pop();
    }
    if (children.length > 0) {
        if (children[children.length - 1].type == exports.TEXT) {
            children[children.length - 1].text = children[children.length - 1].text.trimRight();
        }
    }
};

/**
 * Convert a node in HTML code.
 */
exports.toString = function(node) {
    var txt = '',
    key, val;
    if (!node) return '';
    if (node.type == exports.TAG) {
        txt += "<" + node.name;
        for (key in node.attribs) {
            val = "" + node.attribs[key];
            txt += " " + key + "=" + JSON.stringify(val) + "";
        }
        if (node.children && node.children.length > 0) {
            txt += ">";
            node.children.forEach(
                function(child) {
                    txt += exports.toString(child);
                }
            );
            txt += "</" + node.name + ">";
        } else {
            if (node.void) txt += ">";
            else if (node.autoclose) txt += "/>";
            else txt += "></" + node.name + ">";
        }
    }
    else if (node.type == exports.ENTITY) {
        txt += node.text;
    }
    else if (node.type == exports.VERBATIM) {
        txt += node.text;
    }
    else if (node.type == exports.TEXT) {
        txt += node.text;
    }
    else if (node.type == exports.PROCESSING) {
        txt += "<?" + node.name;
        for (key in node.attribs) {
            val = "" + node.attribs[key];
            txt += " " + key + "=" + JSON.stringify(val) + "";
        }
        txt += "?>";
    }
    else if (node.children) {
        node.children.forEach(
            function(child) {
                txt += exports.toString(child);
            }
        );
    }
    return txt;
};
/**
 * Put on console a representation of the tree.
 */
exports.debug = function(node, indent) {
    if (typeof indent === 'undefined') indent = '';
    if (!node) {
        return console.log(indent + "UNDEFINED!");
    }
    if (node.type == exports.TEXT) {
        console.log(indent + "\"" + node.text.trim() + "\"");
    } else {
        if (node.children && node.children.length > 0) {
            console.log(
                indent + "<" + (node.name ? node.name : node.type) + "> "
                    + (node.attribs ? JSON.stringify(node.attribs) : '')
            );
            node.children.forEach(
                function(child) {
                    exports.debug(child, indent + '  ');
                }
            );
            console.log(indent + "</" + (node.name ? node.name : node.type) + "> ");
        } else {
            console.log(
                indent + "<" + (node.name ? node.name : node.type) + " "
                    + (node.attribs ? JSON.stringify(node.attribs) : '') + " />"
            );
        }
    }
};
/**
 * Walk through the HTML tree and, eventually, replace branches.
 * The functions used as arguments take only one argument: the current node.
 * @param node {object} root node
 * @param functionBottomUp {function} function to call when traversing the tree bottom-up.
 * @param functionTopDowy {function} function to call when traversing the tree top-down.
 * @param parent {object} parent node or *undefined*.
 */
exports.walk = function(node, functionBotomUp, functionTopDown, parent) {
    if (!node) return;
    var i, child, replacement, children;
    if (typeof functionTopDown === 'function') {
        functionTopDown(node, parent);
    }
    if (node.children) {
        children = [];
        node.children.forEach(
            function(item) {
                children.push(item);
            }
        );
        children.forEach(
            function(child) {
                exports.walk(child, functionBotomUp, functionTopDown, node);
            }
        );
    }
    if (typeof functionBotomUp === 'function') {
        return functionBotomUp(node, parent);
    }
};
/**
 * Get/Set an attribute.
 */
exports.att = function(node, name, value) {
    if (typeof value === 'undefined') {
        if (node.attribs) {
            return node.attribs[name];
        }
        return undefined;
    }
    if (!node.attribs) {
        node.attribs = {};
    }
    node.attribs[name] = value;
};
/**
 * Return the text content of a node.
 */
exports.text = function(node, text) {
    if (typeof text === 'undefined') {
        if (node.type == exports.TEXT) {
            return node.text;
        }
        if (node.children) {
            var txt = "";
            node.children.forEach(
                function(child) {
                    txt += exports.text(child);
                }
            );
            return txt;
        } else {
            return "";
        }
    } else {
        node.children = [
            {
                type: exports.TEXT,
                text: text
            }
        ];
    }
};
/**
 * Return a node representing a viewable error message.
 */
exports.createError = function(msg) {
    return {
        type: exports.TAG,
        name: "div",
        attribs: {
            style: "margin:4px;padding:4px;border:2px solid #fff;color:#fff;background:#f00;"
                + "box-shadow:0 0 2px #000;overflow:auto;font-family:monospace;font-size:1rem;"
        },
        children: [
            {
                type: exports.TEXT,
                text: msg.replace("\n", "<br/>", "g")
            }
        ]
    };
};
/**
 * Add a class to a node of type TAG.
 */
exports.addClass = function(node, className) {
    if (!node.attribs) {
        node.attribs = {};
    }
    var classes = (node.attribs["class"] || "").split(/[ \t\n\r]/g);
    var i;
    for (i = 0 ; i < classes.length ; i++) {
        if (className == classes[i]) return false;
    }
    var txt = "";
    classes.push(className);
    for (i = 0 ; i < classes.length ; i++) {
        if (txt.length > 0) {
            txt += " ";
        }
        txt += classes[i];
    }
    if (txt.length > 0) {
        node.attribs["class"] = txt;
    }
    return true;
};
/**
 * Return a node of type TAG représenting a javascript content.
 */
exports.createJavascript = function(code) {
    return {
        type: exports.TAG,
        name: "script",
        attribs: {
            type: "text/javascript"
        },
        children: [
            {
                type: exports.TEXT,
                text: "//<![CDATA[\n" + code + "//]]>"
            }
        ]
    };
};

exports.forEachAttrib = function(node, func) {
    var attribs = node.attribs,
    attName, attValue, count = 0;
    if (!attribs) return 0;
    for (attName in attribs) {
        attValue = attribs[attName];
        if (typeof attValue === 'string') {
            func(attName, attValue);
        }
    }
    return count;
};

/**
 * Apply a function on every child of a node.
 */
exports.forEachChild = function(node, func) {
    var children = node.children, i, child;
    if (!children) return false;
    for (i = 0 ; i < children.length ; i++) {
        child = children[i];
        if (typeof child.type === 'undefined' || child.type == exports.VOID) {
            exports.forEachChild(child, func);
        }
        else if (true === func(child, i)) {
            break;
        }
    }
    return i;
};
/**
 * If a node's children is of type VOID, we must remove it and add its
 * children to node's children.
 *
 * Then following tree:
 * ```
 * {
 *   children: [
 *     {
 *       children: [
 *         {type: Tree.TAG, name: "hr"},
 *         {
 *           children: [{type: Tree.TAG, name: "img"}]
 *         }
 *         {type: Tree.TEXT, text: "Hello"},
 *       ]
 *     },
 *     {type: Tree.TEXT, text: "World"},
 *   ],
 *   type: Tree.TAG,
 *   name: "div"
 * }
 * ```
 * will be tranformed in:
 * ```
 * {
 *   children: [
 *     {type: Tree.TAG, name: "hr"},
 *     {type: Tree.TAG, name: "img"},
 *     {type: Tree.TEXT, text: "Hello"},
 *     {type: Tree.TEXT, text: "World"},
 *   ],
 *   type: Tree.TAG,
 *   name: "div"
 * }
 * ```
 */
exports.normalizeChildren = function(node, recurse) {
    if (typeof recurse === 'undefined') recurse = false;
    if (node.children) {
        var children = [];
        extractNonVoidChildren(node, children);
        node.children = children;
        if (recurse) {
            node.children.forEach(
                function(child) {
                    exports.normalizeChildren(child, true);
                }
            );
        }
    }
};

function extractNonVoidChildren(node, target) {
    if (typeof target === 'undefined') target = [];
    if (node.children && node.children.length > 0) {
        node.children.forEach(
            function(child) {
                if (!child.type || child.type == exports.VOID) {
                    extractNonVoidChildren(child, target);
                } else {
                    target.push(child);
                }
            }
        );
    }
    return target;
}

/**
 * @return The first children tag with name `tagname`, or `null` if not found.
 */
exports.findChild = function(root, tagname) {
    if (!Array.isArray(root.children)) return null;
    for (var i = 0 ; i < root.children.length ; i++) {
        var item = root.children[i];
        if (item.type == exports.TAG && item.name == tagname) return item;
    }
    return null;
};

/**
 * If a tag called `tagname` exist among `root`'s children, return it.
 * Otherwise, create a new tag, append it to `root` and return it.
 */
exports.findOrAppendChild = function(root, tagname, attribs, children) {
    var child = exports.findChild(root, tagname);
    if (child) return child;
    child = exports.tag(tagname, attribs, children);
    if (!Array.isArray(root.children)) {
        root.children = [child];
    } else {
        root.children.push(child);
    }
    return child;
};

/**
 * Return a div element.
 */
exports.div = function(attribs, children) {
    return exports.tag("div", attribs, children);
};

/**
 * @example
 * // <span style='color: red'>ERROR</span>
 * htmltree.tag("span", {style: "color: red"}, "ERROR");
 * @example
 * // <b><span class="dirty">OK!</span></b>
 * htmltree.tag("b", {}, [
 *   htmltree.tag("span", "dirty", "OK!")
 * ]);
 */
exports.tag = function(name, attribs, children) {
    if (!attribs) attribs = {};
    if (typeof attribs === 'string') attribs = {"class": attribs};
    if (typeof children === 'undefined') children = [];
    if (!Array.isArray(children)) {
        if (typeof children === 'string') {
            children = {
                type: exports.TEXT,
                text: children
            };
        }
        children = [children];
    }
    return {
        type: exports.TAG,
        name: name,
        attribs: attribs,
        children: children
    };
};
/**
 * Return multi-lingual text.
 */
exports.createText = function(dic) {
    var key, val, children = [];
    for (key in dic) {
        val = dic[key];
        children.push(
            {
                type: exports.TAG,
                name: "span",
                attribs: {
                    lang: key
                },
                children: [
                    {
                        type: exports.TEXT,
                        text: val
                    }
                ]
            }
        );
    }
    return children;
};
/**
 * @description
 * Remove all TEXT or COMMENT children.
 *
 * @param root the htmlnode from which you want to keep only TAG children.
 * @memberof node
 */
exports.keepOnlyTagChildren = function(root) {
    if (!root.children) return root;
    var children = [];
    root.children.forEach(
        function(node) {
            if (node.type == exports.TAG) {
                children.push(node);
            }
        }
    );
    root.children = children;
    return root;
};
