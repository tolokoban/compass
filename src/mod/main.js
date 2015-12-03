var invertCompass = parseInt(localStorage.getItem('compass-inverted') || 0);


exports.start = function() {
    var compass = document.querySelector('#compass');
    var numeric = document.querySelector('#numeric');
    var warning = document.querySelector('#warning');
    var config = document.querySelector('#config');
    var text = document.querySelector('#warning-text');
    var button = document.querySelector('#button');

    button.addEventListener('touchstart', function(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        invertCompass = invertCompass ? 0 : 1;
        localStorage.setItem('compass-inverted', invertCompass);
        updateInvertButton();
    }, true);

    updateInvertButton();
    
    window.addEventListener("deviceorientation", function (evt) {
        var ang = invertCompass ? evt.alpha : 360 - evt.alpha;
        compass.style.transform = 'rotate(' + (360 - ang) + "deg)";
        var txt = ang.toFixed(1);
        numeric.innerHTML = "<b>" + txt.substr(0, txt.length - 1)
            + "</b><small>" + txt.substr(txt.length - 1) + "</small> °";
    }, true);

    window.setTimeout(function() {
        warning.className = "hide";
    }, 3000);

    var onTap = function(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        config.classList.toggle('hide');
    };

    numeric.addEventListener('touchstart', onTap, false);
    text.addEventListener('touchstart', onTap, false);
};


function updateInvertButton() {
    var invert = document.querySelector('#invert');    
    invert.className = invertCompass ? 'yes' : 'no';
    invert.textContent = invertCompass ? 'YES' : 'NO';    
}
