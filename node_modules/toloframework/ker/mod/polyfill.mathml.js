/****************************************
 Until now (february 2016), only Firefox and Safari support MathML.

 this polyfill  detects the  lack of MathML  support and  transform every
 MathML tag in some thing that vagueley looks like real MathML.
 ****************************************/


function hasMathMLSupport() {
    var div = document.createElement("div"), box;
    div.innerHTML = "<math><mspace height='23px' width='77px'/></math>";
    document.body.appendChild(div);
    box = div.firstChild.firstChild.getBoundingClientRect();
    document.body.removeChild(div);
    return Math.abs(box.height - 23) <= 1  && Math.abs(box.width - 77) <= 1;
}


if (!hasMathMLSupport()) {
    polyfill();
    console.warn("MathML is not supported! The polyfill will be activated.");
} else {
    console.log("MathML is supported!");
}


function polyfill() {
    var mathmlNodes = document.querySelectorAll("math");
    var node;
    for ( var i=0 ; i<mathmlNodes.length ; i++ ) {
        node = mathmlNodes[i];
        node.parentNode.replaceChild( transform( node ), node );
    }
}


function transform(root) {
    var e = document.createElement("div");
    e.className = "math";
    e.innerHTML = root.innerHTML;
    return e;
}
