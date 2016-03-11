var Path = require("path");
var FS = require("fs");

var TPL_DIR = Path.resolve(Path.join(__dirname, "../tpl"));

/**
 * A template is a text with directives.
 * A directive is enclosed in double-curlies.
 * Here is an example :
 *
 * `Welcome mister {{name}}! I'm happy to see you again.`
 *
 * @module template
 */


function makeDefaultReplacer(map) {
    var lowerCaseMap = {}, key, val;
    for (key in map) {
        val = map[key];
        lowerCaseMap[key.toLowerCase()] = val;
    }
    return function(name) {
        var result = lowerCaseMap[name.toLowerCase()];
        if (result === undefined || result === null) {
            return "{{" + name + "}}";
        }
        return result;
    };
}

/**
 *
 * @example
 * var Tpl = require("./template");
 *
 * var text = "Hi {{Joe}} ! Who's {{Natacha}} ?";
 * console.log(text);
 * var replacer = function(name) {
 *     console.log("name: \"" + name + "\"");
 *     return "<data>" + name + "</data>";
 * };
 *
 * var ctx = Tpl.text(text, replacer);
 * console.log(ctx.out);
 *
 * ctx = Tpl.text(
 *     text,
 *     {
 *         joe: "buddy",
 *         natacha: "that girl"
 *     }
 * );
 * console.log(ctx.out);
 *
 *
 * @param text Template text with `${NAME}` directives.
 * @param replacer
 * Can be of two types:
 * * __object__: A map between the directives' names and the value of replacement.
 * * __function__:  A  function  with  the directive's  name  as  unique
 *   argument.  It must  return the replacement string.   `this` is used
 *   as a context along all replacements.  You can add any add attributs
 *   in  it, but  please  avoid reserved  one:  `text`, `count`,  `out`,
 *   `cursor`. The last  gives the cursor's position  when the directive
 *   has been reached.
 * @return The context object with at least theses attributes :
 * * __text__: Initial text.
 * * __count__: Number of replacements made.
 * * __out__: Text after replacements.
 */
exports.text = function(text, replacer) {
    var ctx = {text: text, cursor: 0, count: 0, out: text};
    if (typeof replacer === 'object') {
        replacer = makeDefaultReplacer(replacer);
    }
    else if (typeof replacer !== 'function') {
        delete ctx.cursor;
        return ctx;
    }
    var lastPos = 0;
    var cursor = 0;
    var mode = 0;
    var out = '';
    var c;
    var name;
    var result;
    var flush = function() {
        out += text.substr(lastPos, cursor - lastPos);
        lastPos = cursor + 1;
    };
    for (cursor = 0 ; cursor < text.length ; cursor++) {
        c = text.charAt(cursor);
        if (mode == 0) {
            if (c == '\\') {
                flush();
                mode = 9;
            }
            else if (c == '{') {
                flush();
                mode = 1;
            }
        }
        else if (mode == 1) {
            if (c != '{') {
                flush();
                out += "{";
                lastPos--;
                mode = 0;
            } else {
                mode = 2;
            }
        }
        else if (mode == 2) {
            if (c == '}') {
                mode = 3;
            }
        }
        else if (mode == 3) {
            if (c == '}') {
                mode = 0;
                ctx.cursor = lastPos;
                name = text.substr(lastPos + 1, cursor - lastPos - 2).trim();
                result = replacer.call(ctx, name);
                ctx.count++;
                out += result;
                lastPos = cursor + 1;
            }
        }
        else if (mode == 9) {
            if (c != '{') {
                out += '\\';
            }
            lastPos = cursor;
            mode = 0;
        }
    }
    out += text.substr(lastPos);
    ctx.out = out;
    delete ctx.cursor;
    return ctx;
};

exports.file = function(filename, replacer) {
    var file = Path.join(TPL_DIR, filename);
    if (FS.existsSync(file)) {
        var text = FS.readFileSync(file).toString();
        return exports.text(text, replacer);
    } else {
        throw {fatal: "Mising template file: " + file};
    }
};

exports.files = function(srcDir, dstDir, replacer) {
    var statSrc = FS.statSync(Path.join(TPL_DIR, srcDir));
    if (!statSrc.isDirectory()) return false;
    if (!FS.existsSync(dstDir)) {
        FS.mkdir(dstDir);
    } else {
        var statDst = FS.statSync(dstDir);
        if (!statDst.isDirectory()) return false;
    }
    var files = FS.readdirSync(Path.join(TPL_DIR, srcDir));
    files.forEach(
        function(filename) {
            var srcFile = Path.join(srcDir, filename);
            var dstFile = Path.join(dstDir, filename);
            var stat = FS.statSync(Path.join(TPL_DIR, srcFile));
            if (stat.isFile()) {
                var content = exports.file(srcFile, replacer).out;
                FS.writeFileSync( dstFile, content );
            } else {
                exports.files(srcFile, dstFile, replacer);
            }
        }
    );
    return true;
};
