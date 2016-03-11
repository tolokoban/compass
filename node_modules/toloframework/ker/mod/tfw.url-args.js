exports.parse = function() {
    var args = {},
    t = location.search,
    i, x;
    if (t.length < 2) return args;
    t = t.substring(1).split('&');
    for (i=0; i<t.length; i++){
        x = t[i].split('=');
        if (x.length == 1) {
            args[""] = decodeURIComponent(x[0]);
        }
        else {
            args[x[0]] = decodeURIComponent(x[1]);
        }
    }
    return args;
};

exports.stringify = function(args) {

};
