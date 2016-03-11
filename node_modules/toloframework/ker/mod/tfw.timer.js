require("tfw.promise");

exports.later = function(delay) {
    if (typeof delay === 'undefined') delay = 1;
    return new Promise(
        function(resolve, reject) {
            window.setTimeout(resolve, delay);
        }
    );
};


/**
 * @param action Promise to start after delay.
 * @param delay Milliseconds.
 */
var ActionPromise = function(action, delay) {
    if (typeof delay !== 'number') delay = 300;
    if (delay < 0) delay = 0;
    var that = this;
    this.enabled = true;
    this.waiting = false;
    this.action = action;
    this.delay = delay;
    this.timer = 0;
};

/**
 * @return void
 */
ActionPromise.prototype.dbg = function(msg) {
    console.log((this.enabled ? 'E' : 'e') + (this.waiting ? 'W' : 'w') + ": " + msg);
};

/**
 * @return void
 */
ActionPromise.prototype.fire = function() {
    var that = this;
    if (this.timer) {
        window.clearTimeout(this.timer);
    }
    if (this.enabled) {
        this.waiting = false;
        var f = function() {
            that.enabled = true;
            if (that.waiting) {
                that.fire();
            }
        };
        this.timer = window.setTimeout(
            function() {
                that.timer = 0;
                that.enabled = false;
                that.action().then(f, f);
            },
            that.delay
        );
    } else {
        this.waiting = true;
    }
};


/**
 * @param action Function to start after delay.
 * @param delay Milliseconds.
 */
var Action = function(action, delay) {
    if (typeof delay !== 'number') delay = 300;
    if (delay < 0) delay = 100;
    var that = this;
    this.action = action;
    this.delay = delay;
    this.timer = 0;
};

/**
 * @return void
 */
Action.prototype.fire = function() {
    var that = this;
    if (this.timer) {
        window.clearTimeout(this.timer);
    }
    this.timer = window.setTimeout(
        function() {
            that.timer = 0;
            that.enabled = false;
            that.action();
        },
        that.delay
    );
};

var LongAction = function() {
  this._timer = null;
  this._action = null;
};

/**
 * Fire an action. This action will be executed only if there is nothing else running.
 * @return void
 */
LongAction.prototype.fire = function(action, duration) {
  var that = this;
  if (!this._timer) {
    action();
    this._timer = window.setTimeout(
      function() {
        that._timer = null;
      },
      duration
    );
  }
  return this;
};



/**
 * @param action A function returning a Promise.
 */
exports.laterPromise = function(action, delay) {
    return new ActionPromise(
        function() {
            return new Promise(action);
        },
        delay
    );
};

/**
 * @param action A function to execute.
 */
exports.laterAction = function(action, delay) {
    return new Action(action, delay);
};


exports.longAction = function() {
  return new LongAction();
}
