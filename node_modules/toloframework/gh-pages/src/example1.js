var Path = require("path");

// This a comment...
var TOKENS = {
    js: {
        keyword: /^(break|continue|do|for|import|new|this|void|case|default|else|function|in|return|typeof|while|comment|delete|export|if|label|switch|var|with|catch|enum|throw|class|extends|try|const|finally|debugger|super|let)/,
        keyword2: /^(window|require)/,
        comment: /^(\/\/[^\n]*[\n])/,
        string: /^("([^\\"]|\\\\|\\")*")/,
        operator: /^(===|!==|==|!=|<=|>=|<|>|\|\||&&|\*|\+|\-|\/|%|[\+=&\|\-]+)/,
        symbol: /^([\(\),;:\{\}\[\]]+)/
    }
};

/**
 * Comment...
 */
function h(code, lang, libs) {
    var N = libs.Tree;
    code = code.trim();
    var tokens = TOKENS[lang] || TOKENS.js,
        buff = '', 
        children = [], 
        idx = 0, 
        key, 
        rx, 
        match,
        found;
    while (idx < code.length) {
        found = false;
        for (key in tokens) {
            rx = tokens[key];
            match = rx.exec(code.substr(idx));
            if (match) {
                if (buff.length > 0) {
                    children.push({type: N.TEXT, text: buff});
                    buff = '';
                }
                children.push(
                    {
                        type: N.TAG, name: "span",
                        attribs: {"class": key},
                        children: [
                            {type: N.TEXT, text: match[0]}
                        ]
                    }
                );
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
    if (buff.length > 0) {
        children.push({type: N.TEXT, text: buff});
    }

    return "<pre class='custom highlight " + lang + "'>" 
        + N.toString({children: children}) + '</pre>';
}

h.cssFile = Path.join(__dirname, "highlight.css");

module.exports = h;
