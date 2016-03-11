/**
 * @created 12/08/2014
 *
 */
window["TFW::wtag.Book"] = {
    superclass: "WTag",
    attributes: {
        animDuration: .4,
        anim: "slide",
        pages: {},
        data: null
    },
    classInit: function(vars) {
        var defAnim = function(keyframes) {
            return $$(
                "tfw.CssAnim",
                {keyframes: keyframes}
            );
        };
        vars.anims = {
            slide: {
                fromRight: defAnim(
                    {
                        from: {transform: "translateX(100%)"},
                        to: {transform: "translateX(0%)"}
                    }
                ),
                toRight: defAnim(
                    {
                        from: {transform: "translateX(0%)"},
                        to: {transform: "translateX(100%)"}
                    }
                ),
                fromLeft: defAnim(
                    {
                        from: {transform: "translateX(-100%)"},
                        to: {transform: "translateX(0%)"}
                    }
                ),
                toLeft: defAnim(
                    {
                        from: {transform: "translateX(0%)"},
                        to: {transform: "translateX(-100%)"}
                    }
                )
            }
        };
    },

    init: function() {
        this._currentPage = null;
        var page, id, elem;
        for (page in this._pages) {
            id = this._pages[page];
            elem = document.getElementById(id);
            this._pages[page] = elem;

        }
        this._anims = this.$statics.anims[this._anim];
        if (!this._anims) {
            this._anims = this.$statics.anims["slide"];
        }
        var that = this;
        var attachEvents = function(elem) {
            elem.addEventListener(
                "animationstart",
                function() {
                    $removeClass(elem, "hidden");
                    that._animationRunning = true;
                },
                false
            );
            elem.addEventListener(
                "animationend",
                function() {
                    if (elem._index != that._currentPage._index) {
                        $addClass(elem, "hidden");
                    }
                    that._animationRunning = false;
                    if (that._nextAnim) {
                        that.go(that._nextAnim);
                        delete that._nextAnim;
                    }
                },
                false
            );
        };
        var children = this._element.childNodes,
        i, item, name;
        for (i = 0 ; i < children.length ; i++) {
            item = children[i];
            item._index = i;
            if (i == 0) {
                this._currentPage = item;
            } else {
                $addClass(item, "hidden");
            }
            attachEvents(item);
        }
        $show(this._currentPage);

        this.registerSignal(
            "page",
            function(arg, signal, emitter) {
                return that.go(arg);
            }
        );
        var data = this._data;
        if (typeof data === 'string')  {
            this.bindData(data, "go");
        }
    },

    functions: {
        go: function(name) {
            if (this._animationRunning) {
                this._nextAnim = name;
                return;
            }
            var src = this._currentPage,
            dst = this._pages[name],
            anim;
            if (src === dst) return false;
            if (!dst) {
                // This  page does  not exist  in this  book: let  the
                // event be propagated up to its parents.
                return false;
            }
            /*
             if (src.$widget) {
             src.$widget.slot("hide");
             }
             if (dst.$widget) {
             dst.$widget.slot("show");
             }
             */
            anim = src._index < dst._index ? this._anims.toLeft : this._anims.toRight;
            anim.apply(src, {duration: this._animDuration});
            anim = src._index < dst._index ? this._anims.fromRight : this._anims.fromLeft;
            anim.apply(dst, {duration: this._animDuration});
            $show(dst);
            this._currentPage = dst;
        }
    }
};
