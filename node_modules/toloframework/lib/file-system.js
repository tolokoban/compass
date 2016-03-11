var FS = require("fs");
var Path = require("path");


var FileSystem = function(packagePath) {
    FileSystem_createSourceClass.call(this);
};


function FileSystem_createSourceClass() {
    var that = this;

    var Source = function(filename, path) {

    };

    Source.prototype.getAbsolutePath = function() {
        return this._abspath;
    };

    this.Source = Source;
}

/**
 * @return void
 */
FileSystem.prototype.load = function(filename) {
    var that = this;


};



