var DependsFinder = function(code) {
    this.code = code;
    this.index = 0;
    this.depends = [];
    this.parse();
};

DependsFinder.prototype.addDep = function(dep) {
    if (this.depends.indexOf(dep) < 0) {
        this.depends.push(dep);
        return true;
    }
    return false;
};

DependsFinder.prototype.parse = function() {
    var good = false, name;
    while (this.index < this.code.length) {
        var c = this.code.charAt(this.index);
        if (c == '"' || c == "'") {
            this.parseString();
        }
        else if (c == 'r') {
            if (this.code.substr(this.index, 8) == 'require(') {
                good = true;
                if (this.index > 0) {
                    good = false;
                    c = this.code.charAt(this.index - 1);
                    if (c != '.' && c != '$' && c != '_' && (c < 'a' || c > 'z')
                        && (c < 'A' || c > 'Z') && (c < '0' || c > '9')) {
                        good = true;
                    }
                }
                if (good) {
                    this.index += 8;
                    this.parseRequire();
                }
            }
        }
        else if (c == '$') {
            good = true;
            if (this.index > 0) {
                good = false;
                c = this.code.charAt(this.index - 1);
                if (c != '.' && c != '$' && c != '_' && (c < 'a' || c > 'z')
                    && (c < 'A' || c > 'Z') && (c < '0' || c > '9')) {
                    good = true;
                }
            }
            if (good && this.code.substr(this.index, 3) == '$$(') {
                this.index += 3;
                c = this.code.charAt(this.index);
                if (c == '"' || c == "'") {
                    this.addDep("tfw3.js");
                    this.addDep("cls/" + this.parseString() + ".js");
                }
            }
        }
        else if (c == ']') {
            if (this.code.substr(this.index, 14) == ']={superclass:') {
                this.index += 14;
                c = this.code.charAt(this.index);
                if (c == '"' || c == "'") {
                    this.addDep("cls/" + this.parseString() + ".js");
                }
            }
        }
        this.index++;
    }
};

/**
 * @return void
 */
DependsFinder.prototype.parseRequire = function() {
    var result = [];
    var c;
    var name;
    var par = 1;
    while (this.index < this.code.length) {
        c = this.code.charAt(this.index);
        if (c == '"' || c == "'") {
            name = this.parseString();
            result.push(name);
            this.addDep("require.js");
            this.addDep("mod/" + name + ".js");
        }
        else if (c == '(') {
            par++;
        }
        else if (c == ')') {
            par--;
            this.index++;
            if (par == 0) break;
        }
        this.index++;
    }
    return result;
};

DependsFinder.prototype.parseString = function() {
    var quote = this.code.charAt(this.index);
    this.index++;
    var begin = this.index;
    var esc = false;
    while (this.index < this.code.length) {
        var c = this.code.charAt(this.index);
        if (esc) {
            esc = false;
        } else {
            if (c == '\\') {
                esc = true;
            }
            else if (c == quote) {
                return this.code.substr(begin, this.index - begin);
            }
        }
        this.index++;
    }
    return "";
};


module.exports = DependsFinder;
