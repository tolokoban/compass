#!/bin/bash

echo
echo ==== TFW ====
jsdoc --verbose -c jsdoc.cfg.json -d doc/tfw doc/tfw.md src/*.js
# node src/node_modules/jsdoc/jsdoc.js -d doc/tfw src/cmp/*.js
echo
echo ==== WDG ====
jsdoc --verbose -c jsdoc.cfg.json -d doc/wdg doc/wdg.md src/lib/wdg/*/compile-*.js
echo
echo ==== MOD ====
jsdoc --verbose -c jsdoc.cfg.json -d doc/cls doc/cls.md src/lib/mod/*.js

