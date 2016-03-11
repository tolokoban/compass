/**
 *
 * @module Shader
 */

var FS = require("fs");
var Path = require("path");
var Util = require("../util.js");

/**
 *
 * @example
 * <w:Shader></w:Shader>
 */
exports.compile = function(root) {
  var Tree = this.Tree;
  var id = root.attribs.id;
  if (!id) {
    this.fatal(
      "Missing 'id' attribute for the shader!",
        -1,
      "<w:Shader>"
    );
  }
  id = id.trim();
  var filename = Tree.text(root).trim();
  var file = this.srcOrLibPath(filename);
  if (!FS.existsSync(file)) {
    this.fatal(
      "Shader file not found: \"" + filename + "\"!\n" + this.srcPath(filename),
        -1,
      "<w:Shader>"
    );
  }
  var stat = FS.statSync(file);
  if (!stat.isFile) {
    this.fatal("This is not a file: \"" + file + "\"!", -1, "<w:Shader>");
  }
  root.extra.dependencies.push(filename);
  var content = FS.readFileSync(file).toString().trim();
  root.type = Tree.VOID;
  delete root.attribs;
  var script = Tree.createJavascript(content);
  script.attribs = {id: id, "type": "x-shader/x-fragment"};
  root.children = [script];
};
