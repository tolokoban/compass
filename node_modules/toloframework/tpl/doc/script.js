var navModules, navServices, body;

function unfold(text, start, end) {
  text = text.trim();
  start = start.trim();
  end = end.trim();
  if (text.substr(0, start.length) == start) {
    text = text.substr(start.length);
    if (text.substr(text.length - end.length) == end) {
      text = text.substr(0, text.length - end.length);
    }
  }
  return text;
}

function TAG(name, attribs) {
  if (typeof name === 'undefined') name = 'div';

  var e = document.createElement(name);
  if (typeof attribs === 'object') {
    var key, val;
    for (key in attribs) {
      val = attribs[key];
      e.setAttribute(key, val);
    }
  }
  var i, arg;
  for (i = 2 ; i < arguments.length ; i++) {
    arg = arguments[i];
    e.appendChild(arg);
  }
  e.append = function() {
    var i2, arg2;
    for (i2 = 0 ; i2 < arguments.length ; i2++) {
      arg2 = arguments[i2];
      e.appendChild(arg2);
    }
    return e;
  };
  e.text = function(v) {
    e.textContent = v;
    return e;
  };
  e.html = function(v) {
    e.innerHTML = v;
    return e;
  };
  return e;
}

function expand(caption, content) {
  var e = TAG("div", {"class": "expand"});
  e.appendChild(caption);
  e.appendChild(content);
  caption.addEventListener(
    "click",
    function() {
      e.classList.toggle("show");
    },
    false
  );
  return e;
}

function SPAN(attribs) {
  return TAG("span", attribs);
}

function B(attribs) {
  return TAG("b", attribs);
}

function P(attribs) {
  return TAG("p", attribs);
}

function H1(content) {
  var e = TAG("H1");
  e.textContent = content;
  return e;
}

function H2(content) {
  var e = TAG("H2");
  e.textContent = content;
  return e;
}

function H3(content) {
  var e = TAG("H3");
  e.textContent = content;
  return e;
}

function H4(content) {
  var e = TAG("H4");
  e.textContent = content;
  return e;
}

function H5(content) {
  var e = TAG("H5");
  e.textContent = content;
  return e;
}

function docRoot(x) {
  var e = TAG();
  if (x.value) {
    switch (x.value.TYPE) {
      case "Function":
      case "Class":
        e.appendChild(docFunction(x));
        break;
    }
  }
  return e;
}

function getArgs(x) {
  var title = "( ";
  if (Array.isArray(x.args)) {
    x.args.forEach(
      function(arg, idx) {
        if (idx > 0) {
          title += ", ";
        }
        title += arg;
      }
    );
  }
  title += " )";
  return title;
}

function docFunction(x) {
  var e = TAG();
  console.info("[docFunction] x=...", x);
  var title = x.value.TYPE + " " + getArgs(x.value);
  e.appendChild(H4(title));
  e.appendChild(docComments(x.comments));
  e.appendChild(docComments(x.value.comments));
  var f = x.value;
  ["Methods", "Statics"].forEach(
    function(caption) {
      var items = f[caption.toLowerCase()];
      if (typeof items === 'object') {
        var name, item;
        for (name in items) {
          item = items[name];
          var div = TAG();
          div.className = caption;
          var typ = TAG("span");
          typ.textContent = caption;
          div.appendChild(typ);
          var tail = TAG("span");
          tail.textContent = "  " + name + " " + getArgs(item);
          div.appendChild(typ);
          div.appendChild(tail);
          e.appendChild(expand(div, docComments(item.comments)));
        }
      }
    }
  );

  return e;
}

function docComments(comments) {
  var e = TAG("span");
  if (typeof comments !== 'object') return e;
  e.innerHTML = comments.$summary || "";
  if (Array.isArray(comments.$param)) {
    e.appendChild(H5("Arguments"));
    var ul = TAG("ul", {"class": "param"});
    e.appendChild(ul);
    comments.$param.forEach(
      function(param) {
        var li = TAG("li");
        var caption = SPAN();
        ul.appendChild(li);
        var paramName = SPAN({"class": "name"});
        paramName.textContent = param.name;
        caption.appendChild(paramName);
        var paramType = SPAN({"class": "type"});
        paramType.textContent = param.type;
        caption.appendChild(paramType);
        var content = SPAN();
        content.innerHTML = param.content;
        var n = content.textContent.length;
        if (n > 64) {
          var summary = SPAN();
          summary.textContent = content.textContent.substr(0, 64);
          summary.className = "short inline";
          caption.appendChild(summary);
          li.appendChild(expand(caption, content));
        } else {
          content.classList.add("inline");
          caption.appendChild(content);
          li.appendChild(caption);
        }
      }
    );
  }
  if (Array.isArray(comments.$return)) {
    comments.$return.forEach(
      function(item) {
        // Retirer les <p>...</p> qui obligent à paser à la ligne.
        item = unfold(item, "<p>", "</p>");
        e.appendChild(
          P().append(
            B().text("Return: "),
            SPAN().html(item)
          )
        );
      }
    );
  }
  if (Array.isArray(comments.$example)) {
    comments.$example.forEach(
      function(example, index) {
        example = unfold(example, '<pre><code class="lang-js">', '</code></pre>');
        e.appendChild(
          TAG("fieldset").append(
            TAG("legend").text("Example " + (index + 1)),
            TAG().html(example)
          )
        );
      }
    );
  }
  return e;
}

function showModule(name) {
  var key, val;
  body.innerHTML = "";
  var title = H1(name);
  body.appendChild(title);
  var x = M[name].exports;
  console.info(name, x);
  body.appendChild(H2("module.exports"));
  if (x.TYPE == 'Object') {
    for (key in x.attributes) {
      val = x.attributes[key];
      console.info("[script] val=...", val);
      body.appendChild(H3(key));
      body.appendChild(docRoot(val));
    }
  } else {
    body.appendChild(docRoot(x));
  }
};

function showModule(name) {
  var key, val;
  body.innerHTML = "";
  var title = H1(name);
  body.appendChild(title);
  var x = M[name].exports;
  console.info(name, x);
  body.appendChild(H2("module.exports"));
  if (x.TYPE == 'Object') {
    for (key in x.attributes) {
      val = x.attributes[key];
      console.info("[script] val=...", val);
      body.appendChild(H3(key));
      body.appendChild(docRoot(val));
    }
  } else {
    body.appendChild(docRoot(x));
  }
};

function showService(name) {
  body.innerHTML = SERVICES[name];
}

function init() {
  navModules = document.getElementById("modules");
  navServices = document.getElementById("services");
  body = document.getElementById("body");
  var hash = Date.now();

  window.setInterval(function() {
    var curHash = window.location.hash.substr(1);
    if (hash == curHash) return;
    hash = curHash;
    if (hash.substr(0, 4) == 'svc/') {
      showService(hash.substr(4));
    }
    else if (hash.substr(0, 4) == 'mod/') {
      showModule(hash.substr(4));
    }
  }, 40);

  var name, e;
  navModules.innerHTML = "<h1>Modules</h1>";
  navServices.innerHTML = "<h1>Services</h1>";
  for (name in M) {
    e = TAG("a", {href: "#mod/" + name});
    e.textContent = name;
    navModules.appendChild(e);
  }
  for (name in SERVICES) {
    e = TAG("a", {href: "#svc/" + name});
    e.textContent = name;
    navServices.appendChild(e);
  }
}
