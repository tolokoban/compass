var Widget = require("wdg");

/**
 * @example
 * var Button = require("wdg.button");
 * var instance = new Button("Hello World!");
 * @class Button
 */
var Button = function(arg) {
    var that = this;
    Widget.call(this, {tag: "a"});
    if (typeof arg === 'undefined') arg = {caption: "OK"};
    if (typeof arg === 'string') {
        arg = {caption: arg};
    }
    this._arg = arg;
    this._caption = this.div().addClass("caption");
    this._icon = this.div().addClass("icon");    
    this.addClass("wdg-button").append(this._caption, this._icon);
    this.caption(arg.caption).icon(arg.icon);
};

Button.prototype = Object.create(Widget.prototype);
Button.prototype.constructor = Button;

Button.prototype.caption = function(v) {
    if (typeof v === 'undefined') return this._arg.caption;
    this._arg.caption = v;
    this._caption.text(v);
    return this;
};

Button.prototype.icon = function(v) {
    if (typeof v === 'undefined') return this._arg.icon;
    var icon = this._icon;
    icon.removeClass(v);
    this._arg.icon = v;
    if (v === null) {
        v = "hide";
    }
    icon.addClass(v);
    return this;
};


Button.create = function(args) {
    return new Button(args);
};
module.exports = Button;
