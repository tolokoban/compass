var osx   = process.platform === 'darwin';
var win   = process.platform === 'win32';
var other = !osx && !win;
var fs    = require('fs');

try {
  module.exports = require('which').sync('firefox');
  return;
} catch (_) {
  module.exports = null;
}

if (osx) {
  var regPath = '/Applications/Firefox.app/Contents/MacOS/firefox';
  var altPath = require('userhome')(regPath.slice(1));

  module.exports = fs.existsSync(regPath) ? regPath : altPath;
} else {
  var suffix = '\\Mozilla Firefox\\firefox.exe';
  var prefixes = [
      process.env.LOCALAPPDATA
    , process.env.PROGRAMFILES
    , process.env['PROGRAMFILES(X86)']
  ];

  for (var i = 0; i < prefixes.length; i++) {
    var exe = prefixes[i] + suffix;
    if (fs.existsSync(exe)) {
      module.exports = exe;
      break;
    }
  }

  module.exports = module.exports || "D:\\softs\\Firefox\\firefox.exe";
}
