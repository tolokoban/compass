var Util = require("../../lib/wdg/util.js");

exports.splitter = function() {
    this.assertOneArg(
        Util.splitter,
        [
            //["a\\;b;c", ["a;b", "c"]]
            ["a;b;c", ["a", "b", "c"]],
            ["$f:{'a;b'} ; c", ["$f:{'a;b'}", "c"]],
            ["'a;b';c", ["'a;b'", "c"]]
        ]
    );
};