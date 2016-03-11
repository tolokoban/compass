/**
 * @created 15/05/2014
 * @extends wtag.IFireable
 * @class wtag.Input
 */
window["TFW::wtag.Input"] = {
    superclass: "wtag.IFireable",

    init: function() {
        var that = this;
        this._element.addEventListener(
            "keydown",
            function (evt) {
                if (evt.keyCode == 13) {
                    that.fireAll();
                    evt.preventDefault();
                }
            }
        );
        this._element.addEventListener(
            "keyup",
            function (evt) {
                that.val(that.val());
            }
        );
        // When focused, input's content is selected.
        this._element.addEventListener(
            "focus",
            function (evt) {
                that.select();
            }
        );
        if (this._data) {
            this.bindData(this._data);
        }
    },
    functions: {
        /**
         * Get/Set input text.
         * @memberof wtag.Input
         */
        val: function(v) {
            if (typeof v === 'undefined') {
                return this._element.value;
            }
            this._element.value = v;
            var data = this._data;
            if (data) {
                this.data(data, v);
            }
            return this;
        },

        /**
         * @description
         *
         * @param name, value
         * @memberof wtag.Input
         */
        onDataChanged: function(name, value) {
            this._element.value = value;
        },

        /**
         * Set focus to the input text box.
         * @memberof wtag.Input
         */
        focus: function() {
            $focus(this);
            return this;
        },

        /**
         * Select all the text in this input.
         * @memberof wtag.Input
         */
        select: function() {
            this._element.select();
            return this;
        },

        /**
         * Save content to localstorage.
         * @param text: [optional] text to put in the input before saving it.
         * @memberof wtag.Input
         */
        save: function(text) {
            this.val(text);
            $$.localSave("wtag.Input:" + this._id, this.val());
            return this;
        },

        /**
         * Load content from localstorage.
         * @memberof wtag.Input
         */
        load: function() {
            this.val(
                $$.localLoad("wtag.Input:" + this._id, "")
            );
            return this;
        }
    }
};
