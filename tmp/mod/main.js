{"intl":"","src":"window['#main']=function(exports,module){  var invertCompass = parseInt(localStorage.getItem('compass-inverted') || 0);\r\n\r\n\r\nexports.start = function() {\r\n    var compass = document.querySelector('#compass');\r\n    var numeric = document.querySelector('#numeric');\r\n    var warning = document.querySelector('#warning');\r\n    var config = document.querySelector('#config');\r\n    var text = document.querySelector('#warning-text');\r\n    var button = document.querySelector('#button');\r\n\r\n    button.addEventListener('touchstart', function(evt) {\r\n        evt.preventDefault();\r\n        evt.stopPropagation();\r\n        invertCompass = invertCompass ? 0 : 1;\r\n        localStorage.setItem('compass-inverted', invertCompass);\r\n        updateInvertButton();\r\n    }, true);\r\n\r\n    updateInvertButton();\r\n    \r\n    window.addEventListener(\"deviceorientation\", function (evt) {\r\n        var ang = invertCompass ? evt.alpha : 360 - evt.alpha;\r\n        compass.style.transform = 'rotate(' + (360 - ang) + \"deg)\";\r\n        var txt = ang.toFixed(1);\r\n        numeric.innerHTML = \"<b>\" + txt.substr(0, txt.length - 1)\r\n            + \"</b><small>\" + txt.substr(txt.length - 1) + \"</small> °\";\r\n    }, true);\r\n\r\n    window.setTimeout(function() {\r\n        warning.className = \"hide\";\r\n    }, 3000);\r\n\r\n    var onTap = function(evt) {\r\n        evt.preventDefault();\r\n        evt.stopPropagation();\r\n        config.classList.toggle('hide');\r\n    };\r\n\r\n    numeric.addEventListener('touchstart', onTap, false);\r\n    text.addEventListener('touchstart', onTap, false);\r\n};\r\n\r\n\r\nfunction updateInvertButton() {\r\n    var invert = document.querySelector('#invert');    \r\n    invert.className = invertCompass ? 'yes' : 'no';\r\n    invert.textContent = invertCompass ? 'YES' : 'NO';    \r\n}\r\n }\n","zip":"window[\"#main\"]=function(e,t){function n(){var e=document.querySelector(\"#invert\");e.className=o?\"yes\":\"no\",e.textContent=o?\"YES\":\"NO\"}var o=parseInt(localStorage.getItem(\"compass-inverted\")||0);e.start=function(){var e=document.querySelector(\"#compass\"),t=document.querySelector(\"#numeric\"),r=document.querySelector(\"#warning\"),a=document.querySelector(\"#config\"),c=document.querySelector(\"#warning-text\"),s=document.querySelector(\"#button\");s.addEventListener(\"touchstart\",function(e){e.preventDefault(),e.stopPropagation(),o=o?0:1,localStorage.setItem(\"compass-inverted\",o),n()},!0),n(),window.addEventListener(\"deviceorientation\",function(n){var r=o?n.alpha:360-n.alpha;e.style.transform=\"rotate(\"+(360-r)+\"deg)\";var a=r.toFixed(1);t.innerHTML=\"<b>\"+a.substr(0,a.length-1)+\"</b><small>\"+a.substr(a.length-1)+\"</small> °\"},!0),window.setTimeout(function(){r.className=\"hide\"},3e3);var i=function(e){e.preventDefault(),e.stopPropagation(),a.classList.toggle(\"hide\")};t.addEventListener(\"touchstart\",i,!1),c.addEventListener(\"touchstart\",i,!1)}};\n//# sourceMappingURL=main.js.map","map":{"version":3,"file":"main.js.map","sources":["main.js"],"sourcesContent":["window['#main']=function(exports,module){  var invertCompass = parseInt(localStorage.getItem('compass-inverted') || 0);\r\n\r\n\r\nexports.start = function() {\r\n    var compass = document.querySelector('#compass');\r\n    var numeric = document.querySelector('#numeric');\r\n    var warning = document.querySelector('#warning');\r\n    var config = document.querySelector('#config');\r\n    var text = document.querySelector('#warning-text');\r\n    var button = document.querySelector('#button');\r\n\r\n    button.addEventListener('touchstart', function(evt) {\r\n        evt.preventDefault();\r\n        evt.stopPropagation();\r\n        invertCompass = invertCompass ? 0 : 1;\r\n        localStorage.setItem('compass-inverted', invertCompass);\r\n        updateInvertButton();\r\n    }, true);\r\n\r\n    updateInvertButton();\r\n    \r\n    window.addEventListener(\"deviceorientation\", function (evt) {\r\n        var ang = invertCompass ? evt.alpha : 360 - evt.alpha;\r\n        compass.style.transform = 'rotate(' + (360 - ang) + \"deg)\";\r\n        var txt = ang.toFixed(1);\r\n        numeric.innerHTML = \"<b>\" + txt.substr(0, txt.length - 1)\r\n            + \"</b><small>\" + txt.substr(txt.length - 1) + \"</small> °\";\r\n    }, true);\r\n\r\n    window.setTimeout(function() {\r\n        warning.className = \"hide\";\r\n    }, 3000);\r\n\r\n    var onTap = function(evt) {\r\n        evt.preventDefault();\r\n        evt.stopPropagation();\r\n        config.classList.toggle('hide');\r\n    };\r\n\r\n    numeric.addEventListener('touchstart', onTap, false);\r\n    text.addEventListener('touchstart', onTap, false);\r\n};\r\n\r\n\r\nfunction updateInvertButton() {\r\n    var invert = document.querySelector('#invert');    \r\n    invert.className = invertCompass ? 'yes' : 'no';\r\n    invert.textContent = invertCompass ? 'YES' : 'NO';    \r\n}\r\n }\n"],"names":["window","exports","module","updateInvertButton","invert","document","querySelector","className","invertCompass","textContent","parseInt","localStorage","getItem","start","compass","numeric","warning","config","text","button","addEventListener","evt","preventDefault","stopPropagation","setItem","ang","alpha","style","transform","txt","toFixed","innerHTML","substr","length","setTimeout","onTap","classList","toggle"],"mappings":"AAAAA,OAAO,SAAS,SAASC,EAAQC,GA4CjC,QAASC,KACL,GAAIC,GAASC,SAASC,cAAc,UACpCF,GAAOG,UAAYC,EAAgB,MAAQ,KAC3CJ,EAAOK,YAAcD,EAAgB,MAAQ,KA/CN,GAAIA,GAAgBE,SAASC,aAAaC,QAAQ,qBAAuB,EAGpHX,GAAQY,MAAQ,WACZ,GAAIC,GAAUT,SAASC,cAAc,YACjCS,EAAUV,SAASC,cAAc,YACjCU,EAAUX,SAASC,cAAc,YACjCW,EAASZ,SAASC,cAAc,WAChCY,EAAOb,SAASC,cAAc,iBAC9Ba,EAASd,SAASC,cAAc,UAEpCa,GAAOC,iBAAiB,aAAc,SAASC,GAC3CA,EAAIC,iBACJD,EAAIE,kBACJf,EAAgBA,EAAgB,EAAI,EACpCG,aAAaa,QAAQ,mBAAoBhB,GACzCL,MACD,GAEHA,IAEAH,OAAOoB,iBAAiB,oBAAqB,SAAUC,GACnD,GAAII,GAAMjB,EAAgBa,EAAIK,MAAQ,IAAML,EAAIK,KAChDZ,GAAQa,MAAMC,UAAY,WAAa,IAAMH,GAAO,MACpD,IAAII,GAAMJ,EAAIK,QAAQ,EACtBf,GAAQgB,UAAY,MAAQF,EAAIG,OAAO,EAAGH,EAAII,OAAS,GACjD,cAAgBJ,EAAIG,OAAOH,EAAII,OAAS,GAAK,eACpD,GAEHjC,OAAOkC,WAAW,WACdlB,EAAQT,UAAY,QACrB,IAEH,IAAI4B,GAAQ,SAASd,GACjBA,EAAIC,iBACJD,EAAIE,kBACJN,EAAOmB,UAAUC,OAAO,QAG5BtB,GAAQK,iBAAiB,aAAce,GAAO,GAC9CjB,EAAKE,iBAAiB,aAAce,GAAO"},"dependencies":[]}