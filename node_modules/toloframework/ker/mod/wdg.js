'use strict';

/**
 * Widgets inherit this class.
 */
function Widget(options) {
    this.__data = {};
    try {
        var e;
        if (typeof options === 'undefined') options = {};
        if (typeof options.innerHTML !== 'undefined' && typeof options.childNodes !== 'undefined') {
            // On passe directement un élément.
            options = {element: options};
        }
        if (typeof options.tag === 'undefined') options.tag = "div";
        if (options.element) {
            this.element(options.element);
        } else if (typeof options.id !== 'undefined') {
            e = window.document.getElementById(options.id);
            if (!e) {
                throw Error("Can't find element with id: \"" + options.id + "\"!");
            }
            this.element(e);
        } else {
            this.element(window.document.createElement(options.tag));
            this.addClass("wdg", "custom");
        }
    }
    catch (ex) {
        console.error("[widget] ", ex);
        console.error("[Widget] ", JSON.stringify(options));
        throw Error(ex);
    }
}

Widget.prototype = {
    /**
     * Accessor for attribute element
     * @return element
     */
    element: function(v) {
        if (v === undefined) return this._element;
        if (typeof v === 'string') {
            v = window.document.querySelector(v);
        }
        this._element = v;
        return this;
    },

    data: function(k, v) {
        if (typeof v === 'undefined') {
            return this.__data[k];
        }
        this.__data[k] = v;
        return this;
    },

    /**
     * @description
     * Remove this element from its parent.
     * @memberof wdg
     */
    detach: function() {
        var e = this._element;
        if (e) {
            var p = e.parentNode;
            if (p) {
                p.removeChild(e);
            }
        }
        return this;
    },

    /**
     * @description
     *
     * @param name
     * @memberof wdg
     */
    addEvent: function(name, slot, sender) {
        if (typeof slot === 'string') {
            var that = this, key = slot;
            if (typeof sender === 'undefined') sender = this;
            slot = function(x) {
                var f = sender[key];
                if (typeof f === 'function') {
                    f.call(sender, x);
                } else {
                    throw Error("\"" + slot + "\" is not a function of: " + sender);
                }
            };
        }
        var e = this.element();
        if (name == 'tap') {
            e.addEventListener(
                "mousedown",
                function(evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                },
                false
            );
            e.addEventListener(
                "mouseup",
                function(evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    slot(evt);
                },
                false
            );
            e.addEventListener("touchend", slot, false);

        } else {
            e.addEventListener(name, slot, false);
        }
        return this;
    },

    /**
     * Retire un attribut à l'élément sous-jacent.
     * @example
     * this.removeAttr("selected");
     * @memberof wdg
     */
    removeAttr: function() {
        if (this._element) {
            var i, arg;
            for (i = 0 ; i < arguments.length ; i++) {
                arg = arguments[i];
                this._element.removeAttribute(arg);
            }
        }
        return this;
    },

    /**
     * Teste l'existence d'un attribut dans l'élément sous-jacent.
     * @memberof wdg
     */
    hasAttribute: function(key) {
        if (!this._element) return false;
        return this._element.hasAttribute(key);
    },

    /**
     * Lit ou affecte la valeur d'un attribut de l'élément sous-jacent.
     * @example
     * // Le pseudo attribut '$' sert à insérer du texte.
     * var div = new Widget();
     * div.attr({$: 'Hello world!', title: 'Typical first sentence...'});
     * @param key Nom de l'attribut ou dictionnaire des attributs.
     * @param val [Facultatif] Valeur de l'attribut. Si elle est omise, la méthode retourne la valeur actuelle.
     * @param ns [Facultatif] Namespace éventuel.
     * @memberof wdg
     */
    attr: function(key, val, ns) {
        var k;
        if (!this._element || !this._element.getAttribute) return null;
        if (typeof key == "string") {
            if (val !== undefined) {
                if (key == "class") {
                    this._element.className = val;
                    return this;
                }
                if (ns && this._element.setAttributeNS) {
                    this._element.setAttributeNS(ns, key, val);
                }
                else {
                    this._element.setAttribute(key, val);
                }
                return this;
            }
            return this._element.getAttribute(key);
        }
        if (typeof key == "object") {
            for (k in key) {
                if (k == "class") {
                    this._element.className = key[k];
                } else if (k == "$") {
                    this.text(key[k]);
                } else {
                    this._element.setAttribute(k, key[k]);
                }
            }
        }
        return this;
    },


    /**
     * Permet de changer le style de l'élément sous-jacent.
     * @example
     * this.css("color", "red");
     * alert(this.css("display"));
     * this.css(
     *   {
     *     margin: "0px",
     *     padding: "3px",
     *     border: "1px solid black"
     *   }
     * );
     * @param key Nom du champ de style ou dictionnaire clefs/valeurs.
     * @param val  Valeur du champ key.  S'il est omis et  que "key"
     * est  de type  string,  alors la  méthode  retourne la  valeur
     * actuelle.
     * @memberof wdg
     */
    css: function(key, val) {
        var k, e = this._element;
        if (!e) return null;
        if (typeof e.style !== 'object') {
            console.error("[wdg.css] This element does not support styles!", e);
            e.style = {};
        }
        if (typeof key == 'string') {
            if (val) {
                e.style[key] = val;
                return this;
            }
            return e.style[key];
        }
        if (typeof key == 'object') {
            for (k in key) {
                try {
                    e.style[k] = key[k];
                } catch (x) {
                    console.error("[wdg.css] Bad CSS attribute " + k + ": " + key[k]);
                }
            }
        }
        return this;
    },

    insertAfter: function(target) {
        if (typeof target.element === 'function') {
            target = target.element();
        }
        target.parentNode.insertBefore(this.element(), target.nextSibling);
        return this;
    },

    insertBefore: function(target) {
        if (typeof target.element === 'function') {
            target = target.element();
        }
        target.parentNode.insertBefore(this.element(), target);
        return this;
    },

    /**
     * Append children to this widget.
     */
    append: function() {
        var i, arg;
        for (i = 0 ; i < arguments.length ; i++) {
            arg = arguments[i];
            if (typeof arg === 'number') arg = "" + arg;
            if (typeof arg === 'undefined' || (typeof arg !== 'object' && typeof arg !== 'string')) {
                console.error("[Widget.append] Argument #" + i + " is invalid!", arguments);
                console.error("[Widget.append] Is type is: " + (typeof arg));
                continue;
            };
            if (typeof arg === 'string') {
                if (arg.length < 1) arg = " ";
                arg = window.document.createTextNode(arg);
                if (!arg) {
                    console.error(
                        "[Widget.append] Unable to create a text node with this text: ", arg
                    );
                    console.error("[wdg] arguments=...", arguments);
                    throw Error(
                        "[Widget.append] Unable to create a text node with this text: "
                            + JSON.stringify(arg)
                    );
                }
            }
            if (Array.isArray(arg)) {
                arg.forEach(
                    function(item) {
                        this.append(item);
                    }, this
                );
            } else {
                var e = typeof arg.element === 'function' ? arg.element() : arg;
                this._element.appendChild(e);
                /*
                 if (typeof arg.onAppend === 'function') {
                 arg.onAppend.call(arg);
                 }
                 */
            }
        }
        return this;
    },

    /**
     * @description
     * Append this widget to a parent.
     * @param parent
     * @memberof wdg
     */
    appendTo: function(parent) {
        if (!parent) return this;
        if (typeof parent.append === 'function') {
            parent.append(this);
        } else if (typeof parent.appendChild === 'function') {
            parent.appendChild(this._element);
            this.onAppend();
        }
        return this;
    },

    /**
     * @description
     * Append this widget to BODY.
     * @memberof wdg
     */
    appendToBody: function() {
        window.document.body.appendChild(this._element);
        return this;
    },

    hasClass: function() {
        var e = this._element.classList;
        var i, arg;
        for (i = 0 ; i < arguments.length ; i++) {
            arg = arguments[i];
            if (!e.contains(arg)) return false;
        }
        return true;
    },

    /**
     * @description
     * Add CSS classe(s) to this widget.
     * @memberof wdg
     */
    addClass: function() {
        var e = this._element.classList;
        var i, arg;
        for (i = 0 ; i < arguments.length ; i++) {
            arg = arguments[i];
            if (typeof arg === 'string') {
                arg = arg.trim();
                if (arg.length > 0) e.add(arg);
            } else {
                console.error("[wdg.addClass] Arguments with bad type!", arguments);
            }
        }
        return this;
    },

    /**
     * @description
     * Remove CSS classe(s) to this widget.
     * @memberof wdg
     */
    removeClass: function() {
        var e = this._element.classList;
        var i, arg;
        for (i = 0 ; i < arguments.length ; i++) {
            arg = arguments[i];
            e.remove(arg);
        }
        return this;
    },

    /**
     * @description
     * Toggle CSS classe(s) to this widget.
     * @memberof wdg
     */
    toggleClass: function() {
        var e = this._element.classList;
        var i, arg;
        for (i = 0 ; i < arguments.length ; i++) {
            arg = arguments[i];
            e.toggle(arg);
        }
        return this;
    },

    /**
     * Remove all children of this widget.
     * Any argument passed will be appended to this widget.
     * @memberof wdg
     */
    clear: function() {
        // (!) On préfère retirer les éléments un par un du DOM plutôt que d'utiliser simplement
        // this.html("").
        // En effet, le code simplifié a des conséquences inattendues dans IE9 et IE10 au moins.
        // Le bug des markers qui disparaissaients sur les cartes de Trail-Passion 4 a été corrigé
        // avec cette modification.
        var e = this.element();
        while(e.firstChild){
            e.removeChild(e.firstChild);
        }
        var i, arg;
        for (i = 0 ; i < arguments.length ; i++) {
            arg = arguments[i];
            this.append(arg);
        }

        return this;
    },

    /**
     * 1) Sans argument, cette  fonction retourne le texte contenu
     * dans ce widget.
     * 2) Avec  un texte en  argument, cette fonction  retire tous
     * les  enfants de  ce widget  et  les remplace  par un  noeud
     * texte.
     * 3)  Avec un  élément  du DOM  en  argument, cette  fonction
     * retourne le texte contenu par ce dernier.
     * @memberof tfw.Widget
     */
    text: function(arg) {
        var e, text, i, child;
        if (typeof arg == 'string' || typeof arg == 'number') {
            arg = '' + arg;
            if (arg.substr(0, 6) == '<html>') return this.html( arg.substr( 6 ) );
            
            this.clear();
            this._element.appendChild(window.document.createTextNode(arg));
            return this;
        } else {
            // On retourne le contenu textuel de ce widget.
            e = this._element;
            if (arg !== undefined) {
                // On peut passer un élément du DOM pour en extraire son contenu textuel.
                e = arg;
            }
            text = "";
            if (e.childNodes) {
                for (i=0 ; i<e.childNodes.length ; i++) {
                    child = e.childNodes[i];
                    if (child.nodeType == 3) {
                        if (child.nodeValue) {
                            text += child.nodeValue;
                        }
                    } else {
                        text += this.text( child );
                    }
                }
            }
            return text;
        }
    },

    /**
     * @description
     *
     * @param html
     * @memberof wdg
     */
    html: function(html) {
        if (typeof html === 'undefined') return this._element.innerHTML;
        if (this._element) this._element.innerHTML = html;
        return this;
    },

    /**
     * @description
     * If applicable, give focus to this element.
     * @memberof wdg
     */
    focus: function() {
        var e = this._element;
        if (!e) return this;
        if (typeof e.focus === 'function') {
            e.focus();
        }
        return this;
    },

    /**
     * @description
     * Returns the bounds of the underlying element.
     * @memberof wdg
     */
    rect: function() {
        var e = this._element;
        if (!e) return null;
        return e.getBoundingClientRect();
    },

    /**
     * @description
     *
     * @param
     * @memberof wdg
     */
    Tap: function(slot, sender) {
        if (typeof slot === 'undefined') return this._Tap;
        var that = this;
        if (typeof sender === 'undefined') sender = that;
        if (typeof slot === 'string') slot = sender[slot];
        if (!this._Tap) {
            this.activatePointerEvents();
        }
        this._Tap = [slot, sender];
        return this;
    }
};

