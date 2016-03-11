/**
 * Component x-latex
 */

exports.tags = ["x-latex"];
exports.priority = 0;

// Mapping between LaTeX symbols and MathML entitites.
// http://www.w3.org/TR/MathML2/chapter6.html#chars.entity.tables
var SYMBOLS = {
    cdots: 'ctdot',
    neq: 'NotEqual',
    iif: 'hArr'
};

// Symbols with superscript and subscripts on top and bottom.
var UNDEROVER = {
    sum: 'sum',
    prod: 'prod',
    coprod: 'coprod'
};

// Functions `f` must be converted in `<mo>f</mo>`.
var FUNCTIONS = ['cos', 'sin', 'tan'];

function style(css) {
    return function(tokenizer, parent) {
        var child = parseItemOrGroup(tokenizer);
        if (!child.attribs) {
            child.attribs = {};
        }
        child.attribs.style = css;
        return child;
    };
}

/**
 * Macros are functions with this prototype: (tokenizer, parent, idx).
 * If a macro returns a tag, it will be added to the `parent`.
 */
var MACROS = {
    textbf: style('font-weight:bold'),
    over: function (tokenizer, parent) {
        // `parent` has  only two arguments :  the first is made  of the
        // first `firstArgLength` children.
        parent.firstArgLength = parent.children.length;
        parent.tag = 'mfrac';
    },
    limits: function(tokenizer, parent, idx) {
        var err = "Limit controls must follow a math operator.";
        if (parent.children.length < 1) tokenizer.fatal(err, idx);
        var lastTag = parent.children[parent.children.length - 1];
        if (lastTag.tag != 'mo') tokenizer.fatal(err, idx);
        lastTag.limits = true;
    },
    sqrt: function(tokenizer, parent, idx) {
        var child = parseItemOrGroup(tokenizer);
        return {tag: 'msqrt', children: [child]};
    }
};

/**
 * Called the  first time the  component is  used in the  complete build
 * process.
 */
exports.initialize = function(libs) {};

/**
 * Called after the complete build process is over (success or failure).
 */
exports.terminate = function(libs) {};

/**
 * Called the first time the component is used in a specific HTML file.
 */
exports.open = function(file, libs) {};

/**
 * Called after a specific HTML file  as been processed. And called only
 * if the component has been used in this HTML file.
 */
exports.close = function(file, libs) {};

/**
 * Compile a node of the HTML tree.
 */
exports.compile = function(root, libs) {
    try {
        root.type = libs.Tree.VERBATIM;
        var mrow = parseGroup(new Tokenizer(libs.Tree.text(root)));
        root.text = '<math>' + tagToString(mrow) + '</math>';
        libs.require("polyfill.mathml");
        libs.addInitJS( "require('polyfill.mathml');" );
    }
    catch (ex) {
        libs.fatal(ex, '<x-latex>');
    }
};


function tagToString(item) {
    // Text to output.
    var out = '';
    // In case of superscipt and/or  subscript, we need to surround with
    // the following tag : <msup>, <msub> or <msubsup>.
    var subsup = null;
    // Attribute name.
    var attName;
    // Attribute value.
    var attValue;
    if (item.msub || item.msup) {
        if (!item.msup) {
            subsup = item.limits ? 'munder' : 'msub';
        }
        else if (!item.msub) {
            subsup = item.limits ? 'mover' : 'msup';
        }
        else {
            subsup = item.limits ? 'munderover' : 'msubsup';
        }
    }
    if (subsup) {
        out += '<' + subsup + '>';
    }
    if (item.tag) {
        out += '<' + item.tag;
        if (item.attribs) {
            for (attName in item.attribs) {
                attValue = item.attribs[attName];
                out += ' ' + attName + '=' + JSON.stringify(attValue);
            }
        }
        out += '>';
    }
    if (Array.isArray(item.children)) {
        if (item.firstArgLength) {
            out += '<mrow>';
        }
        item.children.forEach(function (child, idx) {
            if (idx === item.firstArgLength) {
                out += '</mrow><mrow>';
            }
            out += tagToString(child);
        });
        if (item.firstArgLength) {
            out += '</mrow>';
        }
    } else {
        out += item.children;
    }
    if (item.tag) {
        out += '</' + item.tag + '>';
    }
    // Dealing with superscripts and subscripts (^ and _).
    if (subsup) {
        if (item.msub) {
            out += tagToString(item.msub);
        }
        if (item.msup) {
            out += tagToString(item.msup);
        }
        out += '</' + subsup + '>';
    }
    return out;
}


function tokenToTag(tkn) {
    // MathML entity.
    var entity;
    // Macro function.
    var macro;
    if (tkn.typ == 'macro') {
        if (FUNCTIONS.indexOf(tkn.txt) > -1) {
            return {tag: 'mo', children: tkn.txt};
        }
        macro = MACROS[tkn.txt];
        if (typeof macro === 'function') {
            return macro;
        } else {
            entity = UNDEROVER[tkn.txt];
            if (entity) {
                return {tag: 'mo', children: '&' + entity + ';', limits: true};
            }
            entity = SYMBOLS[tkn.txt] || tkn.txt;
            return {tag: 'mo', children: '&' + entity + ';'};
        }
    }
    return {tag: tkn.typ, children: tkn.txt};
}


/**
 * Read tokens from a Tokenizer and return a group.
 *
 * The end of a group is when ye  reach to last token or if we encounter
 * the char '}'.
 */
