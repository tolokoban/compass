"use strict";
var Widget = require("wdg");

function convertArgs(args) {
  var result = [];
  var i, arg;
  for (i = 0 ; i < args.length ; i++) {
    arg = args[i];
    if (!Array.isArray(arg)) arg = [arg];
    if (arg.length == 0) continue;
    if (!Array.isArray(arg[0])) arg = [arg];
    arg.forEach(
      function(row) {
        result.push(row);
      }
    );
  }
  return result;
}

/**
 * @example
 * var LayoutGrid = require("tfw.layout-grid");
 * var instance = new LayoutGrid(["name", I()], ["age", I()]);
 * @class LayoutGrid
 */
var LayoutGrid = function() {
  Widget.call(this);
  this.addClass("tfw-layout-grid");
  var rows = convertArgs(arguments);
  var that = this;
  var cells = {};
  rows.forEach(
    function(row, rowIdx) {
      var div = Widget.div();
      row.forEach(
        function(col, colIdx) {
          var cell = Widget.div().append(col);
          var key = "C" + colIdx;
          ["C" + colIdx, "R" + rowIdx, "R" + rowIdx + "C" + colIdx].forEach(
            function(key) {
              if (typeof cells[key] === 'undefined') {
                cells[key] = [cell];
              } else {
                cells[key].push(cell);
              }
            }
          );
          div.append(cell);
        }
      );
      that.append(div);
    }
  );
  this._cells = cells;
};

// Extension of Widget.
LayoutGrid.prototype = Object.create(Widget.prototype);
LayoutGrid.prototype.constructor = LayoutGrid;

/**
 * @param {object} styles Targetted CSS styles  for the grid. The key is
 * a row, a col or a cell address. For instance, "C7" is the 8th column,
 * "R2" is  the third row  and "R3C2"  is the cell  at row 3  and column
 * 2. The top-left cell is at row 0 and column 0.
 * @return void
 */
LayoutGrid.prototype.styles = function(styles) {
  var key, css;
  var defaultCSS = styles._;
  if (defaultCSS) {
    for (key in this._cells) {
      this._cells[key].forEach(
        function(cell) {
          if (defaultCSS) {
            if (typeof defaultCSS === 'string') {
              cell.addClass(defaultCSS);
            } else {
              cell.css(defaultCSS);
            }
          }
        }
      );
    }
  }
  for (key in styles) {
    css = styles[key];
    var cells = this._cells[key];
    if (Array.isArray(cells)) {
      cells.forEach(
        function(cell) {
          if (typeof css === 'string') {
            cell.addClass(css);
          } else {
            cell.css(css);
          }
        }
      );
    }
  }

  return this;
};



LayoutGrid.create = function() {
  return new LayoutGrid(convertArgs(arguments));
};
module.exports = LayoutGrid;
