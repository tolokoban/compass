/**
 * <w:{{widgetName}}></w:{{widgetName}}>
 *
 */
window["TFW::{{widgetClass}}"] = {
    superclass: "wtag.Tag",
    
    init: function() {
        $addClass(this, "wtag-{{widgetName}}");
    },	
    
    functions: {
	
    }
};