function parseGroup(tokenizer) {
    // Group this functon will return.
    var mrow = {tag: 'mrow', children: []};
    // Last child of mrow.
    var lastItem;
    // Current token.
    var tkn;
    // Current tag.
    var tag;
    // Macro. This is a function with this prototype: (tokenizer, mrow).
    var macro;

    for(;;) {
        tkn = tokenizer.next();
        // End of stream.
        if (!tkn) break;
        // End of block.
        if (tkn.typ == '}') break;
        // Deal with msup.
        if (tkn.typ == '^') {
            if (mrow.children.length == 0) {
                mrow.children.push({tag: 'mrow', children: []});
            }
            lastItem = mrow.children[mrow.children.length - 1];
            if (lastItem.msup) {
                tokenizer.fatal("Double superscript.", tkn.idx);
            }
            lastItem.msup = parseItemOrGroup(tokenizer);
        }
        else if (tkn.typ == '_') {
            if (mrow.children.length == 0) {
                mrow.children.push({tag: 'mrow', children: []});
            }
            lastItem = mrow.children[mrow.children.length - 1];
            if (lastItem.msub) {
                tokenizer.fatal("Double subscript.", tkn.idx);
            }
            lastItem.msub = parseItemOrGroup(tokenizer);
        }
        // Prime, double, triple or quadruple prime.
        else if (tkn.typ == 'prime') {
            lastItem = mrow.children[mrow.children.length - 1];
            if (lastItem.msup) {
                tokenizer.fatal("Double superscript because of a prime.", tkn.idx);
            }
            lastItem.msup = {tag: 'mo', children: tkn.txt};
        }
        // Beginning of a new group.
        else if (tkn.typ == '{') {
            mrow.children.push( parseGroup(tokenizer) );
        }
        // Add this leaf in the tree.
        else {
            tag = tokenToTag(tkn);
            if (typeof tag === 'function') {
                // This is a macro.
                macro = tag;
                tag = macro(tokenizer, mrow, tkn.idx);
                if (tag) {
                    mrow.children.push(tag);
                }
            } else {
                mrow.children.push(tag);
            }
        }
    }
    return mrow;
}

/**
 * Return the next token or the  next group (a group is enclosed between
 * '{' and '}').
 */
function parseItemOrGroup(tokenizer) {
    var tkn = tokenizer.next();
    if (!tkn) return null;
    if (tkn.typ == '{') {
        return parseGroup(tokenizer);
    }
    return {tag: tkn.typ, children: tkn.txt};
}

function Tokenizer(txt) {
    // We add this tailing space to make token parsing easier.
    this.txt = txt + ' ';
    // Current reading index;
    this.index = 0;
}

/**
 * Throw an exception with a cursor on the position in the code.
 */
Tokenizer.prototype.fatal = function(msg, idx) {
    var out = msg + "\n" + this.txt + "\n";
    while (idx > 0) {
        out += ' ';
        idx--;
    }
    throw out + '^\n';
};

/**
 * @return void
 */
Tokenizer.prototype.next = function() {
    // Current state.
    //    0: spaces swallower
    //   10: number (integral part)
    //   11: number (decimal part)
    //   20: macro (first char).
    //   21: macro (next letters).
    //   30: prime (first occurence).
    //   31: prime (all remaining occurences).
    var state = 0,
    // Current char.
    c,
    // Temporary piece of text.
    word,
    // Cursor used to read tokens with more than one char.
    cursor = 0;
    while (this.index < this.txt.length) {
        c = this.txt.charAt(this.index);
        this.index++;
        if (state == 0) {
            if (c <= ' ') continue;      // Spaces are skipped in math mode.
            if (c >= '0' && c <= '9') {
                cursor = this.index - 1;
                state = 10;
                continue;
            }
            if ((c >= 'a' && c <= 'z') || (c >= 'a' && c <= 'z')) {
                return {typ: 'mi', txt: c, idx: this.index - 1};
            }
            if (c == '\\') {
                cursor = this.index;
                state = 20;
                continue;
            }
            if (c == "'") {
                cursor = this.index - 1;
                state = 30;
                continue;
            }
            if ('{}^_'.indexOf(c) > -1) {
                return {typ: c, idx: this.index - 1};
            }
            return {typ: 'mo', txt: c, idx: this.index - 1};
        }
        else if (state == 10) {
            if (c == '.') {
                state = 11;
                continue;
            }
            if (c < '0' || c > '9') {
                this.index--;
                return {typ: 'mn', txt: this.txt.substr(cursor, this.index - cursor), idx: cursor};
            }
        }
        else if (state == 11) {
            if (c < '0' || c > '9') {
                this.index--;
                return {typ: 'mn', txt: this.txt.substr(cursor, this.index - cursor), idx: cursor};
            }
        }
        else if (state == 20) {
            if ((c < 'a' || c > 'z') && (c < 'A' || c > 'Z')) {
                return {typ: 'macro', txt: c, idx: this.index - 1};
            }
            state = 21;
        }
        else if (state == 21) {
            if ((c < 'a' || c > 'z') && (c < 'A' || c > 'Z')) {
                this.index--;
                return {typ: 'macro', txt: this.txt.substr(cursor, this.index - cursor), idx: cursor};
            }
        }
        else if (state == 30) {
            if (c != "'") {
                return {typ: 'prime', txt: '&#x2032;', idx: this.index - 1};
            }
            state = 21;
        }
        else if (state == 31) {
            if (c != "'") {
                this.index--;
                word = this.txt.substr(cursor, this.index - cursor);
                switch (word.length) {
                    case 2: word = '&#x2033;'; break;
                    case 3: word = '&#x2034;'; break;
                    default: word = '&#x2035;'; break;
                }
                return {typ: 'prime', txt: word, idx: cursor};
            }
        }
    }
    this.txt = '';
    return null;
};
