exports.fire = function(msg, id, src) {
    msg = "" + msg;
    var ex = Error(msg);
    ex.fatal = msg;
    ex.id = id;
    ex.src = [src];
    throw ex;    
};

exports.bubble = function (ex, src) {
    if (typeof src !== 'undefined') {
        if (!ex.src) {
            ex.src = [];
        }
        ex.src.push(src);
    }
    throw ex;
};

exports.extractCodeAtPos = function(code, pos) {
    var lines = [],
        lastLinePos = 0,
        index = 0,
        cursor = 0,
        indexOf,
        lineNum,
        out = '',
        c,
        k;
    while (index < pos) {
        c = code.charAt(index);
        if (c == '\n') {
            lines.push(code.substr(cursor, index - cursor));
            lastLinePos = cursor;
            cursor = index + 1;            
        }
        index++;
    }
    indexOf = code.indexOf('\n', index);
    lastLinePos = cursor;
    if (indexOf < 0) {
        lines.push(code.substr(cursor));
    } else {
        lines.push(code.substr(cursor, indexOf - cursor));
    }
    lineNum = Math.max(0, lines.length - 5);
    function pad(txt) {
        txt = "" + txt;
        while (txt.length < 6) txt = ' ' + txt;
        return txt;
    }
    while (lineNum < lines.length) {
        out += pad(lineNum + 1) + ':   ' + preventTooLongLine(lines[lineNum], pos - lastLinePos) + "\n";
        lineNum++;
    }
    // position of the hat cursor ('^').
    var hatPos = pos - lastLinePos;
    if (hatPos > 119) hatPos = 34;
    for (k = 0; k < 10 + hatPos; k++) {
        out += ' ';
    }
    out += '^\n';
    return out;
};


function preventTooLongLine(line, pos) {
    if (line.length < 120) return line;
    pos = Math.max(0, (pos || 0) - 30);
    var subline = line.substr(pos);
    if (subline.length > 110) subline = subline.substr(0, 110) + " ...".magenta;
    return (pos > 0 ? "... ".magenta : '') + subline;
}
