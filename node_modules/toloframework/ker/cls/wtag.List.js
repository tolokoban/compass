/**
 * @namespace wtag.List
 * @created 19/09/2014
 *
 * @class wtag.List
 */
window["TFW::wtag.List"] = {
    superclass: "WTag",
    attributes: {list: null, item: null, tpl: null, maker: null},
    //=====================
    init: function() {
        if (typeof this._tpl !== 'object') {
            this._tpl = document.getElementById(this._tpl);
        }
        this.refresh();
    },	
    
    functions: {
	/**
         * @description
         * 
         * @memberof wtag.List
         */
        refresh: function() {
            $clear(this);
            var items = ["Edouard", "Norbert", "Gaspard"],
            that = this,
            util = $$("dom.Util"),
            container = this.findElement();
            items.forEach(
                function(itm, idx) {
                    var id = that._id + "." + idx,
                    e = util.clone(that._tpl, id),
                    bindings = {};
                    container.appendChild(e);
                    if (that._item) {
                        $$("WTag", {id: id}).defineLocalData(that._item, itm);
                    }
                    that._maker(e, id);
                }
            );

            
        }

        
    }
};
