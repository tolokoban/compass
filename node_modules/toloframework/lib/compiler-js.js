/**
 * @module compiler-js
 */
var FS = require("fs");
var Dox = require("dox");
var Path = require("path");
var Util = require("./util");
var JSON = require("./tolojson");
var JsDoc = require("./jsdoc");
var UglifyJS = require("uglify-js");
var DependsFinder = require("./depends-finder");

function warning(msg) {
  console.log(msg.yellowBG);
}

exports.compile = function(source) {
  var iniName = source.name().substr(0, source.name().length - 2) + "ini";
  var iniPath = source.prj().srcOrLibPath(iniName);
  if (source.isUptodate()) return false;
  console.log("Compiling " + source.name().yellow);
  var prj = source.prj();
  var code = source.read();
  var zip = Util.zipJS(code);
  source.tag("zip", zip);
  if (source.name().substr(0, 4) == 'mod/') {
    var docPath = prj.srcPath("../doc");
    prj.mkdir(docPath);
    var docFile = Path.join(docPath, source.name().substr(4));
    try {
      var doc = JsDoc(code);
      //console.log(JSON.stringify(doc, "  "));
      source.tag("doc", JsDoc(code));
    } catch (x) {
      warning("Unable to generate DOC for " + source.name() + "\n" + x);
    }
  }
  var needs = [];
  var dependsFinder = new DependsFinder(zip);
  dependsFinder.depends.forEach(
    function(file) {
      var prj = source.prj();
      var exist = prj.srcOrLibPath(file);
      if (prj.isReservedModules(file)) {
        // This is a reserved module (maybe defined in nodejs).
        if (exist) {
          warning("This module (used in \""
                  + source.name() + "\") is reserved by nodejs: \""
                  + file.bold + "\"!");
        }
      } else {
        if (!exist) {
          warning("Required module not found in \"" + source.name() + "\": \""
                  + file.bold + "\" !");
        } else {
          needs.push(file);
        }
      }
    }
  );
  var cssName = source.name().substr(0, source.name().length - 2) + "css";
  var cssPath = source.prj().srcOrLibPath(cssName);
  if (cssPath) {
    source.tag("css", cssName);
  } else {
    source.tag("css", null);
  }
  if (iniPath) {
    source.tag("intl", require("./compiler-ini.js").parse(iniPath));
  } else {
    source.tag("intl", "");
  }
  source.tag("needs", needs);
  source.tag("zip", zip);
  source.save();
  return true;
};


