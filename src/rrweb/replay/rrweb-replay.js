var rrwebReplay = (function (exports) {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    var NodeType;
    (function (NodeType) {
        NodeType[NodeType["Document"] = 0] = "Document";
        NodeType[NodeType["DocumentType"] = 1] = "DocumentType";
        NodeType[NodeType["Element"] = 2] = "Element";
        NodeType[NodeType["Text"] = 3] = "Text";
        NodeType[NodeType["CDATA"] = 4] = "CDATA";
        NodeType[NodeType["Comment"] = 5] = "Comment";
    })(NodeType || (NodeType = {}));

    var commentre = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g;
    function parse(css, options) {
        if (options === void 0) { options = {}; }
        var lineno = 1;
        var column = 1;
        function updatePosition(str) {
            var lines = str.match(/\n/g);
            if (lines) {
                lineno += lines.length;
            }
            var i = str.lastIndexOf('\n');
            column = i === -1 ? column + str.length : str.length - i;
        }
        function position() {
            var start = { line: lineno, column: column };
            return function (node) {
                node.position = new Position(start);
                whitespace();
                return node;
            };
        }
        var Position = (function () {
            function Position(start) {
                this.start = start;
                this.end = { line: lineno, column: column };
                this.source = options.source;
            }
            return Position;
        }());
        Position.prototype.content = css;
        var errorsList = [];
        function error(msg) {
            var err = new Error(options.source + ':' + lineno + ':' + column + ': ' + msg);
            err.reason = msg;
            err.filename = options.source;
            err.line = lineno;
            err.column = column;
            err.source = css;
            if (options.silent) {
                errorsList.push(err);
            }
            else {
                throw err;
            }
        }
        function stylesheet() {
            var rulesList = rules();
            return {
                type: 'stylesheet',
                stylesheet: {
                    source: options.source,
                    rules: rulesList,
                    parsingErrors: errorsList
                }
            };
        }
        function open() {
            return match(/^{\s*/);
        }
        function close() {
            return match(/^}/);
        }
        function rules() {
            var node;
            var rules = [];
            whitespace();
            comments(rules);
            while (css.length && css.charAt(0) !== '}' && (node = atrule() || rule())) {
                if (node !== false) {
                    rules.push(node);
                    comments(rules);
                }
            }
            return rules;
        }
        function match(re) {
            var m = re.exec(css);
            if (!m) {
                return;
            }
            var str = m[0];
            updatePosition(str);
            css = css.slice(str.length);
            return m;
        }
        function whitespace() {
            match(/^\s*/);
        }
        function comments(rules) {
            if (rules === void 0) { rules = []; }
            var c;
            while ((c = comment())) {
                if (c !== false) {
                    rules.push(c);
                }
                c = comment();
            }
            return rules;
        }
        function comment() {
            var pos = position();
            if ('/' !== css.charAt(0) || '*' !== css.charAt(1)) {
                return;
            }
            var i = 2;
            while ('' !== css.charAt(i) &&
                ('*' !== css.charAt(i) || '/' !== css.charAt(i + 1))) {
                ++i;
            }
            i += 2;
            if ('' === css.charAt(i - 1)) {
                return error('End of comment missing');
            }
            var str = css.slice(2, i - 2);
            column += 2;
            updatePosition(str);
            css = css.slice(i);
            column += 2;
            return pos({
                type: 'comment',
                comment: str
            });
        }
        function selector() {
            var m = match(/^([^{]+)/);
            if (!m) {
                return;
            }
            return trim(m[0])
                .replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\/+/g, '')
                .replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g, function (m) {
                return m.replace(/,/g, '\u200C');
            })
                .split(/\s*(?![^(]*\)),\s*/)
                .map(function (s) {
                return s.replace(/\u200C/g, ',');
            });
        }
        function declaration() {
            var pos = position();
            var propMatch = match(/^(\*?[-#\/\*\\\w]+(\[[0-9a-z_-]+\])?)\s*/);
            if (!propMatch) {
                return;
            }
            var prop = trim(propMatch[0]);
            if (!match(/^:\s*/)) {
                return error("property missing ':'");
            }
            var val = match(/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+)/);
            var ret = pos({
                type: 'declaration',
                property: prop.replace(commentre, ''),
                value: val ? trim(val[0]).replace(commentre, '') : ''
            });
            match(/^[;\s]*/);
            return ret;
        }
        function declarations() {
            var decls = [];
            if (!open()) {
                return error("missing '{'");
            }
            comments(decls);
            var decl;
            while ((decl = declaration())) {
                if (decl !== false) {
                    decls.push(decl);
                    comments(decls);
                }
                decl = declaration();
            }
            if (!close()) {
                return error("missing '}'");
            }
            return decls;
        }
        function keyframe() {
            var m;
            var vals = [];
            var pos = position();
            while ((m = match(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/))) {
                vals.push(m[1]);
                match(/^,\s*/);
            }
            if (!vals.length) {
                return;
            }
            return pos({
                type: 'keyframe',
                values: vals,
                declarations: declarations()
            });
        }
        function atkeyframes() {
            var pos = position();
            var m = match(/^@([-\w]+)?keyframes\s*/);
            if (!m) {
                return;
            }
            var vendor = m[1];
            m = match(/^([-\w]+)\s*/);
            if (!m) {
                return error('@keyframes missing name');
            }
            var name = m[1];
            if (!open()) {
                return error("@keyframes missing '{'");
            }
            var frame;
            var frames = comments();
            while ((frame = keyframe())) {
                frames.push(frame);
                frames = frames.concat(comments());
            }
            if (!close()) {
                return error("@keyframes missing '}'");
            }
            return pos({
                type: 'keyframes',
                name: name,
                vendor: vendor,
                keyframes: frames
            });
        }
        function atsupports() {
            var pos = position();
            var m = match(/^@supports *([^{]+)/);
            if (!m) {
                return;
            }
            var supports = trim(m[1]);
            if (!open()) {
                return error("@supports missing '{'");
            }
            var style = comments().concat(rules());
            if (!close()) {
                return error("@supports missing '}'");
            }
            return pos({
                type: 'supports',
                supports: supports,
                rules: style
            });
        }
        function athost() {
            var pos = position();
            var m = match(/^@host\s*/);
            if (!m) {
                return;
            }
            if (!open()) {
                return error("@host missing '{'");
            }
            var style = comments().concat(rules());
            if (!close()) {
                return error("@host missing '}'");
            }
            return pos({
                type: 'host',
                rules: style
            });
        }
        function atmedia() {
            var pos = position();
            var m = match(/^@media *([^{]+)/);
            if (!m) {
                return;
            }
            var media = trim(m[1]);
            if (!open()) {
                return error("@media missing '{'");
            }
            var style = comments().concat(rules());
            if (!close()) {
                return error("@media missing '}'");
            }
            return pos({
                type: 'media',
                media: media,
                rules: style
            });
        }
        function atcustommedia() {
            var pos = position();
            var m = match(/^@custom-media\s+(--[^\s]+)\s*([^{;]+);/);
            if (!m) {
                return;
            }
            return pos({
                type: 'custom-media',
                name: trim(m[1]),
                media: trim(m[2])
            });
        }
        function atpage() {
            var pos = position();
            var m = match(/^@page */);
            if (!m) {
                return;
            }
            var sel = selector() || [];
            if (!open()) {
                return error("@page missing '{'");
            }
            var decls = comments();
            var decl;
            while ((decl = declaration())) {
                decls.push(decl);
                decls = decls.concat(comments());
            }
            if (!close()) {
                return error("@page missing '}'");
            }
            return pos({
                type: 'page',
                selectors: sel,
                declarations: decls
            });
        }
        function atdocument() {
            var pos = position();
            var m = match(/^@([-\w]+)?document *([^{]+)/);
            if (!m) {
                return;
            }
            var vendor = trim(m[1]);
            var doc = trim(m[2]);
            if (!open()) {
                return error("@document missing '{'");
            }
            var style = comments().concat(rules());
            if (!close()) {
                return error("@document missing '}'");
            }
            return pos({
                type: 'document',
                document: doc,
                vendor: vendor,
                rules: style
            });
        }
        function atfontface() {
            var pos = position();
            var m = match(/^@font-face\s*/);
            if (!m) {
                return;
            }
            if (!open()) {
                return error("@font-face missing '{'");
            }
            var decls = comments();
            var decl;
            while ((decl = declaration())) {
                decls.push(decl);
                decls = decls.concat(comments());
            }
            if (!close()) {
                return error("@font-face missing '}'");
            }
            return pos({
                type: 'font-face',
                declarations: decls
            });
        }
        var atimport = _compileAtrule('import');
        var atcharset = _compileAtrule('charset');
        var atnamespace = _compileAtrule('namespace');
        function _compileAtrule(name) {
            var re = new RegExp('^@' + name + '\\s*([^;]+);');
            return function () {
                var pos = position();
                var m = match(re);
                if (!m) {
                    return;
                }
                var ret = { type: name };
                ret[name] = m[1].trim();
                return pos(ret);
            };
        }
        function atrule() {
            if (css[0] !== '@') {
                return;
            }
            return (atkeyframes() ||
                atmedia() ||
                atcustommedia() ||
                atsupports() ||
                atimport() ||
                atcharset() ||
                atnamespace() ||
                atdocument() ||
                atpage() ||
                athost() ||
                atfontface());
        }
        function rule() {
            var pos = position();
            var sel = selector();
            if (!sel) {
                return error('selector missing');
            }
            comments();
            return pos({
                type: 'rule',
                selectors: sel,
                declarations: declarations()
            });
        }
        return addParent(stylesheet());
    }
    function trim(str) {
        return str ? str.replace(/^\s+|\s+$/g, '') : '';
    }
    function addParent(obj, parent) {
        var isNode = obj && typeof obj.type === 'string';
        var childParent = isNode ? obj : parent;
        for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
            var k = _a[_i];
            var value = obj[k];
            if (Array.isArray(value)) {
                value.forEach(function (v) {
                    addParent(v, childParent);
                });
            }
            else if (value && typeof value === 'object') {
                addParent(value, childParent);
            }
        }
        if (isNode) {
            Object.defineProperty(obj, 'parent', {
                configurable: true,
                writable: true,
                enumerable: false,
                value: parent || null
            });
        }
        return obj;
    }

    var tagMap = {
        script: 'noscript',
        altglyph: 'altGlyph',
        altglyphdef: 'altGlyphDef',
        altglyphitem: 'altGlyphItem',
        animatecolor: 'animateColor',
        animatemotion: 'animateMotion',
        animatetransform: 'animateTransform',
        clippath: 'clipPath',
        feblend: 'feBlend',
        fecolormatrix: 'feColorMatrix',
        fecomponenttransfer: 'feComponentTransfer',
        fecomposite: 'feComposite',
        feconvolvematrix: 'feConvolveMatrix',
        fediffuselighting: 'feDiffuseLighting',
        fedisplacementmap: 'feDisplacementMap',
        fedistantlight: 'feDistantLight',
        fedropshadow: 'feDropShadow',
        feflood: 'feFlood',
        fefunca: 'feFuncA',
        fefuncb: 'feFuncB',
        fefuncg: 'feFuncG',
        fefuncr: 'feFuncR',
        fegaussianblur: 'feGaussianBlur',
        feimage: 'feImage',
        femerge: 'feMerge',
        femergenode: 'feMergeNode',
        femorphology: 'feMorphology',
        feoffset: 'feOffset',
        fepointlight: 'fePointLight',
        fespecularlighting: 'feSpecularLighting',
        fespotlight: 'feSpotLight',
        fetile: 'feTile',
        feturbulence: 'feTurbulence',
        foreignobject: 'foreignObject',
        glyphref: 'glyphRef',
        lineargradient: 'linearGradient',
        radialgradient: 'radialGradient'
    };
    function getTagName(n) {
        var tagName = tagMap[n.tagName] ? tagMap[n.tagName] : n.tagName;
        if (tagName === 'link' && n.attributes._cssText) {
            tagName = 'style';
        }
        return tagName;
    }
    var HOVER_SELECTOR = /([^\\]):hover/g;
    function addHoverClass(cssText) {
        var ast = parse(cssText, { silent: true });
        if (!ast.stylesheet) {
            return cssText;
        }
        ast.stylesheet.rules.forEach(function (rule) {
            if ('selectors' in rule) {
                (rule.selectors || []).forEach(function (selector) {
                    if (HOVER_SELECTOR.test(selector)) {
                        var newSelector = selector.replace(HOVER_SELECTOR, '$1.\\:hover');
                        cssText = cssText.replace(selector, selector + ", " + newSelector);
                    }
                });
            }
        });
        return cssText;
    }
    function buildNode(n, doc, HACK_CSS) {
        switch (n.type) {
            case NodeType.Document:
                return doc.implementation.createDocument(null, '', null);
            case NodeType.DocumentType:
                return doc.implementation.createDocumentType(n.name, n.publicId, n.systemId);
            case NodeType.Element:
                var tagName = getTagName(n);
                var node_1;
                if (n.isSVG) {
                    node_1 = doc.createElementNS('http://www.w3.org/2000/svg', tagName);
                }
                else {
                    node_1 = doc.createElement(tagName);
                }
                var _loop_1 = function (name) {
                    if (!n.attributes.hasOwnProperty(name)) {
                        return "continue";
                    }
                    var value = n.attributes[name];
                    value = typeof value === 'boolean' ? '' : value;
                    if (!name.startsWith('rr_')) {
                        var isTextarea = tagName === 'textarea' && name === 'value';
                        var isRemoteOrDynamicCss = tagName === 'style' && name === '_cssText';
                        if (isRemoteOrDynamicCss && HACK_CSS) {
                            value = addHoverClass(value);
                        }
                        if (isTextarea || isRemoteOrDynamicCss) {
                            var child = doc.createTextNode(value);
                            for (var _i = 0, _a = Array.from(node_1.childNodes); _i < _a.length; _i++) {
                                var c = _a[_i];
                                if (c.nodeType === node_1.TEXT_NODE) {
                                    node_1.removeChild(c);
                                }
                            }
                            node_1.appendChild(child);
                            return "continue";
                        }
                        if (tagName === 'iframe' && name === 'src') {
                            return "continue";
                        }
                        try {
                            if (n.isSVG && name === 'xlink:href') {
                                node_1.setAttributeNS('http://www.w3.org/1999/xlink', name, value);
                            }
                            else if (name == 'onload' || name == 'onclick' || name.substring(0, 7) == 'onmouse') {
                                node_1.setAttribute('_' + name, value);
                            }
                            else {
                                node_1.setAttribute(name, value);
                            }
                        }
                        catch (error) {
                        }
                    }
                    else {
                        if (tagName === 'canvas' && name === 'rr_dataURL') {
                            var image_1 = document.createElement('img');
                            image_1.src = value;
                            image_1.onload = function () {
                                var ctx = node_1.getContext('2d');
                                if (ctx) {
                                    ctx.drawImage(image_1, 0, 0, image_1.width, image_1.height);
                                }
                            };
                        }
                        if (name === 'rr_width') {
                            node_1.style.width = value;
                        }
                        if (name === 'rr_height') {
                            node_1.style.height = value;
                        }
                        if (name === 'rr_mediaState') {
                            switch (value) {
                                case 'played':
                                    node_1.play();
                                case 'paused':
                                    node_1.pause();
                                    break;
                            }
                        }
                    }
                };
                for (var name in n.attributes) {
                    _loop_1(name);
                }
                return node_1;
            case NodeType.Text:
                return doc.createTextNode(n.isStyle && HACK_CSS ? addHoverClass(n.textContent) : n.textContent);
            case NodeType.CDATA:
                return doc.createCDATASection(n.textContent);
            case NodeType.Comment:
                return doc.createComment(n.textContent);
            default:
                return null;
        }
    }
    function buildNodeWithSN(n, doc, map, skipChild, HACK_CSS) {
        if (skipChild === void 0) { skipChild = false; }
        if (HACK_CSS === void 0) { HACK_CSS = true; }
        var node = buildNode(n, doc, HACK_CSS);
        if (!node) {
            return null;
        }
        if (n.type === NodeType.Document) {
            doc.close();
            doc.open();
            node = doc;
        }
        node.__sn = n;
        map[n.id] = node;
        if ((n.type === NodeType.Document || n.type === NodeType.Element) &&
            !skipChild) {
            for (var _i = 0, _a = n.childNodes; _i < _a.length; _i++) {
                var childN = _a[_i];
                var childNode = buildNodeWithSN(childN, doc, map, false, HACK_CSS);
                if (!childNode) {
                    console.warn('Failed to rebuild', childN);
                }
                else {
                    node.appendChild(childNode);
                }
            }
        }
        return node;
    }
    function rebuild(n, doc, HACK_CSS) {
        if (HACK_CSS === void 0) { HACK_CSS = true; }
        var idNodeMap = {};
        return [buildNodeWithSN(n, doc, idNodeMap, false, HACK_CSS), idNodeMap];
    }

    //      
    // An event handler can take an optional event argument
    // and should not return a value
                                              
                                                                   

    // An array of all currently registered event handlers for a type
                                                
                                                                
    // A map of event types and their corresponding event handlers.
                            
                                     
                                       
      

    /** Mitt: Tiny (~200b) functional event emitter / pubsub.
     *  @name mitt
     *  @returns {Mitt}
     */
    function mitt(all                 ) {
    	all = all || Object.create(null);

    	return {
    		/**
    		 * Register an event handler for the given type.
    		 *
    		 * @param  {String} type	Type of event to listen for, or `"*"` for all events
    		 * @param  {Function} handler Function to call in response to given event
    		 * @memberOf mitt
    		 */
    		on: function on(type        , handler              ) {
    			(all[type] || (all[type] = [])).push(handler);
    		},

    		/**
    		 * Remove an event handler for the given type.
    		 *
    		 * @param  {String} type	Type of event to unregister `handler` from, or `"*"`
    		 * @param  {Function} handler Handler function to remove
    		 * @memberOf mitt
    		 */
    		off: function off(type        , handler              ) {
    			if (all[type]) {
    				all[type].splice(all[type].indexOf(handler) >>> 0, 1);
    			}
    		},

    		/**
    		 * Invoke all handlers for the given type.
    		 * If present, `"*"` handlers are invoked after type-matched handlers.
    		 *
    		 * @param {String} type  The event type to invoke
    		 * @param {Any} [evt]  Any value (object is recommended and powerful), passed to each handler
    		 * @memberOf mitt
    		 */
    		emit: function emit(type        , evt     ) {
    			(all[type] || []).slice().map(function (handler) { handler(evt); });
    			(all['*'] || []).slice().map(function (handler) { handler(type, evt); });
    		}
    	};
    }

    var mittProxy = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': mitt
    });

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var smoothscroll = createCommonjsModule(function (module, exports) {
    /* smoothscroll v0.4.4 - 2019 - Dustan Kasten, Jeremias Menichelli - MIT License */
    (function () {

      // polyfill
      function polyfill() {
        // aliases
        var w = window;
        var d = document;

        // return if scroll behavior is supported and polyfill is not forced
        if (
          'scrollBehavior' in d.documentElement.style &&
          w.__forceSmoothScrollPolyfill__ !== true
        ) {
          return;
        }

        // globals
        var Element = w.HTMLElement || w.Element;
        var SCROLL_TIME = 468;

        // object gathering original scroll methods
        var original = {
          scroll: w.scroll || w.scrollTo,
          scrollBy: w.scrollBy,
          elementScroll: Element.prototype.scroll || scrollElement,
          scrollIntoView: Element.prototype.scrollIntoView
        };

        // define timing method
        var now =
          w.performance && w.performance.now
            ? w.performance.now.bind(w.performance)
            : Date.now;

        /**
         * indicates if a the current browser is made by Microsoft
         * @method isMicrosoftBrowser
         * @param {String} userAgent
         * @returns {Boolean}
         */
        function isMicrosoftBrowser(userAgent) {
          var userAgentPatterns = ['MSIE ', 'Trident/', 'Edge/'];

          return new RegExp(userAgentPatterns.join('|')).test(userAgent);
        }

        /*
         * IE has rounding bug rounding down clientHeight and clientWidth and
         * rounding up scrollHeight and scrollWidth causing false positives
         * on hasScrollableSpace
         */
        var ROUNDING_TOLERANCE = isMicrosoftBrowser(w.navigator.userAgent) ? 1 : 0;

        /**
         * changes scroll position inside an element
         * @method scrollElement
         * @param {Number} x
         * @param {Number} y
         * @returns {undefined}
         */
        function scrollElement(x, y) {
          this.scrollLeft = x;
          this.scrollTop = y;
        }

        /**
         * returns result of applying ease math function to a number
         * @method ease
         * @param {Number} k
         * @returns {Number}
         */
        function ease(k) {
          return 0.5 * (1 - Math.cos(Math.PI * k));
        }

        /**
         * indicates if a smooth behavior should be applied
         * @method shouldBailOut
         * @param {Number|Object} firstArg
         * @returns {Boolean}
         */
        function shouldBailOut(firstArg) {
          if (
            firstArg === null ||
            typeof firstArg !== 'object' ||
            firstArg.behavior === undefined ||
            firstArg.behavior === 'auto' ||
            firstArg.behavior === 'instant'
          ) {
            // first argument is not an object/null
            // or behavior is auto, instant or undefined
            return true;
          }

          if (typeof firstArg === 'object' && firstArg.behavior === 'smooth') {
            // first argument is an object and behavior is smooth
            return false;
          }

          // throw error when behavior is not supported
          throw new TypeError(
            'behavior member of ScrollOptions ' +
              firstArg.behavior +
              ' is not a valid value for enumeration ScrollBehavior.'
          );
        }

        /**
         * indicates if an element has scrollable space in the provided axis
         * @method hasScrollableSpace
         * @param {Node} el
         * @param {String} axis
         * @returns {Boolean}
         */
        function hasScrollableSpace(el, axis) {
          if (axis === 'Y') {
            return el.clientHeight + ROUNDING_TOLERANCE < el.scrollHeight;
          }

          if (axis === 'X') {
            return el.clientWidth + ROUNDING_TOLERANCE < el.scrollWidth;
          }
        }

        /**
         * indicates if an element has a scrollable overflow property in the axis
         * @method canOverflow
         * @param {Node} el
         * @param {String} axis
         * @returns {Boolean}
         */
        function canOverflow(el, axis) {
          var overflowValue = w.getComputedStyle(el, null)['overflow' + axis];

          return overflowValue === 'auto' || overflowValue === 'scroll';
        }

        /**
         * indicates if an element can be scrolled in either axis
         * @method isScrollable
         * @param {Node} el
         * @param {String} axis
         * @returns {Boolean}
         */
        function isScrollable(el) {
          var isScrollableY = hasScrollableSpace(el, 'Y') && canOverflow(el, 'Y');
          var isScrollableX = hasScrollableSpace(el, 'X') && canOverflow(el, 'X');

          return isScrollableY || isScrollableX;
        }

        /**
         * finds scrollable parent of an element
         * @method findScrollableParent
         * @param {Node} el
         * @returns {Node} el
         */
        function findScrollableParent(el) {
          while (el !== d.body && isScrollable(el) === false) {
            el = el.parentNode || el.host;
          }

          return el;
        }

        /**
         * self invoked function that, given a context, steps through scrolling
         * @method step
         * @param {Object} context
         * @returns {undefined}
         */
        function step(context) {
          var time = now();
          var value;
          var currentX;
          var currentY;
          var elapsed = (time - context.startTime) / SCROLL_TIME;

          // avoid elapsed times higher than one
          elapsed = elapsed > 1 ? 1 : elapsed;

          // apply easing to elapsed time
          value = ease(elapsed);

          currentX = context.startX + (context.x - context.startX) * value;
          currentY = context.startY + (context.y - context.startY) * value;

          context.method.call(context.scrollable, currentX, currentY);

          // scroll more if we have not reached our destination
          if (currentX !== context.x || currentY !== context.y) {
            w.requestAnimationFrame(step.bind(w, context));
          }
        }

        /**
         * scrolls window or element with a smooth behavior
         * @method smoothScroll
         * @param {Object|Node} el
         * @param {Number} x
         * @param {Number} y
         * @returns {undefined}
         */
        function smoothScroll(el, x, y) {
          var scrollable;
          var startX;
          var startY;
          var method;
          var startTime = now();

          // define scroll context
          if (el === d.body) {
            scrollable = w;
            startX = w.scrollX || w.pageXOffset;
            startY = w.scrollY || w.pageYOffset;
            method = original.scroll;
          } else {
            scrollable = el;
            startX = el.scrollLeft;
            startY = el.scrollTop;
            method = scrollElement;
          }

          // scroll looping over a frame
          step({
            scrollable: scrollable,
            method: method,
            startTime: startTime,
            startX: startX,
            startY: startY,
            x: x,
            y: y
          });
        }

        // ORIGINAL METHODS OVERRIDES
        // w.scroll and w.scrollTo
        w.scroll = w.scrollTo = function() {
          // avoid action when no arguments are passed
          if (arguments[0] === undefined) {
            return;
          }

          // avoid smooth behavior if not required
          if (shouldBailOut(arguments[0]) === true) {
            original.scroll.call(
              w,
              arguments[0].left !== undefined
                ? arguments[0].left
                : typeof arguments[0] !== 'object'
                  ? arguments[0]
                  : w.scrollX || w.pageXOffset,
              // use top prop, second argument if present or fallback to scrollY
              arguments[0].top !== undefined
                ? arguments[0].top
                : arguments[1] !== undefined
                  ? arguments[1]
                  : w.scrollY || w.pageYOffset
            );

            return;
          }

          // LET THE SMOOTHNESS BEGIN!
          smoothScroll.call(
            w,
            d.body,
            arguments[0].left !== undefined
              ? ~~arguments[0].left
              : w.scrollX || w.pageXOffset,
            arguments[0].top !== undefined
              ? ~~arguments[0].top
              : w.scrollY || w.pageYOffset
          );
        };

        // w.scrollBy
        w.scrollBy = function() {
          // avoid action when no arguments are passed
          if (arguments[0] === undefined) {
            return;
          }

          // avoid smooth behavior if not required
          if (shouldBailOut(arguments[0])) {
            original.scrollBy.call(
              w,
              arguments[0].left !== undefined
                ? arguments[0].left
                : typeof arguments[0] !== 'object' ? arguments[0] : 0,
              arguments[0].top !== undefined
                ? arguments[0].top
                : arguments[1] !== undefined ? arguments[1] : 0
            );

            return;
          }

          // LET THE SMOOTHNESS BEGIN!
          smoothScroll.call(
            w,
            d.body,
            ~~arguments[0].left + (w.scrollX || w.pageXOffset),
            ~~arguments[0].top + (w.scrollY || w.pageYOffset)
          );
        };

        // Element.prototype.scroll and Element.prototype.scrollTo
        Element.prototype.scroll = Element.prototype.scrollTo = function() {
          // avoid action when no arguments are passed
          if (arguments[0] === undefined) {
            return;
          }

          // avoid smooth behavior if not required
          if (shouldBailOut(arguments[0]) === true) {
            // if one number is passed, throw error to match Firefox implementation
            if (typeof arguments[0] === 'number' && arguments[1] === undefined) {
              throw new SyntaxError('Value could not be converted');
            }

            original.elementScroll.call(
              this,
              // use left prop, first number argument or fallback to scrollLeft
              arguments[0].left !== undefined
                ? ~~arguments[0].left
                : typeof arguments[0] !== 'object' ? ~~arguments[0] : this.scrollLeft,
              // use top prop, second argument or fallback to scrollTop
              arguments[0].top !== undefined
                ? ~~arguments[0].top
                : arguments[1] !== undefined ? ~~arguments[1] : this.scrollTop
            );

            return;
          }

          var left = arguments[0].left;
          var top = arguments[0].top;

          // LET THE SMOOTHNESS BEGIN!
          smoothScroll.call(
            this,
            this,
            typeof left === 'undefined' ? this.scrollLeft : ~~left,
            typeof top === 'undefined' ? this.scrollTop : ~~top
          );
        };

        // Element.prototype.scrollBy
        Element.prototype.scrollBy = function() {
          // avoid action when no arguments are passed
          if (arguments[0] === undefined) {
            return;
          }

          // avoid smooth behavior if not required
          if (shouldBailOut(arguments[0]) === true) {
            original.elementScroll.call(
              this,
              arguments[0].left !== undefined
                ? ~~arguments[0].left + this.scrollLeft
                : ~~arguments[0] + this.scrollLeft,
              arguments[0].top !== undefined
                ? ~~arguments[0].top + this.scrollTop
                : ~~arguments[1] + this.scrollTop
            );

            return;
          }

          this.scroll({
            left: ~~arguments[0].left + this.scrollLeft,
            top: ~~arguments[0].top + this.scrollTop,
            behavior: arguments[0].behavior
          });
        };

        // Element.prototype.scrollIntoView
        Element.prototype.scrollIntoView = function() {
          // avoid smooth behavior if not required
          if (shouldBailOut(arguments[0]) === true) {
            original.scrollIntoView.call(
              this,
              arguments[0] === undefined ? true : arguments[0]
            );

            return;
          }

          // LET THE SMOOTHNESS BEGIN!
          var scrollableParent = findScrollableParent(this);
          var parentRects = scrollableParent.getBoundingClientRect();
          var clientRects = this.getBoundingClientRect();

          if (scrollableParent !== d.body) {
            // reveal element inside parent
            smoothScroll.call(
              this,
              scrollableParent,
              scrollableParent.scrollLeft + clientRects.left - parentRects.left,
              scrollableParent.scrollTop + clientRects.top - parentRects.top
            );

            // reveal parent in viewport unless is fixed
            if (w.getComputedStyle(scrollableParent).position !== 'fixed') {
              w.scrollBy({
                left: parentRects.left,
                top: parentRects.top,
                behavior: 'smooth'
              });
            }
          } else {
            // reveal element in viewport
            w.scrollBy({
              left: clientRects.left,
              top: clientRects.top,
              behavior: 'smooth'
            });
          }
        };
      }

      {
        // commonjs
        module.exports = { polyfill: polyfill };
      }

    }());
    });
    var smoothscroll_1 = smoothscroll.polyfill;

    var EventType;
    (function (EventType) {
        EventType[EventType["DomContentLoaded"] = 0] = "DomContentLoaded";
        EventType[EventType["Load"] = 1] = "Load";
        EventType[EventType["FullSnapshot"] = 2] = "FullSnapshot";
        EventType[EventType["IncrementalSnapshot"] = 3] = "IncrementalSnapshot";
        EventType[EventType["Meta"] = 4] = "Meta";
        EventType[EventType["Custom"] = 5] = "Custom";
    })(EventType || (EventType = {}));
    var IncrementalSource;
    (function (IncrementalSource) {
        IncrementalSource[IncrementalSource["Mutation"] = 0] = "Mutation";
        IncrementalSource[IncrementalSource["MouseMove"] = 1] = "MouseMove";
        IncrementalSource[IncrementalSource["MouseInteraction"] = 2] = "MouseInteraction";
        IncrementalSource[IncrementalSource["Scroll"] = 3] = "Scroll";
        IncrementalSource[IncrementalSource["ViewportResize"] = 4] = "ViewportResize";
        IncrementalSource[IncrementalSource["Input"] = 5] = "Input";
        IncrementalSource[IncrementalSource["TouchMove"] = 6] = "TouchMove";
        IncrementalSource[IncrementalSource["MediaInteraction"] = 7] = "MediaInteraction";
        IncrementalSource[IncrementalSource["StyleSheetRule"] = 8] = "StyleSheetRule";
    })(IncrementalSource || (IncrementalSource = {}));
    var MouseInteractions;
    (function (MouseInteractions) {
        MouseInteractions[MouseInteractions["MouseUp"] = 0] = "MouseUp";
        MouseInteractions[MouseInteractions["MouseDown"] = 1] = "MouseDown";
        MouseInteractions[MouseInteractions["Click"] = 2] = "Click";
        MouseInteractions[MouseInteractions["ContextMenu"] = 3] = "ContextMenu";
        MouseInteractions[MouseInteractions["DblClick"] = 4] = "DblClick";
        MouseInteractions[MouseInteractions["Focus"] = 5] = "Focus";
        MouseInteractions[MouseInteractions["Blur"] = 6] = "Blur";
        MouseInteractions[MouseInteractions["TouchStart"] = 7] = "TouchStart";
        MouseInteractions[MouseInteractions["TouchMove_Departed"] = 8] = "TouchMove_Departed";
        MouseInteractions[MouseInteractions["TouchEnd"] = 9] = "TouchEnd";
    })(MouseInteractions || (MouseInteractions = {}));
    var MediaInteractions;
    (function (MediaInteractions) {
        MediaInteractions[MediaInteractions["Play"] = 0] = "Play";
        MediaInteractions[MediaInteractions["Pause"] = 1] = "Pause";
    })(MediaInteractions || (MediaInteractions = {}));
    var ReplayerEvents;
    (function (ReplayerEvents) {
        ReplayerEvents["Start"] = "start";
        ReplayerEvents["Pause"] = "pause";
        ReplayerEvents["Resume"] = "resume";
        ReplayerEvents["Resize"] = "resize";
        ReplayerEvents["Finish"] = "finish";
        ReplayerEvents["FullsnapshotRebuilded"] = "fullsnapshot-rebuilded";
        ReplayerEvents["LoadStylesheetStart"] = "load-stylesheet-start";
        ReplayerEvents["LoadStylesheetEnd"] = "load-stylesheet-end";
        ReplayerEvents["SkipStart"] = "skip-start";
        ReplayerEvents["SkipEnd"] = "skip-end";
        ReplayerEvents["MouseInteraction"] = "mouse-interaction";
        ReplayerEvents["EventCast"] = "event-cast";
        ReplayerEvents["CustomEvent"] = "custom-event";
    })(ReplayerEvents || (ReplayerEvents = {}));

    var Timer = (function () {
        function Timer(config, actions) {
            if (actions === void 0) { actions = []; }
            this.timeOffset = 0;
            this.actions = actions;
            this.config = config;
        }
        Timer.prototype.addAction = function (action) {
            var index = this.findActionIndex(action);
            this.actions.splice(index, 0, action);
        };
        Timer.prototype.addActions = function (actions) {
            var _a;
            (_a = this.actions).push.apply(_a, __spread(actions));
        };
        Timer.prototype.start = function () {
            this.actions.sort(function (a1, a2) { return a1.delay - a2.delay; });
            this.timeOffset = 0;
            var lastTimestamp = performance.now();
            var _a = this, actions = _a.actions, config = _a.config;
            var self = this;
            function check(time) {
                self.timeOffset += (time - lastTimestamp) * config.speed;
                lastTimestamp = time;
                while (actions.length) {
                    var action = actions[0];
                    if (self.timeOffset >= action.delay) {
                        actions.shift();
                        action.doAction();
                    }
                    else {
                        break;
                    }
                }
                if (actions.length > 0 || self.config.liveMode) {
                    self.raf = requestAnimationFrame(check);
                }
            }
            this.raf = requestAnimationFrame(check);
        };
        Timer.prototype.clear = function () {
            if (this.raf) {
                cancelAnimationFrame(this.raf);
            }
            this.actions.length = 0;
        };
        Timer.prototype.findActionIndex = function (action) {
            var start = 0;
            var end = this.actions.length - 1;
            while (start <= end) {
                var mid = Math.floor((start + end) / 2);
                if (this.actions[mid].delay < action.delay) {
                    start = mid + 1;
                }
                else if (this.actions[mid].delay > action.delay) {
                    end = mid - 1;
                }
                else {
                    return mid;
                }
            }
            return start;
        };
        return Timer;
    }());
    function getDelay(event, baselineTime) {
        if (event.type === EventType.IncrementalSnapshot &&
            event.data.source === IncrementalSource.MouseMove) {
            var firstOffset = event.data.positions[0].timeOffset;
            var firstTimestamp = event.timestamp + firstOffset;
            event.delay = firstTimestamp - baselineTime;
            return firstTimestamp - baselineTime;
        }
        event.delay = event.timestamp - baselineTime;
        return event.timestamp - baselineTime;
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    var t;!function(t){t[t.NotStarted=0]="NotStarted",t[t.Running=1]="Running",t[t.Stopped=2]="Stopped";}(t||(t={}));var n={type:"xstate.init"};function e(t){return void 0===t?[]:[].concat(t)}function r(t){return {type:"xstate.assign",assignment:t}}function i(t,n){return "string"==typeof(t="string"==typeof t&&n&&n[t]?n[t]:t)?{type:t}:"function"==typeof t?{type:t.name,exec:t}:t}function o(t){return function(n){return t===n}}function a(t){return "string"==typeof t?{type:t}:t}function u(t,n){return {value:t,context:n,actions:[],changed:!1,matches:o(t)}}function c(t,n){void 0===n&&(n={});var r={config:t,_options:n,initialState:{value:t.initial,actions:e(t.states[t.initial].entry).map((function(t){return i(t,n.actions)})),context:t.context,matches:o(t.initial)},transition:function(n,c){var s,f,l="string"==typeof n?{value:n,context:t.context}:n,v=l.value,p=l.context,g=a(c),y=t.states[v];if(y.on){var d=e(y.on[g.type]),x=function(n){if(void 0===n)return {value:u(v,p)};var e="string"==typeof n?{target:n}:n,a=e.target,c=void 0===a?v:a,s=e.actions,f=void 0===s?[]:s,l=e.cond,d=p;if((void 0===l?function(){return !0}:l)(p,g)){var x=t.states[c],m=!1,h=[].concat(y.exit,f,x.entry).filter((function(t){return t})).map((function(t){return i(t,r._options.actions)})).filter((function(t){if("xstate.assign"===t.type){m=!0;var n=Object.assign({},d);return "function"==typeof t.assignment?n=t.assignment(d,g):Object.keys(t.assignment).forEach((function(e){n[e]="function"==typeof t.assignment[e]?t.assignment[e](d,g):t.assignment[e];})),d=n,!1}return !0}));return {value:{value:c,context:d,actions:h,changed:c!==v||h.length>0||m,matches:o(c)}}}};try{for(var m=function(t){var n="function"==typeof Symbol&&t[Symbol.iterator],e=0;return n?n.call(t):{next:function(){return t&&e>=t.length&&(t=void 0),{value:t&&t[e++],done:!t}}}}(d),h=m.next();!h.done;h=m.next()){var S=x(h.value);if("object"==typeof S)return S.value}}catch(t){s={error:t};}finally{try{h&&!h.done&&(f=m.return)&&f.call(m);}finally{if(s)throw s.error}}}return u(v,p)}};return r}var s=function(t,n){return t.actions.forEach((function(e){var r=e.exec;return r&&r(t.context,n)}))};function f(e){var r=e.initialState,i=t.NotStarted,o=new Set,u={_machine:e,send:function(n){i===t.Running&&(r=e.transition(r,n),s(r,a(n)),o.forEach((function(t){return t(r)})));},subscribe:function(t){return o.add(t),t(r),{unsubscribe:function(){return o.delete(t)}}},start:function(){return i=t.Running,s(r,n),u},stop:function(){return i=t.Stopped,o.clear(),u},get state(){return r},get status(){return i}};return u}

    function createPlayerService(context, _a) {
        var getCastFn = _a.getCastFn, emitter = _a.emitter;
        var playerMachine = c({
            id: 'player',
            context: context,
            initial: 'inited',
            states: {
                inited: {
                    on: {
                        PLAY: {
                            target: 'playing',
                            actions: ['recordTimeOffset', 'play'],
                        },
                        TO_LIVE: {
                            target: 'live',
                            actions: ['startLive'],
                        },
                    },
                },
                playing: {
                    on: {
                        PAUSE: {
                            target: 'paused',
                            actions: ['pause'],
                        },
                        END: 'ended',
                        FAST_FORWARD: 'skipping',
                        CAST_EVENT: {
                            target: 'playing',
                            actions: 'castEvent',
                        },
                    },
                },
                paused: {
                    on: {
                        RESUME: {
                            target: 'playing',
                            actions: ['recordTimeOffset', 'play'],
                        },
                        CAST_EVENT: {
                            target: 'paused',
                            actions: 'castEvent',
                        },
                    },
                },
                skipping: {
                    on: {
                        BACK_TO_NORMAL: 'playing',
                    },
                },
                ended: {
                    on: {
                        REPLAY: 'playing',
                    },
                },
                live: {
                    on: {
                        ADD_EVENT: {
                            target: 'live',
                            actions: ['addEvent'],
                        },
                    },
                },
            },
        }, {
            actions: {
                castEvent: r({
                    lastPlayedEvent: function (ctx, event) {
                        if (event.type === 'CAST_EVENT') {
                            return event.payload.event;
                        }
                        return context.lastPlayedEvent;
                    },
                }),
                recordTimeOffset: r(function (ctx, event) {
                    var timeOffset = ctx.timeOffset;
                    if ('payload' in event && 'timeOffset' in event.payload) {
                        timeOffset = event.payload.timeOffset;
                    }
                    return __assign(__assign({}, ctx), { timeOffset: timeOffset, baselineTime: ctx.events[0].timestamp + timeOffset });
                }),
                play: function (ctx) {
                    var e_1, _a;
                    var timer = ctx.timer, events = ctx.events, baselineTime = ctx.baselineTime, lastPlayedEvent = ctx.lastPlayedEvent;
                    timer.clear();
                    var actions = new Array();
                    var _loop_1 = function (event) {
                        if (lastPlayedEvent &&
                            (event.timestamp <= lastPlayedEvent.timestamp ||
                                event === lastPlayedEvent)) {
                            return "continue";
                        }
                        var isSync = event.timestamp < baselineTime;
                        var castFn = getCastFn(event, isSync);
                        if (isSync) {
                            castFn();
                        }
                        else {
                            actions.push({
                                doAction: function () {
                                    castFn();
                                    emitter.emit(ReplayerEvents.EventCast, event);
                                },
                                delay: getDelay(event, baselineTime),
                            });
                        }
                    };
                    try {
                        for (var events_1 = __values(events), events_1_1 = events_1.next(); !events_1_1.done; events_1_1 = events_1.next()) {
                            var event = events_1_1.value;
                            _loop_1(event);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (events_1_1 && !events_1_1.done && (_a = events_1.return)) _a.call(events_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    timer.addActions(actions);
                    timer.start();
                },
                pause: function (ctx) {
                    ctx.timer.clear();
                },
                startLive: r({
                    baselineTime: function (ctx, event) {
                        ctx.timer.start();
                        if (event.type === 'TO_LIVE' && event.payload.baselineTime) {
                            return event.payload.baselineTime;
                        }
                        return Date.now();
                    },
                }),
                addEvent: r(function (ctx, machineEvent) {
                    var baselineTime = ctx.baselineTime, timer = ctx.timer, events = ctx.events;
                    if (machineEvent.type === 'ADD_EVENT') {
                        var event_1 = machineEvent.payload.event;
                        events.push(event_1);
                        var isSync = event_1.timestamp < baselineTime;
                        var castFn_1 = getCastFn(event_1, isSync);
                        if (isSync) {
                            castFn_1();
                        }
                        else {
                            timer.addAction({
                                doAction: function () {
                                    castFn_1();
                                    emitter.emit(ReplayerEvents.EventCast, event_1);
                                },
                                delay: getDelay(event_1, baselineTime),
                            });
                        }
                    }
                    return __assign(__assign({}, ctx), { events: events });
                }),
            },
        });
        return f(playerMachine);
    }

    var mirror = {
        map: {},
        getId: function (n) {
            if (!n.__sn) {
                return -1;
            }
            return n.__sn.id;
        },
        getNode: function (id) {
            return mirror.map[id] || null;
        },
        removeNodeFromMap: function (n) {
            var id = n.__sn && n.__sn.id;
            delete mirror.map[id];
            if (n.childNodes) {
                n.childNodes.forEach(function (child) {
                    return mirror.removeNodeFromMap(child);
                });
            }
        },
        has: function (id) {
            return mirror.map.hasOwnProperty(id);
        },
    };
    function polyfill() {
        if ('NodeList' in window && !NodeList.prototype.forEach) {
            NodeList.prototype.forEach = Array.prototype
                .forEach;
        }
    }

    var rules = function (blockClass) { return [
        "iframe, ." + blockClass + " { background: #ccc }",
        'noscript { display: none !important; }',
    ]; };

    var SKIP_TIME_THRESHOLD = 10 * 1000;
    var SKIP_TIME_INTERVAL = 5 * 1000;
    var mitt$1 = mitt || mittProxy;
    var REPLAY_CONSOLE_PREFIX = '[replayer]';
    var defaultConfig = {
        speed: 1,
        root: document.body,
        loadTimeout: 0,
        skipInactive: false,
        showWarning: true,
        showDebug: false,
        blockClass: 'rr-block',
        liveMode: false,
        insertStyleRules: [],
        triggerFocus: true,
    };
    var Replayer = (function () {
        function Replayer(events, config) {
            this.emitter = mitt$1();
            this.noramlSpeed = -1;
            this.legacy_missingNodeRetryMap = {};
            if (!(config === null || config === void 0 ? void 0 : config.liveMode) && events.length < 2) {
                throw new Error('Replayer need at least 2 events.');
            }
            this.config = Object.assign({}, defaultConfig, config);
            this.handleResize = this.handleResize.bind(this);
            this.getCastFn = this.getCastFn.bind(this);
            this.emitter.on('resize', this.handleResize);
            smoothscroll_1();
            polyfill();
            this.setupDom();
            this.service = createPlayerService({
                events: events.map(function (e) {
                    if (config && config.unpackFn) {
                        return config.unpackFn(e);
                    }
                    return e;
                }),
                timer: new Timer(this.config),
                speed: (config === null || config === void 0 ? void 0 : config.speed) || defaultConfig.speed,
                timeOffset: 0,
                baselineTime: 0,
                lastPlayedEvent: null,
            }, {
                getCastFn: this.getCastFn,
                emitter: this.emitter,
            });
            this.service.start();
            this.service.subscribe(function (state) {
                if (!state.changed) {
                    return;
                }
            });
            var contextEvents = this.service.state.context.events;
            var firstMeta = contextEvents.find(function (e) { return e.type === EventType.Meta; });
            var firstFullsnapshot = contextEvents.find(function (e) { return e.type === EventType.FullSnapshot; });
            if (firstMeta) {
                var _a = firstMeta.data, width = _a.width, height = _a.height;
                this.emitter.emit(ReplayerEvents.Resize, {
                    width: width,
                    height: height,
                });
            }
            if (firstFullsnapshot) {
                this.rebuildFullSnapshot(firstFullsnapshot);
            }
        }
        Object.defineProperty(Replayer.prototype, "timer", {
            get: function () {
                return this.service.state.context.timer;
            },
            enumerable: false,
            configurable: true
        });
        Replayer.prototype.on = function (event, handler) {
            this.emitter.on(event, handler);
        };
        Replayer.prototype.setConfig = function (config) {
            var _this = this;
            Object.keys(config).forEach(function (key) {
                _this.config[key] = config[key];
            });
            if (!this.config.skipInactive) {
                this.noramlSpeed = -1;
            }
        };
        Replayer.prototype.getMetaData = function () {
            var events = this.service.state.context.events;
            var firstEvent = events[0];
            var lastEvent = events[events.length - 1];
            return {
                totalTime: lastEvent.timestamp - firstEvent.timestamp,
            };
        };
        Replayer.prototype.getCurrentTime = function () {
            return this.timer.timeOffset + this.getTimeOffset();
        };
        Replayer.prototype.getTimeOffset = function () {
            var _a = this.service.state.context, baselineTime = _a.baselineTime, events = _a.events;
            return baselineTime - events[0].timestamp;
        };
        Replayer.prototype.play = function (timeOffset) {
            if (timeOffset === void 0) { timeOffset = 0; }
            this.service.send({ type: 'PLAY', payload: { timeOffset: timeOffset } });
            this.emitter.emit(ReplayerEvents.Start);
        };
        Replayer.prototype.pause = function () {
            this.service.send({ type: 'PAUSE' });
            this.emitter.emit(ReplayerEvents.Pause);
        };
        Replayer.prototype.resume = function (timeOffset) {
            if (timeOffset === void 0) { timeOffset = 0; }
            this.service.send({ type: 'RESUME', payload: { timeOffset: timeOffset } });
            this.emitter.emit(ReplayerEvents.Resume);
        };
        Replayer.prototype.startLive = function (baselineTime) {
            this.service.send({ type: 'TO_LIVE', payload: { baselineTime: baselineTime } });
        };
        Replayer.prototype.addEvent = function (rawEvent) {
            var _this = this;
            var event = this.config.unpackFn
                ? this.config.unpackFn(rawEvent)
                : rawEvent;
            Promise.resolve().then(function () {
                return _this.service.send({ type: 'ADD_EVENT', payload: { event: event } });
            });
        };
        Replayer.prototype.enableInteract = function () {
            this.iframe.setAttribute('scrolling', 'auto');
            this.iframe.style.pointerEvents = 'auto';
        };
        Replayer.prototype.disableInteract = function () {
            this.iframe.setAttribute('scrolling', 'no');
            this.iframe.style.pointerEvents = 'none';
        };
        Replayer.prototype.setupDom = function () {
            this.wrapper = document.createElement('div');
            this.wrapper.classList.add('replayer-wrapper');
            this.config.root.appendChild(this.wrapper);
            this.mouse = document.createElement('div');
            this.mouse.classList.add('replayer-mouse');
            this.wrapper.appendChild(this.mouse);
            this.iframe = document.createElement('iframe');
            this.iframe.setAttribute('sandbox', 'allow-same-origin');
            this.disableInteract();
            this.wrapper.appendChild(this.iframe);
        };
        Replayer.prototype.handleResize = function (dimension) {
            this.iframe.setAttribute('width', String(dimension.width));
            this.iframe.setAttribute('height', String(dimension.height));
        };
        Replayer.prototype.getCastFn = function (event, isSync) {
            var _this = this;
            if (isSync === void 0) { isSync = false; }
            var events = this.service.state.context.events;
            var castFn;
            switch (event.type) {
                case EventType.DomContentLoaded:
                case EventType.Load:
                    break;
                case EventType.Custom:
                    castFn = function () {
                        _this.emitter.emit(ReplayerEvents.CustomEvent, event);
                    };
                    break;
                case EventType.Meta:
                    castFn = function () {
                        return _this.emitter.emit(ReplayerEvents.Resize, {
                            width: event.data.width,
                            height: event.data.height,
                        });
                    };
                    break;
                case EventType.FullSnapshot:
                    castFn = function () {
                        _this.rebuildFullSnapshot(event);
                        _this.iframe.contentWindow.scrollTo(event.data.initialOffset);
                    };
                    break;
                case EventType.IncrementalSnapshot:
                    castFn = function () {
                        var e_1, _a;
                        _this.applyIncremental(event, isSync);
                        if (event === _this.nextUserInteractionEvent) {
                            _this.nextUserInteractionEvent = null;
                            _this.restoreSpeed();
                        }
                        if (_this.config.skipInactive && !_this.nextUserInteractionEvent) {
                            try {
                                for (var events_1 = __values(events), events_1_1 = events_1.next(); !events_1_1.done; events_1_1 = events_1.next()) {
                                    var _event = events_1_1.value;
                                    if (_event.timestamp <= event.timestamp) {
                                        continue;
                                    }
                                    if (_this.isUserInteraction(_event)) {
                                        if (_event.delay - event.delay >
                                            SKIP_TIME_THRESHOLD * _this.config.speed) {
                                            _this.nextUserInteractionEvent = _event;
                                        }
                                        break;
                                    }
                                }
                            }
                            catch (e_1_1) { e_1 = { error: e_1_1 }; }
                            finally {
                                try {
                                    if (events_1_1 && !events_1_1.done && (_a = events_1.return)) _a.call(events_1);
                                }
                                finally { if (e_1) throw e_1.error; }
                            }
                            if (_this.nextUserInteractionEvent) {
                                _this.noramlSpeed = _this.config.speed;
                                var skipTime = _this.nextUserInteractionEvent.delay - event.delay;
                                var payload = {
                                    speed: Math.min(Math.round(skipTime / SKIP_TIME_INTERVAL), 360),
                                };
                                _this.setConfig(payload);
                                _this.emitter.emit(ReplayerEvents.SkipStart, payload);
                            }
                        }
                    };
                    break;
            }
            var wrappedCastFn = function () {
                if (castFn) {
                    castFn();
                }
                _this.service.send({ type: 'CAST_EVENT', payload: { event: event } });
                if (event === events[events.length - 1]) {
                    _this.restoreSpeed();
                    _this.service.send('END');
                    _this.emitter.emit(ReplayerEvents.Finish);
                }
            };
            return wrappedCastFn;
        };
        Replayer.prototype.rebuildFullSnapshot = function (event) {
            if (Object.keys(this.legacy_missingNodeRetryMap).length) {
                console.warn('Found unresolved missing node map', this.legacy_missingNodeRetryMap);
            }
            this.legacy_missingNodeRetryMap = {};
            mirror.map = rebuild(event.data.node, this.iframe.contentDocument)[1];
            var styleEl = document.createElement('style');
            var _a = this.iframe.contentDocument, documentElement = _a.documentElement, head = _a.head;
            documentElement.insertBefore(styleEl, head);
            var injectStylesRules = rules(this.config.blockClass).concat(this.config.insertStyleRules);
            for (var idx = 0; idx < injectStylesRules.length; idx++) {
                styleEl.sheet.insertRule(injectStylesRules[idx], idx);
            }
            this.emitter.emit(ReplayerEvents.FullsnapshotRebuilded);
            this.waitForStylesheetLoad();
        };
        Replayer.prototype.waitForStylesheetLoad = function () {
            var _this = this;
            var head = this.iframe.contentDocument.head;
            if (head) {
                var unloadSheets_1 = new Set();
                var timer_1;
                var beforeLoadState_1 = this.service.state;
                head
                    .querySelectorAll('link[rel="stylesheet"]')
                    .forEach(function (css) {
                    if (!css.sheet) {
                        unloadSheets_1.add(css);
                        css.addEventListener('load', function () {
                            unloadSheets_1.delete(css);
                            if (unloadSheets_1.size === 0 && timer_1 !== -1) {
                                if (beforeLoadState_1.matches('playing')) {
                                    _this.resume(_this.getCurrentTime());
                                }
                                _this.emitter.emit(ReplayerEvents.LoadStylesheetEnd);
                                if (timer_1) {
                                    window.clearTimeout(timer_1);
                                }
                            }
                        });
                    }
                });
                if (unloadSheets_1.size > 0) {
                    this.service.send({ type: 'PAUSE' });
                    this.emitter.emit(ReplayerEvents.LoadStylesheetStart);
                    timer_1 = window.setTimeout(function () {
                        if (beforeLoadState_1.matches('playing')) {
                            _this.resume(_this.getCurrentTime());
                        }
                        timer_1 = -1;
                    }, this.config.loadTimeout);
                }
            }
        };
        Replayer.prototype.applyIncremental = function (e, isSync) {
            var _this = this;
            var baselineTime = this.service.state.context.baselineTime;
            var d = e.data;
            switch (d.source) {
                case IncrementalSource.Mutation: {
                    d.removes.forEach(function (mutation) {
                        var target = mirror.getNode(mutation.id);
                        if (!target) {
                            return _this.warnNodeNotFound(d, mutation.id);
                        }
                        var parent = mirror.getNode(mutation.parentId);
                        if (!parent) {
                            return _this.warnNodeNotFound(d, mutation.parentId);
                        }
                        mirror.removeNodeFromMap(target);
                        if (parent) {
                            parent.removeChild(target);
                        }
                    });
                    var legacy_missingNodeMap_1 = __assign({}, this.legacy_missingNodeRetryMap);
                    var queue_1 = [];
                    var appendNode_1 = function (mutation) {
                        var parent = mirror.getNode(mutation.parentId);
                        if (!parent) {
                            return queue_1.push(mutation);
                        }
                        var previous = null;
                        var next = null;
                        if (mutation.previousId) {
                            previous = mirror.getNode(mutation.previousId);
                        }
                        if (mutation.nextId) {
                            next = mirror.getNode(mutation.nextId);
                        }
                        if (mutation.nextId !== null && mutation.nextId !== -1 && !next) {
                            return queue_1.push(mutation);
                        }
                        var target = buildNodeWithSN(mutation.node, _this.iframe.contentDocument, mirror.map, true);
                        if (mutation.previousId === -1 || mutation.nextId === -1) {
                            legacy_missingNodeMap_1[mutation.node.id] = {
                                node: target,
                                mutation: mutation,
                            };
                            return;
                        }
                        if (previous &&
                            previous.nextSibling &&
                            previous.nextSibling.parentNode) {
                            parent.insertBefore(target, previous.nextSibling);
                        }
                        else if (next && next.parentNode) {
                            parent.contains(next)
                                ? parent.insertBefore(target, next)
                                : parent.insertBefore(target, null);
                        }
                        else {
                            parent.appendChild(target);
                        }
                        if (mutation.previousId || mutation.nextId) {
                            _this.legacy_resolveMissingNode(legacy_missingNodeMap_1, parent, target, mutation);
                        }
                    };
                    d.adds.forEach(function (mutation) {
                        appendNode_1(mutation);
                    });
                    while (queue_1.length) {
                        if (queue_1.every(function (m) { return !Boolean(mirror.getNode(m.parentId)); })) {
                            return queue_1.forEach(function (m) { return _this.warnNodeNotFound(d, m.node.id); });
                        }
                        var mutation = queue_1.shift();
                        appendNode_1(mutation);
                    }
                    if (Object.keys(legacy_missingNodeMap_1).length) {
                        Object.assign(this.legacy_missingNodeRetryMap, legacy_missingNodeMap_1);
                    }
                    d.texts.forEach(function (mutation) {
                        var target = mirror.getNode(mutation.id);
                        if (!target) {
                            return _this.warnNodeNotFound(d, mutation.id);
                        }
                        target.textContent = mutation.value;
                    });
                    d.attributes.forEach(function (mutation) {
                        var target = mirror.getNode(mutation.id);
                        if (!target) {
                            return _this.warnNodeNotFound(d, mutation.id);
                        }
                        for (var attributeName in mutation.attributes) {
                            if (typeof attributeName === 'string') {
                                var value = mutation.attributes[attributeName];
                                if (value !== null) {
                                    target.setAttribute(attributeName, value);
                                }
                                else {
                                    target.removeAttribute(attributeName);
                                }
                            }
                        }
                    });
                    break;
                }
                case IncrementalSource.MouseMove:
                    if (isSync) {
                        var lastPosition = d.positions[d.positions.length - 1];
                        this.moveAndHover(d, lastPosition.x, lastPosition.y, lastPosition.id);
                    }
                    else {
                        d.positions.forEach(function (p) {
                            var action = {
                                doAction: function () {
                                    _this.moveAndHover(d, p.x, p.y, p.id);
                                },
                                delay: p.timeOffset + e.timestamp - baselineTime,
                            };
                            _this.timer.addAction(action);
                        });
                    }
                    break;
                case IncrementalSource.MouseInteraction: {
                    if (d.id === -1) {
                        break;
                    }
                    var event = new Event(MouseInteractions[d.type].toLowerCase());
                    var target = mirror.getNode(d.id);
                    if (!target) {
                        return this.debugNodeNotFound(d, d.id);
                    }
                    this.emitter.emit(ReplayerEvents.MouseInteraction, {
                        type: d.type,
                        target: target,
                    });
                    var triggerFocus = this.config.triggerFocus;
                    switch (d.type) {
                        case MouseInteractions.Blur:
                            if ('blur' in target) {
                                target.blur();
                            }
                            break;
                        case MouseInteractions.Focus:
                            if (triggerFocus && target.focus) {
                                target.focus({
                                    preventScroll: true,
                                });
                            }
                            break;
                        case MouseInteractions.Click:
                        case MouseInteractions.TouchStart:
                        case MouseInteractions.TouchEnd:
                            if (!isSync) {
                                this.moveAndHover(d, d.x, d.y, d.id);
                                this.mouse.classList.remove('active');
                                void this.mouse.offsetWidth;
                                this.mouse.classList.add('active');
                            }
                            break;
                        default:
                            target.dispatchEvent(event);
                    }
                    break;
                }
                case IncrementalSource.Scroll: {
                    if (d.id === -1) {
                        break;
                    }
                    var target = mirror.getNode(d.id);
                    if (!target) {
                        return this.debugNodeNotFound(d, d.id);
                    }
                    if (target === this.iframe.contentDocument) {
                        this.iframe.contentWindow.scrollTo({
                            top: d.y,
                            left: d.x,
                            behavior: isSync ? 'auto' : 'smooth',
                        });
                    }
                    else {
                        try {
                            target.scrollTop = d.y;
                            target.scrollLeft = d.x;
                        }
                        catch (error) {
                        }
                    }
                    break;
                }
                case IncrementalSource.ViewportResize:
                    this.emitter.emit(ReplayerEvents.Resize, {
                        width: d.width,
                        height: d.height,
                    });
                    break;
                case IncrementalSource.Input: {
                    if (d.id === -1) {
                        break;
                    }
                    var target = mirror.getNode(d.id);
                    if (!target) {
                        return this.debugNodeNotFound(d, d.id);
                    }
                    try {
                        target.checked = d.isChecked;
                        target.value = d.text;
                    }
                    catch (error) {
                    }
                    break;
                }
                case IncrementalSource.MediaInteraction: {
                    var target = mirror.getNode(d.id);
                    if (!target) {
                        return this.debugNodeNotFound(d, d.id);
                    }
                    var mediaEl_1 = target;
                    if (d.type === MediaInteractions.Pause) {
                        mediaEl_1.pause();
                    }
                    if (d.type === MediaInteractions.Play) {
                        if (mediaEl_1.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                            mediaEl_1.play();
                        }
                        else {
                            mediaEl_1.addEventListener('canplay', function () {
                                mediaEl_1.play();
                            });
                        }
                    }
                    break;
                }
                case IncrementalSource.StyleSheetRule: {
                    var target = mirror.getNode(d.id);
                    if (!target) {
                        return this.debugNodeNotFound(d, d.id);
                    }
                    var styleEl = target;
                    var styleSheet_1 = styleEl.sheet;
                    if (d.adds) {
                        d.adds.forEach(function (_a) {
                            var rule = _a.rule, index = _a.index;
                            var _index = index === undefined
                                ? undefined
                                : Math.min(index, styleSheet_1.rules.length);
                            try {
                                styleSheet_1.insertRule(rule, _index);
                            }
                            catch (e) {
                            }
                        });
                    }
                    if (d.removes) {
                        d.removes.forEach(function (_a) {
                            var index = _a.index;
                            styleSheet_1.deleteRule(index);
                        });
                    }
                    break;
                }
            }
        };
        Replayer.prototype.legacy_resolveMissingNode = function (map, parent, target, targetMutation) {
            var previousId = targetMutation.previousId, nextId = targetMutation.nextId;
            var previousInMap = previousId && map[previousId];
            var nextInMap = nextId && map[nextId];
            if (previousInMap) {
                var _a = previousInMap, node = _a.node, mutation = _a.mutation;
                parent.insertBefore(node, target);
                delete map[mutation.node.id];
                delete this.legacy_missingNodeRetryMap[mutation.node.id];
                if (mutation.previousId || mutation.nextId) {
                    this.legacy_resolveMissingNode(map, parent, node, mutation);
                }
            }
            if (nextInMap) {
                var _b = nextInMap, node = _b.node, mutation = _b.mutation;
                parent.insertBefore(node, target.nextSibling);
                delete map[mutation.node.id];
                delete this.legacy_missingNodeRetryMap[mutation.node.id];
                if (mutation.previousId || mutation.nextId) {
                    this.legacy_resolveMissingNode(map, parent, node, mutation);
                }
            }
        };
        Replayer.prototype.moveAndHover = function (d, x, y, id) {
            this.mouse.style.left = x + "px";
            this.mouse.style.top = y + "px";
            var target = mirror.getNode(id);
            if (!target) {
                return this.debugNodeNotFound(d, id);
            }
            this.hoverElements(target);
        };
        Replayer.prototype.hoverElements = function (el) {
            this.iframe
                .contentDocument.querySelectorAll('.\\:hover')
                .forEach(function (hoveredEl) {
                hoveredEl.classList.remove(':hover');
            });
            var currentEl = el;
            while (currentEl) {
                if (currentEl.classList) {
                    currentEl.classList.add(':hover');
                }
                currentEl = currentEl.parentElement;
            }
        };
        Replayer.prototype.isUserInteraction = function (event) {
            if (event.type !== EventType.IncrementalSnapshot) {
                return false;
            }
            return (event.data.source > IncrementalSource.Mutation &&
                event.data.source <= IncrementalSource.Input);
        };
        Replayer.prototype.restoreSpeed = function () {
            if (this.noramlSpeed === -1) {
                return;
            }
            var payload = { speed: this.noramlSpeed };
            this.setConfig(payload);
            this.emitter.emit(ReplayerEvents.SkipEnd, payload);
            this.noramlSpeed = -1;
        };
        Replayer.prototype.warnNodeNotFound = function (d, id) {
            if (!this.config.showWarning) {
                return;
            }
            console.warn(REPLAY_CONSOLE_PREFIX, "Node with id '" + id + "' not found in", d);
        };
        Replayer.prototype.debugNodeNotFound = function (d, id) {
            if (!this.config.showDebug) {
                return;
            }
            console.log(REPLAY_CONSOLE_PREFIX, "Node with id '" + id + "' not found in", d);
        };
        return Replayer;
    }());

    exports.Replayer = Replayer;

    return exports;

}({}));
