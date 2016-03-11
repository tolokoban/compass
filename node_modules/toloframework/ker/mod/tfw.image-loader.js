/**
 * @module
 * Charger des images de façon asynchrone.
 */
require("tfw.promise");

/**
 * Retourne  un  promise dont  la  data  est  un dictionnaire  avec  les
 * messages  d'erreurs associés  à chaque  image chargée.  Bien sûr,  ce
 * dictionnaire est vide si tout s'est bien passé, sinon chaque clef est
 * une URL.
 * Il n'y a donc jamais de `reject` dans le promise retourné.
 * 
 * @param src URL vers une image ou tableau d'URLs vers des images.
 */
module.exports = function(src) {
    if (!Array.isArray(src)) src = [src];
    return new Promise(
        function(resolve, reject) {
            var errors = {};
            var size = src.length;
            var next = function() {
                size--;
                if (size <= 0) resolve(errors);
            };
            src.forEach(
                function(url) {
                    var img = new Image();
                    img.onload = next;
                    img.onerror = function(err) {
                        errors[url] = err;
                        next();
                    };
                    img.src = url;
                }
            );
        }
    );
};
