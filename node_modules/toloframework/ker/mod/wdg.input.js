var Widget = require("wdg");

/**
 * HTML5 text input with many options.
 *
 * @param {string} opts.value Initial value.
 * @param {string} opts.type Input's type. Can be `text`, `password`, ...
 * @param {string} opts.name The name can be used by the browser to give a help combo.
 * @param {string} opts.placeholder Text to display when input is empty.
 * @param  {function|regexp}  opts.validator  function  to  check  the
 * validity  of this  input. Takes  the  input value  as argument  and
 * returns a boolean. `onEnter` is not fired until input is valid. You
 * can use a RegExp instead of a function to check validity.
 * @param {function|object}  opts.onEnter function  to call  when user
 * hits  `enter` key.  `function(this)`. It  can be  an object  with a
 * function called `fire()`.
 * @param  {function|object}   opts.onValid  function  to   call  when
 * validator has been called. `function(validity, this)`. It can be an
 * object  with  a  function   `enabled({boolean})`.  For  instance  a
 * `wdg.Button`.
 *
 * @example
 * var Input = require("wdg.input");
 * var opts = {
 *   placeholder: 'email address';
 *   validator: /[^@]+@([^@\.]+\.)*[^@\.]+/,
 *   onEnter: function(wdg) {
 *     console.log("Enter has been hitten!");
 *   },
 *   onValid: function(validity, wdg) {
 *     console.log("Validity: ", validity);
 *   }
 * }
 * var instance = new Input(opts);
 * @example
 * var I = require("wdg.input").create;
 * var btnNext = B(_("next")).Tap(
 *   function() {
 *     alert("Youpi!");
 *   }
 * );
 * var login = I(
 *     {
 *         type: "email",
 *         name: "email",
 *         placeholder: _("email"),
 *         validator: /^[^@]+@[^@]+$/,
 *         onEnter: btnNext,
 *         onValid: btnNext
 *     }
 * );

 * @class Input
 */
var Input = function(opts) {
    Widget.call(this);
    var input = Widget.tag("input");
    this._input = input;
    var that = this;
    this.addClass("wdg-input");
    if (typeof opts !== 'object') opts = {};
    if (typeof opts.type !== 'string') opts.type = 'text';
    input.attr("type", opts.type);
    if (typeof opts.placeholder === 'string') {
        input.attr("placeholder", opts.placeholder);
    }
    if (typeof opts.size !== 'undefined') {
        opts.size = parseInt(opts.size) || 8;
        input.attr("size", opts.size);
    }
    if (typeof opts.width !== 'undefined') {
        input.css("width", opts.width);
    }
    var onValid = opts.onValid;
    if (typeof onValid === 'object' && typeof onValid.enabled === 'function') {
        opts.onValid = function(v) {
            onValid.enabled(v);
        };
    }
    else if (typeof onValid !== 'function') opts.onValid = null;

    if (typeof opts.validator === 'object') {
        var rx = opts.validator;
        opts.validator = function(v) {
            return rx.test(v);
        };
    }
    this._valid = 0;
    if (typeof opts.validator === 'function') {
        input.addEvent(
            "keyup",
            function() {
                opts.validator.call(this);
            }
        );
    }
    input.addEvent(
        "keyup",
        function() {
            that.fireChange();
        }
    );
    if (typeof opts.onEnter === 'object' && typeof opts.onEnter.fire === 'function') {
        var onEnter = opts.onEnter;
        this.Enter(function() {
            onEnter.fire();
        });
    }
    input.addEvent(
        "keyup",
        function(evt) {
            if (that._valid > -1 && evt.keyCode == 13) {
                // On  rend l'événement  asynchrone pour  éviter les
                // problèmes de clavier virtuel qui reste affiché.
                window.setTimeout(
                    function() {
                        that.fireEnter();
                    }
                );
            } else {
                that.validate();
            }
        }
    );
    if (typeof opts.value !== 'string') {
        opts.value = "";
    }
    input.addEvent(
        "focus",
        function() {
            that.selectAll();
        }
    );
    this._opts = opts;
    this.val(opts.value);

    if (typeof opts.label !== 'undefined') {
        var label = Widget.div("label").text(opts.label).attr("title", opts.label);
        this.append(label);
    }
    this.append(input);
};

// Cette classe hérite de Widget
Input.prototype = Object.create(Widget.prototype);
Input.prototype.constructor = Input;

/**
 * Force value validation.
 */
Input.prototype.validate = function() {
    var opts = this._opts;
    if (typeof opts.validator !== 'function') return this;
    var onValid = opts.onValid;
    try {
        if (opts.validator(this.val())) {
            this._valid = 1;
            this._input.removeClass("not-valid").addClass("valid");
            if (onValid) onValid(true, this);
        } else {
            this._valid = -1;
            this._input.removeClass("valid").addClass("not-valid");
            if (onValid) onValid(false, this);
        }
    }
    catch (ex) {
        console.error("[wdg.input] Validation error: ", ex);
    }
    return this;
};

/**
 * @return void
 */
Input.prototype.fireChange = function() {
    var slot = this._Change;
    if (typeof slot === 'function') {
        slot.call(this);
    }
};

/**
 * Accessor for attribute Change.
 */
Input.prototype.Change = function(slot) {
    if (typeof slot === 'undefined') return this._Change;
    if (typeof slot === 'function') {
        this._Change = slot;
    }
    return this;
};

/**
 * Accessor for attribute Enter.
 */
Input.prototype.Enter = function(slot) {
    if (typeof slot === 'undefined') return this._Enter;
    if (typeof slot === 'function') {
        this._Enter = slot;
    }
    return this;
};

/**
 * @return void
 */
Input.prototype.fireEnter = function() {
    var slot = this._Enter;
    if (typeof slot === 'function') {
        slot.call(this);
    }
};

/**
 * Select whole text.
 * @return {this}
 */
Input.prototype.selectAll = function() {
    var e = this._input.element();
    e.setSelectionRange(0, e.value.length);
    return true;
};

/**
 * Accessor for textual content of this input.
 */
Input.prototype.val = function(v) {
    var e = this._input.element();
    if (typeof v === 'undefined') return e.value;
    e.value = v;
    this.validate();
    return this;
};

/**
 * @return void
 */
Input.prototype.focus = function() {
    var e = this._input.element();
    window.setTimeout(
        function() {
            e.focus();
        },
        1
    );
    return this;
};

/**
 * @return void
 */
Input.prototype.isValid = function() {
    return this._valid == 1 ? true : false;
};

/**
 * @return void
 */
Input.prototype.enabled = function(v) {
    if (typeof v === 'undefined') {
        return this._input.hasAttr("disabled");
    }
    if (v) {
        this._input.removeAttr("disabled");
    } else {
        this._input.attr("disabled", "true");
    }
    return this;
};

Input.create = function(opts) {
    return new Input(opts);
};
module.exports = Input;
