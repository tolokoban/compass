
describe("Module <tolojson>", function() {
  it("is in the correct directory", function() {
    expect(function() {require("../lib/tolojson");}).not.toThrow();
  });
  describe("", function() {
    beforeAll(function() {
      this.T = require("../lib/tolojson");
    });
    it("adds indentation to its output", function() {
      [
        [
          {name:"Piliwik",age:27},
          '{"name": "Piliwik", "age": 27}'
        ],
        [
          {name:"Piliwik",age:27,temper:"Very friendly when IT sleeps!!"},
          '{\n  "name": "Piliwik",\n  "age": 27,\n  "temper": "Very friendly when IT sleeps!!"\n}'
        ]
      ].forEach(
        function(testCase) {
          var result = this.T.stringify(testCase[0], '  ');
          expect(result).toBe(testCase[1]);
        },
        this
      );
    });
  });
});
