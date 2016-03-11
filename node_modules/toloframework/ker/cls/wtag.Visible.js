/**
 * @namespace wtag.Visible
 * @created 10/10/2014
 *
 * @class wtag.Visible
 */
window["TFW::wtag.Visible"] = {
    superclass: "WTag",
    init: function() {},
    functions: {
	/**
         * @description
         *
         * @param v If true, this widget must be visible.
         * @memberof wtag.Visible
         */
        "if": function(v) {
            if (v) {
                $removeClass(this, "hidden");
            } else {
                $addClass(this, "hidden");
            }
        }
    }
};
