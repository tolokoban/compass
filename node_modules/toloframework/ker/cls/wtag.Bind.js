/**
 * @created 17/09/2014
 *
 */

window["TFW::wtag.Bind"] = {
    superclass: "WTag",
    init: function() {},
    
    functions: {
	/**
         * Update content when data has changed.
         */
        val: function(value) {
            if (this._type == 'html') {
                this._element.innerHTML = value;
            } else {
                this._element.textContent = value;
            }
        }
    }
};
