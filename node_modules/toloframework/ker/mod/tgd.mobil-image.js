var Mobil = require("tgd.mobil");

var MobilImage = function(opts, attribs) {
    var img = opts.img;
    if (typeof img === 'string') {
        opts.draw = this.drawImage;        
    } else {
        var key;
        for (key in img) {
            this.mode = key;
            break;
        }
        opts.draw = this.drawImage2;
    }
/*
    img = runtime.getImage(this._options.img);
    if (typeof attribs.offsetX === 'undefined') attribs.offsetX = img.width / 2;
    if (typeof attribs.offsetY === 'undefined') attribs.offsetY = img.height / 2;
    this.offsetX = attribs.offsetX;
    this.offsetY = attribs.offsetY;
*/
    Mobil.call(this, opts, attribs);
};

MobilImage.prototype = Object.create(Mobil.prototype);
MobilImage.prototype.constructor = MobilImage;

MobilImage.prototype.drawImage = function(runtime) {
    var ctx = runtime.context;
    var img = runtime.getImage(this._options.img);
    if (typeof this.offsetX === 'undefined') this.offsetX = img.width / 2;
    if (typeof this.offsetY === 'undefined') this.offsetY = img.height / 2;

    ctx.drawImage(img, Math.floor(-this.offsetX), Math.floor(-this.offsetY));
};

/**
 * @return void
 */
MobilImage.prototype.drawImage2 = function(runtime) {
    var ctx = runtime.context;
    var img = this._options.img[this.mode];
    if (!img) return;
    if (typeof img === 'string') {
        img = runtime.getImage(img);
        ctx.drawImage(img, Math.floor(-img.width / 2), Math.floor(-img.height / 2));
    } else {
        img = img[Math.floor(runtime.timestamp / 200) % img.length];
        if (!img) return;
        img = runtime.getImage(img);
        if (!img) return;
        ctx.drawImage(img, Math.floor(-img.width / 2), Math.floor(-img.height / 2));
    }
};

module.exports = MobilImage;
