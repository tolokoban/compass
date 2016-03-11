// https://secure.gravatar.com/site/implement/images/

var Widget = require("wdg");
var Md5 = require("md5");

/**
 * @param {string} md5 Email's MD5.
 * @param {number} size Side size in pixel of the image. Default = `32`.
 * @param {string} unknown Que faut-il afficher s'il n'y a pas de Gravatar. Default = `retro`.
 * 
 * * `404` : Ne rien retourner. C'est la valeur par défaut.
 * * `mm` : Mystery Man, constant.
 * * `blank` : Blanc, constant.
 * * `identicon` : Dépend de l'e-mail.
 * * `monsterid` : Dépend de l'e-mail.
 * * `wavatar` : Dépend de l'e-mail.
 * * `retro` : Dépend de l'e-mail.
 * 
 */
var getURL = function(md5, size, unknown) {
    if (typeof size === 'undefined') size = 32;
    if (typeof unknown === 'undefined') unknown = "retro";

    return "https://secure.gravatar.com/avatar/"
        + md5 + "?s=" + size + "&r=pg&d=" + unknown;
};

/**
 * @param {string} email Adresse mail ou MD5.
 * @param {string} unknown Que faut-il afficher s'il n'y a pas de Gravatar.
 * 
 * * `404` : Ne rien retourner. C'est la valeur par défaut.
 * * `mm` : Mystery Man, constant.
 * * `blank` : Blanc, constant.
 * * `identicon` : Dépend de l'e-mail.
 * * `monsterid` : Dépend de l'e-mail.
 * * `wavatar` : Dépend de l'e-mail.
 * * `retro` : Dépend de l'e-mail.
 * 
 * @example
 * var Gravatar = require("wdg.gravatar");
 * var instance = new Gravatar(email, size);
 * @class Gravatar
 */
var Gravatar = function(email, size, unknown) {
    var that = this;
    Widget.call(this);
    if (typeof unknown === 'undefined') unknown = 'retro';
    var md5 = email;
    if (email.indexOf("@") > 0) {
        md5 = Md5(email);
    }
    this.addClass("wdg-gravatar", "hide");
    if (typeof size !== 'number') size = 32;
    this._loaded = false;
    this._defined = false;
    this._url = null;
    this.css({width: size + "px", height: size + "px"});
    var img = new Image();
    img.onload = function() {
        that.css({backgroundImage: "url(" + img.src + ")"});
        that._loaded = true;
        that._defined = true;
        that.removeClass("hide");
    };
    img.onerror = function() {
        that._loaded = true;
        that._defined = false;
    };
    img.src = getURL(md5, size, unknown);
    this._url = img.src;
};

Gravatar.prototype = Object.create(Widget.prototype);
Gravatar.prototype.constructor = Gravatar;

/**
 * @return void
 */
Gravatar.prototype.isLoaded = function() {
    return this._loaded;
};

/**
 * @return void
 */
Gravatar.prototype.isDefined = function() {
    return this._defined;
};

Gravatar.create = function(email, size, unknown) {
    return new Gravatar(email, size, unknown);
};

Gravatar.url = getURL;

module.exports = Gravatar;
