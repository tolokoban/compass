var LR = require("tfw.layout-row").create;
var Widget = require("wdg");
var Listeners = require("tfw.listeners");
var D = Widget.div;
var B = require("tp4.button").create;
var W = require("tp4.wait").create;

/**
 * @param {object} opts
 * * __title__ {string}: window's caption.
 * @example
 * var Modal = require("tfw.modal");
 * var instance = new Modal();
 */
var Modal = function(opts) {
  Widget.call(this);
  this.addClass("tfw-modal");
  if (typeof opts !== 'object') opts = {};
  if (typeof opts.title === 'undefined') opts.title = "";
  if (typeof opts.width === 'undefined') opts.width = "4096px";
  if (typeof opts.width === 'number') opts.width = opts.width + "px";
  if (typeof opts.neverHide === 'undefined') opts.neverHide = false;
  this._opts = opts;
  var title = Widget.div("title").html(opts.title);
  var div = Widget.div("container");
  Widget.create().append.call(
    this,
    title,
    div,
    Widget.tag("a").addEvent("tap", "hide", this)
  );
  this._container = div;
  this._title = title;
  this.eventShow = new Listeners();
  this.eventHide = new Listeners();
};

Modal.prototype = Object.create(Widget.prototype);
Modal.prototype.constructor = Modal;

/**
 * @return void
 */
Modal.prototype.clear = function() {
  this._container.clear();
  var i, arg;
  for (i = 0 ; i < arguments.length ; i++) {
    arg = arguments[i];
    this._container.append(arg);
  }

  return this;
};

/**
 * Getter/setter for window's title.
 * @return this
 */
Modal.prototype.title = function(v) {
  if (typeof v === 'undefined') return this._title.text();
  this._title.html(v);
  return this;
};

/**
 * @return this
 */
Modal.prototype.append = function() {
  for (var i = 0 ; i < arguments.length ; i++) {
    this._container.append(arguments[i]);
  }
  return this;
};

/**
 * @return this
 */
Modal.prototype.show = function(maxWidth) {
  this.eventShow.fire(this);
  return this.appendToBody();
};

/**
 * @return this
 */
Modal.prototype.hide = function() {
  this.eventHide.fire(this);
  if (this._opts.neverHide) return this;
  return this.detach();
};

Modal.create = function(opts) {
  return new Modal(opts);
};

/**
 * In case of __cancel__ the div will be detached and the `onCancel()` slot be called.
 * In case of  __ok__, the div will  stay and the `onOK()`  slot will be
 * called with the div as argument. The  return of this slot will be the
 * waiting text to display instead of yes/no buttons.
 */
Modal.confirm = function(widget, onOK, onCancel) {
  var div = D("tfw-modal-confirm");
  var row = D();
  var wait = W({color: "#000", caption: _("processing")}).css("color", "#000");
  div.setWait = function(text) {
    wait.text(text);
  };
  div.hide = function() {
    div.detach();
  };
  row.append(
    LR(
      B(_("no")).Tap(
        function() {
          div.detach();
          if (typeof onCancel === 'function') {
            onCancel();
          }
        }
      ),
      B(_("yes")).addClass("warning").Tap(
        function() {
          if (typeof onOK === 'function') {
            row.clear(wait);
            onOK(div);
          } else {
            div.detach();
          }
        }
      )
    )
  );
  div.append(      // table
    D().append(    // table-cell
      D().append(widget),
      Widget.tag("br"),
      row
    )
  );
  div.appendToBody();
  return div;
};

module.exports = Modal;
