/**
 *
 * @module Shader
 */

var FS = require("fs");
var Path = require("path");

/**
 *
 * @example
 * <w:Fragment-Shader id="toto">shader.c</w:Fragment-Shader>
 */
exports.compile = function(root) {
  var Tree = this.Tree;
  var id = root.attribs.id;
  if (!id) {
    this.fatal(
      "Missing 'id' attribute for the shader!",
        -1,
      "<w:Fragment-Shader>"
    );
  }
  id = id.trim();
  var filename = Tree.text(root).trim();
  var file = this.htmPath(filename);
  if (!FS.existsSync(file)) {
    this.fatal(
      "Shader file not found: \"" + filename + "\"!\n" + file,
        -1,
      "<w:Fragment-Shader>"
    );
  }
  var stat = FS.statSync(file);
  if (!stat.isFile) {
    this.fatal("This is not a file: \"" + file + "\"!", -1, "<w:Fragment-Shader>");
  }
  root.extra.dependencies.push(filename);
  var content = FS.readFileSync(file).toString().trim();
  root.type = Tree.VOID;
  delete root.attribs;
  var script = Tree.createJavascript(content);
  script.attribs = {id: id, "type": "x-shader/x-fragment"};
  root.children = [script];
};
