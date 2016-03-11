/**
 * @created 15/05/2014
 * @extends wtag.Fireable
 * @class wtag.Button
 */
window["TFW::wtag.Button"] = {
    superclass: "wtag.IFireable",

    attributes: {
        enabled: true
    },

    init: function() {
        var that = this;
        $events(
            this._element,
            {
                tap: function() {
                    if (that._enabled) {
                        that.fireAll();
                    }
                }
            }
        );
/*
        if (this._enabledG) {
            this._enabled = this._enabledG.call(this);
            this._enabledV.forEach(
                function(name) {
                    this.bindData(name, "enabled", this._enabledG);
                }, this
            );

        }
        this.enabled(this._enabled);
*/
    },

    functions: {
        /**
         * @description
         * You can click on a button only if it is `enabled`.
         *
         * @param {bool} value
         * @memberof wtag.Button
         */
        enabled: function(value) {
            if (typeof value === 'undefined') return this._enabled;
            this._enabled = value;
            if (value) {
                $removeClass(this, "disabled", "-disabled");
            } else {
                $addClass(this, "disabled", "-disabled");
            }
        }
    }
};