var Visitor = function(content) {
  /**
   * Throw a fatal exception with a portion of the buggy code.
   */
  function fatal(node, err) {
    var msg= '', line = node.start.line, col = node.start.col;
    msg += "----------------------------------------"
      + "----------------------------------------\n";
    msg += "  file: " + node.start.file + "\n";
    msg += "  line: " + line + "\n";
    msg += "  col.: " + col + "\n";
    msg += "----------------------------------------"
      + "----------------------------------------\n";
    var lines = content.split("\n"),
    lineIndex, indent = '',
    min = Math.max(0, line - 1 - 2),
    max = line;
    for (lineIndex = min ; lineIndex < max ; lineIndex++) {
      msg += lines[lineIndex].trimRight() + "\n";
    }
    for (lineIndex = 0 ; lineIndex < col ; lineIndex++) {
      indent += ' ';
    }
    msg += "\n" + indent + "^".bold + "\n";
    throw {fatal: err.bold + "\n" + msg};
  }

  /**
   * Extract comments before a node.
   */
  function comment(node) {
    var txt = '';
    var comments = node.start.comments_before;
    if (comments) {
      comments.forEach(
        function(comment) {
          txt += comment.value;
        }
      );
    }
    return txt;
  }

  var cls = {needs:[], functions:{}};
  var currentMethod;
  var nodePath = '', nodePathStack = [];
  var envFatal = function(msg) {
    return function(node) {
      fatal(node, msg);
    };
  };
  var env;

  /**
   * Add a dependency in "cls.needs" if it is not yet in the array.
   * @return true if the class exists.
   */
  function need(name) {
    var i, item;
    for (i = 0 ; i < cls.needs.length ; i++) {
      item = cls.needs[i];
      if (item == name) {
        return true;
      }
    }
    cls.needs.push(name);
    return true;
  }

  var env$$3 = function(node) {
    if (node.TYPE == 'String') {
      if (!need(node.value)) {
        fatal(node, "Class not found: \"" + node.value + "\"!");
      }
    } else {
      fatal(node, "Instanciation of TFW classes must be done with static strings!");
    }
    env = env$$1;
  };

  var env$$2 = function(node) {
    if (node.TYPE == 'SymbolRef' && node.name == '$$') {
      env = env$$3;
    } else {
      env = env$$1;
    }
  };

  function env$$1(node) {
    if (node.TYPE == 'Call') {
      env = env$$2;
    }
  };


  var classProperty = "";
  var registry = {
    "Toplevel/": function(node) {
      cls.comment = comment(node);
    },
    "Toplevel/SimpleStatement/Assign/Sub/SymbolRef/": function(node) {
      if (node.name == 'window') {
        return {
          "../String/": function(node) {
            var className = node.value;
            if (className.substr(0, 5) != 'TFW::') {
              fatal(node, "Class name must begin with \"TFW::\"!");
            }
            className = className.substr(5);
            cls.name = className;
            return {
              "Toplevel/SimpleStatement/Assign/Object/ObjectKeyVal/": function(node) {
                switch (node.key) {
                  case 'superclass':
                    env = function(node) {
                      if (node.TYPE != "String") {
                        fatal(node, "superclass must be a STRING!");
                      }
                      if (!need(node.value)) {
                        fatal(node, "Class not found: \"" + node.value + "\"!");
                      }
                      cls.superclass = node.value;
                    };
                    break;
                  case 'singleton':
                    env = function(node) {
                      if (node.TYPE != "True") {
                        fatal(
                          node,
                          "Property \"singleton\" is not mandatory. "
                            + "But if you use it, it must be equal to \"true\"!"
                        );
                      }
                      cls.singleton = true;
                      env = null;
                    };
                    break;
                  case 'init':
                    cls.init = comment(node);
                    return {
                      "./Function/": function(node) {
                        env = env$$1;
                      },
                      "./Function/SymbolFunarg/":
                      envFatal(
                        "Arguments are not allowed in constructor! "
                          + "Use \"attributes\" instead."
                      )
                    };
                  case 'functions':
                    return {
                      "./Object/ObjectKeyVal/": function(node) {
                        if (cls.functions[node.key]) {
                          fatal(node, "Already defined function \"" + node.key + "\"!");
                        }
                        currentMethod = {
                          comment: comment(node),
                          args: []
                        };
                        cls.functions[node.key] = currentMethod;
                        env = env$$1;
                        return {
                          "./Function/SymbolFunarg/": function(node) {
                            currentMethod.args.push(node.name);
                          },
                          "..": function(node) {
                            env = null;
                          }
                        };
                      }
                    };
                  case 'lang':
                  case 'attributes':
                  case 'signals':
                    env = null;
                    break;
                  case 'classInit':
                    return {
                      "./Function/": function(node) {
                        env = env$$1;
                      }
                    };
                    break;
                  default:
                    fatal(node, "Unknown class property: \"" + node.key + "\"!");
                }
              }
            }
          }
        };
      }
      return false;
    }
  };

  return {
    walk: function(node, down) {
      nodePathStack.push(node.TYPE);
      nodePath += node.TYPE + "/";
      //console.log(nodePath + "\t" + (node.key || node.name || node.value));
      var f = registry[nodePath];
      if (f && typeof f === 'function') {
        var result = f(node, down);
        if (typeof result === 'object') {
          var newReg = {}, key, val;
          for (key in result) {
            val = result[key];
            if (key.charAt(0) == '.') {
              // Chemin relatif.
              key = Path.normalize(Path.join(nodePath, key)).replace(/\\/g, '/');
            }
            registry[key] = val;
          }
          down();
        }
        else if (result !== false) {
          down();
        }
      } else {
        if (!env) {
          down();
        }
        else if (false !== env(node)) {
          down();
        }
      }
      nodePath = nodePath.substr(0, nodePath.length - nodePathStack.pop().length - 1);
      return true;
    },

    result: function() {
      return cls;
    }
  };
};
