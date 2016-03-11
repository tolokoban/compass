function $(id) {
    return window.document.getElementById(id);
}

function setLanguage(lang) {
    require("$").lang(lang);
    window.location = "index.html";
}

$("welcome").textContent = _("welcome");
$("fr").addEventListener(
    "click",
    function() {
        setLanguage("fr");
    },
    false
);
$("en").addEventListener(
    "click",
    function() {
        setLanguage("en");
    },
    false
);