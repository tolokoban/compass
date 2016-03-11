/**
 * Component x-img2css
 *
 * Convert a SVG in a CSS style embeded in a DataURL.
 */

var RX_LOCAL_URL = /url[ \t]*\([ \t]*#([^ \t\)]+)[ \t]*\)/g;

exports.tags = ["x-img2css"];
exports.priority = 0;

/**
 * Called the  first time the  component is  used in the  complete build
 * process.
 */
exports.initialize = function(libs) {};

/**
 * Called after the complete build process is over (success or failure).
 */
exports.terminate = function(libs) {};

/**
 * Called the first time the component is used in a specific HTML file.
 */
exports.open = function(file, libs) {};

/**
 * Called after a specific HTML file  as been processed. And called only
 * if the component has been used in this HTML file.
 */
exports.close = function(file, libs) {};

/**
 * Compile a node of the HTML tree.
 */
exports.compile = function(root, libs) {
    var className = root.attribs['class'];
    if (!className) {
        libs.fatal(
            "Missing mandatory attribute: \"class\"!\n"
                + "This is the name of the final CSS class which defines the SVG background."
        );
    }
    var src = root.attribs['src'];
    if (!src) {
        libs.fatal(
            "Missing mandatory attribute: \"src\"!\n"
                + "This is the SVG source file to convert as a CSS style."
        );
    }
    if (!libs.fileExists(src)) {
        // Extension is not mandatory. We have a chance to add it now.
        src += '.svg';
    }
    if (!libs.fileExists(src)) {
        libs.fatal(
            "SVG file not found: \"" + src + "\"!\n"
                + "The path must be relative to the HTML file in which it is defined."
        );
    }

    var zippedSVG = zipSVG(libs, libs.readFileContent(src), src);
    var dstFileName = "x-img2css/" + className + ".svg";
    // CSS style to add in the Inner part.
    var css = '.' + className + "{background-repeat:no-repeat;"
        + "background-position:50% 50%;"
        + "background-size:contain;"
        + "background-image:url(" + dstFileName + ")}";
    libs.addInnerCSS(css);
    // File must be put in `css` folder otherwise it won't be accessed by CSS files.
    libs.addResourceText(className, 'css/' + dstFileName, zippedSVG);

    // This tag is not usefull anymore. We can delete it.
    root.type = libs.Tree.VOID;
    delete root.children;
};


/**
 * Return the lightest SVG possible.
 */
function zipSVG(libs, svgContent, src) {
    svgContent = svgContent
    // Remove space between two tags.
        .replace(/>[ \t\n\r]+</g, '><')
    // Replace double quotes with single quotes.
        .replace(/"/g, "'")
    // Replace many spaces by one single space.
        .replace(/[ \t\n\r]+/g, ' ');

    var svgTree = libs.parseHTML(svgContent);
    // We want to remove unused `id`attributes.
    // Such an attribute is used as long as there is a `xlink:href` attribute referencing it.
    var idsToKeep = {};
    // Remove Inkscape tags and <image>.
    libs.Tree.walk(svgTree, function(node) {
        if (node.type !== libs.Tree.TAG) return;
        var name = node.name.toLowerCase();
        if (name == 'flowroot') {
            libs.warning(
                "Please don't use <flowRoot> nor <flowRegion> in your SVG (\"" + src + "\")!\n"
                    + "If it was created with Inkscape, convert it in SVG 1.1 by opening the `Text` menu\n"
                    + "and selecting \"Convert to Text\".",
                src,
                svgContent,
                node.pos
            );
        }
        var nodeToDelete = startsWith(
            name,
            "metadata", "inkscape:", "sodipodi:", "image", "dc:", "cc:", "rdf:",
            "flowroot", "flowregion"
        );
        if (nodeToDelete) {
            node.type = libs.Tree.VOID;
            delete node.children;
        } else if (node.attribs) {
            var attribsToDelete = [];
            var attribName, attribValue;
            for (attribName in node.attribs) {
                if (
                    startsWith(
                        attribName,
                        'inkscape:', 'sodipodi:', 'xmlns:inkscape', 'xmlns:sodipodi',
                        'xmlns:dc', 'xmlns:cc', 'xmlns:rdf'
                    )
                ) {
                    // This is an attribute to delete.
                    attribsToDelete.push(attribName);
                } else {
                    // Look for references (`xlink:href`).
                    attribValue = node.attribs[attribName].trim();
                    if (attribName.toLowerCase() == 'xlink:href') {
                        if (attribValue.charAt(0) == '#') {
                            // Remember that this ID must not be deleted.
                            idsToKeep[attribValue.substr(1)] = 1;
                        }
                    } else {
                        // Look for local URLs: `url(#idToKeep)`.
                        var match;
                        while ((match = RX_LOCAL_URL.exec(attribValue))) {
                            idsToKeep[match[1]] = 1;
                        }
                    }
                }
            }
            attribsToDelete.forEach(function (attribName) {
                delete node.attribs[attribName];
            });
        }
    });

    // Removing emtpy <g> and <defs>.
    libs.Tree.walk(svgTree, function(node) {
        if (node.type != libs.Tree.TAG) return;
        var name = node.name.toLowerCase();
        if (node.attribs && node.attribs.id) {
            // Try to remove unused ID.
            if (!idsToKeep[node.attribs.id]) {
                delete node.attribs.id;
            }
        }
        if (['g', 'defs'].indexOf(name) > -1) {
            // If this tag has no child, we must delete it.
            var childrenCount = 0;
            (node.children || []).forEach(function (child) {
                if (child.type == libs.Tree.TEXT || child.type == libs.Tree.TAG) {
                    childrenCount++;
                }
            });
            if (childrenCount == 0) {
                // This tag is empty, remove it.
                delete node.children;
                node.type = libs.Tree.VOID;
            }
        }
    });

    var svg = libs.Tree.toString(svgTree);
    return svg;
    // The following code was used when we embeded the SVG in Data URI form.
    /*
     console.log(svg);
     console.log();
     console.log("Base64: " + (new Buffer(svg)).toString('base64').length);
     console.log("UTF-8:  " + encodeURIComponent(svg).length);
     console.log();
     var encodedSVG_base64 = (new Buffer(svg)).toString('base64');
     var encodedSVG_utf8 = encodeURIComponent(svg);
     if (encodedSVG_base64 < encodedSVG_utf8) {
     return '"data:image/svg+xml;base64,' + encodedSVG_base64 + '"';
     } else {
     return '"data:image/svg+xml;utf8,' + encodedSVG_utf8 + '"';
     }
     */
}


/**
 * Return True if `text` starts by at least one of the remaining arguments.
 */
function startsWith(text) {
    var i, arg;
    for (i = 1 ; i < arguments.length ; i++) {
        arg = arguments[i];
        if (text.substr(0, arg.length) == arg) return true;
    }
    return false;
}
