exports.start = function() {
    var compass = document.querySelector('#compass');
    var numeric = document.querySelector('#numeric');

    window.addEventListener("deviceorientation", function (evt) {
        var ang = 360 - evt.alpha;
        compass.style.transform = 'rotate(' + (360 - ang) + "deg)";
        var txt = ang.toFixed(1);
        numeric.innerHTML = "<b>" + txt.substr(0, txt.length - 1)
            + "</b><small>" + txt.substr(txt.length - 1) + "</small> °";
    }, true);
};
