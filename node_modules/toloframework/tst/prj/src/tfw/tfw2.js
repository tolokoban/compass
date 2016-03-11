/**
 * ToloFrameWork v2.2
 *-------------------------------------------------------------------------------
 * L'instanciation  étant  ce  que  l'on   fait  le  plus  souvent  avec
 * Toloframework,  l'écriture en  est  simplifiée au  maximum. Voici  un
 * exemple d'utilisation :
 * var a = $$("sys.widget.Button", {caption: "Click Me!"});
 *
 * Si la classe  n'existe pas, on le  trace dans le log,  et on retourne
 * null.  Attention  ! si la  classe existe  mais possède une  erreur de
 * syntaxe, on retourne aussi null.
 *
 * @param className Nom complet de la classe.
 * @param attribs [Optionel] Dictionnaire des attributs et de leurs valeurs initiales.
 */
window.$$ = function(className, attribs) {
    var single,
    cls,
    obj,
    k,
    path,
    names,
    signals,
    cur,
    i,
    f,
    sn,
    n,
    s;
    // S'agit-t-il d'un singleton déjà instancié ?
    single = $$._.singletons[className];
    if (single && typeof single == "object") {
        return single;
    }

    if (attribs) $$.trace(attribs, 9);

    cls = $$.loadClass(className);
    obj = new cls();
    obj.$id = $$.newId();

    // Mise à jour des attributs.
    if (typeof attribs == "object") {
        for (k in attribs) {
            if (k == null) continue;
            obj["_" + k] = attribs[k];
        }
    }

    // La mécanique  suivante sert  à récupérer la  hiérarchie des
    // classes afin d'appeler les  constructeurs les uns après les
    // autres.  Sans  cette astuce, les attributs  de construction
    // ne sont  pas renseignés quand  la super classe  exécute son
    // constructeur.
    path = [];
    names = [];
    signals = {};
    cur = cls.prototype;
    while (cur != null) {
        if (cur.$signals) {
            for (i in cur.$signals) {
                signals[cur.$signals[i]] = 1;
            }
        }
        f = cur.$init;
        /**
         * Attention !
         * Quand on ne  définit pas de méthode init()  et que l'on
         * hérite d'une classe en  définissant une, f pointera non
         * pas sur null, mais sur la méthode init() du parent.
         */
        if (f != null) {
            if (f != path[path.length - 1]) {
                path.push(f);
                names.push(cur.$classname);
            }
        }
        cur = cur.$parent;
    }

    // Création des signals.
    for(sn in signals) {
        // Signal Name.
        if (sn) {
            s = new $$.Signal(obj, sn);
            obj["$_" + sn] = s;
        }
    }

    while (path.length > 0) {
        f = path.pop();
        n = names.pop();
        if (f) {
            f.call(obj);
        }
    }

    if (obj.$singleton) {
        // C'est un singleton, alors on stoque son unique instance
        // en mémoire pour réutilisation.
        $$._.singletons[className] = obj;
    }

    return obj;
};

/**
 * Charger la classe className.
 * @param className Nom de la classe à charger en mémoire.
 * @param def Si cet argument est renseigné, on ne télécharge pas la classe,
 *            mais on prend cette valeur comme définition.
 */
$$.loadClass = function(className, def) {
    var cls = $$._.classes[className],
    superclass,
    s,
    k,
    i,
    // Signal name.
    sn,
    // Function name.
    name;
    if (!cls) {
        // La classe n'a pas encore été téléchargée.
        if (def) {
            // Si on spécifie  la défintion de la  classe en argument,
            // on écrase l'ancienne définition potentielle.
            $$._.classes[className] = null;
        } else {
            def = window["TFW::" + className];
        }
        if (!def) {
            console.error("[$$.loadClass] This class does not exist: " + className);
            return;
        }
        // Création de la classe à partir de sa définition.
        cls = function () {};
        superclass = $$.Object;
        if (def.superclass != null) {
            superclass = $$.loadClass(def.superclass);
        }
        $$.trace("This class extends " + superclass.prototype.$classname, 9);
        // Héritage
        cls.prototype = new superclass();
        // Eviter que le constructeur de cette classe soit celui de la super classe.
        cls.prototype.constructor = cls;
        // Définition de l'attribut $parent pour accéder aux méthodes parentes.
        cls.prototype.$parent = superclass.prototype;
        // Multilangues.
        cls.prototype.$lang = def.lang || {};
        // Conserver le nom de la super classe.
        cls.prototype.$superclass = superclass.prototype.$classname;
        // Conserver le nom de la classe.
        cls.prototype.$classname = className;
        // Les noms des signals.
        cls.prototype.$signals = def.signals;
        // Est-ce un singleton ?
        cls.prototype.$singleton = def.singleton;
        // Espace réservé aux membres statiques de la classe.
        s = {className: className};
        $$._.statics[className] = s;
        cls.prototype.$static = $$._.statics;
        // Valeurs par défaut des attributs.
        if (def.attributes) {
            for (k in def.attributes) {
                cls.prototype["_" + k] = def.attributes[k];
            }
        }
        // Déclaration du constructeur.
        cls.prototype.$init = def.init;
        // Définition des méthodes liées aux signaux.
        if (def.signals) {
            for (i in def.signals) {
                sn = def.signals[i];
                $$._declareSignal(cls, sn);
            }
        }
        // Détacher tous les signaux : entrants et sortans.
        cls.prototype.unbind = function() {
console.log("TODO: unbind!");
        };
        // Assigner toutes les méthodes.
        for (name in def.functions) {
            cls.prototype[name] = def.functions[name];
        }

        // Mise en cache de la classe.
        $$._.classes[className] = cls;
        // Appel d'un éventuel constructeur de classe.
        if (typeof def.classInit == "function") {
            def.classInit($$._.statics[className]);
        }
    }
    return cls;
};

