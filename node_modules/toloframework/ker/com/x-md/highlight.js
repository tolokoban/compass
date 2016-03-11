var Path = require("path");

var TOKENS = {
    js: {
        "function": /^([$_a-zA-Z][$_a-zA-Z0-9]*)(?=([ \n\r\t]*\())/,
        string: /^("([^\\"]|\\\\|\\")*")/,
        keyword: /^(?:[^a-zA-Z$_0-9])(break|continue|do|for|import|new|this|void|case|default|else|function|in|return|typeof|while|comment|delete|export|if|label|switch|var|with|catch|enum|throw|class|extends|try|const|finally|debugger|super|let)(?=[^a-zA-Z$_0-9])/,
        keyword2: /^(?:[^a-zA-Z$_0-9])(window|require|module|exports)(?=[^a-zA-Z$_0-9])/,
        comment: /^(\/\/[^\n]*[\n]|\/\*([^\*]+|\*[^\/])*\*\/)/,
        regexp: /^\/(\\\/|[^\/])+\/[gmi]*/,
        symbol: /^\[\(\),;:\{\}\[\]]+/,
        operator: /^(\&[a-zA-Z]+;|===|!==|==|!=|<=|>=|<|>|\|\||&&|\*|\+|\-|\/|%|[\+=&\|\-]+)/
    }
};

var rxLT = /</g;
var rxGT = />/g;
var rxAMP = /&/g;

function h(code, lang, libs) {
    var N = libs.Tree;
    code = code.trim();
    var tokens = TOKENS[lang] || TOKENS.js,
        buff = '',
        idx = 0,
        key,
        rx,
        match,
        found,
        c;
    try {
        code = code.replace(rxAMP, '&amp;');
        code = code.replace(rxLT, '&lt;');
        code = code.replace(rxGT, '&gt;');
        while (idx < code.length) {
            found = false;
            for (key in tokens) {
                rx = tokens[key];
                match = rx.exec(code.substr(idx));
                if (match) {
                    buff += '<span class="' + key + '">' + match[0] + "</span>";
                    idx += match[0].length;
                    found = true;
                    break;
                }
            }
            if (!found) {
                buff += code.charAt(idx);
                idx++;
            }
        }
    }
    catch (ex) {
        libs.fatal("Unexpected error while highlighting '" + lang + "' code!\n" + ex);
    }

    return "<pre class='custom highlight " + lang + "'>"
        + buff + "</pre>";
}

h.cssFile = Path.join(__dirname, "highlight.css");

function parseMarkDown(content, libs, Marked) {
    var root = libs.parseHTML(content),
        replacementKey = '({(' + Date.now() + ')})',
        items = [],
        text = '';
console.log(content.cyan);
console.log(JSON.stringify(root));
    root.children.forEach(function (child) {
        if (child.type == libs.Tree.TEXT) {
            text += child.text;
        } else {
            text += replacementKey;
            items.push(libs.Tree.toString(child));
        }
    });
    text = Marked(text);
    return text;
}


exports.parseCode = h;
exports.parseMarkDown = parseMarkDown;
