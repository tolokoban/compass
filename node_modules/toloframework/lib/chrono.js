var timers = {};

exports.start = function(id) {
    if (typeof id === 'undefined') id = '';

    timers[id] = Date.now();
};


/**
 * @return {number} Number of second since the last call of `start()`or `stop()`.
 */
exports.stop = function(id) {
    if (typeof id === 'undefined') id = '';

    var now = Date.now();
    var elapsed = now - (timers[id] || 0);
    timers[id] = now;
    return elapsed / 1000;
};


exports.log = function(id) {
    console.log(">>> " + exports.stop(id).toFixed(3).bold.cyan + " seconds.");
};
