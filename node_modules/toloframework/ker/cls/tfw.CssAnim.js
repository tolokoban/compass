/**
 * @created 14/01/2014
 *
 * Multi-browser CSS animation creator.
 */
window["TFW::tfw.CssAnim"] = {
    attributes: {
        keyframes: {
            from: {transform: "translateX(0%)"},
            to: {transform: "translateX(100%)"}
        }
    },
    /**
     * Look for css prefixes.
     */
    classInit: function(variables) {
        var animation = false,
        animationstring = 'animation',
        keyframeprefix = '',
        domPrefixes = ["Webkit", "Moz", "O", "ms", "Khtml"],
        pfx = '',
        elm = document.querySelector("body");

        if( elm.style.animationName !== undefined ) { animation = true; }
        if( animation === false ) {
            for( var i = 0; i < domPrefixes.length; i++ ) {
                if( elm.style[ domPrefixes[i] + 'AnimationName' ] !== undefined ) {
                    pfx = domPrefixes[ i ];
                    animationstring = pfx + 'Animation';
                    keyframeprefix = '-' + pfx.toLowerCase() + '-';
                    animation = true;
                    break;
                }
            }
        }
        variables.keyframesPrefix = keyframeprefix;
        variables.animationString = animationstring;
        variables.aliases = {
            transform: keyframeprefix + "transform"
        };
        variables.count = 1;
    },

    init: function() {
        var $static = this.$statics;
        this._id = "-tfw-CssAnim-" + ($static.count++);
        var kfp = $static.keyframesPrefix,
        keyframes = '@' + kfp + 'keyframes ' + this._id + '{';
        for (var k in this._keyframes) {
            keyframes += k + "{";
            var first = true,
            attribs = this._keyframes[k];
            for (var attName in attribs) {
                if (first) {
                    first = false;
                } else {
                    keyframes += ";";
                }
                var attValue = attribs[attName];
                if ($static.aliases[attName]) {
                    attName = $static.aliases[attName];
                }
                keyframes += attName + ":" + attValue;
            }
            keyframes += "}";
        }
        keyframes += "}\n";
        if( document.styleSheets && document.styleSheets.length ) {
            document.styleSheets[0].insertRule(keyframes, 0);
        } else {
            var s = document.createElement('style');
            s.innerHTML = keyframes;
            document.getElementsByTagName('head')[0].appendChild(s);
        }
    },

    functions: {
        /**
         * Start animation on element.
         * The  animation  CSS  property  is a  shorthand  property  for :
         *    animation-name,
         *    animation-duration,
         *    animation-timing-function,
         *    animation-delay,
         *    animation-iteration-count,
         *    animation-direction,
         *    animation-fill-mode.
         */
        apply: function(element, options) {
            var defaultOptions = {
                duration: .4,
                timing: "ease",
                delay: 0,
                iteration: 1,
                direction: "normal",
                fill: "both"
            },
            style,
            animStr = this.$statics.animationString;
            if (options === undefined) {
                options = defaultOptions;
            } else {
                for (var k in defaultOptions) {
                    if (options[k] === undefined) {
                        options[k] = defaultOptions[k];
                    }
                }
            }
            style =
                this._id + " "
                + options.duration + "s "
                + options.timing + " "
                + options.delay + "s "
                + options.iteration + " "
                + options.direction + " "
                + options.fill;
            element.style[animStr] = "";
            setTimeout(
                function() {
                    element.style[animStr] = style;
                },
                1
            );
            return this;
        },

        /**
         * Annuler l'animation en cours.
         */
        clear: function(element) {
            element.style[this.$statics.animationString] = "";
        }
    }
}
