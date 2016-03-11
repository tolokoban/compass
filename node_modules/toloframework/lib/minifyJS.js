var UglifyJS = require("uglify-js");


/**
 * @param args {object} -
 *   * __name__ {string}: Name of the Javascript.
 *   * __content__ {string}: Javascript source content.
 *
 * @return
 *   * __src__ {string}: Verbatim Javascript source content.
 *   * __zip__ {string}: Minified version of the Javascript content.
 *   * __map__ {object}: SourceMap object.
 */
module.exports = function(args) {
    var minification = UglifyJS.minify(args.content, {
        compress: true,
        fromString: true,
        outSourceMap: args.name + ".map"
    });
    var sourceMap = JSON.parse(minification.map);
    sourceMap = {
        version: sourceMap.version,
        file: sourceMap.file,
        sources: [args.name],
        sourcesContent: [args.content],
        names: sourceMap.names,
        mappings: sourceMap.mappings
    };
    return {src: args.content, zip: minification.code, map: sourceMap};
    
};
