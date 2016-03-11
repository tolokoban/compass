var Mobil = require("tgd.mobil");
var Listeners = require("tgd.listeners");

var images = {};


/**
 * @class
 */
var Runtime = function(opts) {
    if (typeof opts === 'undefined') opts = {};

    // Par défaut, on utilise la fonction globale "main" comme fonction de draw.
    if (typeof opts.draw === 'undefined') opts.draw = window.main;

    Mobil.call(this, opts);
    var canvas = opts.canvas;
    if (typeof canvas === 'undefined') canvas = window.document.querySelector("canvas");
    canvas.$runtime = this;
    this.runtime = this;
    this.mobils = [];
    this.timestamp = 0;
    this.deltaTimestamp = 0;
    this.context = canvas.getContext("2d");
    this.app = {};
    this.touchEvents = [];
    var that = this;

    canvas.addEventListener(
        "touchstart",
        function(evt) {
            evt.preventDefault();
            var rect = canvas.getBoundingClientRect();
            var index, touch, x, y;
            //console.info("[tgd.runtime:touchstart] evt=...", evt);
            for (index = 0 ; index < evt.touches.length ; index++) {
                touch = evt.touches[index];
                x = canvas.width * touch.pageX / rect.width;
                y = canvas.height * touch.pageY / rect.height;
                that.touchEvents.push(
                    { x: x, y: y, index: index, type: 1 }
                );
            }
        },
        false
    );
    canvas.addEventListener(
        "touchend",
        function(evt) {
            evt.preventDefault();
            var rect = canvas.getBoundingClientRect();
            var index, touch, x, y;
            //console.info("[tgd.runtime:touchend] evt=...", evt);
            for (index = 0 ; index < evt.touches.length ; index++) {
                touch = evt.touches[index];
                x = canvas.width * touch.pageX / rect.width;
                y = canvas.height * touch.pageY / rect.height;
                that.touchEvents.push(
                    { x: x, y: y, index: index, type: -1 }
                );
            }
        },
        false
    );
};

Runtime.prototype = Object.create(Mobil.prototype);
Runtime.prototype.constructor = Runtime;

/**
 * @return void
 */
Runtime.prototype.clear = function() {
    this.draw = null;
    this.mobils = [];
};

/**
 * Démarer l'animation en utilisant la fonction __draw__.
 * @param draw{function} Fonction à appeler lors du dessin de chaque image.
 * Le `this` sera le __Runtime__ courant.
 */
Runtime.prototype.start = function(draw) {
    if (typeof draw === 'function') {
        this.draw = draw;
    }
    var i, lst, f;
    var that = this;
    var loop = function(timestamp) {
        try {
            /*
            window.setTimeout(
                function() {window.requestAnimationFrame(loop);}, 
                200
            );
             */
            window.requestAnimationFrame(loop);

            f = that.draw;
            that.deltaTimestamp = timestamp - that.timestamp;
            that.timestamp = timestamp;
            that.mobils.forEach(
                function(m) {
                    m.doMove(that);
                }
            );
            if (typeof f === 'function') {
                that.context.save();
                f.call(that, that.context.canvas.width, that.context.canvas.height);
                that.context.restore();
            }
            that.mobils.forEach(
                function(m) {
                    that.context.save();
                    m.doDraw(that);
                    that.context.restore();
                }
            );
            // Retirer les mobils morts.
            lst = [];
            that.mobils.forEach(
                function(m) {
                    if (!m._isDead) {
                        lst.push(m);
                    }
                }
            );
            that.mobils = lst;
            that.touchEvents = [];
        } catch (x) {
            this.enabled = 0;
            throw x;
        }
    };
    window.requestAnimationFrame(loop);
};

/**
 * Ajouter un __Mobil__ à la liste.
 */
Runtime.prototype.addMobil = function(mobil) {
    mobil.runtime = this;
    this.mobils.push(mobil);
    return mobil;
};
Runtime.prototype.add = Runtime.prototype.addMobil;

/**
 * Retourner le code pour définir la couleur à partir du niveau de rouge, de vert et de bleu.
 * @param r{number} Niveau de rouge entre 0 et 255.
 * @param g{number} Niveau de vert entre 0 et 255.
 * @param b{number} Niveau de bleu entre 0 et 255.
 * @param a{number} Niveau d'opacité définit par un nombre réel entre 0 et 1 : 0 = invisible et 1 = opaque.
 */
Runtime.prototype.rgb = function(r,g,b,a) {
    r = TGD.toInt(r, 0, 255);
    g = TGD.toInt(g, 0, 255);
    b = TGD.toInt(b, 0, 255);
    if (typeof a === 'number') {
        return "rgba(" + r + "," + g + "," + b + "," + TGD.toFloat(a, 0, 1) + ")";
    }
    return "rgb(" + TGD.toInt(r, 0, 255)
        + "," + TGD.toInt(g, 0, 255)
        + "," + TGD.toInt(b, 0, 255) + ")";
};

/**
 * Retourner un nouveau CANVAS invisible, mais utilisable en tant qu'image.
 */
Runtime.prototype.createCanvas = function(width, height) {
    if (typeof width === 'undefined') width = this.context.canvas.width;
    if (typeof height === 'undefined') height = this.context.canvas.height;
    var canvas = window.document.createElement("canvas");
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
    return canvas;
};

/**
 * @param id{string} Identifiant de l'image recherchée.
 * @return L'image dont on passe l'identifiant.
 */
Runtime.prototype.getImage = function(id) {
    return images[id];
};

/**
 * Chargement asynchrone d'images.
 */
Runtime.prototype.loadImages = function(dic, onLoad, onProgress) {
    if (typeof dic === 'string') {
        var id = dic;
        dic = {};
        dic[id] = id;
    }
    var that = this;
    var count = 0;
    var max = 0;
    var key;
    var slotLoad = function() {
        count++;
        if (typeof onProgress === 'function') {
            onProgress.call(that, count / max);
        }
        if (count < max) return;
        if (typeof onLoad === 'function') {
            onLoad.call(that);
        }
    };
    var slotError = function(err) {
        console.log("ERROR while loading image:");
        console.log(err.target.src);
        console.log(err);
        slotLoad();
    };
    for (key in dic) max++;
    for (key in dic) {
        if (images[key]) {
            slotLoad();
            continue;
        }
        var img = window.document.createElement("img");
        images[key] = img;
        img.onload = slotLoad;
        img.onerror = slotError;
        img.src = dic[key];
    }
};

module.exports = Runtime;
