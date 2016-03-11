/*
 When compiling the file `main.html`, we  gather all the CSS and JS files
 needed.

 If `no-zip` option has  not been set, all the CSS  files are combined in
 `css/@main.html` and all the JS files are combined in `js/@main.html`.
 */


var FS = require("fs");
var Path = require("path");

var CompilerINI = require("./compiler-ini");
var CompilerCOM = require("./compiler-com");
var ParserHTML = require("./tlk-htmlparser");
var SourceMap = require("./source-map");
var PathUtils = require("./pathutils");
var MinifyJS = require("./minifyJS");
var Template = require("./template");
var Chrono = require("./chrono");
var Source = require("./source");
var Fatal = require("./fatal");
var Tree = require("./htmltree");
var Libs = require("./compiler-com-libs");
var less = require("less");
var Tpl = require("./template");


var Project,
Components,
Scopes;



exports.initialize = function(prj) {
    Project = prj;
    Components = {};
    Scopes = [{}];
    CompilerCOM.loadComponents(prj);
};

exports.terminate = function() {
};

/**
 * @param {string} file Full path of the HTML file to compile.
 */
exports.compile = function(file, options) {
    if (typeof options === 'undefined') options = {};

    var sourceHTML = new Source(Project, file),
    // Output of the main file.
    output,
    // Output of a page file.
    outputPage,
    // In case of  multi-pages, the first page has the  same name as the
    // `file`. So it's output must become the output of the `file`.
    outputOfFirstPage,
    // Page filename relative to the sourceHTML.
    pageFilename,
    // Array of the sources we must link.
    sourcesToLink = [];
    // Check if the file and all its components are uptodate.
    if (!isUptodate(sourceHTML)) {
        Scopes[0].$filename = sourceHTML.name();
        console.log("Compile HTML: " + sourceHTML.name().cyan);
        var root = ParserHTML.parse(sourceHTML.read());
        output = compileRoot(root, sourceHTML, options);
        if (output) {
            sourceHTML.tag('output', output);
            while (typeof root.type === 'undefined' && root.children && root.children.length == 1) {
                root = root.children[0];
            }
            if (root.type == Tree.PAGES) {
                outputPage = JSON.parse(JSON.stringify(output));
                root.children.forEach(function (child, idx) {
                    console.log(("  Page " + (idx + 1)).cyan);
                    var src = sourceHTML;
                    pageFilename = src.name();
                    if (idx != 0) {
                        pageFilename = file.substr(0, file.length - 4) + idx + '.html';
                        src = new Source(Project, pageFilename);
                    }
                    outputPage = compileRoot(child, src, options, JSON.parse(JSON.stringify(output)));
                    outputPage.filename = pageFilename;
                    src.tag("output", outputPage);
                    src.save();
                    sourcesToLink.push(pageFilename);
                    if (idx == 0) {
                        // This is the first page.
                        outputOfFirstPage = outputPage;
                    }
                });
                sourceHTML.tag('pages', sourcesToLink);
                sourceHTML.tag('output', outputOfFirstPage);
            }
            sourceHTML.save();
        }
    }

    // Linking.
    console.log("Link: " + sourceHTML.name().yellow);
    sourcesToLink = sourceHTML.tag('pages');
    if (sourcesToLink) {
        // Multi-pages.
        sourcesToLink.forEach(function (pageFilename) {
            var src = new Source(Project, pageFilename);
            link(src, options);
        });
    } else {
        // Single page.
        link(sourceHTML, options);
    }
    output = sourceHTML.tag('output');
    return sourceHTML;
};

function compileRoot(root, sourceHTML, options, output) {
    // Stuff to create HTML file.
    if (typeof output === 'undefined') output = {
        // Code CSS.
        innerCSS: {},
        // CSS files.
        outerCSS: {},
        // Code Javascript to embed in `js/@index.js` file.
        innerJS: {},
        // Javascript modules directly required.
        require: {},
        // All the Javascript modules needed to build this page.
        modules: [],
        // Javascript code to insert in a `DOMContentLoaded` event.
        initJS: {},
        // Files needed to build this file. If a include change, we must recompile.
        include: {},
        // A resource is a file to create in the output folder when this HTML is linked.
        // the key is the resource name, and the value is an objet depending on the type of resource:
        //  * {dst: "img/plus.png", src: "../gfx/icon-plus.png"}
        //  * {dst: "img/face.svg", txt: "<svg xmlns:svg=..."}
        resource: {}
    };
    var libs = Libs(sourceHTML, Components, Scopes, output);
    libs.compile(root, options);
    Tree.trim(root);
    output.root = root;
    return output;
}