/**
 * @return void
 */
Widget.prototype.activatePointerEvents = function() {
    if (this._pointerEvents) return this;
    this._pointerEvents = {start: 0};

    /*
     interact(this.element()).on("tap", function(evt) {
     var slot = that._Tap;
     if (slot) {
     slot[0].call(slot[1], {x: evt.x, y: evt.y});
     }
     });
     return this;
     */
    var pe = this._pointerEvents;
    var that = this;
    this.addEvent(
        "touchstart",
        function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            pe.touch = 1;
            pe.start = Date.now();
        }
    );
    this.addEvent(
        "touchend",
        function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            var tap = that._Tap;
            if (!tap) return;
            pe.touch = 0;
            var delta = Date.now() - pe.start;
            if (delta > 50) {
                tap[0].call(tap[1], evt);
            }
        }
    );
    this.addEvent(
        "mousedown",
        function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            if (pe.touch) return;
            pe.start = Date.now();
        }
    );
    this.addEvent(
        "mouseup",
        function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            var tap = that._Tap;
            if (!tap) return;
            var delta = Date.now() - pe.start;
            if (delta > 50) {
                tap[0].call(tap[1], evt);
            }
        }
    );

    return this;
};

/**
 * @return void
 */
Widget.prototype.div = function() {
    var div = new Widget();
    for (var i = 0 ; i < arguments.length ; i++) {
        div.addClass(arguments[i]);
    }
    return div;
};

