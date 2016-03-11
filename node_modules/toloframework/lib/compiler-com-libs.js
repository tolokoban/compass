var FS = require("fs");
var Path = require("path");
var Tree = require("./htmltree");
var Util = require("./util");
var Fatal = require("./fatal");
var Source = require("./source");
var Template = require("./template");
var ParserHTML = require("./tlk-htmlparser");
var CompilerCOM = require("./compiler-com");
var CompilerHTML = require("./compiler-html2");


module.exports = function(source, components, scopes, output) {
    var ID = 0;
    function setVar(key, val) {
        scopes[scopes.length - 1][key] = val;
    }
    function getVar(key) {
        var k, v;
        for (k = scopes.length - 1; k >= 0; k--) {
            v = scopes[k][key];
            if (typeof v !== 'undefined') {
                return v;
            }
        }
        return '';
    }
    // Comnpilation options are set by the function `libs.compile(root, options)`.
    var compilationOptions = {};

    var prj = source.prj();

    /**
     * @return
     * The path of the current HTML file, relative to the `src` path.
     */
    function dirname() {
        var absoluteDirname = Path.dirname(source.getAbsoluteFilePath());
        var absoluteSrcPath = source.prj().srcPath();
        return absoluteDirname.substr(absoluteSrcPath.length);
    }

    var libs = {
        Tree: Tree,
        Template: Template,
        // An HTML file can ask to compile another HTML file with this function.
        compileHTML: function(src) {
            CompilerHTML.compile(src, compilationOptions);
            output.include[src] = 1;
        },
        /**
         * The  depth of  `path` is  the number  of subfolders  it defines.  For
         * example, `foo.js'  defined no  subfolder and  it is  of depth  0. But
         * `foo/bar/file.html` has two levels of subfolders hence it is of depth
         * 2.
         */
        getBackToRoot: function (path) {
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
            var folderSep = '/';  // windowsFolderSepCount > standardFolderSepCount ? '\\' : '/';
            for (i = 0; i < folderSepCount; i++) {
                result += '..' + folderSep;
            }
            return result;
        },
        fatal: function(msg) {
            Fatal.fire(msg, "Component");
        },
        warning: function(msg, filename, content, pos) {
            filename = filename || source.name();
            console.log("------------------------------------------------------------".yellow);
            console.log("Warning in file ".bold.yellow + filename.cyan.bold);
            console.log(msg.bold.yellow);
            console.log();
            if (typeof content === 'string') {
                // There is code to show.
                console.log(Fatal.extractCodeAtPos(content, pos).yellow);
            }
        },
        nextID: function() {
            ID++;
            return 'x-' + ID;
        },
        setVar: setVar,
        getVar: getVar,
        fileExists: function(relPath) {
            var srcPath = Path.join(
                source.prj().srcPath(),
                Path.dirname( source.name() )
            );
            var absPath = Path.join( srcPath, relPath);
            return FS.existsSync(absPath);
        },
        filePath: function(relPath) {
            return Path.join( Path.dirname( source.name() ), relPath );
        },
        /**
         * @return
         * The path of the current HTML file, relative to the `src` path.
         */
        dirname: dirname,
        /**
         * Return the absolute path of a path relative to the HTML file.
         * @param path {string} - Path relative to the HTML file.
         */
        htmPath: function(path) {
            return source.prj().srcPath(Path.join(dirname(), path));
        },
        readFileContent: function(relPath) {
            var absPath = source.getPathRelativeToSource(relPath);
            if (!FS.existsSync(absPath)) return "";
            return FS.readFileSync(absPath).toString();
        },
        addDependency: function(dependency) {
            output.dependencies[dependency] = 1;
        },
        addInnerCSS: function(contentCSS) {
            output.innerCSS[contentCSS] = 1;
        },
        addInitJS: function(code) {
            output.initJS[code] = 1;
        },
        addInclude: function(src) {
            output.include[src] = 1;
        },
        addResourceText: function(name, dst, txt) {
            output.resource[name] = {dst: dst, txt: txt};
        },
        addResourceFile: function(name, dst, src) {            
            output.resource[name] = {dst: dst, src: src};
        },
        require: function(moduleName) {
            var prefix = moduleName.substr(0, 4);
            if (prefix != 'mod/' && prefix != 'cls/') {
                // Add directory if missing.
                moduleName = 'mod/' + moduleName;
            }
            output.require[moduleName] = 1;
        },
        parseHTML: ParserHTML.parse
    };

    // Project configuration.
    var cfg = prj._config;
    setVar('$filename', source.name());
    setVar('$title', cfg.name);
    setVar('$author', cfg.author);
    setVar('$version', cfg.version);


    function compileChildren(root) {
        if (Array.isArray(root.children)) {
            root.children.forEach(function (child) {
                libs.compile(child);
            });
        }
    }
    libs.compileChildren = compileChildren;
    libs.compile = function(root, options) {
        compilationOptions = options;
        if (root.type !== Tree.TAG) {
            compileChildren(root);
            return;
        } else {
            var component = CompilerCOM.getCompilerForTag(root.name);
            if (component) {
                if (component.$.css) {
                    libs.addInnerCSS(component.$.css);
                }
                if (component.$.res) {
                    // There is a resource folder.
                    var dstPath = source.name();
                    libs.addResourceFile(
                        Path.join('com', component.$.id),
                        Path.join('css', Path.dirname(dstPath), Path.join('com', component.$.id)),
                        component.$.res
                    );
                }
                try {
                    scopes.push({});
                    component.compile(root, libs);
                    scopes.pop();
                }
                catch (ex) {
                    Fatal.bubble(ex, "Tag: " + root.name + ", HTML file: " + source.name());
                }
            } else {
                // This is a standard TAG. Let's loop on children.
                compileChildren(root);
            }
        }
    };
    return libs;
};