/**
 * A source needs to be rebuild if it is not uptodate.
 * Here are the reasons for a source not to be uptodate:
 * * Source code more recent than the tags (`Source.isUptodate()`).
 * * Includes source codes more recent than this source.
 */
function isUptodate(sourceHTML) {
    if (!sourceHTML.isUptodate()) return false;
    var output = sourceHTML.tag('output');
    if (!output || !output.include) return true;
    // File name relative to `sourceHTML`.
    var includeFilename;
    // Source object of the `sourceFilename`.
    var includeSource;
    // Modification time for the current HTML file.
    var currentFileModificationTime = sourceHTML.modificationTime();
    // Stats of an include file.
    var stats;
    for (includeFilename in output.include) {
        includeSource = new Source(
            Project,
            sourceHTML.getPathRelativeToSource(includeFilename)
        );
        stats = FS.statSync(includeSource.getAbsoluteFilePath());
        if (stats.mtime > currentFileModificationTime) {
            // An included file if more recent. We must recompile.
            return false;
        }
    }
    return true;
}

/**
 * Take  a HTML  file `filename.html`  and combine  all the  styles in
 * `css/@filename.css` and  all the javascripts  in `js/@filename.js`.
 * For each module, check if there is  a folder with the same name. If
 * yes, copy  that resource  in `css`  dir. For  example, it  you have
 * `mod/foobar.js`   and   a   folder  `mod/foobar/`,   copy   it   to
 * `www/css/foobar/`.
 */
function link(src, options) {
    var pathWWW = Project.wwwPath();
    var pathJS = Path.join(pathWWW, "js");
    var pathCSS = Path.join(pathWWW, "css");

    Project.mkdir(pathJS);
    Project.mkdir(pathCSS);

    var output;

    output = linkForRelease(src, pathJS, pathCSS, options);

    PathUtils.file(
        Project.wwwPath(src.name()),
        '<!DOCTYPE HTML>' + Tree.toString(output.root).trim()
    );

    // Writing resources if any.
    writeResources(output);
}

function linkForRelease2(src, pathJS, pathCSS, options) {

}

function linkForRelease(src, pathJS, pathCSS, options) {
    Project.mkdir(Path.join(pathJS, "map"));
    Project.mkdir(Path.join(pathCSS, "map"));

    var prj = src.prj();
    var nameWithoutExt = src.name().substr(0, src.name().length - 5);
    // If `nameWithoutExt` is in a subfolder, `backToRoot` must containt
    // as many `../` as there are subfolders in `nameWithoutExt`.
    var backToRoot = getBackToRoot(nameWithoutExt);
    var output = src.tag("output") || {};
    var root = output.root;
    if (!root) {
        Fatal.fire(
            "The cache seems to be corrupted. Try `tfw clean` to clean it up. And try building again.",
            "Please cleanup the cache!"
        );
    }
    var head = findHead(root);
    var innerJS = Tpl.file("require.js").out + concatDicValues(output.innerJS);
    innerJS += getInitJS(output);

    var innerCSS = concatDicValues(output.innerCSS);

    // If there is a CSS file with the same name as the HTML file, embed it.
    if (FS.existsSync(Project.srcOrLibPath(nameWithoutExt + '.css'))) {
        console.log("Found: " + (nameWithoutExt + ".css").bold);
        innerCSS += PathUtils.file(Project.srcOrLibPath(nameWithoutExt + '.css'));
    }

    var combination = combineRequires(output, options);
    // Used to loop over CSS and JS files.
    var key, val;
    if ( options.dev ) {
        // DEBUG. Do not combine.
        for (key in combination.css) {
            val = combination.css[key];
            if (key.substr(0, 4) == 'mod/') {
                key = key.substr(4);
            }
            head.children.push(
                {type: Tree.TAG, name: 'link', void: true, attribs: {
                    rel: "stylesheet", type: "text/css",
                    href: backToRoot + "css/" + key + ".css"
                }}
            );
            prj.flushContent( "css/" + key + ".css", val.src );
        }
        for (key in combination.js) {
            val = combination.js[key];
            if (key.substr(0, 4) == 'mod/') {
                key = key.substr(4);
            }
            head.children.push(
                {type: Tree.TAG, name: 'script', attribs: {
                    src: backToRoot + "js/" + key + ".js"
                }}
            );
            prj.flushContent( "js/" + key + ".js", val.src );
        }
    } else {
        // RELEASE.
        for (key in combination.css) {
            val = combination.css[key];
            innerCSS += val.zip;
        }
        for (key in combination.js) {
            val = combination.js[key];
            innerJS += val.zip + "\n";
        }
    }

    // Adding innerCSS.
    prj.flushContent( "css/" + addFilePrefix(nameWithoutExt) + ".css", innerCSS );
    head.children.push(
        {type: Tree.TAG, name: 'link', void: true, attribs: {
            rel: "stylesheet", type: "text/css",
            href: backToRoot + "css/" + addFilePrefix(nameWithoutExt) + ".css"
        }}
    );

    // Adding innerJS.
    prj.flushContent( "js/" + addFilePrefix(nameWithoutExt) + ".js", innerJS );
    head.children.push(
        {type: Tree.TAG, name: 'script', attribs: {
            src: backToRoot + "js/" + addFilePrefix(nameWithoutExt) + ".js"
        }}
    );

    return output;
}


