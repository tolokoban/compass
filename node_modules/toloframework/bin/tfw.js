#! /usr/bin/env node
// -*- js -*-

"use strict";

/**
 *
 * @module tfw
 */
require("colors");
var Path = require("path");
var FS = require("fs");
var Util = require("../lib/util.js");
var Project = require("../lib/project");
var PathUtils = require("../lib/pathutils");

// Read the version in the package file.
var packageFile = Path.join(__dirname, "../package.json");
var cfg = JSON.parse(FS.readFileSync(packageFile));
var txt = " ToloFrameWork " + cfg.version + " ";
var sep = "";
for (var i = 0 ; i < txt.length ; i++) {
    sep += "-";
}
sep = "+" + sep + "+";
txt = "|" + txt + "|";
console.log(sep);
console.log(txt);
console.log(sep);
console.log();

String.prototype.err = function() {
    var sep = "+------------------------------------------------------------------------------------------------------------------------+";
    var txt = '';
    this.split("\n").forEach(function (line) {
        var buff = '| ', i, c, mode = 0;
        for (i = 0; i < line.length; i++) {
            c = line.charCodeAt(i);
            if (mode == 0) {
                if (c > 31) {
                    buff += line.charAt(i);
                }
                else if (c == 7) {
                    buff += "    ";
                }
                else if (c == 27) {
                    // Remove all color information.
                    mode = 1;
                }
            } else {
                if (c == 109) {
                    mode = 0;
                }
            }
        }
        while(buff.length < 120) {
            buff += ' ';
        }
        txt += (buff + " |").redBG.white.bold + "\n";
    });
    return sep.redBG.white.bold + "\n" + txt + sep.redBG.white.bold + "\n";
};

var firstProcess = true;
var tasks = [];
var options = {};
var args = process.argv;
args.shift();
args.shift();
if (args.indexOf('clean') > -1) {
    tasks.push(function(prj) {
        console.log("Cleaning...".green);
        Util.cleanDir("./tmp");
    });
}
if (args.indexOf('version') > -1) {
    tasks.push(function(prj) {
        if (firstProcess) {
            console.log("Incrementing version...".green);
            prj.makeVersion();
        }
    });
}
if (args.indexOf('dev') > -1) {
    tasks.push(function(prj) {
        console.log("Build for DEVELOPMENT. Don't minify, don't combine.".green);
        options.dev = true;
        console.log("options: ", options);
    });
}
if (args.indexOf('build') > -1) {
    tasks.push(function(prj) {
        prj.compile(options);
    });
}
if (args.indexOf('php') > -1) {
    tasks.push(function(prj) {
        prj.services(options);
    });
}
if (args.indexOf('doc') > -1) {
    tasks.push(function(prj) {
        prj.makeDoc(options);
    });
}
if (args.indexOf('test') > -1) {
    tasks.push(function(prj) {
        var modules = prj.getCompiledFiles();
        if (modules.length == 0) {
            modules = prj.compile(options);
        }
        prj.makeTest(modules, options);
    });
}
if (tasks.length == 0) {
    console.log();
    console.log("Accepted arguments:");
    console.log("  clean".yellow + ":   remove all temporary files.");
    console.log("  build".yellow + ":   compile project in the www/ folder.");
    console.log("  dev".yellow + ":  JS and CSS files won't be minified.");
    console.log("  php".yellow + ":     add PHP services.");
    console.log("  test".yellow + ":    prepare Karma tests.");
    console.log("  doc".yellow + ":     create documentation.");
    console.log("  watch".yellow + ":   watch for files change.");
    console.log("  version".yellow + ": increment version number.");
    console.log();
    console.log("Example:");
    console.log("  tfw build clean");
    console.log();
} else {
    function process() {
        try {
            console.log();
            console.log(("" + (new Date())).green);
            console.log();
            var time = Date.now();
            var prj = Project.createProject('.');
            tasks.forEach(function(task) {
                task(prj);
            });
            var now = Date.now();
            console.log('----------------------------------------');
            console.log(
                "Time: "
                    + ((now - time) / 1000).toFixed(3).bold
                    + " seconds.");
            return prj;
        } catch (x) {
            x.fatal = x.fatal || "" + x;
            x.src = x.src || [""];
            x.id = x.id || "Internal javascript error";
            console.error("\n");
            console.error("+-------------+".redBG.white.bold);
            console.error("| FATAL ERROR |".redBG.white.bold + " "
                          + (typeof x.id === 'string' ? x.id.red.bold : ''));
            console.error((x.fatal).err());
            x.src.forEach(function (src, idx) {
                src = src || "";
                console.error(src.red.bold);
            });
            console.error("\n");
            if (x.stack) {
                console.error(x.stack.trim().red);
                console.error("\n");
            }
            return false;
        }
    }

    var timer = 0;
    var watchedDirectories = [];

    function watch(path) {
        console.log("Watching ".cyan + path);
        watchedDirectories.push(path);
        var watcher = FS.watch(path);
        watcher.path = path;
        watcher.on('change', processLater);
    }

    var prj = process();
    firstProcess = false;

    function processLater(eventName, filename) {
        if (filename) {
            // Don't compile if only `manifest.webapp` changed.
            if (filename == 'manifest.webapp') return;
            if (filename.charAt(0) == '#') return;
            if (filename.substr(0, 2) == '.#') return;
            if (filename.charAt(filename.length - 1) == '~') return;
            var path = Path.join(this.path, filename);
            if (PathUtils.isDirectory(path)) {                
                if (!FS.existsSync(path)) return;
                if (watchedDirectories.indexOf(filename) == -1) {
                    watch(path);
                }
                return;
            }
            console.log("File change: " + path.bold.yellow);
            // If a resource file changes, we have to touch the corresponding module's JS file.
            prj.cascadingTouch(path);
        }
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(process, 50);
    }

    // Watch files?
    if (args.indexOf("watch") > -1) {
        console.log();
        var fringe = [prj.srcPath()];
        var path;
        while (fringe.length > 0) {
            path = fringe.pop();
            watch(path);
            FS.readdirSync(path).forEach(
                function(filename) {
                    var subpath = Path.join(path, filename);
                    if (PathUtils.isDirectory(subpath)) {
                        fringe.push(subpath);
                    }
                }
            );
        }
        console.log();
    }
}
