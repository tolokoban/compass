var Widget = require("wdg");

/**
 * @example
 * var LayoutRow = require("tfw.layout-row");
 * var instance = new LayoutRow();
 * @class LayoutRow
 */
var LayoutRow = function() {
    Widget.call(this);
    this.addClass("tfw-layout-row");
    var i, arg;
    for (i = 0 ; i < arguments.length ; i++) {
        arg = arguments[i];
        if (!Array.isArray(arg)) arg = [arg];
        arg.forEach(
            function(item) {
                this.append(
                    Widget.div().append(
                      Widget.div().append(item)
                    )
                );
            },
            this
        );
    }
};

LayoutRow.prototype = Object.create(Widget.prototype);
LayoutRow.prototype.constructor = LayoutRow;

LayoutRow.create = function() {
    var i, arg, args = [];
    for (i = 0 ; i < arguments.length ; i++) {
        arg = arguments[i];
        args.push(arg);
    }    
    return new LayoutRow(args);
};
module.exports = LayoutRow;
