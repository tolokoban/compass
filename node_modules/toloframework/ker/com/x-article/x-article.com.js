/**
 * Component x-article
 */
var Path = require("path");

exports.tags = ["x-article"];

/**
 * Compile a node of the HTML tree.
 */
exports.compile = function(root, libs) {
    var N = libs.Tree,
        result = [],
        head = null,
        title = libs.getVar("$title"),
        app,
        refs = {},
        links = [],
        pageIndex = 0;
    N.forEachAttrib(root, function (attName, attValue) {
        if (attName.toLowerCase() == 'title') {
            title = attValue;
        }
        else if (attName.toLowerCase() == 'app' && attValue.length > 0) {
            app = attValue;
        }
    });

    N.forEachChild(root, function (child) {
        if (child.type != N.TAG) return;
        var name = child.name.toLowerCase();
        if (name == 'head') {
            head = child;
        }
        else if (name == 'page') {
            var article = {
                type: N.TAG,
                name: "article",
                attribs: {},
                children: []
            };
            var section = {
                type: N.TAG,
                name: "section",
                attribs: {"class": "x-article custom"},
                children: []
            };
            var html = {
                type: N.TAG,
                name: "x-html",
                attribs: {},
                children: []
            };
            child.name = 'x-md';
            if (typeof child.attribs.title === 'undefined') {
                html.attribs.title = title;
                section.children.push(
                    libs.parseHTML(
                        "<header><a class='back' href='" 
                            + libs.getBackToRoot(libs.getVar('$filename'))
                            + "index.html'>◀</a>" + title + "</header>"
                    )
                );
            }
            section.children.push(article);
            if (typeof child.attribs.app === 'undefined') html.attribs.app = app;
            if (head) {
                html.children.push(head);
            }
            libs.compile(child);
            // Looking for references over all pages.
            N.walk(child, function(node) {
                if (node.type == N.TAG && node.name.toLowerCase() == 'a') {
                    node.page = pageIndex;
                    if (node.attribs.name) {
                        refs[node.attribs.name] = pageIndex;
                    }
                    if (node.attribs.href && node.attribs.href.charAt(0) == '#') {
                        links.push(node);
                    }
                }
            });
            article.children.push(child);
            // Adding a tailing space. This is needed for aesthetic reasons.
            article.children.push( N.div({style: 'height:1rem'}) );
            html.children.push(section);
            result.push(html);
            pageIndex++;
        }
    });
    links.forEach(function (link) {
        var href = link.attribs.href.substr(1);
        var ref = refs[href];
        if (typeof ref === 'undefined') {
            libs.fatal("Reference not found: \"" + href + "\"!\n" + N.toString(link));
        }
        if (link.page != ref) {
            var filename = Path.basename(libs.getVar('$filename'));
            if (ref > 0) {
                filename = filename.substr(0, filename.length - 4) + ref + '.html';
            }
            link.attribs.href = filename + '#' + href;
        }
    });

    // Add page navigation if more than one page.
    if (result.length > 1) {
        result.forEach(function (page, idx) {
            var filename,
                footer = "<footer><div>";
            for (var idxPage = 0 ; idxPage < result.length ; idxPage++) {
                filename = Path.basename(libs.getVar('$filename'));
                if (idxPage > 0) {
                    filename = filename.substr(0, filename.length - 4) + idxPage + '.html';
                }
                footer += "<div>";
                if (idx == idxPage) {
                    footer += "<div class='selected'>" + (1 + idx) + "</div>";
                } else {
                    footer += "<a href='" + filename + "'>" + (idxPage + 1) + "</a>";
                }
                footer += "</div>";
            }
            footer += "</div></footer>";
            page.children[page.children.length - 1].children.push(libs.parseHTML(footer));
        });
    }

    root.type = N.PAGES;
    delete root.name;
    delete root.attribs;
    root.children = result;
};
