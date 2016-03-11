var Parser = require("../lib/tlk-htmlparser");
var Tree = require("../lib/htmltree");
var JSON = require("../lib/tolojson");

describe('htmltree', function () {
    function check(input, output) {
        var root = Parser.parse(input);
        var html = Tree.toString(root);
        if (typeof output === 'undefined') output = input;
        expect(html).toBe(output);
    }
    it('should keep text unchanged', function () {
        check('Hello world!');
        check('  Hello world!  ');
    });
    it('should keep simple tags unchanged', function () {
        check('Hello <b>world</b>!');
        check('This is <span class="toto">very <i>fun</i></span>, is not it?');
    });
});
