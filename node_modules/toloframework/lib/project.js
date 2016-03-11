var FS = require("fs");
var Path = require("path");
var ChildProcess = require('child_process');

var Tree = require("./htmltree");
var Util = require("./util");
var Fatal = require("./fatal");
var Input = require('readline-sync');
var Source = require("./source");
var Template = require("./template");
var PathUtils = require("./pathutils");
var CompilerPHP = require("./compiler-php");
var CompilerHTML2 = require("./compiler-html2");

/**
 * * `_modulesPath`: Array of pathes where to look for modules not found in local `src/mod` directory.
 */
var Project = function(prjDir) {
    // Will own the list of HTML files as Source objects.
    this._compiledFiles = [];

    this._prjDir = Path.resolve(prjDir);
    this._libDir = Path.resolve(Path.join(__dirname, "../ker"));
    this._tplDir = Path.resolve(Path.join(__dirname, "../tpl"));
    this._srcDir = this.mkdir(prjDir, "src");
    this._docDir = this.mkdir(prjDir, "doc");
    this._tmpDir = this.mkdir(prjDir, "tmp");
    this._wwwDir = this.mkdir(prjDir, "www");
    Util.cleanDir(this.wwwPath(), true);

    // To prevent double flushing of the  same file, this array keep the
    // name of the already flushed files.
    // @see `this.flushContent()`
    this._flushedContent = [];

    this._modulesPath = [];
    this.Util = require("../ker/wdg/util.js");

    var cfg = this.loadConfigFile();
    this._config = cfg;

    // Is there an output specified in config file?
    if (cfg.tfw && cfg.tfw.output) {
        this._wwwDir = this.prjPath(cfg.tfw.output);
        if (!FS.existsSync(this._wwwDir)) {
            this.fatal("Output folder does not exist: `" + this._wwwDir + "`!");
        }
    }
    console.log("Output folder: " + this._wwwDir.yellow);

    // Finding extra modules.
    if (Array.isArray(cfg.tfw.modules)) {
        cfg.tfw.modules.forEach(
            function(item) {
                item = Path.resolve(this._prjDir, item);
                if (FS.existsSync(item)) {
                    this._modulesPath.push(item);
                    console.log("Extra modules from: " + item);
                } else {
                    this.fatal("Unable to find module directory:\n" + item);
                }
            },
            this
        );
    }

    var now = new Date();
    this.mkdir(this.srcPath("mod"));
    this.mkdir(this.srcPath("wdg"));
    createIfNeededModule$.call(this, cfg);

    this._type = cfg.tfw.compile.type;

    if (this._type == 'firefoxos') {
        this._config.reservedModules = [];
    } else {
        this._config.reservedModules = [
            "fs", "path", "process", "child_process", "cluster", "http", "os",
            "crypto", "dns", "domain", "events", "https", "net", "readline",
            "stream", "string_decoder", "tls", "dgram", "util", "vm", "zlib"
        ];
    }
    console.info();
    this._modulesPath.forEach(
        function(path) {
            console.log("External lib: " + path.bold);
        }
    );
};


/**
 * Create the file `mod/$.js` only if `package.json` is newer.
 */
function createIfNeededModule$(cfg) {
    var file = Path.join(this.srcPath("mod"), "$.js");
    if (PathUtils.isNewer(this.prjPath('package.json'), file)) {
        var version = cfg.version.split(".");
        var now = new Date();
        PathUtils.file(
            file,
            "exports.config={\n"
                + "    name:" + JSON.stringify(cfg.name)
                + ",\n    description:" + JSON.stringify(cfg.description || "")
                + ",\n    author:" + JSON.stringify(cfg.author || "")
                + ",\n    version:" + JSON.stringify(cfg.version)
                + ",\n    major:" + version[0]
                + ",\n    minor:" + version[1]
                + ",\n    revision:" + version[2]
                + ",\n    date:new Date(" + now.getFullYear() + "," + now.getMonth() + ","
                + now.getDate()
                + "," + now.getHours() + "," + now.getMinutes() + "," + now.getSeconds() + ")"
                + "\n};\n"
                + FS.readFileSync(Path.join(this._tplDir, "$.js"))
        );
    }
}

/**
 * @return void
 */
Project.prototype.flushContent = function( filepath, content ) {
    if ( this._flushedContent.indexOf( filepath ) > -1 ) return false;

    if (filepath.indexOf('@') > -1) {
        console.log(">>> " + filepath.cyan
                    + " (" + (content.length / 1024).toFixed(content.length < 2048 ? 3 : 0).yellow + " kb)"
                    + "  " + this.wwwPath( filepath ).grey );
    }
    var wwwFilePath = this.wwwPath( filepath );
    this.mkdir( Path.dirname( wwwFilePath ) );
    FS.writeFile( wwwFilePath, content, (err) => {
        if (err) {
            console.info("[project] content=...", content);
            Fatal.fire(
                "Unable to write the file: \"" + wwwFilePath + "\"\n\n!" + err,
                    -1, "project.flushContent");
        }
    });
    return true;
};


