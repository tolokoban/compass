/**
 * @created 16/09/2014
 *
 */
window["TFW::Main"] = {
    superclass: "WTag",
    
    init: function() {
        this.registerSignal(
            "alert",
            function(arg) {
                alert(arg);
            }
        );        
    },	
    
    functions: {
	
    }
};
