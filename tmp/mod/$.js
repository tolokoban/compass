{"intl":"","src":"window['#$']=function(exports,module){  exports.config={\n    name:\"Compass\",\n    description:\"Simple magnetic compass for Firefox OS.\",\n    author:\"Tolokoban\",\n    version:\"1.1.0\",\n    major:1,\n    minor:1,\n    revision:0,\n    date:new Date(2016,2,14,8,54,21)\n};\nvar currentLang = null;\nexports.lang = function(lang) {\n    if (lang === undefined) {\n        lang = window.localStorage.getItem(\"Language\");\n        if (!lang) {\n            lang = window.navigator.language;\n            if (!lang) {\n                lang = window.navigator.browserLanguage;\n                if (!lang) {\n                    lang = \"fr\";\n                }\n            }\n        }\n        lang = lang.substr(0, 2).toLowerCase();\n    }\n    currentLang = lang;\n    window.localStorage.setItem(\"Language\", lang);\n    return lang;\n};\nexports.intl = function(words, params) {\n    var dic = words[exports.lang()],\n    k = params[0],\n    txt, newTxt, i, c, lastIdx, pos;\n    if (!dic) {\n        //console.error(\"Missing internationalization for language : \\\"\" + exports.lang() + \"\\\"!\");\n        return k;\n    }\n    txt = dic[k];\n    if (!txt) {\n        //console.error(\"Missing internationalization [\" + exports.lang() + \"]: \\\"\" + k + \"\\\"!\");\n        return k;\n    }\n    if (params.length > 1) {\n        newTxt = \"\";\n        lastIdx = 0;\n        for (i = 0 ; i < txt.length ; i++) {\n            c = txt.charAt(i);\n            if (c === '$') {\n                newTxt += txt.substring(lastIdx, i);\n                i++;\n                pos = txt.charCodeAt(i) - 48;\n                if (pos < 0 || pos >= params.length) {\n                    newTxt += \"$\" + txt.charAt(i);\n                } else {\n                    newTxt += params[pos];\n                }\n                lastIdx = i + 1;\n            } else if (c === '\\\\') {\n                newTxt += txt.substring(lastIdx, i);\n                i++;\n                newTxt += txt.charAt(i);\n                lastIdx = i + 1;\n            }\n        }\n        newTxt += txt.substr(lastIdx);\n        txt = newTxt;\n    }\n    return txt;\n};\n }\n","zip":"window[\"#$\"]=function(n,r){n.config={name:\"Compass\",description:\"Simple magnetic compass for Firefox OS.\",author:\"Tolokoban\",version:\"1.1.0\",major:1,minor:1,revision:0,date:new Date(2016,2,14,8,54,21)};var a=null;n.lang=function(n){return void 0===n&&(n=window.localStorage.getItem(\"Language\"),n||(n=window.navigator.language,n||(n=window.navigator.browserLanguage,n||(n=\"fr\"))),n=n.substr(0,2).toLowerCase()),a=n,window.localStorage.setItem(\"Language\",n),n},n.intl=function(r,a){var o,t,e,i,g,s,u=r[n.lang()],l=a[0];if(!u)return l;if(o=u[l],!o)return l;if(a.length>1){for(t=\"\",g=0,e=0;e<o.length;e++)i=o.charAt(e),\"$\"===i?(t+=o.substring(g,e),e++,s=o.charCodeAt(e)-48,t+=0>s||s>=a.length?\"$\"+o.charAt(e):a[s],g=e+1):\"\\\\\"===i&&(t+=o.substring(g,e),e++,t+=o.charAt(e),g=e+1);t+=o.substr(g),o=t}return o}};\n//# sourceMappingURL=$.js.map","map":{"version":3,"file":"$.js.map","sources":["$.js"],"sourcesContent":["window['#$']=function(exports,module){  exports.config={\n    name:\"Compass\",\n    description:\"Simple magnetic compass for Firefox OS.\",\n    author:\"Tolokoban\",\n    version:\"1.1.0\",\n    major:1,\n    minor:1,\n    revision:0,\n    date:new Date(2016,2,14,8,54,21)\n};\nvar currentLang = null;\nexports.lang = function(lang) {\n    if (lang === undefined) {\n        lang = window.localStorage.getItem(\"Language\");\n        if (!lang) {\n            lang = window.navigator.language;\n            if (!lang) {\n                lang = window.navigator.browserLanguage;\n                if (!lang) {\n                    lang = \"fr\";\n                }\n            }\n        }\n        lang = lang.substr(0, 2).toLowerCase();\n    }\n    currentLang = lang;\n    window.localStorage.setItem(\"Language\", lang);\n    return lang;\n};\nexports.intl = function(words, params) {\n    var dic = words[exports.lang()],\n    k = params[0],\n    txt, newTxt, i, c, lastIdx, pos;\n    if (!dic) {\n        //console.error(\"Missing internationalization for language : \\\"\" + exports.lang() + \"\\\"!\");\n        return k;\n    }\n    txt = dic[k];\n    if (!txt) {\n        //console.error(\"Missing internationalization [\" + exports.lang() + \"]: \\\"\" + k + \"\\\"!\");\n        return k;\n    }\n    if (params.length > 1) {\n        newTxt = \"\";\n        lastIdx = 0;\n        for (i = 0 ; i < txt.length ; i++) {\n            c = txt.charAt(i);\n            if (c === '$') {\n                newTxt += txt.substring(lastIdx, i);\n                i++;\n                pos = txt.charCodeAt(i) - 48;\n                if (pos < 0 || pos >= params.length) {\n                    newTxt += \"$\" + txt.charAt(i);\n                } else {\n                    newTxt += params[pos];\n                }\n                lastIdx = i + 1;\n            } else if (c === '\\\\') {\n                newTxt += txt.substring(lastIdx, i);\n                i++;\n                newTxt += txt.charAt(i);\n                lastIdx = i + 1;\n            }\n        }\n        newTxt += txt.substr(lastIdx);\n        txt = newTxt;\n    }\n    return txt;\n};\n }\n"],"names":["window","exports","module","config","name","description","author","version","major","minor","revision","date","Date","currentLang","lang","undefined","localStorage","getItem","navigator","language","browserLanguage","substr","toLowerCase","setItem","intl","words","params","txt","newTxt","i","c","lastIdx","pos","dic","k","length","charAt","substring","charCodeAt"],"mappings":"AAAAA,OAAO,MAAM,SAASC,EAAQC,GAAUD,EAAQE,QAC5CC,KAAK,UACLC,YAAY,0CACZC,OAAO,YACPC,QAAQ,QACRC,MAAM,EACNC,MAAM,EACNC,SAAS,EACTC,KAAK,GAAIC,MAAK,KAAK,EAAE,GAAG,EAAE,GAAG,IAEjC,IAAIC,GAAc,IAClBZ,GAAQa,KAAO,SAASA,GAgBpB,MAfaC,UAATD,IACAA,EAAOd,OAAOgB,aAAaC,QAAQ,YAC9BH,IACDA,EAAOd,OAAOkB,UAAUC,SACnBL,IACDA,EAAOd,OAAOkB,UAAUE,gBACnBN,IACDA,EAAO,QAInBA,EAAOA,EAAKO,OAAO,EAAG,GAAGC,eAE7BT,EAAcC,EACdd,OAAOgB,aAAaO,QAAQ,WAAYT,GACjCA,GAEXb,EAAQuB,KAAO,SAASC,EAAOC,GAC3B,GAEAC,GAAKC,EAAQC,EAAGC,EAAGC,EAASC,EAFxBC,EAAMR,EAAMxB,EAAQa,QACxBoB,EAAIR,EAAO,EAEX,KAAKO,EAED,MAAOC,EAGX,IADAP,EAAMM,EAAIC,IACLP,EAED,MAAOO,EAEX,IAAIR,EAAOS,OAAS,EAAG,CAGnB,IAFAP,EAAS,GACTG,EAAU,EACLF,EAAI,EAAIA,EAAIF,EAAIQ,OAASN,IAC1BC,EAAIH,EAAIS,OAAOP,GACL,MAANC,GACAF,GAAUD,EAAIU,UAAUN,EAASF,GACjCA,IACAG,EAAML,EAAIW,WAAWT,GAAK,GAEtBD,GADM,EAANI,GAAWA,GAAON,EAAOS,OACf,IAAMR,EAAIS,OAAOP,GAEjBH,EAAOM,GAErBD,EAAUF,EAAI,GACD,OAANC,IACPF,GAAUD,EAAIU,UAAUN,EAASF,GACjCA,IACAD,GAAUD,EAAIS,OAAOP,GACrBE,EAAUF,EAAI,EAGtBD,IAAUD,EAAIN,OAAOU,GACrBJ,EAAMC,EAEV,MAAOD"},"dependencies":[]}