$$._declareSignal = function(cls, sn) {
    cls.prototype["fire" + sn] = function(a) {
        this["$_" + sn].emit(a);
    };
    cls.prototype[sn] = function(a,b,c) {
        this["$_" + sn].connect(a,b,c);
        return this;
    };
    cls.prototype["unbind" + sn] = function(a,b,c) {
        this["$_" + sn].disconnect(a,b,c);
        return this;
    };
};

$$.addScript = function(code, id) {
    var s = document.createElement("script");
    if (id !== undefined) {
        s.setAttribute("id", id);
    }
    s.innerHTML = "//<!-- \n" + code + "\n// -->";
    document.querySelector("head").appendChild(s);
    return s;
};

$$.stopPropagation = function(e) {

    var evt = e ? e : window.event;
    if (evt.stopPropagation) {
        evt.stopPropagation();
        evt.preventDefault();
    }
    if (evt.cancelBubble != null) {
        evt.cancelBubble = true;
        evt.returnValue = false;
    }
};

$$.addEvent = function(element, type, handler) {
    var handlers;
        if (type === "mouseenter") {
            return $$.addEvent(element, "mouseover", $$._.mouseEnter(handler));
        }
        if (type === "mouseleave") {
            return $$.addEvent(element, "mouseout", $$._.mouseEnter(handler));
        }
        if (!handler.$$guid) handler.$$guid = $$.addEvent.guid++;
        if (!element.$events) element.$events = {};
        handlers = element.$events[type];
        if (!handlers) {
            handlers = element.$events[type] = {};
            if (element["on" + type]) {
                handlers[0] = element["on" + type];
            }
        }
        handlers[handler.$$guid] = handler;
        if (type == "DOMMouseScroll") {
            // Firefox gère un événement particulier pour le MouseWheel.
            element.addEventListener(type, handler, false);
        } else {
            element["on" + type] = $$._.handleEvent;
        }
    return null;
};

$$.addEvent.guid = 1;

$$.removeEvent = function(element, type, handler) {
    if (element.$events && element.$events[type]) {
        if (handler === undefined) {
            delete element.$events[type];
        } else {
            delete element.$events[type][handler.$$guid];
        }
    }
};

/**
 * Retourne true si "child" est un enfant de "parent".
 */
$$.isChildElement = function(parent, child) {
    if (parent === child) {
        return false;
    }
    while (child && child !== parent) {
        child = child.parentNode;
    }
    return child === parent;
};

$$.App = {};

$$.Object = function() {};
/**
 * Cette méthod sert à récupérer le prototype d'un ancètre particulier.
 * Vous pouvez ainsi appeler une méthode d'un parent.
 * Il est aussi possible d'utiliser cette méthode pour savoir si un objet
 * appartient à une classe donnée. En effet, la méthode retourne null si
 * la classe n'existe pas dansla chaîne d'héritage.
 * @code
 *   var a = $$("B");
 *   a.foo(3.14);
 *   a.$super("A").foo.call(a, 3.14);
 * @code
 */
$$.Object.prototype.$super = function(classname) {
    var p = window[this.$classname];
    while (p) {
        if (p.prototype.$classname == classname) {
            return p.prototype;
        }
        p = p.prototype.$parent;
        if (!p) break;
        p = window[p.$classname];
    }
    return null;
};
// URL d'une resource.
$$.Object.prototype.$url = function(file) {
    return $$.url(file, this.$classname);
};
$$.Object.prototype.$classname = null;
$$.Object.prototype.$parent = null;

$$.Signal = function(sender, name) {
    this._name = name;
    this._sender = sender;
    this._slots = {};
};

$$.Signal.prototype.connect = function(obj, slot, data) {
    var k = this._key(obj, slot),
    s = this._slots[k];
    if (s === undefined) {
        s = [obj, slot, []];
        this._slots[k] = s;
    }
    s[2].push(data);
    return k;
};

$$.Signal.prototype.disconnect = function(obj, slot) {
    var k = (slot ? this._key(obj, slot) : obj);
    delete this._slots[k];
};

$$.Signal.prototype.emit = function(arg) {
    var i, s, obj, f, j, d, msg;
    try {
        for (i in this._slots) {
            s = this._slots[i];
            if (s) {
                obj = s[0];
                // Slot function.
                f = s[1];
                if (f) {
                    f = $$.slot(obj, f);
                    for (j in s[2]) {
                        d = s[2][j];
                        try {
                            f.call(obj, arg, d, this._sender);
                        } catch (e) {
                            throw new Error("[$$.Signal.emit] Exception occured in slot "
                                  + obj.$classname + "." + s[1] + "\n" + e);
                        }
                    }
                }
                else {
                    f = s[0];
                    f(arg, s[2], this._sender);
                }
            }
        }
    } catch (e) {
        msg = "[$$.Signal.emit] Exception occured in signal " + this._sender.$classname
            + "." + this._name + "\n" + e;
        $$.trace(msg);
        throw new Error(msg);
    }
};

