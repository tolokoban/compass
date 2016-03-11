function load(storage) {
    return function(key, def) {
        var v = storage.getItem(key);
        if (v === null) {
            return def;
        }
        try {
            v = JSON.parse(v);
        }
        catch(ex) {}
        return v;
    };
}

function save(storage) {
    return function(key, val) {
        storage.setItem(key, JSON.stringify(val));
    };
}


exports.local = {
    get: load(window.localStorage),
    set: save(window.localStorage)
};

exports.session = {
    get: load(window.sessionStorage),
    set: save(window.sessionStorage)
};