/**
 * Compile every `*.html` file found in _srcDir_.
 */
Project.prototype.compile = function(options) {
    var compiledFiles = [];
    var i, filename,
        cfg = this._config;
    // List of modules for doc.
    this._modulesList = [];
    this._htmlFiles = this.findHtmlFiles();
    CompilerHTML2.initialize(this);
    for (i = 0; i < this._htmlFiles.length; i++) {
        filename = this._htmlFiles[i];
        try {
            compiledFiles.push(CompilerHTML2.compile(filename, JSON.parse(JSON.stringify(options))));
        }
        catch (ex) {
            Fatal.bubble(ex, filename);
        }
    }
    // Copying resources.
    copyResources.call(this, compiledFiles);
    // Look at manifest.webapp
    var manifest = this.srcPath("manifest.webapp");
    var content = PathUtils.file(manifest);
    var data;
    try {
        data = JSON.parse(content);
    }
    catch (ex) {
        data = null;
    }
    if (!data || typeof data !== 'object') {
        data = {
            launch_path: '/index.html',
            developer: {
                name: cfg.author,
                url: cfg.homepage
            },
            icons: {
                "128": "/icon-128.png",
                "512": "/icon-512.png"
            }
        };
    }
    data.name = cfg.name;
    data.version = cfg.version;
    data.description = cfg.description;
    PathUtils.file(manifest, JSON.stringify(data, null, 2));
    PathUtils.file(this.wwwPath("manifest.webapp"), JSON.stringify(data, null, 2));
    // Copy the icons.
    if (typeof data.icons === 'object') {
        var key, val, icon;
        for (key in data.icons) {
            icon = data.icons[key];
            val = this.srcOrLibPath(icon);
            if (!val) {
                console.log(' Warning! '.yellowBG + "Missing icon: " + icon.bold);
            } else {
                this.copyFile(val, this.wwwPath(icon));
            }
        }
    }

    this._compiledFiles = compiledFiles;
    return compiledFiles;
};

/**
 * If a resource file changes, we have to touch the corresponding module's JS file.
 */
Project.prototype.cascadingTouch = function(path) {
    var srcPath = this.srcPath('mod');
    path = Path.normalize(path);
    // We are looking for files in resource folders.
    if (PathUtils.isDirectory(path)) return;
    if (path.length < srcPath.length) return;
    if (path.substr(0, srcPath.length) != srcPath) return;

    // Path of the corresponding JS module.
    var modulePath;
    // Up to the prent dir.
    path = Path.dirname(path);
    while (path.length > srcPath) {
        modulePath = path + ".js";
        if (Path.existsSync(modulePath)) {
            PathUtils.touch(modulePath);
            return;
        }
    }
};


/**
 * @return void
 */
Project.prototype.getCompiledFiles = function() {
    return this._compiledFiles;
};


/**
 * @return void
 */
Project.prototype.services = function(options) {
    console.log("Adding services...".cyan);
    var tfwPath = this.srcPath("tfw");
    if (!FS.existsSync(tfwPath)) {
        Template.files("tfw", tfwPath);
    }
    this.copyFile( tfwPath, this.wwwPath('tfw'));
};


/**
 * Copy resources in `css/`.
 * @param sources {array} - array of objects of class `Source` representing each compiled HTML.
 */
function copyResources(sources) {
    var that = this;

    var dependenciesForAllFiles = [];
    sources.forEach(function (sourceHTML) {
        var output = sourceHTML.tag("output") || {};
        if (!Array.isArray(output.modules)) return;
        output.modules.forEach(function (module) {
            if (dependenciesForAllFiles.indexOf(module) < 0) {
                dependenciesForAllFiles.push(module);
            }
        });
    });
    if (dependenciesForAllFiles.length > 0) {
        console.log("Copying resources...".cyan);
        dependenciesForAllFiles.forEach(function (module) {
            var src = that.srcOrLibPath(module);
            if (src) {
                var dst = that.wwwPath('css/' + module.substr(4));
                that.copyFile(src, dst);
            }
        });
    }
}


/**
 * We use the "pakage.json" file as configuration file.
 * If it does not exist, we will create it.
 *
 * @return The configuration as an object.
 */