$$.Signal.prototype._key = function(obj, slot) {
    if (!slot) {
        return "#" + $$.newId();
    }
    return obj.$id + slot;
};

/**
 * Tous les paramètres de toloframework se trouvent ici.
 */
$$.params = {
    // Graine utilisée pour empêcher la mise en cache des fichiers lus
    // par AJAX. En effet, cette valeur sera ajoutée à la fin de l'URL
    // pour éviter d'aller la chercher dans le cache.
    seed: 0,
    // Emplacement des fichiers de classes.
    root: "tfw",
    // Extension des fichiers de classes.
    // Certains proxies rejettent l'extension ".js" :
    // il peut alors être utile d'utiliser ".htm".
    jsExt: "js.htm",
    debug: 0,
    compression: true
};


/**
 * Les variables internes sont stockées ici.
 * Il ne faut surtout pas les modifier depuis l'extérieur.
 */
$$._ = {
    // Identifiant unique pour les objets.
    id: 0,

    // Liste des classes téléchargées.
    classes: {},
    // Liste des codes dources pour les classes téléchargées.
    classesSrc: {},

    // Liste les classes qui sont des singletons.
    // La clef est le nom complet de la classe et la valeur est
    // soit une chaîne vide pour indiquer que la classe est un
    // singleton non instancié, soit l'objet singleton lui-même.
    singletons: {},

    // Liste des CSS téléchargés.
    styles: {},

    // Liste des variables statiques de chaque classe.
    statics: {},

    // Indentation pour la trace.
    traceIndent: "",

    /**
     * Voir http://blog.stchur.com/2007/03/15/mouseenter-and-mouseleave-events-for-firefox-and-other-non-ie-browsers/
     */
    mouseEnter: function(f) {
        return function(e) {
            var child = e.relatedTarget;
            if (this === child || $$.isChildElement(this, child)) {
                return;
            }
            f.call(this, e);
        };
    },

    handleEvent: function(evt) {
        var handlers, i;
        evt = evt || window.event;
        if (this.$events) {
            if (!evt.stopPropagation) {
                // IE.
                evt.stopPropagation = function() {
                    window.event.cancelBubble = true;
                };
            }
            if (!evt.preventDefault) {
                // IE.
                evt.preventDefault = function() {
                    window.event.returnValue = false;
                };
            }
            handlers = this.$events[evt.type];
            for (i in handlers) {
                this.$$handleEvent = handlers[i];
                this.$$handleEvent(evt);
            }
        }
    },

    /**
     * Constructeur commun à tous les objets.
     * Pour créer un nouvel objet, on lui passe un dictionnaire
     * d'attributs. Les noms finaux de ces attributs seront préfixés
     * par un underscore.
     *
     * @param obj Objet à construire.
     * @param attribs Dictionnaire des attributs par défaut.
     */
    init: function (obj, attribs) {
        var k;
        if (typeof attribs == "object") {
            for (k in attribs) {
                if (k == null) continue;
                obj["_" + k] = attribs[k];
            }
        }
        else {
            obj["_init"] = attribs;
        }
    }
};


/**
 * Certaines classes peuvent avoir besoin de fichier annexes
 * (images, fontes, css, ...). La convention est de les stoquer
 * dans un répertoire portant le nom du package de la classe.
 * Par exemple, la classe "sys.widget.Widget" utilise des fichiers
 * provenant du sous-répertoire "sys.widget/".
 * Pour connaître l'URL du fichier dont on a besoin, il suffit de
 * faire appel à cette méthode.
 *
 * Pour simplifier les appels, tous les objets ont une méthode $url().
 * @param filename Fichier resource dont on veut l'URL.
 * @param classname Nom de la classe.
 */
$$.url = function(filename, classname) {
    var prefix = "", items;
    if (classname) {
        items = classname.split('.');
        items.pop();
        prefix = items.join('.') + "/";
    }
    return $$.params.root + "/src/" + prefix + filename;
};


/**
 * Lit un fichier au format JSON stoqué dans le répertoire "pub".
 *
 * @param filename Nom du fichier à accéder.
 * @param obj Objet à notifier quand le fichier est téléchargé.
 * @param slotSuccess Méthode à appeler en cas de succés.
 *                    Elle doit accepter deux arguments :
 *                    la donnée téléchargée et le nom du fichier.
 * @param slotError Méthode à appeler en cas d'échec.
 *                  Elle doit accepter deux arguments :
 *                  le message d'erreur et le nom du fichier.
 */
$$.getData = function(filename, obj, slotSuccess, slotError) {
    return $$.loadJSON($$.params.root + "/pub/" + filename);
};

