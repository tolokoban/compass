var SourceMap = require("../lib/source-map");
var JSON = require("../lib/tolojson");

var map1 = {"version":3,"file":"test.js.map","sources":["test.js"],"sourcesContent":["window['#test']=function(exports,module){  console.log(3.14);\nvar pi = 3.14;\nexports.PI = pi;\n }\n"],
"names":["window","exports","module","console","log","pi","PI"],
"mappings":"AAAAA,OAAO,SAAS,SAASC,EAAQC,GAAUC,QAAQC,IAAI,KACvD,IAAIC,GAAK,IACTJ,GAAQK,GAAKD"};

describe("SourceMap", function() {
    describe("mappings", function() {
        it("should encode what was decoded", function() {
            var srcMap = new SourceMap();
            var mappings = "AAAAA,OAAO,SAAS,SAASC,EAAQC,GAAUC,QAAQC,IAAI,KACvD,IAAIC,GAAK,IACTJ,GAAQK,GAAKD";
            var lines = srcMap.decodeMappings(mappings);
            expect(srcMap.encodeMappings(lines)).toBe(mappings);
        });
    });
});