Project.prototype.loadConfigFile = function() {
    var answer;
    var oldConfigFile = this.prjPath("project.tfw.json");
    var configFile = this.prjPath("package.json");
    var oldCfg = {};
    var cfg = {};
    var origin = "";
    var remotes;
    var projectName;
    var version;
    var type;
    var path;
    var currentConfigAsString = '';

    if (FS.existsSync(oldConfigFile)) {
        // Before tfw 0.19, configuration was stored in "project.tfw.json".
        // But now, we extend "package.json".
        try {
            oldCfg = JSON.parse(PathUtils.file(oldConfigFile));
        }
        catch (ex) {
            console.log("Old configuration file found, but it is not a valid JSON!".red);
            console.log("The file has been backuped.".red);
            this.copyFile(oldConfigFile, oldConfigFile + ".backup");
        }
    }
    if (FS.existsSync(configFile)) {
        try {
            cfg = JSON.parse(PathUtils.file(configFile));
            currentConfigAsString = JSON.stringify(cfg);
        }
        catch (ex) {
            console.log("Your \"package,json\" file is not a valid JSON!".red);
            console.log("The file has been backuped.".red);
            this.copyFile(configFile, configFile + ".backup");
        }
    }
    // Looking for git remote origin.
    if (!cfg.repository || !cfg.repository.url) {
        remotes = ChildProcess.execSync("git remote -v").toString();
        remotes.split("\n").forEach(
            function(remote) {
                if (remote.substr(0, 6) == "origin") {
                    remote = remote.substr(6);
                    if (remote.substr(-8) == " (fetch)") {
                        origin = remote.substr(0, remote.length - 8).trim();
                    }
                }
            }
        );
        cfg.repository = {type: "git", url: origin};
    } else {
        origin = cfg.repository.url;
    }

    // Filling config attributes.
    cfg.homepage = cfg.homepage || origin.length > 4 ? origin.substr(0, origin.length - 4) : "";
    cfg.bugs = cfg.bugs || {url: origin.length > 4 ? origin.substr(0, origin.length - 4) + "/issues" : ""};
    cfg.scripts = cfg.scripts ||
        {
            test: "jasmine",
            "test:dbg": "node --debug-brk node_modules/jasmine/bin/jasmine.js"
        };
    if (!cfg.name) {
        projectName = oldCfg.name || Path.basename(this._prjDir);
        answer = Input.question("Project's name [" + projectName + "]: ");
        if (answer.trim().length > 0) {
            projectName = answer;
        }
        cfg.name = projectName;
    }
    cfg.version = cfg.version || oldCfg.version || "1";
    if (!cfg.author) {
        answer = Input.question("Author: ");
        cfg.author = answer.trim();
    }
    if (!cfg.description) {
        answer = Input.question("Description: ");
        cfg.description = answer.trim();
    }
    if (!cfg.license) {
        cfg.license = "GPL";
    }
    if (!cfg.tfw) {
        cfg.tfw = {
            modules: [],
            compile: {
                type: "html",
                files: oldCfg["html-filter"] || "\\.html$"
            }
        };
    }

    // Application type.
    type = {
        "firefoxos": "firefoxos",
        "firefox os": "firefoxos",
        "firefox-os": "firefoxos",
        "fxos": "firefoxos",
        "nodewebkit": "nodewebkit",
        "node webkit": "nodewebkit",
        "node-webkit": "nodewebkit",
        "nw": "nodewebkit"
    }[(cfg.tfw.compile["type"] || "firefoxos").trim().toLowerCase()];
    if (typeof type === 'undefined') type = "firefoxos";
    if (type != 'nodewebkit') type = "firefoxos";
    if (type != 'firefoxos') type = "nodewebkit";
    cfg.tfw.compile["type"] = type;

    // Save config file if it has changed.
    if (currentConfigAsString != JSON.stringify(cfg)) {
        console.log("`package.json` has been overwritten.");
        PathUtils.file(configFile, JSON.stringify(cfg, null, 4));
    }

    // Initial template.
    path = this.prjPath("src");
    if (!FS.existsSync(path)) {
        this.mkdir(path);
        this.copyFile(this.tplPath("src"), path);
    }

    console.info((cfg.name + " v" + cfg.version).bold + " ("
                 + {firefoxos: "Firefox OS", nodewebkit: "Node-Webkit"}[cfg.tfw.compile.type]
                 + ")");

    return cfg;
};


/**
 * Before tfw 0.19, configuration was stored in "project.tfw.json".
 * But now, we extend "package.json".
 *
 * @return void
 */
Project.prototype.upgradeOldConfigFile = function() {

};

/**
 * @return void
 */
Project.prototype.isReservedModules = function(filename) {
    var reservedModules = this._config.reservedModules;
    if (!Array.isArray(reservedModules)) return false;
    filename = filename.split("/").pop();
    if (filename.substr(filename.length - 3) == '.js') {
        // Remove extension.
        filename = filename.substr(0, filename.length - 3);
    }
    if (reservedModules.indexOf(filename) > -1) return true;
    return false;
};

/**
 * @return module `Template`.
 */
Project.prototype.Template = Template;

/**
 * @return Tree module.
 */
Project.prototype.Tree = Tree;

/**
 * @param {string} path path relative to `lib/` in ToloFrameWork folder.
 * @return an absolute path.
 */
Project.prototype.libPath = function(path) {
    return Path.resolve(Path.join(this._libDir, path));
};

/**
 * @param {string} path path relative to `tpl/` in ToloFrameWork folder.
 * @return an absolute path.
 */
