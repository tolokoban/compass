var Parser = require("../lib/tlk-htmlparser");
var Tree = require("../lib/htmltree");
var JSON = require("../lib/tolojson");

describe('htmlparser', function () {
    function check(content, expected) {
        try {
            var txtExpected = JSON.stringify(expected, '  ');
            var result = Parser.parse(content);
            var txtResult = JSON.stringify(result, '  ');
            if (txtExpected != txtResult) {
                fail(content + "\n"
                     + "======== EXPECTED ========\n"
                     + txtExpected + "\n"
                     + "========= RESULT =========\n"
                     + txtResult + "\n");
            }
        }
        catch (ex) {
            if (ex.msg) {
                fail("Exception: " + JSON.stringify(ex));
            } else {
                fail(ex + "\n" + ex.stack);
            }
        }
    }
    it('should deal with simple text', function () {
        check(
            'Hello world!',
            {children:[{type: Tree.TEXT, text: 'Hello world!'}]}
        );
    });
    it('should deal with simple text with HTML entities', function () {
        check(
            'a&lt;b',
            {children:[
                {type: Tree.TEXT, text: 'a'},
                {type: Tree.ENTITY, text: '&lt;', pos: 1},
                {type: Tree.TEXT, text: 'b'}
            ]}
        );
    });
    it('should deal with simple text with HTML entities and spaces', function () {
        check(
            'a &lt; b',
            {children:[
                {type: Tree.TEXT, text: 'a '},
                {type: Tree.ENTITY, text: '&lt;', pos: 2},
                {type: Tree.TEXT, text: ' b'}
            ]}
        );
    });
    it('should deal with lonely ampercents', function () {
        check(
            'a&b',
            {children:[
                {type: Tree.TEXT, text: 'a&b'}
            ]}
        );
    });
    it('should deal with simple void elements', function () {
        ["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"].forEach(function (name) {
            check(
                '<' + name + '>',
                {children:[{type: Tree.TAG, name: name, attribs: {}, children:[], pos: 0, void: true}]}
            );
        });
    });
    it('should deal with simple autoclose elements', function () {
        check(
            '<$number/>',
            {children:[
                {type: Tree.TAG, name: '$number', attribs: {}, children:[], pos: 0, autoclose: true}
            ]}
        );
    });
    it('should deal with simple autoclose elements with namespace', function () {
        check(
            '<tag:div/>',
            {children:[
                {type: Tree.TAG, name: 'tag:div', attribs: {}, children:[], pos: 0, autoclose: true}
            ]}
        );
    });
    it('should deal with attributes', function () {
        check(
            'name: <input disabled type="text" size=\'4\'>',
            {
                "children": [
                    {"type": 2, "text": "name: "},
                    {
                        "type": 1,
                        "name": "input",
                        "attribs": {"disabled": null, "type": "text", "size": "4"},
                        "children": [],
                        "pos": 6,
                        "void": true
                    }]
            }
        );
    });
    it('should deal with attributes and nested quotes', function () {
        check(
            '<a href="javascript:alert(\\"Yo!\\")">',
            {
                "children": [
                    {
                        "type": 1,
                        "name": "a",
                        "attribs": {"href": "javascript:alert(\"Yo!\")"},
                        "children": [],
                        "pos": 0
                    }]
            }
        );
    });
    it('should deal with nested tags', function () {
        check(
            'a<div>c<b>e</b>d</div>b',
            {
                "children": [
                    {"type": 2, "text": "a"},
                    {
                        "type": 1,
                        "name": "div",
                        "attribs": {},
                        "children": [
                            {"type": 2, "text": "c"},
                            {
                                "type": 1,
                                "name": "b",
                                "attribs": {},
                                "children": [{"type": 2, "text": "e"}],
                                "pos": 7
                            },
                            {"type": 2, "text": "d"}],
                        "pos": 1
                    },
                    {"type": 2, "text": "b"}]
            }
        );
    });
    it('should deal with comments', function () {
        check(
            'Hello<!-- Bouh! -->World!',
            {
                "children": [
                    {"type": 2, "text": "Hello"},
                    {"type": 5, "text": " Bouh! ", "pos": 5},
                    {"type": 2, "text": "World!"}]
            }
        );
    });
    it('should deal with doc types', function () {
        check(
            '<!DOCTYPE html>',
            {
                "children": [
                    {
                        "type": 6,
                        "name": "DOCTYPE",
                        "attribs": {"html": null},
                        "pos": 0
                    }]
            }        );
    });
    it('should deal with processing', function () {
        check(
            '<?xml-stylesheet href="default.css" title="Default style"?>',
            {
                "children": [
                    {
                        "type": 4,
                        "name": "xml-stylesheet",
                        "attribs": {
                            "href": "default.css",
                            "title": "Default style"
                        },
                        "pos": 0
                    }]
            }
        );
    });
});


