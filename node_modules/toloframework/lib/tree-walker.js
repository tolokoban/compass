var rxTest = /^[ \t]*\[[ \t]*([a-z_][a-z_0-9]*)[ \t]*(=[^\]]+)?[ \t]*\]/i;


/**
 * @example
 * var TreeWalker = require("tree-walker");
 * var instance = new TreeWalker(opts);
 * @class TreeWalker
 */
var TreeWalker = function(opts) {
    if (typeof opts === 'string') {
        opts = {defaultProperty: opts};
    }
    if (typeof opts !== 'object') {
        opts = {};
    }
    if (typeof opts.defaultProperty !== 'string') {
        opts.defaultProperty = "TYPE";
    }
    this.defaultProperty(opts.defaultProperty);
};

/**
 * Accessor for attribute defaultProperty.
 */
TreeWalker.prototype.defaultProperty = function(v) {
    if (typeof v === 'undefined') return this._defaultProperty;
    this._defaultProperty = v;
    return this;
};

/**
 * @return void
 */
TreeWalker.prototype.action = function(node, actions) {
    var path;
    for (path in actions) {
        var action = actions[path];
        if (this.test(node, path)) {
            action(node, path);
            return this;
        }
    }
    return this;
};

/**
 * @return void
 */
TreeWalker.prototype.test = function(node, path) {
    var i, k, c, item;
    var items = path.split("/");
    var m, key, val;
    for (i = 0 ; i < items.length ; i++) {
        item = items[i].trim();
        if (item == ("" + parseInt(item))) {
            if (!Array.isArray(node)) return null;
            node = node[parseInt(item)];
        }
        else {
            while(item.length > 0) {
                m = item.match(rxTest);
                if (!m) break;
                key = m[1];
                val = m[2];
                if (!val) {
                    val = key;
                    key = "TYPE";
                } else {
                    val = val.substr(1);
                }
                if (node[key] != val) return null;
                item = item.substr(m[0].length);
            }
            key = item.trim();
            if (key.length > 0) {
                node = node[key];
                if (typeof node === 'undefined') return null;
            }
        }
    }
    return node;
};

TreeWalker.create = function(opts) {
    return new TreeWalker(opts);
};
module.exports = TreeWalker;