Project.prototype.tplPath = function(path) {
    return Path.resolve(Path.join(this._tplDir, path));
};

/**
 * @param {string} path path relative to `src/`.
 * @return an absolute path.
 */
Project.prototype.srcPath = function(path) {
    if (typeof path === 'undefined') return this._srcDir;
    return Path.resolve(Path.join(this._srcDir, path));
};

/**
 * @param {string} path path relative to `doc/`.
 * @return an absolute path.
 */
Project.prototype.docPath = function(path) {
    if (typeof path === 'undefined') return this._docDir;
    return Path.resolve(Path.join(this._docDir, path));
};

/**
 * @param {string} path path relative to the current page folder.
 * @return an absolute path.
 */
Project.prototype.htmPath = function(path) {
    if (typeof path === 'undefined') return this._htmDir;
    return Path.resolve(Path.join(this._htmDir, path));
};

/**
 * @param {string} path path relative to `prj/`.
 * @return an absolute path.
 */
Project.prototype.prjPath = function(path) {
    if (typeof path === 'undefined') return this._prjDir;
    return Path.resolve(Path.join(this._prjDir, path));
};

/**
 * @param {string} path path relative to `src/` or extenal modules or `lib/`.
 * @return an absolute path or null if the file does not exist.
 */
Project.prototype.srcOrLibPath = function(path) {
    var result = this.srcPath(path);
    if (FS.existsSync(result)) return result;
    for (var i = 0 ; i < this._modulesPath.length ; i++) {
        result = this._modulesPath[i];
        result = Path.resolve(result, path);
        if (FS.existsSync(result)) return result;
    }
    result = this.libPath(path);
    if (FS.existsSync(result)) return result;
    return null;
};

/**
 * @return void
 */
Project.prototype.getExtraModulesPath = function() {
    return this._modulesPath.slice();
};


/**
 * @param {string} path path relative to `tmp/`.
 * @return an absolute path.
 */
Project.prototype.tmpPath = function(path) {
    if (typeof path === 'undefined') return this._tmpDir;
    return Path.resolve(Path.join(this._tmpDir, path));
};

/**
 * @param {string} path path relative to `www/`.
 * @return an absolute path.
 */
Project.prototype.wwwPath = function(path) {
    if (typeof path === 'undefined') return this._wwwDir;
    return Path.resolve(Path.join(this._wwwDir, path));
};

/**
 * @return Dictionary  of available widget  compilers. The key  is the
 * widget name, the value is an object:
 * * __path__: absolute path of the compiler's' directory.
 * * __name__: widget's name.
 * * __compiler__: compiler's module owning functions such as `compile`, `precompile`, ...
 * * __precompilation__: is this widget in mode _precompilation_? In this case, it must be called in the Top-Down walking.
 */
Project.prototype.getAvailableWidgetCompilers = function() {
    if (!this._availableWidgetsCompilers) {
        var map = {};
        var dirs = [this._srcDir, this._libDir];
        console.log("Available widgets:");
        dirs.forEach(
            // Resolve paths for "wdg/" directories.
            function(itm, idx, arr) {
                var path = Path.resolve(Path.join(itm, "wdg"));
                if (!FS.existsSync(path)) {
                    path = null;
                }
                arr[idx] = path;
            }
        );
        dirs.forEach(
            function(dir, idx) {
                if (typeof dir !== 'string') return;
                var files = FS.readdirSync(dir);
                files.forEach(
                    function(filename) {
                        var file = Path.join(dir, filename);
                        var stat = FS.statSync(file);
                        if (stat.isFile()) return;
                        if (!map[filename]) {
                            map[filename] = {path: file, name: filename};
                            var modulePath = Path.join(file, "compile-" + filename + ".js");
                            if (FS.existsSync(modulePath)) {
                                var compiler = require(modulePath);
                                if (typeof compiler.precompile === 'function') {
                                    map[filename].precompilation = true;
                                    map[filename].compiler = compiler;
                                }
                                else if (typeof compiler.compile === 'function') {
                                    map[filename].compiler = compiler;
                                }
                            }
                            var name = (filename.substr(0, 1).toUpperCase()
                                        + filename.substr(1).toLowerCase()).cyan;
                            if (idx == 0) {
                                name = name.bold;
                            }
                            console.log(
                                "   " + (map[filename].precompilation ? "<w:".yellow.bold : "<w:")
                                    + name + (map[filename].precompilation ? ">".yellow.bold : ">")
                                    + "\t" + file
                            );
                        }
                    }
                );
            }
        );
        this._availableWidgetsCompilers = map;
    }
    return this._availableWidgetsCompilers;
};

/**
 * Throw a fatal exception.
 */
Project.prototype.fatal = function(msg, id, src) {
    Fatal.fire(msg, id, src);
};

/**
 * Incrément version.
 */
