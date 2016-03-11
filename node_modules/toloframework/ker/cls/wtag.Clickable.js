/**
 * @namespace wtag.Clickable
 * @created 11/10/2014
 *
 * @class wtag.Clickable
 */
window["TFW::wtag.Clickable"] = {
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
