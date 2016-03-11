var Tree = require("./htmltree");
var Fatal = require("./fatal");

// Void elements do not have any children.
var VOID_ELEMENTS = ["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];

var rxEntity = /^&[a-zA-Z]+;/;
var rxStartTag = /^<([a-zA-Z_$][a-zA-Z0-9$_:-]*)/;
var rxAttrib = /^[ \t\n\r]*([a-zA-Z_$][a-zA-Z0-9$_:-]*)([ \t\n\r]*=[ \t\n\r]*)?/;
var rxEndTag = /^[ \t\n\r]*>/;
var rxAutoCloseTag = /^[ \t\n\r]*\/>/;
var rxCloseTag = /^<\/([a-zA-Z_$][a-zA-Z0-9$_:-]*)>/;
var rxComment = /^<\!--(.+)-->/;
var rxDocType = /^<\!([a-zA-Z_$][a-zA-Z0-9$_:-]*)/;
var rxStartProcessing = /^<\?([a-zA-Z_$][a-zA-Z0-9$_:-]*)/;
var rxEndProcessing = /^\?>/;


function parse(content) {
    var cursor = 0,
        index = 0,
        node,
        root = {children: []},
        stack = [root];

    function append(node) {
        if (node.type == Tree.TEXT
            && root.children.length > 0
            && root.children[root.children.length - 1].type == Tree.TEXT)
        {
            root.children[root.children - 1].text += node.text;
        } else {
            root.children.push(node);
        }
    }
    function flushText() {
        var text = content.substr(cursor, index - cursor);
        if (text.length > 0) {
            append({type: Tree.TEXT, text: text});
        }
        cursor = index;
    }
    /**
     * @param {array...} rules Each rule  is an array with two elements:
     * a  regular expression  and  a  function to  call  if that  regexp
     * matches.
     */
    function match() {
        var i, rule, rx, m, lastIndex = index;
        for (i = 0 ; i < arguments.length ; i++) {
            rule = arguments[i];
            rx = rule[0];
            m = rx.exec(content.substr(index));
            if (m) {
                if (rule[1](m)) {
                    return true;
                }
                index = lastIndex;
            }
        }
        return false;
    }

    function parseAttribs(node) {
        while (match([rxAttrib, function (m) {
            var name = m[1];
            var value = null;
            index += m[0].length;
            if (m[2]) {
                // There is a value between single or double quotes.
                var quote = content.charAt(index),
                    c;
                if (quote == '"' || quote == "'") {
                    value = "";
                    index++;
                    while (index < content.length) {
                        c = content.charAt(index);
                        if (c == quote) {
                            index++;
                            break;
                        }
                        if (c == '\\') {
                            index++;
                            c = content.charAt(index);
                            if (index >= content.length) break;
                        }
                        value += c;
                        index++;
                    }
                }
            }
            node.attribs[name] = value;
            return true;
        }]));
    }
    try {
        while (index < content.length) {
            if (!match(
                [rxStartTag, function (m) {
                    flushText();
                    node = {type: Tree.TAG, name: m[1], attribs: {}, children: [], pos: index};
                    index += m[0].length;
                    parseAttribs(node);
                    return match(
                        [rxAutoCloseTag, function (m) {
                            node.autoclose = true;
                            root.children.push(node);
                            index += m[0].length;
                            cursor = index;
                            return true;
                        }],
                        [rxEndTag, function (m) {
                            if (VOID_ELEMENTS.indexOf(node.name.toLowerCase()) > -1) {
                                // Void elements have no children and do not need any closing syntax.
                                node.void = true;
                                root.children.push(node);
                                index += m[0].length;
                                cursor = index;
                                return true;
                            } else {
                                root.children.push(node);
                                stack.push(node);
                                root = node;
                                index += m[0].length;
                                cursor = index;
                                return true;
                            }
                        }]
                    );
                }],
                [rxCloseTag, function (m) {
                    if (stack.length == 1) {
                        throw {msg: "Unexpected closing tag " + m[0] + "!", pos: index};
                    }
                    if (root.name != m[1]) {
                        throw {msg: "Invalid closing tag " + m[0] + ", expected </"
                               + root.name + ">!", pos: index};
                    }
                    flushText();
                    stack.pop();
                    root = stack[stack.length - 1];
                    index += m[0].length;
                    cursor = index;
                    return true;
                }],
                [rxEntity, function (m) {
                    // This is an HTML entity.
                    flushText();
                    append({type: Tree.ENTITY, text: m[0], pos: index});
                    cursor = index = index + m[0].length;
                    return true;
                }],
                [rxComment, function (m) {
                    flushText();
                    append({type: Tree.COMMENT, text: m[1], pos: index});
                    index += m[0].length;
                    cursor = index;
                    return true;
                }],
                [rxDocType, function (m) {
                    flushText();
                    node = {type: Tree.DOCTYPE, name: m[1], attribs: {}, pos: index};
                    index += m[0].length;
                    parseAttribs(node);
                    return match([rxEndTag, function (m) {
                        append(node);
                        index += m[0].length;
                        cursor = index;
                        return true;
                    }]);
                }],
                [rxStartProcessing, function (m) {
                    flushText();
                    node = {type: Tree.PROCESSING, name: m[1], attribs: {}, pos: index};
                    index += m[0].length;
                    parseAttribs(node);
                    return match([rxEndProcessing, function (m) {
                        append(node);
                        index += m[0].length;
                        cursor = index;
                        return true;
                    }]);
                }]
            ))
            {
                index++;
            }
        }
        flushText();
    }
    catch (ex) {
        if (typeof ex.pos !== 'undefined') {
            Fatal.fire(ex.msg + "\n\n" + Fatal.extractCodeAtPos(content, ex.pos));
        } else {
            Fatal.bubble(ex);
        }
    }
    return stack[0];
}


exports.parse = parse;