Project.prototype.makeVersion = function(options) {
    var cfg = this._config;
    var version = cfg.version.split(".");
    if (version.length < 3) {
        while (version.length < 3) version.push("0");
    } else {
        version[version.length - 1] = (parseInt(version[version.length - 1]) || 0) + 1;
    }
    cfg.version = version.join(".");
    PathUtils.file(this.prjPath('package.json'), JSON.stringify(cfg, null, '    '));
    console.log("New version: " + cfg.version.cyan);
};


/**
 * Tests use __Karma__ and __Jasmine__ ans the root folder is `spec`.
 * All the __tfw__ modules are put in `spec/mod` folder.
 */
Project.prototype.makeTest = function(compiledFiles) {
    console.log("Prepare Karma/Jasmine tests...".cyan);

    // Create missing folders.
    var specPath = this.prjPath("spec");
    if (!FS.existsSync(specPath)) {
        FS.mkdir(specPath);
    }
    if (!FS.existsSync(Path.join(specPath, "mod"))) {
        FS.mkdir(Path.join(specPath, "mod"));
    }

    // List of needed modules.
    var allModules = [];
    compiledFiles.forEach(function (compiledFile) {
        var output = compiledFile.tag('output');
        var modules = output.modules;
        modules.forEach(function (module) {
            if (allModules.indexOf(allModules) < 0) {
                allModules.push(module);
            }
        });
    });

    // Copy modules in `spec/mod`.
    allModules.forEach(function (module) {
        var js = new Source(this, module + ".js");
        PathUtils.file(this.prjPath("spec/" + module + ".js"), js.tag('zip'));
    }, this);

    PathUtils.file(this.prjPath("spec/mod/@require.js"), Template.file('require.js').out);
};


/**
 * Writing documentation.
 * @return void
 */
Project.prototype.makeDoc = function() {
    console.log("Writing documentation...".cyan);
    CompilerPHP.compile(this);
    var that = this;
    var modules = "window.M={";
    this._modulesList.sort();
    this._modulesList.forEach(
        function(moduleName, index) {
            var src = new Source(that, "mod/" + moduleName);
            if (index > 0) modules += ",\n";
            modules += JSON.stringify(moduleName.substr(0, moduleName.length - 3)) + ":"
                + JSON.stringify(src.tag("doc"));
        }
    );
    modules += "}";
    var cfg = this._config;
    var docPath = this.prjPath("doc");
    Template.files( "doc", docPath, { project: cfg.name } );
    this.mkdir(docPath);
    PathUtils.file(
        Path.join(docPath, "modules.js"),
        modules
    );
};

/**
 * @return {this}
 */
Project.prototype.addModuleToList = function(moduleName) {
    if (moduleName.substr(0, 4) != 'mod/') return this;
    moduleName = moduleName.substr(4);
    if (moduleName.charAt(0) == '$') return this;
    if (this._modulesList.indexOf(moduleName) < 0) {
        this._modulesList.push(moduleName);
    }
    return this;
};

/**
 * Link every `*.html` file found in _srcDir_.
 */
Project.prototype.link = function() {
    console.log("Cleaning output: " + this.wwwPath());
    Util.cleanDir(this.wwwPath());
    this.mkdir(this.wwwPath("DEBUG"));
    this.mkdir(this.wwwPath("RELEASE"));
    this._htmlFiles.forEach(
        function(filename) {
            filename = filename.split(Path.sep).join("/");
            console.log("Linking " + filename.yellow.bold);
            var shiftPath = "";
            var subdirCount = filename.split("/").length - 1;
            for (var i = 0 ; i < subdirCount ; i++) {
                shiftPath += "../";
            }
            this.linkForDebug(filename, shiftPath);
            this.linkForRelease(filename, shiftPath);
        },
        this
    );
};

/**
 * @return void
 */
Project.prototype.sortCSS = function(linkJS, linkCSS) {
    var input = [];
    linkCSS.forEach(
        function(nameCSS, indexCSS) {
            var nameJS = nameCSS.substr(0, nameCSS.length - 3) + "js";
            var pos = linkJS.indexOf(nameJS);
            if (pos < 0) pos = 1000000 + indexCSS;
            input.push([nameCSS, pos]);
        }
    );
    input.sort(
        function(a, b) {
            var x = a[0];
            var y = b[0];
            if (x < y) return -1;
            if (x > y) return 1;
            x = a[1];
            y = b[1];
            if (x < y) return -1;
            if (x > y) return 1;
            return 0;
        }
    );
    return input.map(function(x){return x[0];});
};

Project.prototype.sortJS = function(srcHTML, linkJS) {
    var input = [];
    linkJS.forEach(
        function(nameJS) {
            var srcJS = srcHTML.create(nameJS);
            var item = {key: nameJS, dep: []};
            srcJS.tag("needs").forEach(
                function(name) {
                    if (name != nameJS && linkJS.indexOf(name) > -1) {
                        item.dep.push(name);
                    }
                }
            );
            input.push(item);
        }
    );
    return this.topologicalSort(input);
};

