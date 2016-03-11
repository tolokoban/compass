var keys = {};

window.addEventListener(
    "keydown",
    function(evt) {
//console.info("[tgd.keyboard] evt.keyCode=...", evt.keyCode);
        evt.preventDefault();
        keys[evt.keyCode] = 1;
    },
    true
);

window.addEventListener(
    "keyup",
    function(evt) {
        evt.preventDefault();
        delete keys[evt.keyCode];
    },
    true
);

exports.isPressed = function(code) {
  return keys[code] == 1;
};

exports.TAB = 9;
exports.SHIFT = 16;
exports.CTRL = 17;
exports.CONTROL = 17;
exports.ALT = 18;
exports.ESCAPE = 27;
exports.SPACE = 32;
exports.LEFT = 37;
exports.UP = 38;
exports.RIGHT = 39;
exports.DOWN = 40;
exports.ALTGR = 225;