Widget.prototype.tag = function(tag) {
    if (typeof tag === 'undefined') tag = 'div';
    var div = new Widget({tag: tag});
    for (var i = 1 ; i < arguments.length ; i++) {
        div.addClass(arguments[i]);
    }
    return div;
};

/**
 * @return void
 */
Widget.prototype.isInDOM = function() {
    return Widget.isInDOM(this.element());
};

/**
 * Fonction à surcharger  si on veut réagir lors de  l'insertion dans le
 * DOM.
 */
Widget.prototype.onAppend = function() {};

Widget.create = function(args) {
    return new Widget(args);
};

Widget.find = function(query) {
    return new Widget({element: window.document.querySelector(query)});
};


/**
 * Create a SVG élément with attributes.
 */
Widget.svg = function(tag, attribs) {
    var namespace = "http://www.w3.org/2000/svg";
    if (typeof tag === 'object') {
        attribs = tag;
        tag = "svg";
    }
    if (typeof tag !== 'string') tag = 'svg';
    var e = window.document.createElementNS(namespace, tag);
    var w = new Widget({element: e});
    if (typeof attribs === 'undefined') attribs = {};
    if (tag == 'svg') {
        if (typeof attribs.version === 'undefined') attribs.version = "1.1";
        if (typeof attribs['xmlns:svg'] === 'undefined') {
            attribs['xmlns:svg'] = 'http://www.w3.org/2000/svg';
        }
        if (typeof attribs['xmlns'] === 'undefined') {
            attribs['xmlns'] = 'http://www.w3.org/2000/svg';
        }
        if (typeof attribs['xmlns:xlink'] === 'undefined') {
            attribs['xmlns:xlink'] = 'http://www.w3.org/1999/xlink';
        }
        if (typeof attribs.viewBox === 'undefined'
            && typeof attribs.width === 'number'
            && typeof attribs.height === 'number')
        {
            attribs.viewBox = "0 0 " + attribs.width + " " + attribs.height;
        }
    }
    if (typeof attribs === 'object') {
        w.attr(attribs);
    }
    return w;
};