Project.prototype.topologicalSort = function(input) {
    var output = [];
    while (output.length < input.length) {
        // Looking for the less depending item.
        var candidate = null;
        input.forEach(
            function(item) {
                if (!item.key) return;
                if (!candidate) {
                    candidate = item;
                } else {
                    if (item.dep.length < candidate.dep.length) {
                        candidate = item;
                    }
                }
            }
        );
        // This candidate is the next item of the output list.
        var key = candidate.key;
        output.push(key);
        delete candidate.key;
        // Remove this item in all the dependency lists.
        input.forEach(
            function(item) {
                if (!item.key) return;
                item.dep = item.dep.filter(
                    function(x) {
                        return x != key;
                    }
                );
            }
        );
    }
    return output;
};

/**
 * Linking in DEBUG mode.
 * Starting with an HTML file, we will find all dependent JS and CSS.
 *
 * Example: filename = "foo/bar.html"
 * We will create:
 * * `DEBUG/js/foo/@bar.js` for inner JS.
 * * `DEBUG/css/foo/@bar.css` for inner CSS.
 */
Project.prototype.linkForDebug = function(filename, shiftPath) {
    // Add this to a Javascript link to force webserver to deliver a non cached file.
    var seed = "?" + Date.now();
    // The HTML source file.
    var srcHTML = new Source(this, filename);
    // Array of all needed JS topologically sorted.
    var linkJS = this.sortJS(srcHTML, srcHTML.tag("linkJS") || []);
    // Array of all needed CSS topologically sorted.
    var linkCSS = this.sortCSS(linkJS, srcHTML.tag("linkCSS") || []);
    // HTML tree structure.
    var tree = Tree.clone(srcHTML.tag("tree"));
    var manifestFiles = [];

    var head = Tree.getElementByName(tree, "head");
    if (!head) {
        this.fatal(
            "Invalid HTML file: missing <head></head>!"
                + "\n\n"
                + Tree.toString(tree)
        );
    }

    // Needed CSS files.
    var cssDir = this.mkdir(this.wwwPath("DEBUG/css"));
    linkCSS.forEach(
        function(item) {
            var srcCSS = srcHTML.create(item);
            var shortName = Path.basename(srcCSS.getAbsoluteFilePath());
            var output = Path.join(cssDir, shortName);
            PathUtils.file(output, srcCSS.tag("debug"));
            if (!head.children) head.children = [];
            head.children.push(
                Tree.tag(
                    "link",
                    {
                        href: shiftPath + "css/" + shortName + seed,
                        rel: "stylesheet",
                        type: "text/css"
                    }
                )
            );
            head.children.push({type: Tree.TEXT, text: "\n"});
            manifestFiles.push("css/" + shortName);
            var resources = srcCSS.listResources();
            resources.forEach(
                function(resource) {
                    var shortName = "css/"  + resource[0];
                    var longName = resource[1];
                    manifestFiles.push(shortName);
                    this.copyFile(longName, Path.join(this.wwwPath("DEBUG"), shortName));
                },
                this
            );
        } ,
        this
    );

    // For type "nodewebkit", all JS must lie in "node_modules" and they
    // don't need to be declared in the HTML file.
    var jsDirShortName = (this._type == 'nodewebkit' ? "node_modules" : "js");
    var jsDir = this.mkdir(this.wwwPath("DEBUG/" + jsDirShortName));
    linkJS.forEach(
        function(item) {
            var srcJS = srcHTML.create(item);
            var shortName = Path.basename(srcJS.getAbsoluteFilePath());
            var output = Path.join(jsDir, shortName);
            var code = srcJS.read();
            if (item.substr(0, 4) == 'mod/') {
                if (this._type == 'nodewebkit') {
                    // Let's add internationalisation snippet.
                    code = (srcJS.tag("intl") || "") + code;
                } else {
                    // This is a module. We need to wrap it in module's declaration snippet.
                    code =
                        "window['#"
                        + shortName.substr(0, shortName.length - 3).toLowerCase()
                        + "'] = function(exports, module){\n"
                        + (srcJS.tag("intl") || "")
                        + code
                        + "\n};\n";
                }
            }
            PathUtils.file(output, code);
            if (this._type != 'nodewebkit') {
                // Declaration and  manifest only needed for  project of
                // type that is not "nodewebkit".
                if (!head.children) head.children = [];
                head.children.push(
                    Tree.tag(
                        "script",
                        {src: shiftPath + jsDirShortName + "/" + shortName + seed}
                    )
                );
                head.children.push({type: Tree.TEXT, text: "\n"});
                manifestFiles.push(jsDirShortName + "/" + shortName);
            }
        } ,
        this
    );
    srcHTML.tag("resources").forEach(
        function(itm, idx, arr) {
            var src = itm;
            var dst = src;
            if (Array.isArray(src)) {
                dst = src[1];
                src = src[0];
            }
            manifestFiles.push(dst);
            src = this.srcPath(src);
            dst = Path.join(this.wwwPath("DEBUG"), dst);
            this.copyFile(src, dst);
        }, this
    );

    // Adding innerJS and innerCSS.
    var shortNameJS = PathUtils.addPrefix(filename.substr(0, filename.length - 5), "@") + ".js";
    head.children.push(
        Tree.tag(
            "script",
            {src: shiftPath + jsDirShortName + "/" + shortNameJS + seed}
        )
    );
    manifestFiles.push(jsDirShortName + "/" + shortNameJS);
    var wwwInnerJS = Path.join(jsDir, shortNameJS);
    PathUtils.file(
        wwwInnerJS,
        srcHTML.tag("innerJS")
    );

    if (true) {
        // For now, we decided to put the CSS relative to the inner HTML into the <head>'s tag.
        head.children.push(
            Tree.tag("style", {}, srcHTML.tag("innerCSS"))
        );
    } else {
        // If we want to externalise the inner CSS in the future, we can use this piece of code.
        var shortNameCSS = PathUtils.addPrefix(filename.substr(0, filename.length - 5), "@") + ".css";
        head.children.push(
            Tree.tag(
                "link",
                {
                    href: shiftPath + "css/" + shortNameCSS + seed,
                    rel: "stylesheet",
                    type: "text/css"
                }
            )
        );
        manifestFiles.push(shiftPath + "css/" + shortNameCSS);
        PathUtils.file(
            Path.join(cssDir, shortNameCSS),
            srcHTML.tag("innerCSS")
        );
    }

    if (this._type != 'nodewebkit') {
        // Looking for manifest file.
        var html = Tree.findChild(tree, "html");
        if (html) {
            var manifestFilename = Tree.att("manifest");
            if (manifestFilename) {
                // Writing manifest file only if needed.
                PathUtils.file(
                    Path.join(this.wwwPath("DEBUG"), filename + ".manifest"),
                    "CACHE MANIFEST\n"
                        + "# " + (new Date()) + " - " + Date.now() + "\n\n"
                        + "CACHE:\n"
                        + manifestFiles.join("\n")
                        + "\n\nNETWORK:\n*\n"
                );
            }
        }
    }
    // Writing HTML file.
    PathUtils.file(
        Path.join(this.wwwPath("DEBUG"), filename),
        "<!-- " + (new Date()).toString() + " -->"
            + "<!DOCTYPE html>" + Tree.toString(tree)
    );
    // Writing ".htaccess" file.
    this.writeHtaccess("DEBUG");
    // Looking for webapp manifest for Firefox OS (also used for nodewebkit).
    copyManifestWebapp.call(this, "DEBUG");
};

