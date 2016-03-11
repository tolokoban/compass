/**
 * @namespace wtag.Popup
 * @class wtag.Popup
 */
window["TFW::wtag.Popup"] = {
    superclass: "WTag",

    classInit: function(vars) {
        vars.instances = [];
        window.WTag.popup = function(name, attribs) {
            var i, instance;
            for (i = 0 ; i < vars.instances.length ; i++) {
                instance = vars.instances[i];
                if (instance.show(name, attribs)) {
                    return;
                }
            }
        };
        
    },

    init: function() {
        var that = this;
        this.$statics.instances.push(this);
        if (this.$statics.instances.length == 1) {
            // First instance of popup: register to global signal.
            this.registerSignal(
                "@popup",
                WTag.popup  
            );
        }
        $events(
            this,
            {
                tap: function() {that.hide();}
            }
        );
    },

    functions: {
        /**
         *
         */
        show: function(name, attribs) {
            var i, child, n,
            key, val, e,
            that = this,
            found = false;
            for (i = 0 ; i < this._element.childNodes.length ; i++) {
                child = this._element.childNodes[i];
                n = child.getAttribute("name").trim();
                if (n == name) {
                    $removeClass(child, "hide");
                    if (typeof attribs === 'object') {
                        // Replace dynamically parts of the message.
                        for (key in attribs) {
                            val = attribs[key];
                            e = child.querySelector("[key='" + key + "']");
                            if (e) {
                                e.textContent = val;
                            } else {
                                console.error(
                                    "[wtag.Popup] Missing item \"" + key + "\" in popup \""
                                        + name + "\"!"
                                );
                            }
                        }
                    }
                    found = true;
                } else {
                    $addClass(child, "hide");
                }
            }
            if (found) {
                $addClass(this, "show");
                if (this._timer) {
                    clearTimeout(this._timer);
                }
                this._timer = setTimeout(
                    function() {
                        delete that._timer;
                        that.hide();
                    },
                    5000
                );
            }
            return found;
        },

        /**
         * hide the popup message.
         */
        hide: function() {
            if (this._timer) {
                clearTimeout(this._timer);
                delete this._timer;
            }
            $removeClass(this, "show");
        }
    }
};
