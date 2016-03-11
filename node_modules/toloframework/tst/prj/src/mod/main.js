var TouchEvent = require("tfw.touch-event");
var DragAndDrop = require("tfw.drag-end-drop");

var element = document.querySelector("#A");
var te = new TouchEvent(element);
te.signalTouchstart.add(
    function(arg) {
        document.querySelector("#DOWN").textContent = arg.x + ", " + arg.y;
    }
);
te.signalTouchend.add(
    function(arg) {
        document.querySelector("#UP").textContent = arg.x + ", " + arg.y;
    }
);
te.signalTap.add(
    function(arg) {
        var div = document.querySelector("#C");
        console.log(div.getBoundingClientRect());
        console.log(div.style.left + ", " + div.style.top);
    }
);
te.signalLong.add(
    function(arg) {
        alert("LONG");
    }
);

var div = document.querySelector("#C");
var divTE = new TouchEvent(div);
var divDND = new DragAndDrop(divTE);
divDND.enabled(true);
div = document.querySelector("#B");
divTE = new TouchEvent(div);
divDND = new DragAndDrop(divTE);
divDND.enabled(true);