/**
 * @param mode can be "RELEASE" or "DEBUG".
 * @return void
 */
Project.prototype.writeHtaccess = function(mode) {
    PathUtils.file(
        Path.join(this.wwwPath(mode), ".htaccess"),
        "AddType application/x-web-app-manifest+json .webapp\n"
            + "AddType text/cache-manifest .manifest\n"
            + "ExpiresByType text/cache-manifest \"access plus 0 seconds\"\n"
            + "Header set Expires \"Thu, 19 Nov 1981 08:52:00 GM\"\n"
            + "Header set Cache-Control \"no-store, no-cache, must-revalidate, post-check=0, pre-check=0\"\n"
            + "Header set Pragma \"no-cache\"\n"
    );
};

/**
 * @param mode : "DEBUG" or "RELEASE".
 */
function copyManifestWebapp(mode) {
    var filename = "manifest.webapp";
    var out;
    if (this._type == 'nodewebkit') filename = "package.json";

    // Looking for webapp manifest for Firefox OS.
    if (false == FS.existsSync(this.srcPath(filename))) {
        out = Template.file(filename, this._config).out;
        PathUtils.file(this.srcPath(filename), out);
    }
    var webappFile = this.srcPath(filename);
    if (webappFile) {
        var content = FS.readFileSync(webappFile).toString();
        var json = null;
        try {
            json = JSON.parse(content);
        } catch (x) {
            this.fatal("'" + filename  + "' must be a valid JSON file!\n" + x);
        }
        json.version = this._config.version;
        if (typeof json.window === 'object') {
            json.window.toolbar = (mode == "DEBUG");
        }
        PathUtils.file(Path.join(this.wwwPath(mode), filename), JSON.stringify(json, null, 4));
        var icons = json.icons || {};
        var key, val;
        for (key in icons) {
            val = this.srcOrLibPath(icons[key]);
            if (val) {
                this.copyFile(val, Path.join(this.wwwPath(mode), icons[key]));
            }
        }
    }
}

/**
 * @return array of HTML files found in _srcDir_.
 */