$$.loadJSON = function(url, obj, slotSuccess, slotError) {
    if (!url) {
        throw new Error("[$$.loadJSON(url, obj, success, error)] Missing url!");
    }
    if (!obj) {
        throw new Error("[$$.loadJSON(url, obj, success, error)] Missing obj!");
    }

    var local_filename = url,
    local_obj = obj,
    local_success = $$.slot(obj, slotSuccess),
    local_error = (slotError ? $$.slot(obj, slotError) : null);

    try {
        $$.ajax(
            {
                url: url,
                cache: false,
                dataType: "json",
                error: function(xhr, status, msg) {
                    if (local_error) {
                        local_error.call(local_obj, msg, local_filename);
                    } else {
                        alert("Fatal error in $$.loadJSON(" + local_filename + ", ...):\n"
                              + "url = " + url + "\n"
                              + msg);
                    }
                },
                success: function(data) {
                    // Si tout va bien, on appelle la callback.
                    try {
                        if (local_success) {
                            local_success.call(local_obj, data, local_filename);
                        }
                    } catch (e) {
                        throw new Error("[$$.loadJSON] Unexpected error in success function "
                              + local_obj.$classname + "." + local_success + "()\n" + e);
                    }
                }
            }
        );
    } catch (err) {
        throw new Error("[Error in $$.loadJSON] url = " + url + "\n" + err);
    }
};


$$.loadText = function(url, obj, slotSuccess, slotError) {
    if (!url) {
        throw new Error("[$$.loadText(url, obj, success, error)] Missing url!");
    }
    if (!obj) {
        throw new Error("[$$.loadText(url, obj, success, error)] Missing obj!");
    }

    var local_filename = url,
    local_obj = obj,
    local_success = $$.slot(obj, slotSuccess),
    local_error = (slotError ? $$.slot(obj, slotError) : null);

    try {
        $$.ajax(
            {
                url: url,
                cache: false,
                dataType: "text",
                error: function(xhr, status, msg) {
                    if (local_error) {
                        local_error.call(local_obj, msg, local_filename);
                    } else {
                        alert("Fatal error in $$.loadText(" + local_filename + ", ...):\n"
                              + "url = " + url + "\n"
                              + msg);
                    }
                },
                success: function(data) {
                    // Si tout va bien, on appelle la callback.
                    try {
                        if (local_success) {
                            local_success.call(local_obj, data, local_filename);
                        }
                    } catch (e) {
                        throw new Error("[$$.loadText] Unexpected error in success function "
                              + local_obj.$classname + "." + local_success + "()\n" + e);
                    }
                }
            }
        );
    } catch (err) {
        throw new Error("[Error in $$.loadText] url = " + url + "\n" + err);
    }
};


/**
 * Charge de façon asynchrone une feuille de style CSS.
 * Si elle a déjà été chargée, rien ne se passe.
 */
$$.loadCss = function(name, media, path) {
    var key, url, head, css;
    if (media === undefined) media = "all";
    if (path === undefined) path = $$.params.root + "/src/" + name;
    key = name + "." + media;
    if ($$._.styles[key] == null) {
        url = path + "?seed=" + $$.params.seed + Math.random();
        head = document.getElementsByTagName("head")[0];
        css = document.createElement('link');
        css.type = 'text/css';
        css.rel = 'stylesheet';
        css.href = url;
        css.media = media;
        head.appendChild(css);
        $$._.styles[key] = true;
    }
};

/**
 * Ajoute à l'objet original tous les attributs de l'objet overrider.
 * S'il y a des attributs en communs, les valeurs seront écrasées par
 * overrider.
 *
 * @param original Objet initial.
 * @param overrider Objet qui va surcharger l'original.
 * @param onlyNewValues Si true, on ajoute uniquement les clefs inexistantes.
 *                      Par défaut, il est à false.
 * @return Objet original étendu par overrider.
 */
$$.extend = function(original, overrider, onlyNewValues) {
    var k;
    if (overrider) {
        for (k in overrider) {
            if (k === undefined) continue;
            if (onlyNewValues && original[k] === undefined) continue;
            original[k] = overrider[k];
        }
    }
    return original;
};

/**
 * Copie un objet de type JSON, c'est-à-dire
 * qui ne contient pas de fonctions ni d'objets natifs.
 */
$$.clone = function(obj) {
    var r, k, i;
    if ($$.isArray(obj)) {
        r = [];
        for (i in obj) {
            r.push($$.clone(obj[i]));
        }
        return r;
    }
    if (typeof obj == "object") {
        r = {};
        for (k in obj) {
            r[k] = $$.clone(obj[k]);
        }
        return r;
    }
    return obj;
};

/**
 * Retourne un identifiant unique.
 */
$$.newId = function() {
    $$._.id++;
    if ($$._.id > 2000000000) {
        $$._.id = 0;
    }
    return $$._.id;
};


/**
 * Retourne un slot sur un objet donné.
 * Par exemple, si l'objet toto a une méthode toString(),
 * on peut l'appeler comme ceci :
 *   $$.slot(toto, "toString").call(toto)
 *
 * @param obj Objet sur lequel on veut appeler une méthode.
 * @param functionName Chaîne contenant le nom de la méthode à appeler.
 */
