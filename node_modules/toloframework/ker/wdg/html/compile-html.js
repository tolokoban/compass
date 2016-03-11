/**
 * @module Html
 */

var FS = require("fs");

module.exports.compile = function(root) {
    var Tree = this.Tree;
    // root's children must be shifted to <body>.
    var children = (root.children || []).filter(
        function(item) {
            return item.type != Tree.TAG 
                || (item.name.toLowerCase() != "head" && item.name.toLowerCase() != "body");
        }
    );
    var head = Tree.findOrAppendChild(root, "head");
    var body = Tree.findOrAppendChild(root, "body");
    if (Array.isArray(body.children)) {
        body.children = body.children.concat(children);
    } else {
        body.children = children;
    }
    root.children = [head, body];
    // Title must be added to <head>.
    var title = Tree.att(root, "title") || "Toloframework";
    delete root.attribs.title;
    // Add standard metas to <head>.
    var deviceW = Tree.att(root, "width") || "device-width";
    var deviceH = Tree.att(root, "height") || "device-height";
    var metas = [
        Tree.tag(
            "meta", {"http-equiv": "X-UA-Compatible", content: "IE=Edge"}
        ),
/*
        Tree.tag(
            "meta", {"http-equiv": "Pragma", content: "no-cache"}
        ),
*/
        Tree.tag(
            "meta", {"http-equiv": "Content-Type", content: "text/html; charset=UTF-8"}
        ),
        Tree.tag(
            "meta", {"http-equiv": "description", content: title}
        ),
        Tree.tag(
            "meta", {"name": "apple-mobile-web-app-capable", content: "yes"}
        ),
        Tree.tag(
            "meta", {
                "name": "viewport",
                content: "width="
                    + deviceW + ",height="
                    + deviceH + ",user-scalable=no,initial-scale=1.0,maximum-scale=1.0"
            }
        )
    ];
    if (Array.isArray(head.children)) {
        metas = metas.concat(head.children);
    }
    head.children = metas;
    // Move app attribute to <body>.
    var app = Tree.att(root, "app");
    if (app) {
        delete root.attribs.app;
        Tree.att(body, "app", app);
    }
    // Set the title.
    if (title) {
        var titleTag = Tree.findOrAppendChild(head, "title");
        Tree.text(titleTag, title);
    }
    root.name = "html";
};
