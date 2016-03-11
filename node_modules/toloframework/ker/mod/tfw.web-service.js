require("tfw.promise");
var Storage = require("tfw.storage");
var Listeners = require("tfw.listeners");

var currentUser = null;
var changeEvent = new Listeners();
var config = {url: "tfw"};
var saved = Storage.local.get("nigolotua");
if (Array.isArray(saved)) {
    config.usr = saved[0];
    config.pwd = saved[1];
}

exports.BAD_ROLE = -1;
exports.BAD_TYPE = -2;
exports.CONNECTION_FAILURE = -3;
exports.MISSING_AUTOLOGIN = -4;
exports.UNKNOWN_USER = -5;
exports.HTTP_ERROR = -6;

function svc(name, args, url) {
    console.info("[tfw.web-service]", name, args);
    return new Promise(
        function(resolve, reject) {
            if (typeof url === 'undefined') url = config.url;
            var that = this;
            var xhr = new XMLHttpRequest({mozSystem: true});
            if ('withCredentials' in xhr) {
                xhr.open("POST", url + "/svc.php", true);
                xhr.withCredentials = true;  // Indispensable pour le CORS.
            } else {
                // IE
                xhr = new XDomainRequest();
                xhr.open("POST", url + "/svc.php");
            }
            xhr.onload = function() {
                if (xhr.status != 200) {
                    reject(
                        {
                            id: exports.HTTP_ERROR,
                            msg: "(" + xhr.status + ") " + xhr.statusText,
                            status: xhr.status
                        }
                    );
                }
                var value = xhr.responseText;
                if (typeof value === "string") {
                    if (value.substr(0, 1) == "!") {
                        reject(
                            {
                                id: exports.BAD_ROLE,
                                msg: Error("Service \"" + name + "\" needs role \""
                                           + value.substr(1) + "\"!")
                            }
                        );
                    }
                    var valueObject;
                    try {
                        valueObject = JSON.parse(value);
                    }
                    catch (ex) {
                        reject(
                            {
                                id: exports.BAD_TYPE,
                                msg: Error("Service \"" + name
                                           + "\" should return a valid JSON!\n" + ex)
                            }
                        );
                    }
                    resolve(valueObject);
                } else {
                    reject(
                        {
                            id: exports.BAD_TYPE,
                            msg: Error("Service \"" + name + "\" should return a string!")
                        }
                    );
                }
            };
            xhr.onerror = function() {
                reject(
                    {
                        id: exports.HTTP_ERROR,
                        msg: "(" + xhr.status + ") " + xhr.statusText,
                        status: xhr.status
                    }
                );
            };
            var params = "s=" + encodeURIComponent(name)
                + "&i=" + encodeURIComponent(JSON.stringify(args));
            xhr.setRequestHeader(
                "Content-type",
                "application/x-www-form-urlencoded");
            xhr.send(params);
        }
    );
}

/**
 * Event fired when login status has changed.
 * @type {tfw.listeners}
 */
exports.changeEvent = changeEvent;

/**
 * Disconnect current user.
 * @return {Promise} A _thenable_ object resolved as soon as the server answered.
 */
exports.logout = function() {
    currentUser = null;
    changeEvent.fire();
    Storage.local.set("nigolotua", null);
    return svc("tfw.login.Logout");
};

/**
 * Try to connect a user.
 * @param {string} usr Login name.
 * @param {string} pwd Password.
 * @return {Promise}
 *
 */
exports.login = function(usr, pwd) {
    if (typeof usr === 'undefined') usr = config.usr;
    if (typeof pwd === 'undefined') pwd = config.pwd;

    return new Promise(
        function (resolve, reject) {
            if (typeof usr === 'undefined') {
                var autologin = Storage.local.get("nigolotua");
                if (!Array.isArray(autologin)) return reject({id: exports.MISSING_AUTOLOGIN});
                usr = autologin[0];
                pwd = autologin[1];
            }
            Storage.local.set("nigolotua", null);
            svc("tfw.login.Challenge", usr)
                .then(
                    function(code) {
                        // Hashage du mot de passe à l'aide du code.
                        var output = [0, 0, 0, 0,
                                      0, 0, 0, 0,
                                      0, 0, 0, 0,
                                      0, 0, 0, 0],
                        i, j = 0,
                        pass = [],
                        k1, k2, k3;
                        for (i=0 ; i<pwd.length ; i++) {
                            pass.push(pwd.charCodeAt(i));
                        }
                        if (256 % pass.length == 0) {
                            pass.push(0);
                        }

                        for (i=0 ; i<256 ; i++) {
                            output[i % 16] ^= i + pass[i % pass.length];
                            k1 = code[j++ % code.length]%16;
                            k2 = code[j++ % code.length]%16;
                            k3 = code[j++ % code.length]%16;
                            output[k3] ^= (output[k3] + 16*k2 + k3)%256;
                            output[k2] ^= (output[k1] + output[k3])%256;
                        }
                        return svc("tfw.login.Response", output); //.then(resolve, reject);
                    },
                    reject
                )
                .then(
                    function(user) {
                        if (typeof user === 'object') {
                            currentUser = {
                                data: user,
                                hasRole: function(role) {
                                    for (var i = 0 ; i < user.roles.length ; i++) {
                                        var item = user.roles[i];
                                        if (item == role) return true;
                                    }
                                    return false;
                                }
                            };
                            Storage.local.set("nigolotua", [usr, pwd]);
                            changeEvent.fire();
                            resolve(user);
                        } else {
                            currentUser = null;
                            reject({id: exports.UNKNOWN_USER});
                        }
                    },
                    reject
                );
        }
    );
};

/**
 * Call a webservice.
 */
exports.get = function(name, args, url) {
    return new Promise(
        function(resolve, reject) {
            svc(name, args, url).then(
                resolve,
                function(err) {
                    if (typeof err === 'object' && err.id == exports.BAD_ROLE) {
                        // Echec de connexion, on retente de se connecter avant d'abandonner.
                        exports.login().then(
                            function() {
                                svc(name, args, url).then(resolve, reject);
                            },
                            reject
                        );
                    } else {
                        reject(err);
                    }
                }
            );
        }
    );
};

exports.user = function() {
    return currentUser;
};

exports.config = function(key, val) {
    if (typeof val === 'undefined') {
        return config[key];
    }
    config[key] = val;
    return val;
};

// _Backward compatibility.
if (window.$$) {
    window.$$.service = function (name, args, caller, onSuccess, onError) {
        var p = exports.get(name, args);
        p.then(
            function(value) {
                if (onSuccess) {
                    return caller[onSuccess].call(caller, value);
                }
                return value;
            },
            function(reason) {
                if (onError) {
                    return caller[onError].call(caller, reason);
                }
                return reason;
            }
        );
    };
}
