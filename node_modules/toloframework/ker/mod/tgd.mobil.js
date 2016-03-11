/**
 * @param opts{object} options with the following attributes:
 * * __x__: position X.
 * * __y__: position Y.
 * * __sx__: speed X in pixels per second.
 * * __sy__: speed Y in pixels per second.
 * * __ax__: acceleration X in pixels per second.
 * * __ay__: acceleration Y in pixels per second.
 * * __init__: function to call at initialisation time.
 * * __move__: function to call before drawing a new frame.
 * * __draw__: function to call when drawing a new frame.
 * @class
 */
var Mobil = function(opts, attribs) {
    if (typeof opts !== 'object') opts = {};
    if (typeof opts.x !== 'number') opts.x = 0;
    if (typeof opts.y !== 'number') opts.y = 0;
    if (typeof opts.sx !== 'number') opts.sx = 0;
    if (typeof opts.sy !== 'number') opts.sy = 0;
    if (typeof opts.ax !== 'number') opts.ax = 0;
    if (typeof opts.ay !== 'number') opts.ay = 0;

    if (typeof attribs === 'undefined') attribs = {};
    var key;
    for (key in attribs) {
        this[key] = attribs[key];
    }

    this.x = opts.x;
    this.y = opts.y;
    this.sx = opts.sx;
    this.sy = opts.sy;
    this.ax = opts.ax;
    this.ay = opts.ay;
    this.rotation = 0;
    this.scale = 1;
    this.flipX = false;
    this.flipY = false;
    this._isDead = 0;
    this._options = opts;
    this.mobils = [];

    if (typeof opts.move === 'function') this.move = opts.move;
    if (typeof opts.draw === 'function') this.draw = opts.draw;
    if (typeof opts.init === 'function') {
        opts.init.call(this);
    }
};

Mobil.prototype.doMove = function(runtime) {
    var delta = runtime.deltaTimestamp / 1000;
    this.oldX = this.x;
    this.oldY = this.y;
    this.x += this.sx * delta;
    this.y += this.sy * delta;
    this.sx += this.ax * delta;
    this.sy += this.ay * delta;
    var move = this.move;
    if (typeof move === 'function') {
        move.call(this, runtime);
    }
    this.mobils.forEach(
        function(mobil) {
            mobil.doMove(runtime);
        } 
    );
    var lst = [];
    this.mobils.forEach(
        function(mobil) {
            if (!mobil.isDead) {
                lst.push(mobil);
            }
        } 
    );
    this.mobils = lst;
};

Mobil.prototype.doDraw = function(runtime) {
    var draw = this.draw;
    var ctx = runtime.context;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation * Math.PI / 180);
    var s = this.scale;
    ctx.scale(this.flipX ? -s : s, this.flipY ? -s : s);
    if (typeof draw === 'function') {
        draw.call(this, runtime);
    }
    ctx.restore();
    this.mobils.forEach(
        function(mobil) {
            mobil.doDraw(runtime);
        } 
    );
};

/**
 * Lors  de  trajectoires  rapides,  il peut  arriver  que  la  distance
 * parcourue  par le  mobile entre  deux images  soit très  grand.  Cela
 * arrive encore plus  souvent sur des appareils  lents.  Cette fonction
 * permet  donc  de simuler  les  différentes  étapes  du trajet  en  le
 * découpant en une série de "sauts".
 * @param stepX{double} Distance horizontale  maximale (en pixels) entre
 * deux "sauts".
 * @param stepY{double}  Distance verticale  maximale (en  pixels) entre
 * deux "sauts".
 * @param slot{function(x,y)} Fonction acceptant  les arguments __x__ et
 * __y__. Si  elle retourne __true__, c'est  qu'on a trouvé ce  que l'on
 * cherche et il faut donc arrêter la série de sauts.
 * @param caller{object} Objet  qui sera utilisé comme  __this__ dans la
 * fonction __slot__.  C'est un argument  facultatif, s'il est  omis, on
 * utilise le mobil comme __this__.
 * @return void
 * @example
 * mobil.foreachPos(
 *   32, 32,
 *   function(x, y) {
 *     var tile = map.getTileAtXY(x, y);
 *     if (tile) {
 *       this.doAction(tile);
 *       return true;
 *     }
 *   }
 * );
 */
Mobil.prototype.foreachPos = function(stepX, stepY, slot, caller) {
    if (typeof caller === 'undefined') caller = this;
    if (typeof slot !== 'function') return false;
    if (Math.floor(this.x) == Math.floor(this.oldX) && Math.floor(this.y) == Math.floor(this.oldY)) {
        return slot.call(caller, this.x, this.y);
    }
    var nbStepsX = Math.ceil((this.x - this.oldX) / stepX);
    var nbStepsY = Math.ceil((this.y - this.oldY) / stepY);
    var nbSteps = Math.max(nbStepsX, nbStepsY);
    var deltaX = (this.x - this.oldX) / nbSteps;
    var deltaY = (this.y - this.oldY) / nbSteps;
    var x;
    var y;
    for (var i = 1 ; i <= nbSteps ; i++) {
        x = this.oldX + i * deltaX;
        y = this.oldY + i * deltaY;
        if (true === slot.call(caller, x, y)) return true;
    }
    return false;
};


/**
 * Ajouter un Mobil à la liste.
 */
Mobil.prototype.add = function(mobil) {
    mobil.runtime = this.runtime;
    mobil.parent = this;
    this.mobils.push(mobil);
};

/**
 * Diriger le mobile vers (__x__, _y__) à la vitesse de __speed__ pixels par seconde.
 */
Mobil.prototype.gotoAtSpeed = function(x, y, speed) {
    var sx = x - this.x;
    var sy = y - this.y;
    if (sx != 0 || sy != 0) {
        var r = Math.sqrt(sx * sx + sy * sy);
        sx = (sx * speed) / r;
        sy = (sy * speed) / r;
    }
    this.sx = sx;
    this.sy = sy;
};

/**
 * Force the mobil to die. It will be removed from the mobils' list at
 * new frame.
 * @member
 */
Mobil.prototype.die = function() {
    this._isDead = 1;
};

module.exports = Mobil;
