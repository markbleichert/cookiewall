(function(cw) {
    // stop from running again, if accidently included more than once.
    if (cw.hasInitialised) return;

    var util = {

        hasClass: function(element, selector) {
            var s = ' ';
            return (
                element.nodeType === 1 &&
                (s + element.className + s)
                    .replace(/[\n\t]/g, s)
                    .indexOf(s + selector + s) >= 0
            );
        },

        addClass: function(element, className) {
            element.className += ' ' + className;
        },

        removeClass: function(element, className) {
            element.classList.remove(className);
        },

        // only used for extending the initial options
        deepExtend: function(target, source) {
            for (var prop in source) {
                if (source.hasOwnProperty(prop)) {
                    if (
                        prop in target &&
                        this.isPlainObject(target[prop]) &&
                        this.isPlainObject(source[prop])
                    ) {
                        this.deepExtend(target[prop], source[prop]);
                    } else {
                        target[prop] = source[prop];
                    }
                }
            }
            return target;
        },

        getCookie: function(name) {
            var value = '; ' + document.cookie;
            var parts = value.split('; ' + name + '=');
            return parts.length < 2
                ? undefined
                : parts
                    .pop()
                    .split(';')
                    .shift();
        },

        setCookie: function(name, value, expiryDays, domain, path, secure) {
            var exdate = new Date();
            exdate.setDate(exdate.getDate() + (expiryDays || 365));

            var cookie = [
                name + '=' + value,
                'expires=' + exdate.toUTCString(),
                'path=' + (path || '/')
            ];

            if (domain) {
                cookie.push('domain=' + domain);
            }
            if (secure) {
                cookie.push('secure');
            }
            document.cookie = cookie.join(';');
        },

        isPlainObject: function(obj) {
            // The code "typeof obj === 'object' && obj !== null" allows Array objects
            return (
                typeof obj === 'object' && obj !== null && obj.constructor == Object
            );
        },

        interpolateString: function(str, callback) {
            var marker = /{{([a-z][a-z0-9\-_]*)}}/gi;
            return str.replace(marker, function(matches) {
                return callback(arguments[1]) || '';
            });
        },

        createElementFromString: function(str) {
            var element = document.createElement('div');
            element.innerHTML = str;

            // make sure there always is a parent element
            return element.children.length > 1 ? element : element.firstChild;
        }
    };

    cw.types = {
        INLINE: 'inline',
        POPUP: 'popup'
    };

    cw.status = {
        MINIMAL: '1',
        PERSONAL: '2',
        OPTIMAL: '3'
    };

    cw.Wall = (function() {

        var defaultOptions = {

            container: null,

            type: 'popup',

            cookie: {
                name: 'RABO_PSL',
                path: '/',
                domain: '',
                expiryDays: 365,
                secure: false
            },

            content: {
                popupTitleText:
                    'Wij gebruiken cookies',

                popupIntroText:
                    'Door cookies werkt de site goed en veilig. Ook kunnen we je beter informeren. Welk niveau van ' +
                    'cookies en verwerken van persoonsgegevens wil je dat wij gebruiken? Als je inlogt bewaren we de ' +
                    'cookie-keuze bij je klantprofiel.',
                threeStarLabel:
                    'Een werkende website. Cookies hiervoor plaatsen we altijd.',

                thwoStarLabel:
                    'Alleen een goed werkende, op jou aangepaste website met informatie over relevante producten en diensten.',

                oneStarLabel:
                'De beste gebruikerservaring inclusief video\'s, podcasts en informatie over relevante producten en ' +
                'diensten op de website.',

                saveButton: 'save',

                rabobankLink: 'http://www.rabobank.nl',

                infoCookies: 'Meer informatie over cookies'
            },

            elements: {
                messageLink:
                    '<p><a href="{{rabobankLink}}">{{infoCookies}}</a></p>',

                popupTitle:
                    '<h3>{{popupTitleText}}</h3>',
                popupText:
                    '<p>{{popupIntroText}}</p>',

                star:
                    '<svg height="25" width="23" class="star rating">' +
                    '   <polygon points="9.9, 1.1, 3.3, 21.78, 19.8, 8.58, 0, 8.58, 16.5, 21.78" style="fill-rule:nonzero;"/>' +
                    '</svg>',

                form:
                    '<form>' +
                    '   <div class="option-wrapper">' +
                    '       <input id="level_3" type="radio" class="btn-radio" name="choice" value="3" checked>' +
                    '       <label for="level_3" class="option">' +
                    '           <span class="stars">' +
                    '               {{star}}{{star}}{{star}}' +
                    '           </span>' +
                    '           <span class="message">{{threeStarLabel}}</span>' +
                    '       </label>' +
                    '   </div>' +
                    '   <div class="option-wrapper">' +
                    '       <input id="level_2" type="radio" class="btn-radio" name="choice" value="2">' +
                    '       <label for="level_2" class="option">' +
                    '           <span class="stars">' +
                    '               {{star}}{{star}}' +
                    '           </span>' +
                    '           <span class="message">{{thwoStarLabel}}</span>' +
                    '       </label>' +
                    '   </div>' +
                    '   <div class="option-wrapper">' +
                    '       <input id="level_1" type="radio" class="btn-radio" name="choice" value="1">' +
                    '       <label for="level_1" class="option">' +
                    '           <span class="stars">' +
                    '               {{star}}' +
                    '           </span>' +
                    '           <span class="message">{{oneStarLabel}}</span>' +
                    '       </label>' +
                    '   </div>' +
                    '   <a class="btn-save">Save</a>' +
                    '</form>'
            },

            window:
                '<div class="cw-window-overlay"><div class="cw-window">{{children}}</div></div>',

            layouts: {
                popup:
                    '{{popupTitle}}{{popupText}}{{form}}{{messageLink}}',
                inline:
                    '{{form}}',

            }
        };

        function CookieWall() {
            this.init.apply(this, arguments);
        }

        CookieWall.prototype.init = function(options) {

            // set options to default options
            util.deepExtend((this.options = {}), defaultOptions);

            // merge in user options
            if (util.isPlainObject(options)) {
                util.deepExtend(this.options, options);
            }

            var markup = getWallInnerMarkup.call(this);
            var cookieWall = this.options.window
                .replace('{{children}}', markup);

            if (this.options.type === cw.types.INLINE) {
                cookieWall = markup;
            }

            this.element = appendMarkup.call(this, cookieWall);

            this.open();
        };

        CookieWall.prototype.isOpen = function() {
            return (
                this.element &&
                this.element.style.display == ''
            );
        };

        CookieWall.prototype.close = function() {
            if (!this.element) return;

            if (this.isOpen()) {
                this.element.style.display = 'none';
                this.options.onWallClose.call(this);
            }

            return this;
        };

        CookieWall.prototype.open = function(callback) {
            if (!this.element) return;

            this.element.style.display = '';

            return this;
        };

        CookieWall.prototype.setStatus = function(status) {
            var c = this.options.cookie;

            // if `status` is valid
            if (Object.values(cw.status).indexOf(status) >= 0) {
                util.setCookie(
                    c.name,
                    status,
                    c.expiryDays,
                    c.domain,
                    c.path,
                    c.secure
                );

                this.options.onStatusChange.call(this, status);
            }
        };

        CookieWall.prototype.getStatus = function() {
            return util.getCookie(this.options.cookie.name);
        };

        CookieWall.prototype.hasAnswered = function(options) {
            return Object.values(cw.status).indexOf(this.getStatus()) >= 0;
        };

        CookieWall.prototype.animateUpdate = function() {
            util.addClass(this.element, 'loading');
            setTimeout(function() {
                util.removeClass(this.element, 'loading');
            }.bind(this), 1000);
        };

        function getWallInnerMarkup() {
            var interpolated = {};
            var opts = this.options;

            Object.keys(opts.elements).forEach(function(prop) {
                interpolated[prop] = util.interpolateString(
                    opts.elements[prop],
                    function(name) {
                            var str = opts.content[name] || opts.elements[name];
                            return name && typeof str == 'string' && str.length ? str : '';
                    }
                );
            });

            var layout = opts.layouts[opts.type];
            if (!layout) {
                layout = opts.layouts.popup;
            }

            return util.interpolateString(layout, function(match) {
                return interpolated[match];
            });
        }

        function appendMarkup(markup) {
            var opts = this.options;

            var cont =
                opts.container && opts.container.nodeType === 1
                    ? opts.container
                    : document.body;

            var el = util.createElementFromString(markup);

            // save ref to the function handle so we can unbind it later
            this.onButtonClick = handleButtonClick.bind(this);

            // find button and attach click handler
            var button = el.querySelector('a.btn-save');
            button.addEventListener('click', this.onButtonClick);


            if (!cont.firstChild) {
                cont.appendChild(el);
            } else {
                cont.insertBefore(el, cont.firstChild);
            }

            return el;
        }

        function getSelected() {
            return document.querySelector('input[name="choice"]:checked').value;
        }

        function handleButtonClick(event) {
            this.setStatus(getSelected());

            // remove only when display as popup
            if (this.options.type === cw.types.POPUP) {
                this.close();
            } else {
                this.animateUpdate();
            }
        }

        return CookieWall;
    })();

    cw.init = function(options, complete) {
        if (!complete) complete = function() {};

        var allowed = Object.values(cw.status);
        var answer = util.getCookie('RABO_PSL');
        var match = allowed.indexOf(answer) >= 0;

        // open always when type is 'inline'
        // open only when popup and no cookie set
        if (options.type === cw.types.INLINE ||
            options.type !== cw.types.INLINE && !match) {
            complete(new cw.Wall(options));
        }
    }

    // prevent this code from being run twice
    cw.hasInitialised = true;

    window.cookiewall = cw;

})(window.cookiewall || {});

































