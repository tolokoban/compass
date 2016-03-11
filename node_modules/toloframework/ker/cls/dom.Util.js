/**
 * @created 19/09/2014
 * @class dom.Util
 */
window["TFW::dom.Util"] = {
    singleton: true,
    classInit: function(vars) {
        vars.globalSlots = {};
        if (!window.WTag) {
            window.WTag = {};
        }

        /**
         * Replace a DOM element by another DOM element.
         * @param oldElem DOM element to remove.
         * @param newElem DOM element to add.
         * @global
         */
        $replace = function(oldElem, newElem) {
            oldElem = $(oldElem);
            if (typeof newElem === 'string') {
                newElem = document.createTextNode(newElem);
            }
            var parent = oldElem.parentNode;
            parent.replaceChild(newElem, oldElem);
            return newElem;
        };

        /**
         * Create a DOM element.
         * @param name Name of the element to be created.
         * @param attribs [optional] Object of all attributes of the element.
         * @global
         */
        $tag = function(name, attribs) {
            if (attribs === undefined) attribs = {};
            if (name === undefined) name = "div";
            var e = document.createElement(name),
            key, val, i;
            for (key in attribs) {
                val = attribs[key];
                e.setAttribute(key, val);
            }
            for (i = 2 ; i < arguments.length ; i++) {
                $addClass(e, arguments[i]);
            }

            return e;
        };

        /**
         * Créer un élément DIV.
         * @param {object} attribs Attributes to add to the created element.
         * @global
         */
        $div = function(attribs) {
            return $tag("div", attribs);
        };

        /**
         * Add a child to an element.
         * @param {element} root DOM element into which you want to add `child`.
         * @param {element} child DOM element to add into `root`.
         * @global
         */
        $add = function(root, child) {
            $(root).appendChild($(child));
        };

        /**
         * Déplacer le contenu d'un élément vers un autre.
         */
        $moveContent = function(src, dst) {
            var i, child, children = [];
            if (!src) return null;
            src = $(src);
            dst = $(dst);
            for (i = 0 ; i < src.childNodes.length ; i++) {
                children.push(src.childNodes[i]);
            }
            children.forEach(
                function(child) {
                    src.removeChild(child);
                    dst.appendChild(child);
                }
            );
            return dst;
        };

        /**
         * Ajouter des slots pour les événements mouse/touch.
         */
        $events = function(element, slots) {
            element = $(element);
            var onTouchstart = function(evt) {
                if (slots.touchstart) {
                    slots.touchstart({target: element});
                }
            },
            onTouchend = function(evt) {
                evt.preventDefault();
                if (slots.touchend) {
                    slots.touchend({target: element});
                }
                if (slots.tap) {
                    slots.tap({target: element});
                }
            };
            slots._type = null;
            element.addEventListener(
                "touchstart",
                function(evt) {
                    if (slots._type) return;
                    slots._type = "T";
                    onTouchstart(evt);
                }
            );
            element.addEventListener(
                "mousedown",
                function(evt) {
                    if (slots._type) return;
                    slots._type = "M";
                    onTouchstart(evt);
                }
            );
            element.addEventListener(
                "touchend",
                function(evt) {
                    if (slots._type == "T") {
                        onTouchend(evt);
                    }
                    delete slots._type;
                }
            );
            element.addEventListener(
                "mouseup",
                function(evt) {
                    if (slots._type == "M") {
                        onTouchend(evt);
                    }
                    delete slots._type;
                }
            );
            return element;
        };

        /**
         * Si une classe existe, l'enlever, sinon l'ajouter.
         * On peut passer un nombre variable de noms de classes en arguments.
         */
        $toggleClass = function(e) {
            var i, classname;
            e = $(e);
            for (i = 0 ; i < arguments.length ; i++) {
                classname = arguments[i];
                if ($hasClass(classname)) {
                    $removeClass(classname);
                } else {
                    $addClass(classname);
                }
            }
        };

        /**
         * Détermine si l'élément sous-jacent possède la classe CSS passée en argument.
         */
        $hasClass = function(e, cls) {
            var cn, rx;
            if (!e) return false;
            e = $(e);
            cn = e.className;
            if (!cn) return false;
            rx = new RegExp('(\\s|^)' + cls + '(\\s|$)');
            if (!cn.match(rx)) return false;
            return true;
        };

        /**
         * Chaque élément du DOM peut possèder une liste de classes CSS.
         * Avec cette méthode, on peut en ajouter une.
         */
        $addClass = function(e) {
            var i, cls;
            if (!e) return;
            e = $(e);
            for (i = 1 ; i < arguments.length ; i++) {
                cls = arguments[i];
                if (!e.className) {
                    e.className = cls;
                } else {
                    if (!$hasClass(e, cls)) e.className += " "+cls;
                }
            }
        };

        /**
         * Retire la classe passée en argument de la liste des classes CSS de l'élément sous-jacent.
         */
        $removeClass = function(e) {
            var reg, i, cls;
            if (!e) return this;
            e = $(e);
            for (i = 1 ; i < arguments.length ; i++) {
                cls = arguments[i];
                if ($hasClass(e, cls)) {
                    reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
                    e.className = e.className.replace(reg,' ');
                }
            }
        };

        $show = function(e) {
            $removeClass(e, "dom-util-hidden", "-A", "-B");
        };

        $hide = function(e) {
            $addClass(e, "dom-util-hidden", "-A", "-B");
        };

        $clear = function(e) {
            var child;
            e = $(e);
            while (e.childNodes.length > 0) {
                child = e.childNodes[0];
                if (child.$widget) {
                    child.$widget.destroy();
                }
                e.removeChild(child);
            }
        };

        $focus = function(e) {
            e = $(e);
            setTimeout(
                function() {
                    if (typeof e.focus === 'function') {
                        e.focus();
                    }
                },
                100
            );
        };

        $css = function(e, attribs) {
            e = $(e);
            var key, val;
            for (key in attribs) {
                val = attribs[key];
                e.style[key] = val;
            }
        };

        /**
         * Effectuer un document.querySelector().
         */
        $ = function(selector) {
            var elem = typeof selector === 'string' ? document.querySelector(selector) : selector;
            if (!elem) {
                throw new Error("Bad selector: \"" + selector + "\"!");
            }
            if (typeof elem === 'object') {
                if (!elem.nodeName && elem._element) {
                    // This is a widget.
                    return elem._element;
                }
            }
            return elem;
        };
    },

    functions: {
	/**
         * @description
         * Clone an element of the DOM.
         * 
         * @param elem DOM element to clone or ID of such an element.
         * @param id ID to give to the new element.
         * All its children that own an ID will get it prefixed with the ID of the new element.
         * @memberof dom.Util
         */
        clone: function(elem, id) {
            if (typeof elem === 'string') {
                elem = document.getElementById(elem);
                if (!elem) return null;
            }
            var copy = elem.cloneNode(true);
            if (typeof id === 'string') {
                var i, div, divs, prefix = id + ".";
                divs = copy.querySelectorAll("[id]");
                for (i = 0 ; i < divs.length ; i++) {
                    div = divs[i];
                    div.setAttribute("id", prefix + div.getAttribute("id"));
                }
                delete copy.style.display;
                copy.removeAttribute("style");
                copy.setAttribute("id", id);
            }
            return copy;
        }
    }
};