function writeResources(output) {
    // Name of the resource.
    var resourceName;
    // Data of the resource.
    var resourceData;
    // Destination path (in `www`folder).
    var dstPath;
    // Source path (in `src` folder).
    var srcPath;
    // Resource content.
    var content;

    for (resourceName in output.resource) {
        resourceData = output.resource[resourceName];
        dstPath = Project.wwwPath(resourceData.dst);
        if (PathUtils.isDirectory(dstPath)) {
            // We must copy a whole directory.

        } else {
            // Create folders if needed.
            Project.mkdir(Path.dirname(dstPath));
            if (resourceData.src) {
                srcPath = Project.srcOrLibPath(resourceData.src);
                Project.copyFile(srcPath, dstPath);
            } else {
                content = resourceData.txt;
                PathUtils.file(dstPath, content);
            }
        }
    }

    // Copy modules' resources if any.
    var moduleName;
    // Path of the folder containing the resourses of the module (if any).
    var resourcePath;
    output.modules.forEach(function (moduleName) {
        resourcePath = Project.srcOrLibPath(moduleName);
        if (resourcePath) {
            // Ok, this folder exists.
            console.info("Copy resource: " + (moduleName + "/").cyan);
            var dst = Path.join(Path.dirname(output.filename), moduleName.substr(4));
            dst = dst.replace(/\\/g, '/');
            Project.copyFile(resourcePath, Project.wwwPath('css/' + dst));
        }
    });
}


function concatDicValues(map) {
    if (!map) return '';
    var key, out = '';
    for (key in map) {
        if (out != '') out += "\n";
        out += key;
    }
    return out;
}


function findHead(root) {
    if (!root) return null;

    var head = Tree.getElementByName(root, "head");
    if (!head) {
        // There is no <head> tag. Create it!
        var html = Tree.getElementByName(root, "html");
        if (!html) {
            html = {type: Tree.TAG, name: "html", children: []};
            root.children.push(html);
        }
        head = {type: Tree.TAG, name: "head", children: []};
        html.children.push(head);
    }
    return head;
}


function getInitJS(output) {
    var js = concatDicValues(output.initJS);
    if (js.length > 0) {
        return Tpl.file("init.js", {INIT_JS: js}).out;
    }
    return js;
}


function writeInnerCSS(innerCSS, pathCSS, nameWithoutExt, head, sourcemap) {
    if (innerCSS.length > 0) {
        // Add inner CSS file.
        writeCSS('@' + nameWithoutExt + ".css", innerCSS);
        head.children.push(
            {type: Tree.TAG, name: 'link', void: true, attribs: {
                rel: "stylesheet", type: "text/css",
                href: "css/@" + nameWithoutExt + ".css"
            }}
        );
    }
}


function writeInnerJS(innerJS, pathJS, nameWithoutExt, head, sourcemap) {
    if (innerJS.length > 0) {
        // Add inner JS file.
        writeJS('@' + nameWithoutExt + ".js", innerJS);
        head.children.push(
            {type: Tree.TAG, name: 'script', attribs: {
                src: "js/@" + nameWithoutExt + ".js"
            }}
        );
    }
}