$$.slot = function(obj, functionName) {
    var cls, f;
    if (!obj.$classname) {
        $$.trace("============================================================");
        $$.trace("ERROR: [$$.slot] Not a Toloramework object!");
        $$.trace("obj=...",5);$$.trace(obj,5);
        $$.trace("functionName=...",5);$$.trace(functionName,5);
        $$.trace("------------------------------------------------------------");
        throw new Error("[$$.slot(" + functionName + ")] Not a Toloframework object!");
    }
    cls = $$._.classes[obj.$classname];
    if (!cls) {
        throw new Error("[$$.slot(" + functionName + ")] Class not defined: " + obj.$classname);
    }
    f = cls.prototype[functionName];
    if (!f) {
        throw new Error("[$$.slot()] Slot not found: " + obj.$classname + "." + functionName);
    }
    return f;
};


/**
 * Appel d'une méthode au bout d'un certain nombre de millisecondes.
 * Le premier argument peut être omis. Dans ce cas, il vaudra 1 milliseconde.
 *
 * @param delay Nombre de millisecondes avant exécution de la méthode.
 * @param obj Objet sur lequel on veut appeler une méthode.
 * @param slot Chaîne contenant le nom de la méthode à appeler.
 * @param data [Optionel] Argument à passer à la méthode.
 * @return Identifiant servant à annuler l'appel avec la fonction window.clearTimeout(id).
 */
$$.invokeLater = function(delay, obj, slot, data) {
    if (typeof delay == 'object') {
        data = slot;
        slot = obj;
        obj = delay;
        delay = 1;
    }
    var local_obj = obj,
    local_data = data,
    process = $$.slot(obj, slot);

    return window.setTimeout(
        function() {
            if (typeof local_obj == 'function') {
                try {
                    local_obj(slot);
                } catch (x) {
                    $$.trace("Exception in the following function:");
                    $$.trace(local_obj);
                    throw new Error("[$$.invokeLater]\n" + x);
                }
            } else {
                try {
                    process.call(local_obj, local_data);
                } catch (x) {
                    throw new Error("[$$.invokeLater] "
                          + local_obj.$classname + "." + slot + ":\n" + x);
                }
            }
        },
        delay );
};

$$.init = function(options) {
    $$.params = $$.extend($$.params, options, true);
};

if (String.prototype.trim === undefined) {
    $$._trimLeft = new RegExp("^\\s+");
    $$._trimRight = new RegExp("\\s+$");
    String.prototype.trim = function() {
        return this.toString()
            .replace( $$._trimLeft, "" )
            .replace( $$._trimRight, "" );
    };
}

if ( window.JSON && window.JSON.parse ) {
    $$.parseJSON = window.JSON.parse;
}
else {
    $$.parseJSON = function(json) {
        try {
            if ( typeof json !== "string" || !json ) {
                return null;
            }
            json = $$.trim(json);
            return (new Function("return " + json))();
        } catch (x) {
            throw new Error("Invalid JSON!\n" + x + "\n" + json);
        }
    };
}

/**
 * Cette fonction provient du site http://code.google.com/p/jquery-json/
 * ---------------------------------------------------------------------
 * Convertit un objet en chaîne de caractères au format JSON.
 */
$$.toJSON = function(o){
    var type = typeof(o),
    month, day, year, hours, minutes, seconds, milli,
    ret, i,
    pairs, k, name,
    val;

    if (o === null || type == "undefined") return "null";
    if (type == "number" || type == "boolean")  return o + "";
    if (type == "string") return $$.quoteString(o);

    if (type == 'object') {
        if (typeof o.toJSON == "function") return $$.toJSON( o.toJSON() );

        if (o.constructor === Date) {
            month = o.getUTCMonth() + 1;
            if (month < 10) month = '0' + month;

            day = o.getUTCDate();
            if (day < 10) day = '0' + day;

            year = o.getUTCFullYear();

            hours = o.getUTCHours();
            if (hours < 10) hours = '0' + hours;

            minutes = o.getUTCMinutes();
            if (minutes < 10) minutes = '0' + minutes;

            seconds = o.getUTCSeconds();
            if (seconds < 10) seconds = '0' + seconds;

            milli = o.getUTCMilliseconds();
            if (milli < 100) milli = '0' + milli;
            if (milli < 10) milli = '0' + milli;

            return '"' + year + '-' + month + '-' + day + 'T' +
                hours + ':' + minutes + ':' + seconds +
                '.' + milli + 'Z"';
        }

        if (o.constructor === Array) {
            ret = [];
            for (i = 0; i < o.length; i++) ret.push( $$.toJSON(o[i]) || "null" );

            return "[" + ret.join(",") + "]";
        }

        pairs = [];
        for (k in o) {
            type = typeof k;
            if (type == "number") {
                name = '"' + k + '"';
            }
            else if (type == "string") {
                name = $$.quoteString(k);
            }
            else {
                continue;  //skip non-string or number keys
            }
            if (typeof o[k] == "function") {
                continue;  //skip pairs where the value is a function.
            }
            val = $$.toJSON(o[k]);
            pairs.push(name + ":" + val);
        }
        return "{" + pairs.join(", ") + "}";
    }
    return "null";
};


