var Marked = require("marked");
var Highlight = require("./highlight");
var S = require("string");

var LANGUAGES = ['js', 'css', 'html', 'xml'];

Marked.setOptions(
    {
        // Git Flavoured Markdown.
        gfm: true,
        // Use tables.
        tables: true,
        highlight: function (code, lang) {
            return Highlight(code, lang);
        }
    }
);

module.exports.toHTML = function(content) {
    var str = S(content);
    LANGUAGES.forEach(
        function(item) {
            var str = S(content);
            str = str.replaceAll('[' + item + ']', '```' + item + ' ');
            str = str.replaceAll('[/' + item + ']', '```');
        }
    );

    return Marked(str.toString());
};