/**
 * @param {object} output - Results of the HTML's compilation.
 *
 * @return {object} two attributes:
 * * __js__: map of Javascript sources.
 * * __css__: map of stylesheet sources.
 */
function combineRequires(output, options) {
    // The  `cache` is  used  to prevent  dependencies  cycling. When  a
    // module has been  processed, we add its name in  the `cache`. Next
    // time we find a module already in `cache` we will not process it.
    var cache = {},
    // dictionary  of directly needed modules. The key is the module's name, the value is always `1`.
    modules = output.require || {},
    // List of modules' names we have to process.
    fringe = [],
    // Name of the current module.
    moduleName,
    // Style Sheet combined content.
    css = '',
    // Source file of the JS or CSS for the current module.
    src,
    // Dependencies of the current module's javascript.
    dependencies,
    // Map of Javascript sources. No compression.
    jsFiles = {},
    // Map of Stylesheet sources. No compression.
    cssFiles = {},
    // Iterator used for comments visual improvements.
    i;

    if (!Array.isArray(output.modules)) output.modules = [];

    // Always include the module `$` which was generated automatically.
    modules['mod/$'] = 1;
    // Fill the fringe with `modules`.
    for (moduleName in modules) {
        fringe.push(moduleName);
    }
    // Process all required modules by popping the next module's name from the `fringe`.
    while (fringe.length > 0) {
        moduleName = fringe.pop(); // Pop the current module from the `fringe`.
        cache[moduleName] = 1;     // Don't process this module more than once.
        if (moduleName.substr(0, 4) == 'cls/') {
            // We have to include `tfw3.js` for backward compatibility.
            output.innerJS[Template.file('tfw3.js').out] = 1;
        }
        else if (moduleName.substr(0, 4) == 'mod/') {
            // Remember all the modules used in this HTML page.
            if (output.modules.indexOf(moduleName) < 0) {
                output.modules.push(moduleName);
            }
        }
        //============
        // Javascript
        //------------
        // Compile (if  not uptodate) the  JS of the current  module and
        // return the source file.
        src = compileJS(moduleName + ".js", options);
        if (!jsFiles[moduleName]) {
            jsFiles[moduleName] = { src: src.tag('src'), zip: src.tag('zip') };
        }
        // Adding dependencies to the `fringe`.
        dependencies = src.tag("dependencies");
        if (Array.isArray(dependencies)) {
            dependencies.forEach(function (dep) {
                if (!cache[dep]) {
                    fringe.push(dep);
                }
            });
        }
        //==============
        // Style Sheets
        //--------------
        src = compileCSS(moduleName + ".css", options);
        if (src) {
            if (!cssFiles[moduleName]) {
                cssFiles[moduleName] = { src: src.tag('src'), zip: src.tag('zip') };
            }
        }
    }

    return { js: jsFiles, css: cssFiles };
}


function writeRequires(modules, pathJS, pathCSS, head, options) {
    var cache = {},
    fringe = [],
    moduleName,
    src,
    path,
    dependencies;
    // Always include the module `$`.
    modules.$ = 1;
    for (moduleName in modules) {
        fringe.push(moduleName);
    }
    while (fringe.length > 0) {
        moduleName = fringe.pop();
        cache[moduleName] = 1;
        // JS.
        path = moduleName + ".js";
        src = compileJS(path, options);
        writeJS(
            moduleName,
            src.tag(options.noZip ? 'src' : 'zip'),
            options.noMap || options.noZip ? '' : JSON.stringify(src.tag('map'))
        );
        head.children.push(
            {type: Tree.TAG, name: 'script', attribs: {
                src: "js/" + moduleName + ".js"
            }}
        );
        dependencies = src.tag("dependencies");
        if (Array.isArray(dependencies)) {
            dependencies.forEach(function (dep) {
                if (!cache[dep]) {
                    fringe.push(dep);
                }
            });
        }
        // CSS.
        path = moduleName + ".css";
        src = compileCSS(path, options);
        if (src) {
            console.info("[After compileCSS] src=...", src);
            writeCSS(moduleName, src.tag('zip'), src.tag('map'));
            head.children.push(
                {type: Tree.TAG, name: 'link', attribs: {
                    rel: "stylesheet", type: "text/css",
                    href: "css/" + moduleName + ".css"
                }}
            );
        }
    }
}


