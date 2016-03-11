var Mobil = require("tgd.mobil");

/**
 * @param options Un objet décrivant la carte, avec les attributs suivants :
 * * __cols__: nombre de colonnes dans la carte.
 * * __rows__: nombre de lignes dans la carte.
 * * __tileWidth__: largeur d'une tuile en pixels.
 * * __tileHeight__: hauteur d'une tuile en pixels.
 * * __mapWidth__: largeur de la partie visible de la carte en pixels.
 * * __mapHeight__: hauteur de la partie visible de la carte en pixels.
 *
 * @example
 * var TiledMap = require("tgd.tiled-map");
 * var options = {
 *   tileWidth: 32,
 *   tileHeight: 32
 * }
 * var instance = new TiledMap(options);
 * @class TiledMap
 */
var TiledMap = function(options) {
    if (typeof options === 'undefined') options = {};

    Mobil.call(this, options);
    this.target = null;
    this.targetX = null;
    this.targetY = null;
    this.origX = options.origX || 0;
    this.origY = options.origY || 0;
    this.origSpeedX = options.origSpeedX || 0;
    this.origSpeedY = options.origSpeedY || 0;
    this.origAccelX = options.origAccelX || 0;
    this.origAccelY = options.origAccelY || 0;
    this.tileWidth = options.tileWidth || 32;
    this.tileHeight = options.tileHeight || 32;
    this.mapWidth = options.mapWidth || 320;
    this.mapHeight = options.mapHeight || 240;
};

TiledMap.prototype = Object.create(Mobil.prototype);
TiledMap.prototype.constructor = TiledMap;

/**
 * @return void
 */
TiledMap.prototype.getCol = function(x) {
    return Math.floor(x / this.tileWidth);
};

/**
 * @return void
 */
TiledMap.prototype.getX = function(col) {
    return Math.floor(this.tileWidth * col + this.tileWidth / 2);
};

/**
 * @return void
 */
TiledMap.prototype.getRow = function(y) {
    return Math.floor(y / this.tileHeight);
};

/**
 * @return void
 */
TiledMap.prototype.getY = function(row) {
    return Math.floor(this.tileHeight * row + this.tileHeight / 2);
};

/**
 * @return void
 */
TiledMap.prototype.setTile = function(col, row, mobil) {
    if (col < 0 || row < 0 || col > this.maxCol || row > this.maxRow) return false;
    this.grid[row * this.cols + col] = mobil;
    return true;
};

/**
 * @return void
 */
TiledMap.prototype.setTarget = function(target, x, y) {
    this.target = target;
    this.targetX = x;
    this.targetY = y;
};

/**
 * @return void
 */
TiledMap.prototype.getTile = function(col, row) {
    if (col < 0 || row < 0 || col > this.maxCol || row > this.maxRow) return null;
    return this.grid[row * this.cols + col];
};

/**
 * @return void
 */
TiledMap.prototype.getTileAtXY = function(x, y) {
    return this.getTile(this.getCol(x), this.getRow(y));
};

/**
 * @return void
 */
TiledMap.prototype.initTiles = function(cols, rows, grid) {
    var copyGrid = [];
    grid.forEach(
        function(item) {
            copyGrid.push(item);
        } 
    );
    this.cols = cols;
    this.rows = rows;
    this.grid = copyGrid;
    this.maxCol = cols - 1;
    this.maxRow = rows - 1;
};

/**
 * @return void
 */
TiledMap.prototype.doMove = function(runtime) {
    var delta = runtime.deltaTimestamp / 1000;
    this.origX += this.origSpeedX * delta;
    this.origY += this.origSpeedY * delta;
    this.origSpeedX += this.origAccelX * delta;
    this.origSpeedY += this.origAccelY * delta;
    if (this.target) {
        if (typeof this.targetX === 'number') {
            this.origX = this.target.x - this.targetX;
        }
        if (typeof this.targetY === 'number') {
            this.origY = this.target.y - this.targetY;
        }
    }
    var v;
    if (this.origX < 0) this.origX = 0;
    v = this.cols * this.tileWidth - this.mapWidth;
    if (this.origX > v) this.origX = v;
    if (this.origY < 0) this.origY = 0;
    v = this.rows * this.tileHeight - this.mapHeight;
    if (this.origY > v) this.origY = v;
    Mobil.prototype.doMove.call(this, runtime);
};

/**
 * @return void
 */
TiledMap.prototype.doDraw = function(runtime) {
    var col = this.origX / this.tileWidth;
    var row = this.origY / this.tileHeight;
    var shiftX = this.tileWidth * (Math.floor(col) - col);
    var shiftY = this.tileHeight * (Math.floor(row) - row);
    col = this.getCol(this.origX);
    row = this.getRow(this.origY);
    var ctx = runtime.context;
    ctx.beginPath();
    ctx.rect(0, 0, this.mapWidth, this.mapHeight);
    ctx.clip();

    var j, i;
    var visibleCols = Math.ceil(this.mapWidth / this.tileWidth) + 1;
    var visibleRows = Math.ceil(this.mapHeight / this.tileHeight) + 1;
    var centerX = this.tileWidth / 2 + shiftX;
    var centerY = this.tileHeight / 2 + shiftY;
    for (j = 0 ;  j < visibleRows ; j++) {
        var currentRow = (row + j) % this.rows;
        for (i = 0 ;  i < visibleCols ; i++) {
            var currentCol = (col + i) % this.cols;
            var mobil = this.getTile(currentCol, currentRow);
            if (mobil) {
                ctx.save();
                ctx.translate(
                    Math.floor(i * this.tileWidth + centerX), 
                    Math.floor(j * this.tileHeight + centerY)
                );
                mobil.doDraw(runtime);
                ctx.restore();
            }
        }
    }
    ctx.translate(Math.floor(-this.origX), Math.floor(-this.origY));
    Mobil.prototype.doDraw.call(this, runtime);
};

module.exports = TiledMap;
