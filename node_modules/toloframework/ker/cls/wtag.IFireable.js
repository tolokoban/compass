/**
 * @namespace wtag.IFireable
 * @created 17/09/2014
 *
 * @class wtag.IFireable
 * @extends WTag
 */
window["TFW::wtag.IFireable"] = {
    superclass: "WTag",
    init: function() {},

    //=====================
    functions: {
	/**
         * @description
         * Trigger signals according to attributes _fire_ and _fire-arg_.
         * 
         * @memberof wtag.IFireable
         */
        fireAll: function(attName) {
            if (typeof attName === 'undefined') attName = 'fire';
            var fire = this["_" + attName];
            if (!fire) return;
            var fireArg = this["_" + attName + "Arg"];
            var i, sig, arg;
            for (i = 0 ; i < fire.length ; i++) {
                sig = fire[i];
                arg = fireArg[i];
                this.fire(sig, arg);
            }
        }
    }
};