function writeJS(name, sourceZip, sourceMap) {
    if (name.substr(-3) == '.js') {
        name = name.substr(0, name.length - 3);
    }
    var path = Path.join(Project.wwwPath("js"), name + ".js");
    FS.writeFileSync(path, sourceZip);
    if (sourceMap) {
        path = Path.join(Project.wwwPath("js"), name + ".js.map");
        FS.writeFileSync(path, sourceMap);
    }
    // Look for resources.
    var src = Project.srcOrLibPath(name);
    if (FS.existsSync(src)) {
        var dst = Path.join(Project.wwwPath("css"), name);
        Project.copyFile(src, dst);
    }
}


function writeCSS(name, content, sourceMap) {
    if (name.substr(-4) == '.css') {
        name = name.substr(0, name.length - 4);
    }
    var path = Path.join(Project.wwwPath("css"), name + ".css");
    FS.writeFileSync(path, content);
    if (sourceMap) {
        path = Path.join(Project.wwwPath("css"), name + ".css.map");
        FS.writeFileSync(path, sourceMap);
    }
}


function moduleExists(requiredModule) {
    var path = Project.srcOrLibPath(requiredModule + ".js");
    if (path) return true;
    return false;
}

/**
 * @param {string} path Source path relative to the `src` folder.
 * @return {Source}
 * Tags:
 *  * __src__: debug content.
 *  * __zip__: release content.
 *  * __dependencies__: array of dependent modules.
 */
function compileJS(path, options) {
    var src = new Source(Project, path),
    code,
    moduleName = src.name(),
    moduleShortName,
    iniName, iniPath,
    compilation,
    mode,
    requiredModule,
    dependencies,
    minification,
    minifiedCode,
    sourceMap;
    if (!src.getAbsoluteFilePath()) {
        // This file does not exist!
        Fatal.fire(
            'Javascript file not found: "' + Project.srcPath(path) + '"!',
            path
        );
    }
    if (!src.isUptodate()) {
        moduleShortName = moduleName.substr(4);
        moduleShortName = moduleShortName.substr(0, moduleShortName.length - 3);
        console.log("Compile JS module: " + moduleShortName.cyan
                    + "  "
                    + src.getAbsoluteFilePath().substr(
                        0, src.getAbsoluteFilePath().length - moduleShortName.length - 3).grey);

        // Intl.
        iniName = src.name().substr(0, src.name().length - 2) + "ini";
        iniPath = Project.srcOrLibPath(iniName);
        if (iniPath) {
            src.tag("intl", CompilerINI.parse(iniPath));
        } else {
            src.tag("intl", "");
        }
        if (moduleName.substr(0, 4) == 'mod/') {
            code = Tpl.file(
                "module.js",
                {name: moduleShortName, code: src.read(), intl: src.tag('intl')}
            ).out;
        } else {
            code = src.read();
        }
        minification = MinifyJS({
            name: moduleShortName + ".js",
            content: code
        });
        dependencies = findDependencies(minification.zip, src, options);
        src.tag('src', code);
        src.tag('zip', minification.zip);
        src.tag('map', minification.map);
        src.tag('dependencies', dependencies);
        src.save();
    }
    return src;
}

