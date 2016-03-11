var cache = window.applicationCache;
var cacheStates = ["UNCACHED", "IDLE", "CHECKING", "DOWNLOADING", "UPDATEREADY", "OBSOLETE"];

exports.debug = function() {
    try {
        if (cache) {
            cache.onchecking = function() {
                console.log("[appcache] onchecking (" + cacheStates[cache.status] + ")");
            };
            cache.onerror = function() {
                console.log("[appcache] onerror (" + cacheStates[cache.status] + ")");
            };
            cache.onnoupdate = function() {
                console.log("[appcache] onnoupdate (" + cacheStates[cache.status] + ")");
            };
            cache.ondownloading = function() {
                console.log("[appcache] ondownloading (" + cacheStates[cache.status] + ")", arguments);
            };
            cache.onprogress = function() {
                //console.log("[appcache] onprogress (" + cacheStates[cache.status] + ")");
            };
            cache.onupdateready = function() {
                console.log("[appcache] onupdateready (" + cacheStates[cache.status] + ")");
                cache.swapCache();
            };
            cache.oncached = function() {
                console.log("[appcache] oncached (" + cacheStates[cache.status] + ")");
            };
            cache.onobsolete = function() {
                console.log("[appcache] onobsolete (" + cacheStates[cache.status] + ")");
            };
            console.info("[@index] cache=...", cache);
            cache.update();
        }

    } catch (x) {
        console.log(Error(x));
    }
};
