"use strict";
var Widget = require("wdg");
var D = Widget.div;
var T = Widget.tag;

/****************************************
@example
var Grader = require("tfw.grader");
var options = {
  header: "function(textToReverse) {";
  footer: "}";
  grader: function(resolve, reject) {
    this.expect("Hello!").toBe("!olleH");
    this.expect("bob").toBe("bob");
 }
};
var instance = new Grader(options);

@class Grader
****************************************/
var Grader = function(options) {
console.info("[tfw.grader] options=", options);
    var that = this;

    Widget.call(this);
    this.addClass("tfw-grader");
    this._options = options;
    if (options.header) {
        this.append(T('pre').text(options.header));
    }
    var area = T("textarea").attr({cols: 80, rows: 12});
    area.text(localStorage.getItem('grader#' + this.attr('id')) || '');
    this.append(area);
    if (options.footer) {
        this.append(T('pre').text(options.footer));
    }
    var btn = Widget.tag('button').text("Valider").Tap(function() {
        that.grade(area.element().value);
        localStorage.setItem('grader#' + this.attr('id'), area.element().value);
    });
    var ok = Widget.tag('div').addClass('ok');
    var error = Widget.tag('pre').addClass('error');
    this.append(btn, ok, error);
    this._btn = btn;
    this._ok = ok;
    this._error = error;

    area.element().addEventListener('keyup', function() {
        btn.removeAttr("disabled");
        error.text('');
        ok.text('').removeClass('show');
    });
};

// Extension of Widget.
Grader.prototype = Object.create(Widget.prototype);
Grader.prototype.constructor = Grader;

/**
 * @return void
 */
Grader.prototype.grade = function(testContent) {
    var opt = this._options;
    if (opt.header) testContent = opt.header + testContent;
    if (opt.footer) testContent += opt.footer;
    
    var f;
    try {
        eval("f=" + testContent);
    }
    catch(ex) {
        console.error(ex);
        return this.fail("La syntaxe de votre code est invalide!\n" + ex);
    }

    var wrapper;
    try {
        wrapper = this.wrapper(f);
    }
    catch(ex) {
        console.error(ex);
        return this.fail("Le grader lui-même a provoqué une exception!\n" + ex);
    }

    var grader = opt.grader;

    if (typeof grader !== 'function') {
        return this.fail("Ce grader n'a pas de fonction de vérification!");
    }
    
    try {
        var jasmine = new Jasmine(wrapper);
        grader.call(jasmine);
        this._ok.text("Votre code est correct. Bravo !").addClass('show');
    }
    catch(ex) {
        console.error(ex);
        if (ex && ex.fail) {
            return this.fail(ex.fail);
        } else {
            return this.fail("Votre code a déclenché une exception!\n" + ex);
        }
    }
};

/**
 * @return void
 */
Grader.prototype.fail = function(txt) {
    this._btn.attr("disabled", "disabled");
    this._error.text(txt);
};


/**
 * @return wrapper function which will call the tested function.
 */
Grader.prototype.wrapper = function(f) {
    if (typeof this._options.wrapper !== 'function') {
        return f;
    }
    return this._options.wrapper(f);
};


Grader.create = function(options) {
    return new Grader(options);
};
module.exports = Grader;



function Jasmine(wrapper) {
    this._runtime = null;
    this._wrapper = wrapper;
};

Jasmine.prototype.fail = function(msg) {
    throw {fail: msg};
};

Jasmine.prototype.expect = function() {
    try {
        var args = [], i;
        for (i = 0 ; i < arguments.length ; i++) {
            args.push(arguments[i]);
        }
        var result = this._wrapper.apply(this, args);
        var runtime = new Runtime(result, args);
        return runtime;
    }
    catch(ex) {
        if (ex.fail) {
            throw ex;
        }
        throw {fail: "Votre code a provoqué une exception!\n" + ex};
    }
}


function Runtime(result, args) {
    this._inverted = 0;
    this._result = result;
    this._args = args;
}

Runtime.prototype.not = function() {
    this._inverted = 1 - this._inverted;
    return this;
};

Runtime.prototype.toBe = function(value) {
    if (this._inverted) {
        if (this._result === value) {
            throw {
                fail: "Expected " + JSON.stringify(this._result)
                    + " NOT to be " + JSON.stringify(value) + "!",
                expected: value,
                result: this._result,
                args: this._args
            };
        }
    } else {
        if (this._result !== value) {
            throw {
                fail: "Expected " + JSON.stringify(this._result)
                    + " to be " + JSON.stringify(value) + "!",
                expected: value,
                result: this._result,
                args: this._args
            };
        }
    }
};
