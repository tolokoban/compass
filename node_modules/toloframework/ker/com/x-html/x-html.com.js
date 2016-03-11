/**
 * Component x-html, w:html
 */

exports.tags = ["x-html", "w:html"];
exports.priority = 0;

/**
 * Compile a node of the HTML tree.
 */
exports.compile = function(root, libs) {
    var N = libs.Tree,
    head = {type: N.TAG, name: "head", children: []},
    body = {type: N.TAG, name: "body", children: []},
    title = libs.getVar("$title"),
    app;
    N.forEachAttrib(root, function (attName, attValue) {
        if (attName.toLowerCase() == 'title') {
            title = attValue;
        }
        else if (attName.toLowerCase() == 'app' && attValue.length > 0) {
            app = attValue;
        }
    });
    if (app) {
        libs.require(app);
        libs.addInitJS(
            "APP = require('" + app + "');\n"
            + "setTimeout(function (){if(typeof APP.start==='function')APP.start()});"
        );
    }
    N.forEachChild(root, function (child) {
        if (child.type == N.TAG) {
            if (child.name.toLowerCase() == 'head') {
                N.forEachChild(child, function(subchild) {
                    head.children.push(subchild);
                });
            }
            else if (child.name.toLowerCase() == 'body') {
                body.attribs = child.attribs;
                N.forEachChild(child, function(subchild) {
                    body.children.push(subchild);
                });
            } else {
                body.children.push(child);
            }
        } else {
            body.children.push(child);
        }
    });

    // Add missing header tags.
    var alreadyExist = {};
    N.forEachChild(N, function (child) {
        if (child.type != N.TAG) return;
        var name = child.name.toLowerCase(),
        atts = child.attribs;
        if (name == 'title') {
            alreadyExist.title = 1;
        }
        else if (name == 'meta') {
            if (atts.charset) {
                alreadyExist.meta_charset = 1;
            }
            else if (atts.name == 'viewport') {
                alreadyExist.meta_name_viewport = 1;
            }
        }
    });

    if (!alreadyExist.title) {
        head.children.push(N.tag("title", {}, title));
    }
    if (!alreadyExist.meta_charset) {
        head.children.push(
            {type: N.TAG, name: "meta", attribs: {charset: "utf-8"}, void: true}
        );
    }
    if (!alreadyExist.meta_name_viewport) {
        head.children.push(
            {
                type: N.TAG, name: "meta",
                attribs: {
                    name: "viewport",
                    content: "width=device-width, initial-scale=1, maximum-scale=1"
                },
                void: true
            }
        );
    }

    root.name = "html";
    delete root.attribs;
    libs.compileChildren(head);
    libs.compileChildren(body);
    root.children = [head, body];
};
