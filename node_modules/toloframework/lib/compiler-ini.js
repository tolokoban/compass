var FS = require("fs");
var Template = require("./template");

function splitIfNeeded(txt) {
    // Transformer tous les "\n" en sauts de lignes.
    var parts = txt.split("\\");
    if (parts.length > 0) {
        parts.forEach(
            function(itm, idx) {
                if (idx > 0) {
                    var c = itm.substr(0, 1);
                    if (c == 'n') {
                        txt += "\n";
                    } else {
                        txt += "\\" + c;
                    }
                    txt += itm.substr(1);
                } else {
                    txt = itm;
                }
            }
        );
    }
    return txt;
}

exports.parse = function(file) {
    var content = FS.readFileSync(file).toString();
    var dic = {};
    var currentLang = null;
    content.split("\n").forEach(
        function(line, idx) {
            line = line.trim();
            if (line == '') return;
            var c = line.charAt(0);
            if (c == '#' || c == '/') return;
            var pos, lang, key, text;
            if (c == '[') {
                pos = line.indexOf(']');
                lang = line.substr(1, pos - 1).toLowerCase();
                currentLang = dic[lang];
                if (!currentLang) {
                    dic[lang] = {};
                    currentLang = dic[lang];
                }
                return;
            }
            if (c > '32' && c != ':') {
                pos = line.indexOf(':');
                key = line.substr(0, pos).trim();
                text = line.substr(pos + 1).trim();
                currentLang[key] = splitIfNeeded(text);
            }
        }
    );

    var params = {dico: JSON.stringify(dic)};
    return Template.file("intl.js", params).out;
};