/**
 * Cette fonction provient du site http://code.google.com/p/jquery-json/
 * ---------------------------------------------------------------------
 * Returns a string-repr of a string, escaping quotes intelligently.
 * Mostly a support function for toJSON.
 *
 * Examples:
 * >>> $$.quoteString("apple")
 * "apple"
 *
 * >>> $$.quoteString('"Where are we going?", she asked.')
 * "\"Where are we going?\", she asked."
 */
$$.quoteString = function(string)
{
    var _escapeable = /["\\\x00-\x1f\x7f-\x9f]/g,
    _meta = {
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    };
    if (string.match(_escapeable))
    {
        return '"' + string.replace(
            _escapeable, function (a)
            {
                var c = _meta[a];
                if (typeof c === 'string') return c;
                c = a.charCodeAt();
                return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
            }) + '"';
    }
    return '"' + string + '"';
};


$$.xhr = function() {
    var xhr=null;
    try {
        xhr = new XMLHttpRequest();
    }
    catch(e) {
        try { xhr = new ActiveXObject("Msxml2.XMLHTTP"); }
        catch (e2) {
            try { xhr = new ActiveXObject("Microsoft.XMLHTTP"); }
            catch (e) {
                throw new Error("Unable to create XMLHttpRequest needed for Ajax!");
            }
        }
    }
    return xhr;
};

$$.xhrResponse = function(response, dataType) {
    if (dataType == "xml") {
        return response.responseXML;
    }
    var text = response.responseText;
    if (dataType == "json") {
        return $$.parseJSON(text);
    }
    return text;
};

$$.ajax = function(options) {
    var xhr = $$.xhr(),
    params,
    key, val;

    options = $$.extend(
        {
            async: true,
            dataType: "text",
            type: "GET",
            data: null,
            cache: true,
            success: function(data) {
                $$.trace("[$$.ajax] Success!", 3);
                $$.trace(data, 4);
            },
            error: function(data) {
                $$.trace("[$$.ajax] Error!", 3);
                $$.trace(data, 4);
            }
        },
        options
    );
    // Astuce pour contrôler la mise en cache.
    if (options.url.indexOf("?") > -1) {
        options.url += "&seed=" + $$.params.seed + Math.random();
    }
    else {
        options.url += "?" + $$.params.seed + Math.random();
    }

    if (options.async) {
        xhr.onreadystatechange = function() {
            if(xhr.readyState == 4) {
                if(xhr.status == 200) {
                    options.success($$.xhrResponse(xhr, options.dataType), xhr.statusText, xhr);
                }
                else {
                    options.error(xhr, xhr.statusText);
                }
            }
        };
    }
    xhr.open(options.type, options.url, options.async);
    params = null;
    if (options.type == "POST" && options.data) {
        params = "";
        if (typeof options.data == "object") {
            for (key in options.data) {
                val = options.data[key];
                if (params.length > 0) {
                    params += "&";
                }
                params += key + "=" + encodeURIComponent(val);
            }
        }
        //xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
        xhr.setRequestHeader(
            "Content-type",
            "application/x-www-form-urlencoded");
        xhr.setRequestHeader("Content-length", params.length);
        xhr.setRequestHeader("Connection", "close");
    }
    try {
        xhr.send(params);
    }
    catch (e) {
        if (options.error) {
            options.error(e.message);
        }
        else {
            throw new Error("[$$.ajax] " + e.message + "\n" + options.url);
        }
    }
    if (!options.async) {
        return $$.xhrResponse(xhr, options.dataType);
    }
    return null;
};

$$.service = function(p_service, p_input, p_obj, p_slot) {
    var callback = null,
    obj, slot, f, arg;
    if (!p_obj) {
        throw new Error("[$$.service] Missing argument #3: object!");
    }
    if (!p_slot) {
        callback = p_obj;
    }
    obj = p_obj;
    slot = p_slot;
    f = slot ? $$.slot(obj, slot): null;
    arg = {
        s: p_service,
        i: $$.toJSON(p_input)
    };
    $$.ajax(
        {
            url: $$.params.root + "/svc.php", // "/server.php",
            data: arg,
            type: "POST",
            cache: false,
            dataType: "json",
            success: function(data) {
                // Si tout va bien, on appelle la callback.
                try {
                    if (callback) {
                        callback(data);
                    } else {
                        f.call(obj, data);
                    }
                } catch (e) {
                    throw new Error("[$$.service] Unexpected error in callback function "
                          + obj.$classname + "." + slot + "()\n" + e);
                }
            }
        }
    );
};


// Local storage
if (window["localStorage"]) {
    /**
     * Ce navigateur supporte le localStorage.
     */
    $$.localLoad = function(key, defVal) {
        var val = window.localStorage.getItem( key );
        if (val === null) {
            return defVal;
        }
        try {
            val = $$.parseJSON(val);
        }
        catch(e) {
            val = defVal;
        }
        return val;
    };
    $$.localSave = function(key, val) {
        window.localStorage.setItem(key, $$.toJSON(val));
    };
    $$.sessionLoad = function(key, defVal) {
        var val = window.sessionStorage.getItem( key );
        if (val === null) {
            return defVal;
        }
        return $$.parseJSON( val );
    };
    $$.sessionSave = function(key, val) {
        window.sessionStorage.setItem( key, $$.toJSON( val ) );
    };
} else {
    /**
     * Ce navigateur n supporte pas le localStorage,
     * alors nous allons l'émuler avec des cookies.
     */
    $$.localLoad = function(key) {
        var theCookie = "" + document.cookie,
        ind = theCookie.indexOf(key),
        ind1;
        if (ind == -1 || key == "") return null;
        ind1 = theCookie.indexOf(';', ind);
        if (ind1 == -1) ind1 = theCookie.length;
        return $$.parseJSON(decodeURIComponent(theCookie.substring(ind + key.length + 1, ind1)));
    };
    $$.localSave = function(key, val) {
        var nDays = 365,
        today = new Date(),
        expire = new Date();
        expire.setTime(today.getTime() + 3600000*24*nDays);
        document.cookie = key + "=" + encodeURIComponent($$.toJSON(val))
            + ";expires=" + expire.toGMTString();
    };
}


/**
 * Il peut-être utile d'activer les traces en cas de problème.
 * On peut donc trufer le code d'appels à cette fonction $$.trace()
 * et régler leur affichage au runtime à l'aide de la variable $$.params.debug.
 * Cette dernière est nue valeur numérique aui indique le niveau le plus élévé
 * de a trace à afficher. Ainsi, s'il vaut 2, l'appel suivant produira une trace :
 * $$.trace("Coucou", 2);
 * mais pas celui-ci :
 * $$.trace("Plus de détails", 3);
 */
$$.trace = function(msg, level) {
    if (!$$.params.debug) return;
    if (!level) level = 1;
    if ($$.params.debug >= level) {
        var begin = "";
        if (typeof msg === 'string') {
            begin = msg.substring(0, 4);
            if (begin == '<<< ') {
                if ($$._.traceIndent.length > 2) {
                    $$._.traceIndent = $$._.traceIndent.substring(0, $$._.traceIndent.length - 2);
                }
            }
        }
        console.log($$._.traceIndent, msg);
        if (begin == '>>> ') {
            $$._.traceIndent += "  ";
        }
    }
};

// Prévenir les erreurs sur les browsers qui ne supportent pas l'objet "console".
if (window.console === undefined) {
    window.console = {};
}
var consoleMethods = ["log", "info", "warn", "error"],
i;
for (i = 0 ; i < consoleMethods.length ; i++) {
    if (window.console[consoleMethods[i]] === undefined) {
        window.console[consoleMethods[i]] = function(){};
    }
}


/**
 * Retourne un dictionnaire contenant les arguments passés dans l'URL.
 * Ceci fonctionne pour des arguments du style "a=toto&b=titi".
 * Si le "=" est omis, la valeur est renvoyée dans le champ "" (chaîne vide) du dictionnaire.
 */
$$.urlArgs = function() {
    var f = {},
    t = location.search,
    i, x;
    if (t.length < 2) return f;
    t = t.substring(1).split('&');
    for (i=0; i<t.length; i++){
        x = t[i].split('=');
        if (x.length == 1) {
            f[""] = decodeURIComponent(x[0]);
        }
        else {
            f[x[0]] = decodeURIComponent(x[1]);
        }
    }
    return f;
};

$$.browser = function() {
    var s = navigator.userAgent,
    j, i = s.indexOf("MSIE");
    if (i > -1) {
        j = s.indexOf(".", i + 5);
        return ["msie", parseInt(s.substring(i + 4, j))];
    }
    i = s.indexOf("Firefox/");
    if (i > -1) {
        j = s.indexOf(".", i + 8);
        return ["firefox", parseInt(s.substring(i + 8, j))];
    }
    return [s, 0];
};

$$.isArray = function (x) {
    return (typeof x == 'object' && x instanceof Array);
};

$$.htmlentities = function(t) {
    var entities = {
        '"': '&quot;', // 34 22
        '&': '&amp;', // 38 26
        '\'': '&#39;', // 39 27
        '<': '&lt;', // 60 3C
        '>': '&gt;', // 62 3E
        '\^': '&circ;', // 94 5E
        '‘': '&lsquo;', // 145 91
        '’': '&rsquo;', // 146 92
        '“': '&ldquo;', // 147 93
        '”': '&rdquo;', // 148 94
        '•': '&bull;', // 149 95
        '–': '&ndash;', // 150 96
        '—': '&mdash;', // 151 97
        '˜': '&tilde;', // 152 98
        '™': '&trade;', // 153 99
        'š': '&scaron;', // 154 9A
        '›': '&rsaquo;', // 155 9B
        'œ': '&oelig;', // 156 9C
        '': '&#357;', // 157 9D
        'ž': '&#382;', // 158 9E
        'Ÿ': '&Yuml;', // 159 9F
        ' ': '&nbsp;', // 160 A0
        '¡': '&iexcl;', // 161 A1
        '¢': '&cent;', // 162 A2
        '£': '&pound;', // 163 A3
        ' ': '&curren;', // 164 A4
        '¥': '&yen;', // 165 A5
        '¦': '&brvbar;', // 166 A6
        '§': '&sect;', // 167 A7
        '¨': '&uml;', // 168 A8
        '©': '&copy;', // 169 A9
        'ª': '&ordf;', // 170 AA
        '«': '&laquo;', // 171 AB
        '¬': '&not;', // 172 AC
        '­': '&shy;', // 173 AD
        '®': '&reg;', // 174 AE
        '¯': '&macr;', // 175 AF
        '°': '&deg;', // 176 B0
        '±': '&plusmn;', // 177 B1
        '²': '&sup2;', // 178 B2
        '³': '&sup3;', // 179 B3
        '´': '&acute;', // 180 B4
        'µ': '&micro;', // 181 B5
        '¶': '&para', // 182 B6
        '·': '&middot;', // 183 B7
        '¸': '&cedil;', // 184 B8
        '¹': '&sup1;', // 185 B9
        'º': '&ordm;', // 186 BA
        '»': '&raquo;', // 187 BB
        '¼': '&frac14;', // 188 BC
        '½': '&frac12;', // 189 BD
        '¾': '&frac34;', // 190 BE
        '¿': '&iquest;', // 191 BF
        'À': '&Agrave;', // 192 C0
        'Á': '&Aacute;', // 193 C1
        'Â': '&Acirc;', // 194 C2
        'Ã': '&Atilde;', // 195 C3
        'Ä': '&Auml;', // 196 C4
        'Å': '&Aring;', // 197 C5
        'Æ': '&AElig;', // 198 C6
        'Ç': '&Ccedil;', // 199 C7
        'È': '&Egrave;', // 200 C8
        'É': '&Eacute;', // 201 C9
        'Ê': '&Ecirc;', // 202 CA
        'Ë': '&Euml;', // 203 CB
        'Ì': '&Igrave;', // 204 CC
        'Í': '&Iacute;', // 205 CD
        'Î': '&Icirc;', // 206 CE
        'Ï': '&Iuml;', // 207 CF
        'Ð': '&ETH;', // 208 D0
        'Ñ': '&Ntilde;', // 209 D1
        'Ò': '&Ograve;', // 210 D2
        'Ó': '&Oacute;', // 211 D3
        'Ô': '&Ocirc;', // 212 D4
        'Õ': '&Otilde;', // 213 D5
        'Ö': '&Ouml;', // 214 D6
        '×': '&times;', // 215 D7
        'Ø': '&Oslash;', // 216 D8
        'Ù': '&Ugrave;', // 217 D9
        'Ú': '&Uacute;', // 218 DA
        'Û': '&Ucirc;', // 219 DB
        'Ü': '&Uuml;', // 220 DC
        'Ý': '&Yacute;', // 221 DD
        'Þ': '&THORN;', // 222 DE
        'ß': '&szlig;', // 223 DF
        'à': '&agrave;', // 224 E0
        'á': '&aacute;', // 225 E1
        'â': '&acirc;', // 226 E2
        'ã': '&atilde;', // 227 E3
        'ä': '&auml;', // 228 E4
        'å': '&aring;', // 229 E5
        'æ': '&aelig;', // 230 E6
        'ç': '&ccedil;', // 231 E7
        'è': '&egrave;', // 232 E8
        'é': '&eacute;', // 233 E9
        'ê': '&ecirc;', // 234 EA
        'ë': '&euml;', // 235 EB
        'ì': '&igrave;', // 236 EC
        'í': '&iacute;', // 237 ED
        'î': '&icirc;', // 238 EE
        'ï': '&iuml;', // 239 EF
        'ð': '&eth;', // 240 F0
        'ñ': '&ntilde;', // 241 F1
        'ò': '&ograve;', // 242 F2
        'ó': '&oacute;', // 243 F3
        'ô': '&ocirc;', // 244 F4
        'õ': '&otilde;', // 245 F5
        'ö': '&ouml;', // 246 F6
        '÷': '&divide;', // 247 F7
        'ø': '&oslash;', // 248 F8
        'ù': '&ugrave;', // 249 F9
        'ú': '&uacute;', // 250 FA
        'û': '&ucirc;', // 251 FB
        'ü': '&uuml;', // 252 FC
        'ý': '&yacute;', // 253 FD
        'þ': '&thorn;', // 254 FE
        'ÿ': '&yuml;' // 255 FF
    },
    newText = "",
    idx, lastIdx = 0,
    r;
    for (idx = 0 ; idx < t.length ; idx++) {
        r = entities[t.charAt(idx)];
        if (r !== undefined) {
            newText += t.substr(lastIdx, idx) + r;
            lastIdx = idx + 1;
        }
    }
    newText += t.substr(lastIdx);
    return newText;
};

/**
 * Retourne la taille d'un dictionnaire.
 */
$$.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};


/**
 * Retourner la valeur numérique entière de x.
 * Si min et/ou max sont définis, ce sont des contraintes à appliquer à x.
 */
$$.intVal = function(x, min, max) {
    x = parseInt(x);
    if (isNaN(x)) return 0;
    if (min !== undefined && x < min) x = min;
    if (max !== undefined && x > max) x = max;
    return x;
};


/**
 * Retourner la valeur numérique flottante de x.
 * Si min et/ou max sont définis, ce sont des contraintes à appliquer à x.
 */
$$.floatVal = function(x, min, max) {
    x = parseFloat(x);
    if (isNaN(x)) return 0;
    if (min !== undefined && x < min) x = min;
    if (max !== undefined && x > max) x = max;
    return x;
};
