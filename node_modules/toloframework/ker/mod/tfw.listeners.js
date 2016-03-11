/**
 * Gestion d'une liste de fonctions devant réagir à des événements.
 * @class
 */
var Listeners = function() {
    this._list = [];
};

/**
 * Ajouter un __listener__ à la liste.
 * @param listener{function} Fonction à appeler quand l'énément est déclenché.
 * @return false  si le __listener__  n'a pas été ajouté  (parce qu'il
 * existe déjà ou parce qu'il n'est pas une fonction).
 */
Listeners.prototype.add = function(listener, obj) {
    if (typeof listener !== 'function') return false;
    this.remove(listener);
    for (var i = 0 ; i < this._list.length ; i++) {
        if (listener === this._list[i]) return false;
    }
    this._list.push([listener, obj]);
    return true;
};

/**
 * Supprimer le __listener__ de la liste.
 * @param listener{function} Fonction à appeler quand l'énément est déclenché.
 * @return false si le __listener__  n'existe pas.
 */
Listeners.prototype.remove = function(listener, obj) {
    if (typeof listener !== 'function') return false;
    for (var i = 0 ; i < this._list.length ; i++) {
        var x = this._list[i];
        if (listener === x[0] && obj === x[1]) {
            this._list.splice(i, 1);            
            return true;
        }
    }
    return false;
};

/**
 * Supprimer tous les __listeners__ de la liste.
 */
Listeners.prototype.clear = function() {
    this._list = [];
};

/**
 * Emettre l'événement. Si un listener retourne ```false```, on n'appelle pas les listeners suivants.
 */
Listeners.prototype.fire = function(arg) {
    var i, listener, obj, x;
    for (i = 0 ; i < this._list.length ; i++) {
        x = this._list[i];
        listener = x[0];
        obj = x[1];
        if (false === listener.call(obj, arg)) return false;
    }    
    return true;
};


module.exports = Listeners;