/**
 * Tester si le widget ou élément est actuellement attaché au DOM.
 */
Widget.isInDOM = function(e) {
    if (!e) return false;
    if (typeof e.element === 'function') {
        e = e.element();
    }
    if (e === window.document) return true;
    return Widget.isInDOM(e.parentNode);
};

/**
 * Create a `span` with a text or an HTML content.
 * If `txt` starts with `<html>`, we set an HTML content.
 */
Widget.fromTextOrHtml = function(txt) {
    var e = Widget.span();
    if (txt.substr(0, 6) == '<html>') {
        e.html(txt.substr(6));
    } else {
        e.text(txt);
    }
    return e;
};

/**
 * Create a DIV and apply all arguments as classes to it.
 */
Widget.div = function() {
    var div = new Widget({tag: "div"});
    for (var i = 0 ; i < arguments.length ; i++) {
        div.addClass(arguments[i]);
    }
    return div;
};

/**
 * Create a SPAN and apply all arguments as classes to it.
 */
Widget.span = function() {
    var div = new Widget({tag: "span"});
    for (var i = 0 ; i < arguments.length ; i++) {
        div.addClass(arguments[i]);
    }
    return div;
};

Widget.tag = function(tag) {
    if (typeof tag === 'undefined') tag = 'div';
    var div = new Widget({tag: tag});
    for (var i = 1 ; i < arguments.length ; i++) {
        div.addClass(arguments[i]);
    }
    return div;
};

Widget.id = function(id) {
    return new Widget({element: window.document.getElementById(id)});
};

/**
 * Widget defining the `document.body` element.
 */
Widget.body = new Widget(window.document.body);

module.exports = Widget;



