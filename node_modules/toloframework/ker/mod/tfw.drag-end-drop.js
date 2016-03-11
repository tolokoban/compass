/**
 * @example
 * var touchEvent = require("tfw.touch-event")(element);
 * var DragEndDrop = require("tfw.drag-end-drop");
 * var instance = new DragEndDrop(touchEvent);
 * instance.enabled(true);
 * @class DragEndDrop
 */
var DragEndDrop = function(touchEvent) {
    this._touchEvent = touchEvent;
    this._enabled = false;
    this._dragging = false;
};

/**
 * Active ou désactive le Drag'n Drop.
 */
DragEndDrop.prototype.enabled = function(value) {
    if (typeof value === 'undefined') return this._enabled;
    if (value == this._enabled) return;
    this._enabled = value;
    var te = this._touchEvent;
    if (value) {
        te.signalTouchstart.add(onPress, this);
        te.signalMove.add(onMove, this);
        te.signalTouchend.add(onRelease, this);
    } else {
        te.signalTouchstart.remove(onPress, this);
        te.signalMove.remove(onMove, this);
        te.signalTouchend.remove(onRelease, this);
    }
};

function removeUnit(v) {
    var i = v.length;
    var c;
    while (i > 0) {
        c = v.charAt(i);
        if (c >= '0' && c <= '9') {
            return parseFloat(v.substr(0, i + 1));
        }
        i--;
    }
    return 0;
}

function onPress(arg) {
    var t = this._touchEvent;
    var p = t.getPointerPos();
    var e = t.element;
    var x = removeUnit(e.style.left || "0");
    var y = removeUnit(e.style.top || "0");
    this._shift = {
        x: x - p.x,
        y: y - p.y
    };
    this._dragging = true;
}

function onMove() {
    if (!this._dragging) return;
    var t = this._touchEvent;
    var p = t.getPointerPos();
    var e = t.element;
    var s = this._shift;
    e.style.left = (s.x + p.x) + "px";
    e.style.top = (s.y + p.y) + "px";
}

function onRelease(arg) {
    this._dragging = false;
    delete this._shift;
}

module.exports = DragEndDrop;
