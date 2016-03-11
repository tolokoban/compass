var Path = require("path");

function h(code, lang) {
    code = code.trim();
    code = code.replace('&', '&amp;');
    code = code.replace('<', '&lt;');
    code = code.replace('>', '&gt;');
    return "<pre class='highlight " + lang + "'>" + code + "</pre>";
}

h.cssFile = Path.join(__dirname, "highlight.css");

module.exports = h;