Project.prototype.findHtmlFiles = function() {
    var filters = this._config.tfw.compile.files;
    if (typeof filters === 'undefined') filters = "\\.html$";
    var files = [],
        srcDir = this.srcPath(),
        prefixLength = srcDir.length + 1,
        filter, i, rxFilters = [], arr;
    if (!Array.isArray(filters)) {
        filters = [filters];
    }
    for (i = 0 ; i < filters.length ; i++) {
        filter = filters[i];
        if (typeof filter !== 'string') {
            this.fatal("Invalid atribute \"tfw.compile.files\" in \"package.json\"!\n"
                       + "Must be a string or an array of strings.");
        }
        arr = [];
        filter.split("/").forEach(
            function(item) {
                try {
                    item = item.trim();
                    if (item == '' || item == '*') {
                        // `null`matches anything.
                        arr.push(null);
                    } else {
                        arr.push(new RegExp(item, "i"));
                    }
                }
                catch (ex) {
                    this.fatal(
                        "Invalid regular expression for filter: " + JSON.stringify(filter) + "!"
                    );
                }
            }
        );
        rxFilters.push(arr);
    }
    rxFilters.forEach(
        function(f) {
            PathUtils.findFiles(srcDir, f).forEach(
                function(item) {
                    files.push(item.substr(prefixLength));
                }
            );
        }
    );
    if (files.length == 0) {
        this.fatal(
            "No HTML file found!\n\nPattern: " + JSON.stringify(filters)
                + "\nFolder:  " + srcDir
        );
    }
    return files;
};

/**
 * @param arguments all arguments will be joined to form the path of the directory to create.
 * @return the name of the created directory.
 */
Project.prototype.mkdir = function() {
    var key, arg, items = [];
    for (key in arguments) {
        arg = arguments[key].trim();
        items.push(arg);
    }
    var path = Path.resolve(Path.normalize(items.join("/"))),
        item, i,
        curPath = "";
    items = path.replace(/\\/g, '/').split("/");
    for (i = 0 ; i < items.length ; i++) {
        item = items[i];
        curPath += item + "/";
        if (FS.existsSync(curPath)) {
            var stat = FS.statSync(curPath);
            if (!stat.isDirectory()) {
                break;
            }
        } else {
            try {
                FS.mkdirSync(curPath);
            }
            catch (ex) {
                throw {fatal: "Unable to create directory \"" + curPath + "\"!\n" + ex};
            }
        }
    }
    return path;
};

// Used for file copy.
var buffer = new Buffer(64 * 1024);

/**
 * Copy a file from `src` to `dst`.
 * @param src full path of the source file.
 * @param dst full path of the destination file.
 */
Project.prototype.copyFile = function(src, dst) {
    if (!FS.existsSync(src)) {
        this.fatal("Unable to copy missing file: " + src, -1, src);
    }
    var stat = FS.statSync(src);
    if (stat.isDirectory()) {
        // We need to copy a whole directory.
        if (FS.existsSync(dst)) {
            // Check if the destination is a directory.
            stat = FS.statSync(dst);
            if (!stat.isDirectory()) {
                this.fatal("Destination is not a directory: \"" + dst
                           + "\"!\nSource is \"" + src + "\".", -1, "project.copyFile");
            }
        } else {
            // Make destination directory.
            this.mkdir(dst);
        }
        var files = FS.readdirSync(src);
        files.forEach(
            function(filename) {
                this.copyFile(
                    Path.join(src, filename),
                    Path.join(dst, filename)
                );
            },
            this
        );
        return;
    }

    var bytesRead, pos, rfd, wfd;
    this.mkdir(Path.dirname(dst));
    try {
        rfd = FS.openSync(src, "r");
    }
    catch(ex) {
        this.fatal("Unable to open file \"" + src + "\" for reading!\n" + ex, -1, "project.copyFile");
    }
    try {
        wfd = FS.openSync(dst, "w");
    }
    catch(ex) {
        this.fatal("Unable to open file \"" + dst + "\" for writing!\n" + ex, -1, "project.copyFile");
    }
    bytesRead = 1;
    pos = 0;
    while (bytesRead > 0) {
        try {
            bytesRead = FS.readSync(rfd, buffer, 0, 64 * 1024, pos);
        }
        catch (ex) {
            this.fatal("Unable to read file \"" + src + "\"!\n" + ex, -1, "project.copyFile");
        }
        FS.writeSync(wfd, buffer, 0, bytesRead);
        pos += bytesRead;
    }
    FS.closeSync(rfd);
    return FS.closeSync(wfd);
};


/**
 * @param prjDir root directory of the project. It is where we can find `project.tfw.json`.
 * @return instance of the class `Project`.
 */
exports.createProject = function(prjDir) {
    return new Project(prjDir);
};


exports.ERR_WIDGET_TRANSFORMER = 1;
exports.ERR_WIDGET_NOT_FOUND = 2;
exports.ERR_WIDGET_TOO_DEEP = 3;
exports.ERR_FILE_NOT_FOUND = 4;
