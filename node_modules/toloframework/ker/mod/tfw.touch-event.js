var Listeners = require("tfw.listeners");

var pointerX, pointerY;
var currentTouchListener = null;
var windowMove = new Listeners();
var windowTouchend = new Listeners();

function onMoveM(evt) {
    pointerX = evt.pageX;
    pointerY = evt.pageY;
    windowMove.fire();
}

function onMoveT(evt) {
    pointerX = evt.pageX;
    pointerY = evt.pageY;
    windowMove.fire();
}

function onEndM(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    var obj = currentTouchListener;
    if (!obj._touch || obj._touch != 1) {
        return;
    }
    obj._touch = 0;
    currentTouchListener = null;
    var rect = obj.element.getBoundingClientRect();
    var arg = {
        x: evt.pageX - rect.left,
        y: evt.pageY - rect.top,
        rect: rect
    };
    obj.signalTouchend.fire(arg);
    if (arg.x < 0 || arg.y < 0 || arg.x > rect.width || arg.y > rect.height) return;
    if (evt.button == 0) {
        obj.signalTap.fire(arg);
    } else {
        obj.signalLong.fire(arg);
    }
}

function onEndT(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    var obj = currentTouchListener;
    if (!obj._touch || obj._touch != 2) {
        return;
    }
    obj._touch = 0;
    currentTouchListener = null;
    var rect = obj.element.getBoundingClientRect();
    var arg = {
        x: evt.pageX - rect.left,
        y: evt.pageY - rect.top,
        rect: rect
    };
    obj.signalTouchend.fire(arg);
    if (arg.x < 0 || arg.y < 0 || arg.x > rect.width || arg.y > rect.height) return;
    if (evt.button == 0) {
        obj.signalTap.fire(arg);
    } else {
        obj.signalLong.fire(arg);
    }
}

window.document.addEventListener("mousemove", onMoveM, true);
window.document.addEventListener("touchmove", onMoveT, true);
window.document.addEventListener("mouseup", onEndM, true);
window.document.addEventListener("touchend", onEndT, true);


/**
 * Il est possible d'ajouter des listeners aux attributs suivants :
 * * __signalTap__: Un "tap" a été effectué sur l'élément.
 * * __signalTouchstart__: Le doigt (ou la souris) a été posé sur l'élément.
 * * __signalTouchend__: Le doigt (ou la souris) n'est plus posé sur l'élément.
 * @example
 * var TouchEvent = require("tfw.touch-event");
 * var instance = new TouchEvent(element);
 * @class TouchEvent
 */
var TouchEvent = function(element) {
    var that = this;
    this.element = element;
    this.signalTap = new Listeners();
    this.signalLong = new Listeners();
    this.signalTouchstart = new Listeners();
    this.signalTouchend = new Listeners();
    this.signalMove = windowMove;
    this._touch = 0; // 0 = Nothing,  1 = Mouse, 2 = Touch.
    this._onMouseDown = function(evt) {
        if (that._touch) return;
        currentTouchListener = that;
        that._touch = 1;
        evt.preventDefault();
        evt.stopPropagation();
        var rect = that.element.getBoundingClientRect();
        var arg = {
            x: evt.pageX - rect.left,
            y: evt.pageY - rect.top,
            rect: rect
        };
        console.info("[tfw.touch-event] arg=...", arg);
        that.signalTouchstart.fire(arg);
    };
    this._onTouchstart = function(evt) {
        if (that._touch) return;
        currentTouchListener = that;
        that._touch = 2;
        evt.preventDefault();
        evt.stopPropagation();
        var rect = that.element.getBoundingClientRect();
        var arg = {
            x: evt.pageX - rect.left,
            y: evt.pageY - rect.top,
            rect: rect
        };
        console.info("[tfw.touch-event] arg=...", arg);
        that.signalTouchstart.fire(arg);
    };
    element.addEventListener("mousedown", this._onMouseDown, false);
};

/**
 * @return Position du pointeur sur le document. C'est un objet avec les
 * attributs __x__ et __y__.
 * @example
 * var pos = instance.getPointerPos();
 * element.style.left = pos.x + "px";
 * element.style.top = pos.y + "px";
 */
TouchEvent.prototype.getPointerPos = function() {
    return {x: pointerX, y: pointerY};
};


module.exports = TouchEvent;