/*
 * classList.js: Cross-browser full element.classList implementation.
 * 2014-07-23
 *
 * http://purl.eligrey.com/github/classList.js/blob/master/classList.js
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

// Full polyfill for browsers with no classList support
if (!("classList" in window.document.createElement("_"))) {
    (function () {
        "use strict";

        if (!('Element' in window)) return;

        var classListProp = "classList";
        var protoProp = "prototype";
        var elemCtrProto = window.Element[protoProp];
        var objCtr = Object;
        var strTrim = String.prototype.trim || function () {
            var rx = new RegExp("^\\s+|\\s+$", "g");
            return this.replace(rx, '');
        };
        var arrIndexOf = Array[protoProp].indexOf || function (item) {
            var
            i = 0
            , len = this.length
            ;
            for (; i < len; i++) {
                if (i in this && this[i] === item) {
                    return i;
                }
            }
            return -1;
        }
        // Vendors: please allow content code to instantiate DOMExceptions
        , DOMEx = function (type, message) {
            this.name = type;
            this.code = DOMException[type];
            this.message = message;
        }
        , checkTokenAndGetIndex = function (classList, token) {
            if (token === "") {
                throw new DOMEx(
                    "SYNTAX_ERR"
                    , "An invalid or illegal string was specified"
                );
            }
            if ((new RegExp("\\s")).test(token)) {
                throw new DOMEx(
                    "INVALID_CHARACTER_ERR"
                    , "String contains an invalid character"
                );
            }
            return arrIndexOf.call(classList, token);
        }
        , ClassList = function (elem) {
            var
            trimmedClasses = strTrim.call(elem.getAttribute("class") || "")
            , classes = trimmedClasses ? trimmedClasses.split(new RegExp("\\s+")) : []
            , i = 0
            , len = classes.length
            ;
            for (; i < len; i++) {
                this.push(classes[i]);
            }
            this._updateClassName = function () {
                elem.setAttribute("class", this.toString());
            };
        }
        , classListProto = ClassList[protoProp] = []
        , classListGetter = function () {
            return new ClassList(this);
        }
        ;

        // Most DOMException implementations don't allow calling DOMException's toString()
        // on non-DOMExceptions. Error's toString() is sufficient here.
        DOMEx[protoProp] = Error[protoProp];
        classListProto.item = function (i) {
            return this[i] || null;
        };
        classListProto.contains = function (token) {
            token += "";
            return checkTokenAndGetIndex(this, token) !== -1;
        };
        classListProto.add = function () {
            var
            tokens = arguments
            , i = 0
            , l = tokens.length
            , token
            , updated = false
            ;
            do {
                token = tokens[i] + "";
                if (checkTokenAndGetIndex(this, token) === -1) {
                    this.push(token);
                    updated = true;
                }
            }
            while (++i < l);

            if (updated) {
                this._updateClassName();
            }
        };
        classListProto.remove = function () {
            var
            tokens = arguments
            , i = 0
            , l = tokens.length
            , token
            , updated = false
            , index
            ;
            do {
                token = tokens[i] + "";
                index = checkTokenAndGetIndex(this, token);
                while (index !== -1) {
                    this.splice(index, 1);
                    updated = true;
                    index = checkTokenAndGetIndex(this, token);
                }
            }
            while (++i < l);

            if (updated) {
                this._updateClassName();
            }
        };
        classListProto.toggle = function (token, force) {
            token += "";

            var
            result = this.contains(token)
            , method = result ?
                force !== true && "remove"
                :
                force !== false && "add"
            ;

            if (method) {
                this[method](token);
            }

            if (force === true || force === false) {
                return force;
            } else {
                return !result;
            }
        };
        classListProto.toString = function () {
            return this.join(" ");
        };

        if (objCtr.defineProperty) {
            var classListPropDesc = {
                get: classListGetter, enumerable: true, configurable: true
            };
            try {
                objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
            } catch (ex) { // IE 8 doesn't support enumerable:true
                if (ex.number === -0x7FF5EC54) {
                    classListPropDesc.enumerable = false;
                    objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
                }
            }
        } else if (objCtr[protoProp].__defineGetter__) {
            elemCtrProto.__defineGetter__(classListProp, classListGetter);
        }
    }());
} else {
    // There is full or partial native classList support, so just check if we need
    // to normalize the add/remove and toggle APIs.
    (function () {
        "use strict";

        var testElement = window.document.createElement("_");

        testElement.classList.add("c1", "c2");

        // Polyfill for IE 10/11 and Firefox <26, where classList.add and
        // classList.remove exist but support only one argument at a time.
        if (!testElement.classList.contains("c2")) {
            var createMethod = function(method) {
                var original = DOMTokenList.prototype[method];

                DOMTokenList.prototype[method] = function(token) {
                    var i, len = arguments.length;

                    for (i = 0; i < len; i++) {
                        token = arguments[i];
                        original.call(this, token);
                    }
                };
            };
            createMethod('add');
            createMethod('remove');
        }

        testElement.classList.toggle("c3", false);

        // Polyfill for IE 10 and Firefox <24, where classList.toggle does not
        // support the second argument.
        if (testElement.classList.contains("c3")) {
            var _toggle = DOMTokenList.prototype.toggle;

            DOMTokenList.prototype.toggle = function(token, force) {
                if (1 in arguments && !this.contains(token) === !force) {
                    return force;
                } else {
                    return _toggle.call(this, token);
                }
            };

        }
        testElement = null;
    }());
}
