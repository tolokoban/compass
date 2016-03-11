var MD = require("./tfw-md");
var FS = require("fs");
var Path = require("path");
var Source = require("./source");


module.exports.compile = function(prj) {
  var svcPath = prj.srcPath("tfw/svc");
  console.log(svcPath);
  if (!FS.existsSync(svcPath)) {
    console.log("No services.");
    return;
  }
  var files = FS.readdirSync(svcPath);
  var services = {};
  files.forEach(
    function(f) {
      var path = Path.join(svcPath, f);
      if (f.substr(f.length - 4) != '.php') return;
      var shortName = f.substr(0, f.length - 4);
      var source = new Source(prj, path);
      if (!source.isUptodate()) {
        var html = "<h1>" + shortName + "</h1>" + compile(source.read(), shortName);
        source.tag("html", html);
        source.save();
      }
      services[shortName] = source.tag("html");
    }
  );
  FS.writeFileSync(
    prj.docPath("services.js"),
    "window.SERVICES=" + JSON.stringify(services) + ";"
  );
};


function compile(content, name) {
  var level = 0;
  var mode = null;
  var role = "";
  var comment = "";
  var html = "";
  var c, i;
  var rxRole = /^\$ROLE[ \t\n\r]*=[ \t\n\r]*['"]([^'"]*)['"][ \t\n\r]*;/;
  var rxEnd = /^function[ \t\n\r]+execService[ \t\n\r]*\(/;
  var rxComment1 = /^\/\/(.+?)[\n\r]+/;
  var rxComment2 = /^\/\*(([^*]+|\*[^\/])+)\*\//;
  function hit(text) {
    if (content.substr(i, text.length) == text) {
      i += text.length - 1;
      return true;
    }
    return false;
  }
  function rx(x) {
    var match = x.exec(content.substr(i));
    if (!match) return null;
    i += match[0].length - 1;
    return match;
  }
  var modes = {
    search: function() {
      var match = rx(rxRole);
      if (match) {
        role = match[1].toUpperCase();
        return;
      }
      match = rx(rxComment1) || rx(rxComment2);
      if (match) {
        comment += match[1] + "\n";
        return;
      }
      match = rx(rxEnd);
      if (match) {
        mode = null;
        return;
      }
      return;
      if (hit('{')) {
        level++;
        mode = "block";
        return;
      }
    },
    block: function() {
      if (hit('{')) {
        level++;
      }
      else if (hit('}')) {
        level--;
        if (level < 1) {
          comment = "";
          mode = "search";
        }
      }
    }
  };

  mode = "search";

  for (i = 0 ; i < content.length ; i++) {
    if (!mode) {
      html = MD.toHTML(cleanup(comment));
      if (role == "") {
        html = "<div class='public'>Public access</div>" + html;
      } else {
        html = "<div class='restricted'>Restricted to " + role + "</div>" + html;
      }
      console.log("Service: " + name.yellow + " [" + role.green + "]");
      return html;
    }
    c = content.charAt(i);
    modes[mode]();
  }
  throw "Invalid service: missing function execService()!";
}


function cleanup(comment) {
  var lines = comment.split("\n");
  var lines2 = [];
  var result = "";
  var min1 = comment.length;
  var min2 = comment.length;
  var rx1 = /^[ \t]+/;
  var rx2 = /^[ \t]*\*[ \t]*/;
  lines.forEach(
    function(line) {
      var trimedLine = line.trim();
      var emptyLine = trimedLine.length == 0 || trimedLine == "*";
      line.split("\n").forEach(
        function(line2) {
          if (!emptyLine) {
            var match = rx1.exec(line2);
            min1 = match ? Math.min(min1, match[0].length) : 0;
            match = rx2.exec(line2);
            min2 = match ? Math.min(min2, match[0].length) : 0;
          }
          lines2.push(line2);
        }
      );
    }
  );
  var skip = Math.max(min1, min2);
  lines2.forEach(
    function(line2) {
      result += line2.substr(skip);
    }
  );
  return result;
}