function findDependencies(minifiedCode, src, options) {
    var rx = /[^a-zA-Z0-9$_\.](require|\$\$)[ \t\n\r]*\([ \t\n\r]*('[^']+'|"[^"]+")/g,
    rxTP3 = /[^a-zA-Z0-9$_\.]superclass[ \t\n\r]*:[ \t\n\r]*('[^']+'|"[^"]+")/g,
    content = ' ' + minifiedCode,
    cursor,
    dependencies = [],
    requiredModule,
    requiredType,
    match;

    if (src.name().substr(0, 4) == 'cls/') {
        // Look for a dependency to a superclass.
        match = rxTP3.exec(content);
        if (match) {
            requiredModule = match[1].substr(1);
            requiredModule = 'cls/' + requiredModule.substr(0, requiredModule.length - 1);
            console.log("(TP3) Superclass: " + requiredModule.cyan);
            if (dependencies.indexOf(requiredModule) < 0) {
                dependencies.push(requiredModule);
            }
        }
    }

    while (null != (match = rx.exec(content, cursor))) {
        requiredModule = match[2].substr(1);
        requiredModule = requiredModule.substr(0, requiredModule.length - 1);
        // Compatibility with old `cls` modules.
        requiredType = match[1];
        if (requiredType == '$$') {
            // Prefix old modules with `$$:`.
            requiredModule = 'cls/' + requiredModule;
            console.log(" Warning! ".yellowBG + " Deprecated module: " + requiredModule.bold
                        + "  " + src.name().yellow);
        } else {
            requiredModule = 'mod/' + requiredModule;
        }
        if (!moduleExists(requiredModule)) {
            Fatal.fire(
                'Unknown module "' + requiredModule + '"!',
                src.getAbsoluteFilePath()
            );
        }
        if (dependencies.indexOf(requiredModule) < 0) {
            dependencies.push(requiredModule);
            if (options.verbose) {
                console.log("  require: " + requiredModule.bold);
            }
        }
    }
    return dependencies;
}


function minifyCSS(name, code, options) {
    var result = null;
    if (!code) return null;

    if (code.trim().length == 0) {
        // Empty CSS content.
        console.log(" Warning! ".yellowBG.black + name.bold + " is EMPTY!");
        return null;     // {src: "", zip: ""};
    }
    less.render(code, {sourceMap: {}, compress: options.dev ? false : true}, function (e, output) {
        try {
            var map = JSON.parse(output.map);
            map.sourcesContent = [code];
            map.sources = [name];
            result = {
                src: code,
                zip: output.css,
                map: map
            };
        }
        catch (ex) {
            throw Error("Unable to minify CSS \"" + name + "\":\n" + ex
                        + "\n\nCSS content was:\n" + code.substr(0, 256)
                        + (code.length > 256 ? '\n[...]' : ''));
        }
    });
    return result;
}

/**
 * @param {string} path Source path relative to the `src` folder.
 */
function compileCSS(path, options) {
    var absPath = Project.srcOrLibPath(path);
    if (!absPath) return null;
    var src = new Source(Project, path);
    if (!src.exists()) return null;
    if (!src.isUptodate()) {
        console.log("Compile CSS: " + path.cyan);
        var cssCode = src.read();
        var minify = minifyCSS(src.name(), cssCode, options);
        src.tag('src', cssCode);
        src.tag('zip', minify.zip);
        src.tag('map', minify.map);
        src.save();
    }
    return src;
}


/**
 * Add a prefix to  a filename. This is not as  simple as prepending the
 * `prefix` to  the string `path`,  because `path` can  contain folders'
 * separators. The  prefix must be prepended  to the real file  name and
 * not to the whole path.
 * Examples with `prefix` == "@":
 * * `foobar.html`: `@foobar.html`
 * * `myfolder/myfile.js`: `myfolder/@myfile.js`
 */
function addFilePrefix(path, prefix) {
    if (typeof prefix === 'undefined') prefix = '@';

    var separatorPosition = path.lastIndexOf('/');
    if (separatorPosition < 0) {
        // Let's try with Windows separators.
        separatorPosition = path.lastIndexOf('\\');
    }
    var filenameStart = separatorPosition > -1 ? separatorPosition + 1 : 0;
    var result = path.substr(0, filenameStart) + prefix + path.substr(filenameStart);
    return result.replace(/\\/g, '/');
}

/**
 * The  depth of  `path` is  the number  of subfolders  it defines.  For
 * example, `foo.js'  defined no  subfolder and  it is  of depth  0. But
 * `foo/bar/file.html` has two levels of subfolders hence it is of depth
 * 2.
 */
function getBackToRoot(path) {
    // Counter for '/'.
    var standardFolderSepCount = 0;
    // Counter for '\' (windows folder separator).
    var windowsFolderSepCount = 0;
    // Loops index used for parsing chars of `path`and to add `../` to the result.
    var i;
    // Current char read from `path`.
    var c;
    // Counting folders' separators.
    for (i = 0; i < path.length; i++) {
        c = path.charAt(i);
        if (c == '/') standardFolderSepCount++;
        if (c == '\\') windowsFolderSepCount++;
    }
    var folderSepCount = Math.max(standardFolderSepCount, windowsFolderSepCount);
    if (folderSepCount == 0) {
        // There is no subfolder.
        return '';
    }

    var result = '';
    var folderSep = '/';   // windowsFolderSepCount > standardFolderSepCount ? '\\' : '/';
    for (i = 0; i < folderSepCount; i++) {
        result += '..' + folderSep;
    }
    return result;
}
