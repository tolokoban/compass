/**
 * Tous les générateurs  de wtags héritent de cette  classe qui contient
 * des fonctions utiles communes.
 *
 * @class WTag
 * @namespace WTag
 */
function N(a) {
    var t = typeof a;
    if (t === 'number') return a;
    if (t === 'undefined') return 0;
    if (t === 'null') return 0;
    try {
        var v = parseFloat(a);
        if (isNaN(v)) return 0;
        return v;
    }
    catch (e) {
        return 0;
    }
}

function S(a) {
    return "" + a;
}





window["TFW::WTag"] = {
    classInit: function(vars) {
        $$("dom.Util");
        vars.globalSlots = {};
    },

    /**
     * @constructs WTag
     */
    init: function() {
        // Store here all the stuff needed to make a cleanup when method `destroy` is called.
        this._widgetCleanUp = {
            signals: [],
            globalSignals: [],
            dataBindings: []
        };

        var element;
        if (typeof this._id === 'object') {
            element = this._id;
        } else {
            element = document.getElementById(this._id);
        }
        if (!element) {
            throw new Error("There is no element with id \"" + this._id + "\"!");
        }
        element.$widget = this;
        this._element = element;
        this._slots = {};

        // Look for binding expressions.
        // See in widgets the function Util.bindable(...).
        var key, attName;
        for (key in this) {
            if (key.substr(0, 3) == '_G$') {
                // There is a getter for data binding.
                attName = key.substr(3);
                this["_V$" + attName].forEach(
                    function(dataName) {
                        this.bindData(dataName, attName, this[key]);
                    }, this
                );
                this[attName].call(this, this[key].call(this));
            }
        }
    },


    functions: {
        /**
         * Fire a "signal" up to the parents widgets.
         * If a slot returns false, the event is fired up to the parents.
         *
         * @param signal Name of the signal to trigger.
         * @param arg Optional argument to sent with this signal.
         * @param emitter Optional reference to the signal's emitter.
         * @memberof WTag
         */
        fire: function(signal, arg, emitter) {
            var widget = this,
            slot;
            if (typeof emitter === 'undefined') emitter = this;
            console.log("fire(" + signal + ")", arg);
            if (signal.charAt(0) == '@') {
                // This is a global signal.
                slot = $$.statics("WTag");
                if (slot) {
                    slot = slot.globalSlots[signal];
                    if (slot) {
                        slot[1].call(slot[0], arg, signal, emitter);
                    } else {
                        console.error(
                            "[WTag.fire] Nothing is binded on global signal \""
                                + signal + "\"!"
                        );
                    }
                }
            }
            if (signal.charAt(0) == '$') {
                // Assign a value to a data.
                this.data(signal.substr(1).trim(), arg);
            }
            else {
                while (widget) {
                    slot = widget._slots[signal];
                    if (typeof slot === 'function') {
                        if (false !== slot.call(widget, arg, signal, emitter)) {
                            return;
                        }
                    }
                    widget = widget.parentWidget();
                }
                console.warning("Signal lost: " + signal + "!");
            }
        },

        /**
         * Register a  listener (the  function "slot") for  the signal
         * "signal". If  this slot  returns true, the  signal continue
         * its ascension towards parent widgets.
         *
         * @param signal Name of the signal to catch.
         * @param slot Function to call to process this signal
         * @memberof WTag
         * @inner
         * @memberof WTag
         */
        registerSignal: function(signal, slot) {
            if (signal.charAt(0) == '@') {
                // Registering a global signal.
                $$.statics("WTag").globalSlots[signal] = [this, slot];
            } else {
                this._slots[signal] = slot;
            }
        },

        /**
         * Stop listening for the "signal".
         * @memberof WTag
         */
        unregisterSignal: function(signal) {
            delete this._slots[signal];
        },

        /**
         * Call the slot mapped to the "signal".
         * @param signal : name of the signal on which this object may be registred.
         * @param arg : argument to pass to the registred slot.
         * @memberof WTag
         */
        slot: function(signal, arg) {
            var slot = this._slots[signal];
            if (slot) {
                slot.call(this, arg, signal);
                return true;
            }
            return false;
        },

        /**
         * Get the parent element.
         * @memberof WTag
         */
        parentElement: function() {
            return this._element.parentNode;
        },

        /**
         * Get the parent widget.
         * @memberof WTag
         */
        parentWidget: function() {
            var element = this._element;
            while (element.parentNode) {
                element = element.parentNode;
                if (element.$widget) {
                    return element.$widget;
                }
            }
            return null;
        },

        /**
         * Return or set the current language.
         * @memberof WTag
         */
        lang: function(id) {
            if (!$$.App) $$.App = this;
            if (!$$.App._languages) {
                // Initialise localization.
                var languages = [],
                langStyle = document.createElement("style"),
                children = document.querySelectorAll("[lang]");
                document.head.appendChild(langStyle);
                $$.App._langStyle = langStyle;
                for (var i = 0 ; i < children.length ; i++) {
                    var child = children[i];
                    lang = child.getAttribute("lang");
                    found = false;
                    for (k = 0 ; k < languages.length ; k++) {
                        if (languages[k] == lang) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        languages.push(lang);
                    }
                }
                $$.App._languages = languages;
            }

            var that = this, lang, k, found, first, txt;
            languages = $$.App._languages;
            if (id === undefined) {
                // Return current language.
                lang = $$.lang();  // localStorage.getItem("wtag-language");
                if (!lang) {
                    lang = navigator.language || navigator.browserLanguage || "fr";
                    lang = lang.substr(0, 2);
                }
                $$.lang(lang);
                // localStorage.setItem("wtag-language", lang);
                return lang;
            } else {
                // Set current language and display localized elements.
                found = false;
                for (k = 0 ; k < languages.length ; k++) {
                    if (languages[k] == id) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    id = languages[0];
                }
                txt = "";
                first = true;
                for (k = 0 ; k < languages.length ; k++) {
                    lang = languages[k];
                    if (lang != id) {
                        if (first) {
                            first = false;
                        } else {
                            txt += ",";
                        }
                        txt += "[lang=" + lang + "]";
                    }
                }
                $$.App._langStyle.textContent = txt + "{display: none}";
                $$.lang(id);
                //localStorage.setItem("wtag-language", id);
            }
        },

        /**
         * Get  an  element  with   this  `name`  among  this  element's
         * children.
         * @memberof WTag
         */
        findElement: function(name) {
            if (typeof name === 'undefined') return this._element;
            var e = this._element.querySelector("[name='" + name + "']");
            if (!e) {
                throw new Error(
                    "[WTag.get] Can't find child [name=\""
                        + name + "\"] in element \"" + this._id + "\"!"
                );
            }
            return e;
        },

        /**
         * Get the widget  mapped to the element with  this `name` among
         * this element's children.
         * @memberof WTag
         */
        findWidget: function(name) {
            if (typeof name === 'undefined') return this;
            var element = this.findElement(name);
            if (element) {
                return element.$widget;
            }
            return null;
        },

        /**
         * @description
         * Databindings are scoped and stored in the `$data` property of a DOM element.
         * We always take data from the nearest parent element.
         *
         * @param {string} name name of the data binding.
         * @return  object representing  data bindings.  The key  is the
         * name of  the data and the  value is a two-items  array. First
         * item is the current value for this data, and second item is a
         * list of all listeners.
         * Each listener is an object with these attributes:
         * * `obj`: the real listener object.
         * * `slot`: the method of `obj` to call with a value as unique argument, when datat has changed.
         * * `getter`: the method of `obj` to call in order to get the value to pass to `slot`.
         * @memberof WTag
         */
        findDataBinding: function(name) {
            var data, dataOwner, parent = this.findElement();
            while (parent) {
                dataOwner = parent;
                if (dataOwner.$data && name in dataOwner.$data) {
                    break;
                }
                if (dataOwner.nodeName.toLowerCase() == 'html') {
                    break;
                }
                parent = dataOwner.parentNode;
            }
            data = dataOwner.$data[name];
            if (typeof data === 'undefined') {
                data = ["", []];
                dataOwner.$data[name] = data;
            }
            return data;
        },

        /**
         * Set/Get bindable data.
         * @memberof WTag
         */
        data: function(name, value) {
            var data = this.findDataBinding(name);
            if (typeof value === 'undefined') {
                return data[0];
            }
            if (value !== data[0]) {
                data[0] = value;
                this.fireData(data);
            }
        },

        /**
         * @description
         * Simulate a data change.
         * @param {string|object} name name of the data, or the data binding object itself.
         * @memberof WTag
         */
        fireData: function(name) {
            var data = name;
            if (typeof name === 'string') {
                data = this.findDataBinding(name);
            }
            data[1].forEach(
                function(listener) {
                    var obj = listener.obj;
                    var slot = listener.slot;
                    var getter = listener.getter;
                    if (listener !== this) {
                        var value = getter.call(obj);
                        slot.call(obj, value);
                    }
                }
            );
        },

        /**
         * @description
         * Define a local data binding.
         * @param {string} name Name of this data.
         * @param value Initial value.
         * @memberof WTag
         */
        defineLocalData: function(name, value) {
            var e = this.findElement();
            if (!this._dataBinding) {
                e.$data = {};
            }
            e.$data[name] = [value, []];
        },

        /**
         * Bind to data updates.
         * When the data changed, the  `slot` is call with `this` object
         * and the data's value as unique argument.
         * @param {array} vars array of names of data to watch.
         * @param {function} slot function to call when data changed.
         * @param {string} slot name of the method to call when data changed.
         * @param {function} getter function getting the binded value.
         * @return {object} the listener you can give to `unbindData`.
         * @memberof WTag
         */
        bindData: function(vars, slot, getter) {
            if (!Array.isArray(vars)) {
                vars = [vars];
            }
            if (vars.length == 0) return null;
            if (typeof slot === 'string') {
                slot = this[slot];
            }
            if (typeof getter === 'undefined') {
                getter = function() {
                    return this.data(vars[0]);
                };
            }
            var listener = {
                obj: this,
                slot: slot,
                getter: getter
            };
            vars.forEach(
                function(name) {
                    var data = this.findDataBinding(name);
                    data[1].push(listener);
                }, this
            );
            return listener;
        },

        /**
         * Detach this object from data binding.
         *
         * @param {array} vars array of names of data to watch.
         * @param {object} listner the listener to remove.
         * @memberof WTag
         */
        unbindData: function(vars, listener) {
            if (!Array.isArray(vars)) {
                vars = [vars];
            }
            if (vars.length == 0) return null;
            var found = false;
            vars.forEach(
                function(name) {
                    var data = this.findDataBinding(name);
                    var i, target;
                    for (i = 0 ; i < data[1].length ; i++) {
                        target = data[1][i];
                        if (listener === target) {
                            data[1].splice(i, 1);
                            found = true;
                            return;
                        }
                    }
                }, this
            );
            return found;
        },

        /**
         * @description
         * Remove all bindings.
         * @memberof WTag
         */
        destroy: function() {

        },

        ADD: function(a,b) {return N(a)+N(b);},
        SUB: function(a,b) {return N(a)-N(b);},
        MUL: function(a,b) {return N(a)*N(b);},
        POW: function(a,b) {return Math.pow(N(a),N(b));},
        DIV: function(a,b) {b=N(b); return b==0?0:N(a)/b;},
        MOD: function(a,b) {b=N(b); return b==0?0:N(a)%b;},
        B: function(a) {
            if (typeof a === 'string') {
                if (a.trim().length == 0) return 0;
                return 1;
            }
            return a ? 1 : 0;
        }
    }
};
