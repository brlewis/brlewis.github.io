(function () {
'use strict';

function Vnode(tag, key, attrs, children, text, dom) {
	return {tag: tag, key: key, attrs: attrs, children: children, text: text, dom: dom, domSize: undefined, state: undefined, _state: undefined, events: undefined, instance: undefined, skip: false}
}
Vnode.normalize = function(node) {
	if (Array.isArray(node)) return Vnode("[", undefined, undefined, Vnode.normalizeChildren(node), undefined, undefined)
	if (node != null && typeof node !== "object") return Vnode("#", undefined, undefined, node === false ? "" : node, undefined, undefined)
	return node
};
Vnode.normalizeChildren = function normalizeChildren(children) {
	for (var i = 0; i < children.length; i++) {
		children[i] = Vnode.normalize(children[i]);
	}
	return children
};

var vnode = Vnode;

var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g;
var selectorCache = {};
var hasOwn = {}.hasOwnProperty;

function compileSelector(selector) {
	var match, tag = "div", classes = [], attrs = {};
	while (match = selectorParser.exec(selector)) {
		var type = match[1], value = match[2];
		if (type === "" && value !== "") tag = value;
		else if (type === "#") attrs.id = value;
		else if (type === ".") classes.push(value);
		else if (match[3][0] === "[") {
			var attrValue = match[6];
			if (attrValue) attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\");
			if (match[4] === "class") classes.push(attrValue);
			else attrs[match[4]] = attrValue || true;
		}
	}
	if (classes.length > 0) attrs.className = classes.join(" ");
	return selectorCache[selector] = {tag: tag, attrs: attrs}
}

function execSelector(state, attrs, children) {
	var hasAttrs = false, childList, text;
	var className = attrs.className || attrs.class;

	for (var key in state.attrs) {
		if (hasOwn.call(state.attrs, key)) {
			attrs[key] = state.attrs[key];
		}
	}

	if (className !== undefined) {
		if (attrs.class !== undefined) {
			attrs.class = undefined;
			attrs.className = className;
		}

		if (state.attrs.className != null) {
			attrs.className = state.attrs.className + " " + className;
		}
	}

	for (var key in attrs) {
		if (hasOwn.call(attrs, key) && key !== "key") {
			hasAttrs = true;
			break
		}
	}

	if (Array.isArray(children) && children.length === 1 && children[0] != null && children[0].tag === "#") {
		text = children[0].children;
	} else {
		childList = children;
	}

	return vnode(state.tag, attrs.key, hasAttrs ? attrs : undefined, childList, text)
}

function hyperscript(selector) {
	// Because sloppy mode sucks
	var attrs = arguments[1], start = 2, children;

	if (selector == null || typeof selector !== "string" && typeof selector !== "function" && typeof selector.view !== "function") {
		throw Error("The selector must be either a string or a component.");
	}

	if (typeof selector === "string") {
		var cached = selectorCache[selector] || compileSelector(selector);
	}

	if (attrs == null) {
		attrs = {};
	} else if (typeof attrs !== "object" || attrs.tag != null || Array.isArray(attrs)) {
		attrs = {};
		start = 1;
	}

	if (arguments.length === start + 1) {
		children = arguments[start];
		if (!Array.isArray(children)) children = [children];
	} else {
		children = [];
		while (start < arguments.length) children.push(arguments[start++]);
	}

	var normalized = vnode.normalizeChildren(children);

	if (typeof selector === "string") {
		return execSelector(cached, attrs, normalized)
	} else {
		return vnode(selector, attrs.key, attrs, normalized)
	}
}

var hyperscript_1$2 = hyperscript;

var trust = function(html) {
	if (html == null) html = "";
	return vnode("<", undefined, undefined, html, undefined, undefined)
};

var fragment = function(attrs, children) {
	return vnode("[", attrs.key, attrs, vnode.normalizeChildren(children), undefined, undefined)
};

hyperscript_1$2.trust = trust;
hyperscript_1$2.fragment = fragment;

var hyperscript_1 = hyperscript_1$2;

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var promise = createCommonjsModule(function (module) {
"use strict";
/** @constructor */
var PromisePolyfill = function(executor) {
	if (!(this instanceof PromisePolyfill)) throw new Error("Promise must be called with `new`")
	if (typeof executor !== "function") throw new TypeError("executor must be a function")

	var self = this, resolvers = [], rejectors = [], resolveCurrent = handler(resolvers, true), rejectCurrent = handler(rejectors, false);
	var instance = self._instance = {resolvers: resolvers, rejectors: rejectors};
	var callAsync = typeof setImmediate === "function" ? setImmediate : setTimeout;
	function handler(list, shouldAbsorb) {
		return function execute(value) {
			var then;
			try {
				if (shouldAbsorb && value != null && (typeof value === "object" || typeof value === "function") && typeof (then = value.then) === "function") {
					if (value === self) throw new TypeError("Promise can't be resolved w/ itself")
					executeOnce(then.bind(value));
				}
				else {
					callAsync(function() {
						if (!shouldAbsorb && list.length === 0) console.error("Possible unhandled promise rejection:", value);
						for (var i = 0; i < list.length; i++) list[i](value);
						resolvers.length = 0, rejectors.length = 0;
						instance.state = shouldAbsorb;
						instance.retry = function() {execute(value);};
					});
				}
			}
			catch (e) {
				rejectCurrent(e);
			}
		}
	}
	function executeOnce(then) {
		var runs = 0;
		function run(fn) {
			return function(value) {
				if (runs++ > 0) return
				fn(value);
			}
		}
		var onerror = run(rejectCurrent);
		try {then(run(resolveCurrent), onerror);} catch (e) {onerror(e);}
	}

	executeOnce(executor);
};
PromisePolyfill.prototype.then = function(onFulfilled, onRejection) {
	var self = this, instance = self._instance;
	function handle(callback, list, next, state) {
		list.push(function(value) {
			if (typeof callback !== "function") next(value);
			else try {resolveNext(callback(value));} catch (e) {if (rejectNext) rejectNext(e);}
		});
		if (typeof instance.retry === "function" && state === instance.state) instance.retry();
	}
	var resolveNext, rejectNext;
	var promise = new PromisePolyfill(function(resolve, reject) {resolveNext = resolve, rejectNext = reject;});
	handle(onFulfilled, instance.resolvers, resolveNext, true), handle(onRejection, instance.rejectors, rejectNext, false);
	return promise
};
PromisePolyfill.prototype.catch = function(onRejection) {
	return this.then(null, onRejection)
};
PromisePolyfill.resolve = function(value) {
	if (value instanceof PromisePolyfill) return value
	return new PromisePolyfill(function(resolve) {resolve(value);})
};
PromisePolyfill.reject = function(value) {
	return new PromisePolyfill(function(resolve, reject) {reject(value);})
};
PromisePolyfill.all = function(list) {
	return new PromisePolyfill(function(resolve, reject) {
		var total = list.length, count = 0, values = [];
		if (list.length === 0) resolve([]);
		else for (var i = 0; i < list.length; i++) {
			(function(i) {
				function consume(value) {
					count++;
					values[i] = value;
					if (count === total) resolve(values);
				}
				if (list[i] != null && (typeof list[i] === "object" || typeof list[i] === "function") && typeof list[i].then === "function") {
					list[i].then(consume, reject);
				}
				else consume(list[i]);
			})(i);
		}
	})
};
PromisePolyfill.race = function(list) {
	return new PromisePolyfill(function(resolve, reject) {
		for (var i = 0; i < list.length; i++) {
			list[i].then(resolve, reject);
		}
	})
};

if (typeof window !== "undefined") {
	if (typeof window.Promise === "undefined") window.Promise = PromisePolyfill;
	module.exports = window.Promise;
} else if (typeof commonjsGlobal !== "undefined") {
	if (typeof commonjsGlobal.Promise === "undefined") commonjsGlobal.Promise = PromisePolyfill;
	module.exports = commonjsGlobal.Promise;
} else {
	module.exports = PromisePolyfill;
}
});

var build = function(object) {
	if (Object.prototype.toString.call(object) !== "[object Object]") return ""

	var args = [];
	for (var key in object) {
		destructure(key, object[key]);
	}

	return args.join("&")

	function destructure(key, value) {
		if (Array.isArray(value)) {
			for (var i = 0; i < value.length; i++) {
				destructure(key + "[" + i + "]", value[i]);
			}
		}
		else if (Object.prototype.toString.call(value) === "[object Object]") {
			for (var i in value) {
				destructure(key + "[" + i + "]", value[i]);
			}
		}
		else args.push(encodeURIComponent(key) + (value != null && value !== "" ? "=" + encodeURIComponent(value) : ""));
	}
};

var FILE_PROTOCOL_REGEX = new RegExp("^file://", "i");

var request$2 = function($window, Promise) {
	var callbackCount = 0;

	var oncompletion;
	function setCompletionCallback(callback) {oncompletion = callback;}

	function finalizer() {
		var count = 0;
		function complete() {if (--count === 0 && typeof oncompletion === "function") oncompletion();}

		return function finalize(promise) {
			var then = promise.then;
			promise.then = function() {
				count++;
				var next = then.apply(promise, arguments);
				next.then(complete, function(e) {
					complete();
					if (count === 0) throw e
				});
				return finalize(next)
			};
			return promise
		}
	}
	function normalize(args, extra) {
		if (typeof args === "string") {
			var url = args;
			args = extra || {};
			if (args.url == null) args.url = url;
		}
		return args
	}

	function request(args, extra) {
		var finalize = finalizer();
		args = normalize(args, extra);

		var promise = new Promise(function(resolve, reject) {
			if (args.method == null) args.method = "GET";
			args.method = args.method.toUpperCase();

			var useBody = (args.method === "GET" || args.method === "TRACE") ? false : (typeof args.useBody === "boolean" ? args.useBody : true);

			if (typeof args.serialize !== "function") args.serialize = typeof FormData !== "undefined" && args.data instanceof FormData ? function(value) {return value} : JSON.stringify;
			if (typeof args.deserialize !== "function") args.deserialize = deserialize;
			if (typeof args.extract !== "function") args.extract = extract;

			args.url = interpolate(args.url, args.data);
			if (useBody) args.data = args.serialize(args.data);
			else args.url = assemble(args.url, args.data);

			var xhr = new $window.XMLHttpRequest(),
				aborted = false,
				_abort = xhr.abort;


			xhr.abort = function abort() {
				aborted = true;
				_abort.call(xhr);
			};

			xhr.open(args.method, args.url, typeof args.async === "boolean" ? args.async : true, typeof args.user === "string" ? args.user : undefined, typeof args.password === "string" ? args.password : undefined);

			if (args.serialize === JSON.stringify && useBody) {
				xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
			}
			if (args.deserialize === deserialize) {
				xhr.setRequestHeader("Accept", "application/json, text/*");
			}
			if (args.withCredentials) xhr.withCredentials = args.withCredentials;

			for (var key in args.headers) if ({}.hasOwnProperty.call(args.headers, key)) {
				xhr.setRequestHeader(key, args.headers[key]);
			}

			if (typeof args.config === "function") xhr = args.config(xhr, args) || xhr;

			xhr.onreadystatechange = function() {
				// Don't throw errors on xhr.abort().
				if(aborted) return

				if (xhr.readyState === 4) {
					try {
						var response = (args.extract !== extract) ? args.extract(xhr, args) : args.deserialize(args.extract(xhr, args));
						if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304 || FILE_PROTOCOL_REGEX.test(args.url)) {
							resolve(cast(args.type, response));
						}
						else {
							var error = new Error(xhr.responseText);
							for (var key in response) error[key] = response[key];
							reject(error);
						}
					}
					catch (e) {
						reject(e);
					}
				}
			};

			if (useBody && (args.data != null)) xhr.send(args.data);
			else xhr.send();
		});
		return args.background === true ? promise : finalize(promise)
	}

	function jsonp(args, extra) {
		var finalize = finalizer();
		args = normalize(args, extra);

		var promise = new Promise(function(resolve, reject) {
			var callbackName = args.callbackName || "_mithril_" + Math.round(Math.random() * 1e16) + "_" + callbackCount++;
			var script = $window.document.createElement("script");
			$window[callbackName] = function(data) {
				script.parentNode.removeChild(script);
				resolve(cast(args.type, data));
				delete $window[callbackName];
			};
			script.onerror = function() {
				script.parentNode.removeChild(script);
				reject(new Error("JSONP request failed"));
				delete $window[callbackName];
			};
			if (args.data == null) args.data = {};
			args.url = interpolate(args.url, args.data);
			args.data[args.callbackKey || "callback"] = callbackName;
			script.src = assemble(args.url, args.data);
			$window.document.documentElement.appendChild(script);
		});
		return args.background === true? promise : finalize(promise)
	}

	function interpolate(url, data) {
		if (data == null) return url

		var tokens = url.match(/:[^\/]+/gi) || [];
		for (var i = 0; i < tokens.length; i++) {
			var key = tokens[i].slice(1);
			if (data[key] != null) {
				url = url.replace(tokens[i], data[key]);
			}
		}
		return url
	}

	function assemble(url, data) {
		var querystring = build(data);
		if (querystring !== "") {
			var prefix = url.indexOf("?") < 0 ? "?" : "&";
			url += prefix + querystring;
		}
		return url
	}

	function deserialize(data) {
		try {return data !== "" ? JSON.parse(data) : null}
		catch (e) {throw new Error(data)}
	}

	function extract(xhr) {return xhr.responseText}

	function cast(type, data) {
		if (typeof type === "function") {
			if (Array.isArray(data)) {
				for (var i = 0; i < data.length; i++) {
					data[i] = new type(data[i]);
				}
			}
			else return new type(data)
		}
		return data
	}

	return {request: request, jsonp: jsonp, setCompletionCallback: setCompletionCallback}
};

var request = request$2(window, promise);

var render = function($window) {
	var $doc = $window.document;
	var $emptyFragment = $doc.createDocumentFragment();

	var onevent;
	function setEventCallback(callback) {return onevent = callback}

	//create
	function createNodes(parent, vnodes, start, end, hooks, nextSibling, ns) {
		for (var i = start; i < end; i++) {
			var vnode$$1 = vnodes[i];
			if (vnode$$1 != null) {
				createNode(parent, vnode$$1, hooks, ns, nextSibling);
			}
		}
	}
	function createNode(parent, vnode$$1, hooks, ns, nextSibling) {
		var tag = vnode$$1.tag;
		if (typeof tag === "string") {
			vnode$$1.state = {};
			if (vnode$$1.attrs != null) initLifecycle(vnode$$1.attrs, vnode$$1, hooks);
			switch (tag) {
				case "#": return createText(parent, vnode$$1, nextSibling)
				case "<": return createHTML(parent, vnode$$1, nextSibling)
				case "[": return createFragment(parent, vnode$$1, hooks, ns, nextSibling)
				default: return createElement(parent, vnode$$1, hooks, ns, nextSibling)
			}
		}
		else return createComponent(parent, vnode$$1, hooks, ns, nextSibling)
	}
	function createText(parent, vnode$$1, nextSibling) {
		vnode$$1.dom = $doc.createTextNode(vnode$$1.children);
		insertNode(parent, vnode$$1.dom, nextSibling);
		return vnode$$1.dom
	}
	function createHTML(parent, vnode$$1, nextSibling) {
		var match = vnode$$1.children.match(/^\s*?<(\w+)/im) || [];
		var parent1 = {caption: "table", thead: "table", tbody: "table", tfoot: "table", tr: "tbody", th: "tr", td: "tr", colgroup: "table", col: "colgroup"}[match[1]] || "div";
		var temp = $doc.createElement(parent1);

		temp.innerHTML = vnode$$1.children;
		vnode$$1.dom = temp.firstChild;
		vnode$$1.domSize = temp.childNodes.length;
		var fragment = $doc.createDocumentFragment();
		var child;
		while (child = temp.firstChild) {
			fragment.appendChild(child);
		}
		insertNode(parent, fragment, nextSibling);
		return fragment
	}
	function createFragment(parent, vnode$$1, hooks, ns, nextSibling) {
		var fragment = $doc.createDocumentFragment();
		if (vnode$$1.children != null) {
			var children = vnode$$1.children;
			createNodes(fragment, children, 0, children.length, hooks, null, ns);
		}
		vnode$$1.dom = fragment.firstChild;
		vnode$$1.domSize = fragment.childNodes.length;
		insertNode(parent, fragment, nextSibling);
		return fragment
	}
	function createElement(parent, vnode$$1, hooks, ns, nextSibling) {
		var tag = vnode$$1.tag;
		switch (vnode$$1.tag) {
			case "svg": ns = "http://www.w3.org/2000/svg"; break
			case "math": ns = "http://www.w3.org/1998/Math/MathML"; break
		}

		var attrs = vnode$$1.attrs;
		var is = attrs && attrs.is;

		var element = ns ?
			is ? $doc.createElementNS(ns, tag, {is: is}) : $doc.createElementNS(ns, tag) :
			is ? $doc.createElement(tag, {is: is}) : $doc.createElement(tag);
		vnode$$1.dom = element;

		if (attrs != null) {
			setAttrs(vnode$$1, attrs, ns);
		}

		insertNode(parent, element, nextSibling);

		if (vnode$$1.attrs != null && vnode$$1.attrs.contenteditable != null) {
			setContentEditable(vnode$$1);
		}
		else {
			if (vnode$$1.text != null) {
				if (vnode$$1.text !== "") element.textContent = vnode$$1.text;
				else vnode$$1.children = [vnode("#", undefined, undefined, vnode$$1.text, undefined, undefined)];
			}
			if (vnode$$1.children != null) {
				var children = vnode$$1.children;
				createNodes(element, children, 0, children.length, hooks, null, ns);
				setLateAttrs(vnode$$1);
			}
		}
		return element
	}
	function initComponent(vnode$$1, hooks) {
		var sentinel;
		if (typeof vnode$$1.tag.view === "function") {
			vnode$$1.state = Object.create(vnode$$1.tag);
			sentinel = vnode$$1.state.view;
			if (sentinel.$$reentrantLock$$ != null) return $emptyFragment
			sentinel.$$reentrantLock$$ = true;
		} else {
			vnode$$1.state = void 0;
			sentinel = vnode$$1.tag;
			if (sentinel.$$reentrantLock$$ != null) return $emptyFragment
			sentinel.$$reentrantLock$$ = true;
			vnode$$1.state = (vnode$$1.tag.prototype != null && typeof vnode$$1.tag.prototype.view === "function") ? new vnode$$1.tag(vnode$$1) : vnode$$1.tag(vnode$$1);
		}
		vnode$$1._state = vnode$$1.state;
		if (vnode$$1.attrs != null) initLifecycle(vnode$$1.attrs, vnode$$1, hooks);
		initLifecycle(vnode$$1._state, vnode$$1, hooks);
		vnode$$1.instance = vnode.normalize(vnode$$1._state.view.call(vnode$$1.state, vnode$$1));
		if (vnode$$1.instance === vnode$$1) throw Error("A view cannot return the vnode it received as argument")
		sentinel.$$reentrantLock$$ = null;
	}
	function createComponent(parent, vnode$$1, hooks, ns, nextSibling) {
		initComponent(vnode$$1, hooks);
		if (vnode$$1.instance != null) {
			var element = createNode(parent, vnode$$1.instance, hooks, ns, nextSibling);
			vnode$$1.dom = vnode$$1.instance.dom;
			vnode$$1.domSize = vnode$$1.dom != null ? vnode$$1.instance.domSize : 0;
			insertNode(parent, element, nextSibling);
			return element
		}
		else {
			vnode$$1.domSize = 0;
			return $emptyFragment
		}
	}

	//update
	function updateNodes(parent, old, vnodes, recycling, hooks, nextSibling, ns) {
		if (old === vnodes || old == null && vnodes == null) return
		else if (old == null) createNodes(parent, vnodes, 0, vnodes.length, hooks, nextSibling, undefined);
		else if (vnodes == null) removeNodes(old, 0, old.length, vnodes);
		else {
			if (old.length === vnodes.length) {
				var isUnkeyed = false;
				for (var i = 0; i < vnodes.length; i++) {
					if (vnodes[i] != null && old[i] != null) {
						isUnkeyed = vnodes[i].key == null && old[i].key == null;
						break
					}
				}
				if (isUnkeyed) {
					for (var i = 0; i < old.length; i++) {
						if (old[i] === vnodes[i]) continue
						else if (old[i] == null && vnodes[i] != null) createNode(parent, vnodes[i], hooks, ns, getNextSibling(old, i + 1, nextSibling));
						else if (vnodes[i] == null) removeNodes(old, i, i + 1, vnodes);
						else updateNode(parent, old[i], vnodes[i], hooks, getNextSibling(old, i + 1, nextSibling), recycling, ns);
					}
					return
				}
			}
			recycling = recycling || isRecyclable(old, vnodes);
			if (recycling) {
				var pool = old.pool;
				old = old.concat(old.pool);
			}

			var oldStart = 0, start = 0, oldEnd = old.length - 1, end = vnodes.length - 1, map;
			while (oldEnd >= oldStart && end >= start) {
				var o = old[oldStart], v = vnodes[start];
				if (o === v && !recycling) oldStart++, start++;
				else if (o == null) oldStart++;
				else if (v == null) start++;
				else if (o.key === v.key) {
					var shouldRecycle = (pool != null && oldStart >= old.length - pool.length) || ((pool == null) && recycling);
					oldStart++, start++;
					updateNode(parent, o, v, hooks, getNextSibling(old, oldStart, nextSibling), shouldRecycle, ns);
					if (recycling && o.tag === v.tag) insertNode(parent, toFragment(o), nextSibling);
				}
				else {
					var o = old[oldEnd];
					if (o === v && !recycling) oldEnd--, start++;
					else if (o == null) oldEnd--;
					else if (v == null) start++;
					else if (o.key === v.key) {
						var shouldRecycle = (pool != null && oldEnd >= old.length - pool.length) || ((pool == null) && recycling);
						updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), shouldRecycle, ns);
						if (recycling || start < end) insertNode(parent, toFragment(o), getNextSibling(old, oldStart, nextSibling));
						oldEnd--, start++;
					}
					else break
				}
			}
			while (oldEnd >= oldStart && end >= start) {
				var o = old[oldEnd], v = vnodes[end];
				if (o === v && !recycling) oldEnd--, end--;
				else if (o == null) oldEnd--;
				else if (v == null) end--;
				else if (o.key === v.key) {
					var shouldRecycle = (pool != null && oldEnd >= old.length - pool.length) || ((pool == null) && recycling);
					updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), shouldRecycle, ns);
					if (recycling && o.tag === v.tag) insertNode(parent, toFragment(o), nextSibling);
					if (o.dom != null) nextSibling = o.dom;
					oldEnd--, end--;
				}
				else {
					if (!map) map = getKeyMap(old, oldEnd);
					if (v != null) {
						var oldIndex = map[v.key];
						if (oldIndex != null) {
							var movable = old[oldIndex];
							var shouldRecycle = (pool != null && oldIndex >= old.length - pool.length) || ((pool == null) && recycling);
							updateNode(parent, movable, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling, ns);
							insertNode(parent, toFragment(movable), nextSibling);
							old[oldIndex].skip = true;
							if (movable.dom != null) nextSibling = movable.dom;
						}
						else {
							var dom = createNode(parent, v, hooks, undefined, nextSibling);
							nextSibling = dom;
						}
					}
					end--;
				}
				if (end < start) break
			}
			createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, ns);
			removeNodes(old, oldStart, oldEnd + 1, vnodes);
		}
	}
	function updateNode(parent, old, vnode$$1, hooks, nextSibling, recycling, ns) {
		var oldTag = old.tag, tag = vnode$$1.tag;
		if (oldTag === tag) {
			vnode$$1.state = old.state;
			vnode$$1._state = old._state;
			vnode$$1.events = old.events;
			if (!recycling && shouldNotUpdate(vnode$$1, old)) return
			if (typeof oldTag === "string") {
				if (vnode$$1.attrs != null) {
					if (recycling) {
						vnode$$1.state = {};
						initLifecycle(vnode$$1.attrs, vnode$$1, hooks);
					}
					else updateLifecycle(vnode$$1.attrs, vnode$$1, hooks);
				}
				switch (oldTag) {
					case "#": updateText(old, vnode$$1); break
					case "<": updateHTML(parent, old, vnode$$1, nextSibling); break
					case "[": updateFragment(parent, old, vnode$$1, recycling, hooks, nextSibling, ns); break
					default: updateElement(old, vnode$$1, recycling, hooks, ns);
				}
			}
			else updateComponent(parent, old, vnode$$1, hooks, nextSibling, recycling, ns);
		}
		else {
			removeNode(old, null);
			createNode(parent, vnode$$1, hooks, ns, nextSibling);
		}
	}
	function updateText(old, vnode$$1) {
		if (old.children.toString() !== vnode$$1.children.toString()) {
			old.dom.nodeValue = vnode$$1.children;
		}
		vnode$$1.dom = old.dom;
	}
	function updateHTML(parent, old, vnode$$1, nextSibling) {
		if (old.children !== vnode$$1.children) {
			toFragment(old);
			createHTML(parent, vnode$$1, nextSibling);
		}
		else vnode$$1.dom = old.dom, vnode$$1.domSize = old.domSize;
	}
	function updateFragment(parent, old, vnode$$1, recycling, hooks, nextSibling, ns) {
		updateNodes(parent, old.children, vnode$$1.children, recycling, hooks, nextSibling, ns);
		var domSize = 0, children = vnode$$1.children;
		vnode$$1.dom = null;
		if (children != null) {
			for (var i = 0; i < children.length; i++) {
				var child = children[i];
				if (child != null && child.dom != null) {
					if (vnode$$1.dom == null) vnode$$1.dom = child.dom;
					domSize += child.domSize || 1;
				}
			}
			if (domSize !== 1) vnode$$1.domSize = domSize;
		}
	}
	function updateElement(old, vnode$$1, recycling, hooks, ns) {
		var element = vnode$$1.dom = old.dom;
		switch (vnode$$1.tag) {
			case "svg": ns = "http://www.w3.org/2000/svg"; break
			case "math": ns = "http://www.w3.org/1998/Math/MathML"; break
		}
		if (vnode$$1.tag === "textarea") {
			if (vnode$$1.attrs == null) vnode$$1.attrs = {};
			if (vnode$$1.text != null) {
				vnode$$1.attrs.value = vnode$$1.text; //FIXME handle multiple children
				vnode$$1.text = undefined;
			}
		}
		updateAttrs(vnode$$1, old.attrs, vnode$$1.attrs, ns);
		if (vnode$$1.attrs != null && vnode$$1.attrs.contenteditable != null) {
			setContentEditable(vnode$$1);
		}
		else if (old.text != null && vnode$$1.text != null && vnode$$1.text !== "") {
			if (old.text.toString() !== vnode$$1.text.toString()) old.dom.firstChild.nodeValue = vnode$$1.text;
		}
		else {
			if (old.text != null) old.children = [vnode("#", undefined, undefined, old.text, undefined, old.dom.firstChild)];
			if (vnode$$1.text != null) vnode$$1.children = [vnode("#", undefined, undefined, vnode$$1.text, undefined, undefined)];
			updateNodes(element, old.children, vnode$$1.children, recycling, hooks, null, ns);
		}
	}
	function updateComponent(parent, old, vnode$$1, hooks, nextSibling, recycling, ns) {
		if (recycling) {
			initComponent(vnode$$1, hooks);
		} else {
			vnode$$1.instance = vnode.normalize(vnode$$1._state.view.call(vnode$$1.state, vnode$$1));
			if (vnode$$1.instance === vnode$$1) throw Error("A view cannot return the vnode it received as argument")
			if (vnode$$1.attrs != null) updateLifecycle(vnode$$1.attrs, vnode$$1, hooks);
			updateLifecycle(vnode$$1._state, vnode$$1, hooks);
		}
		if (vnode$$1.instance != null) {
			if (old.instance == null) createNode(parent, vnode$$1.instance, hooks, ns, nextSibling);
			else updateNode(parent, old.instance, vnode$$1.instance, hooks, nextSibling, recycling, ns);
			vnode$$1.dom = vnode$$1.instance.dom;
			vnode$$1.domSize = vnode$$1.instance.domSize;
		}
		else if (old.instance != null) {
			removeNode(old.instance, null);
			vnode$$1.dom = undefined;
			vnode$$1.domSize = 0;
		}
		else {
			vnode$$1.dom = old.dom;
			vnode$$1.domSize = old.domSize;
		}
	}
	function isRecyclable(old, vnodes) {
		if (old.pool != null && Math.abs(old.pool.length - vnodes.length) <= Math.abs(old.length - vnodes.length)) {
			var oldChildrenLength = old[0] && old[0].children && old[0].children.length || 0;
			var poolChildrenLength = old.pool[0] && old.pool[0].children && old.pool[0].children.length || 0;
			var vnodesChildrenLength = vnodes[0] && vnodes[0].children && vnodes[0].children.length || 0;
			if (Math.abs(poolChildrenLength - vnodesChildrenLength) <= Math.abs(oldChildrenLength - vnodesChildrenLength)) {
				return true
			}
		}
		return false
	}
	function getKeyMap(vnodes, end) {
		var map = {}, i = 0;
		for (var i = 0; i < end; i++) {
			var vnode$$1 = vnodes[i];
			if (vnode$$1 != null) {
				var key = vnode$$1.key;
				if (key != null) map[key] = i;
			}
		}
		return map
	}
	function toFragment(vnode$$1) {
		var count = vnode$$1.domSize;
		if (count != null || vnode$$1.dom == null) {
			var fragment = $doc.createDocumentFragment();
			if (count > 0) {
				var dom = vnode$$1.dom;
				while (--count) fragment.appendChild(dom.nextSibling);
				fragment.insertBefore(dom, fragment.firstChild);
			}
			return fragment
		}
		else return vnode$$1.dom
	}
	function getNextSibling(vnodes, i, nextSibling) {
		for (; i < vnodes.length; i++) {
			if (vnodes[i] != null && vnodes[i].dom != null) return vnodes[i].dom
		}
		return nextSibling
	}

	function insertNode(parent, dom, nextSibling) {
		if (nextSibling && nextSibling.parentNode) parent.insertBefore(dom, nextSibling);
		else parent.appendChild(dom);
	}

	function setContentEditable(vnode$$1) {
		var children = vnode$$1.children;
		if (children != null && children.length === 1 && children[0].tag === "<") {
			var content = children[0].children;
			if (vnode$$1.dom.innerHTML !== content) vnode$$1.dom.innerHTML = content;
		}
		else if (vnode$$1.text != null || children != null && children.length !== 0) throw new Error("Child node of a contenteditable must be trusted")
	}

	//remove
	function removeNodes(vnodes, start, end, context) {
		for (var i = start; i < end; i++) {
			var vnode$$1 = vnodes[i];
			if (vnode$$1 != null) {
				if (vnode$$1.skip) vnode$$1.skip = false;
				else removeNode(vnode$$1, context);
			}
		}
	}
	function removeNode(vnode$$1, context) {
		var expected = 1, called = 0;
		if (vnode$$1.attrs && typeof vnode$$1.attrs.onbeforeremove === "function") {
			var result = vnode$$1.attrs.onbeforeremove.call(vnode$$1.state, vnode$$1);
			if (result != null && typeof result.then === "function") {
				expected++;
				result.then(continuation, continuation);
			}
		}
		if (typeof vnode$$1.tag !== "string" && typeof vnode$$1._state.onbeforeremove === "function") {
			var result = vnode$$1._state.onbeforeremove.call(vnode$$1.state, vnode$$1);
			if (result != null && typeof result.then === "function") {
				expected++;
				result.then(continuation, continuation);
			}
		}
		continuation();
		function continuation() {
			if (++called === expected) {
				onremove(vnode$$1);
				if (vnode$$1.dom) {
					var count = vnode$$1.domSize || 1;
					if (count > 1) {
						var dom = vnode$$1.dom;
						while (--count) {
							removeNodeFromDOM(dom.nextSibling);
						}
					}
					removeNodeFromDOM(vnode$$1.dom);
					if (context != null && vnode$$1.domSize == null && !hasIntegrationMethods(vnode$$1.attrs) && typeof vnode$$1.tag === "string") { //TODO test custom elements
						if (!context.pool) context.pool = [vnode$$1];
						else context.pool.push(vnode$$1);
					}
				}
			}
		}
	}
	function removeNodeFromDOM(node) {
		var parent = node.parentNode;
		if (parent != null) parent.removeChild(node);
	}
	function onremove(vnode$$1) {
		if (vnode$$1.attrs && typeof vnode$$1.attrs.onremove === "function") vnode$$1.attrs.onremove.call(vnode$$1.state, vnode$$1);
		if (typeof vnode$$1.tag !== "string" && typeof vnode$$1._state.onremove === "function") vnode$$1._state.onremove.call(vnode$$1.state, vnode$$1);
		if (vnode$$1.instance != null) onremove(vnode$$1.instance);
		else {
			var children = vnode$$1.children;
			if (Array.isArray(children)) {
				for (var i = 0; i < children.length; i++) {
					var child = children[i];
					if (child != null) onremove(child);
				}
			}
		}
	}

	//attrs
	function setAttrs(vnode$$1, attrs, ns) {
		for (var key in attrs) {
			setAttr(vnode$$1, key, null, attrs[key], ns);
		}
	}
	function setAttr(vnode$$1, key, old, value, ns) {
		var element = vnode$$1.dom;
		if (key === "key" || key === "is" || (old === value && !isFormAttribute(vnode$$1, key)) && typeof value !== "object" || typeof value === "undefined" || isLifecycleMethod(key)) return
		var nsLastIndex = key.indexOf(":");
		if (nsLastIndex > -1 && key.substr(0, nsLastIndex) === "xlink") {
			element.setAttributeNS("http://www.w3.org/1999/xlink", key.slice(nsLastIndex + 1), value);
		}
		else if (key[0] === "o" && key[1] === "n" && typeof value === "function") updateEvent(vnode$$1, key, value);
		else if (key === "style") updateStyle(element, old, value);
		else if (key in element && !isAttribute(key) && ns === undefined && !isCustomElement(vnode$$1)) {
			//setting input[value] to same value by typing on focused element moves cursor to end in Chrome
			if (vnode$$1.tag === "input" && key === "value" && vnode$$1.dom.value == value && vnode$$1.dom === $doc.activeElement) return
			//setting select[value] to same value while having select open blinks select dropdown in Chrome
			if (vnode$$1.tag === "select" && key === "value" && vnode$$1.dom.value == value && vnode$$1.dom === $doc.activeElement) return
			//setting option[value] to same value while having select open blinks select dropdown in Chrome
			if (vnode$$1.tag === "option" && key === "value" && vnode$$1.dom.value == value) return
			// If you assign an input type that is not supported by IE 11 with an assignment expression, an error will occur.
			if (vnode$$1.tag === "input" && key === "type") {
				element.setAttribute(key, value);
				return
			}
			element[key] = value;
		}
		else {
			if (typeof value === "boolean") {
				if (value) element.setAttribute(key, "");
				else element.removeAttribute(key);
			}
			else element.setAttribute(key === "className" ? "class" : key, value);
		}
	}
	function setLateAttrs(vnode$$1) {
		var attrs = vnode$$1.attrs;
		if (vnode$$1.tag === "select" && attrs != null) {
			if ("value" in attrs) setAttr(vnode$$1, "value", null, attrs.value, undefined);
			if ("selectedIndex" in attrs) setAttr(vnode$$1, "selectedIndex", null, attrs.selectedIndex, undefined);
		}
	}
	function updateAttrs(vnode$$1, old, attrs, ns) {
		if (attrs != null) {
			for (var key in attrs) {
				setAttr(vnode$$1, key, old && old[key], attrs[key], ns);
			}
		}
		if (old != null) {
			for (var key in old) {
				if (attrs == null || !(key in attrs)) {
					if (key === "className") key = "class";
					if (key[0] === "o" && key[1] === "n" && !isLifecycleMethod(key)) updateEvent(vnode$$1, key, undefined);
					else if (key !== "key") vnode$$1.dom.removeAttribute(key);
				}
			}
		}
	}
	function isFormAttribute(vnode$$1, attr) {
		return attr === "value" || attr === "checked" || attr === "selectedIndex" || attr === "selected" && vnode$$1.dom === $doc.activeElement
	}
	function isLifecycleMethod(attr) {
		return attr === "oninit" || attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove" || attr === "onbeforeupdate"
	}
	function isAttribute(attr) {
		return attr === "href" || attr === "list" || attr === "form" || attr === "width" || attr === "height"// || attr === "type"
	}
	function isCustomElement(vnode$$1){
		return vnode$$1.attrs.is || vnode$$1.tag.indexOf("-") > -1
	}
	function hasIntegrationMethods(source) {
		return source != null && (source.oncreate || source.onupdate || source.onbeforeremove || source.onremove)
	}

	//style
	function updateStyle(element, old, style) {
		if (old === style) element.style.cssText = "", old = null;
		if (style == null) element.style.cssText = "";
		else if (typeof style === "string") element.style.cssText = style;
		else {
			if (typeof old === "string") element.style.cssText = "";
			for (var key in style) {
				element.style[key] = style[key];
			}
			if (old != null && typeof old !== "string") {
				for (var key in old) {
					if (!(key in style)) element.style[key] = "";
				}
			}
		}
	}

	//event
	function updateEvent(vnode$$1, key, value) {
		var element = vnode$$1.dom;
		var callback = typeof onevent !== "function" ? value : function(e) {
			var result = value.call(element, e);
			onevent.call(element, e);
			return result
		};
		if (key in element) element[key] = typeof value === "function" ? callback : null;
		else {
			var eventName = key.slice(2);
			if (vnode$$1.events === undefined) vnode$$1.events = {};
			if (vnode$$1.events[key] === callback) return
			if (vnode$$1.events[key] != null) element.removeEventListener(eventName, vnode$$1.events[key], false);
			if (typeof value === "function") {
				vnode$$1.events[key] = callback;
				element.addEventListener(eventName, vnode$$1.events[key], false);
			}
		}
	}

	//lifecycle
	function initLifecycle(source, vnode$$1, hooks) {
		if (typeof source.oninit === "function") source.oninit.call(vnode$$1.state, vnode$$1);
		if (typeof source.oncreate === "function") hooks.push(source.oncreate.bind(vnode$$1.state, vnode$$1));
	}
	function updateLifecycle(source, vnode$$1, hooks) {
		if (typeof source.onupdate === "function") hooks.push(source.onupdate.bind(vnode$$1.state, vnode$$1));
	}
	function shouldNotUpdate(vnode$$1, old) {
		var forceVnodeUpdate, forceComponentUpdate;
		if (vnode$$1.attrs != null && typeof vnode$$1.attrs.onbeforeupdate === "function") forceVnodeUpdate = vnode$$1.attrs.onbeforeupdate.call(vnode$$1.state, vnode$$1, old);
		if (typeof vnode$$1.tag !== "string" && typeof vnode$$1._state.onbeforeupdate === "function") forceComponentUpdate = vnode$$1._state.onbeforeupdate.call(vnode$$1.state, vnode$$1, old);
		if (!(forceVnodeUpdate === undefined && forceComponentUpdate === undefined) && !forceVnodeUpdate && !forceComponentUpdate) {
			vnode$$1.dom = old.dom;
			vnode$$1.domSize = old.domSize;
			vnode$$1.instance = old.instance;
			return true
		}
		return false
	}

	function render(dom, vnodes) {
		if (!dom) throw new Error("Ensure the DOM element being passed to m.route/m.mount/m.render is not undefined.")
		var hooks = [];
		var active = $doc.activeElement;

		// First time rendering into a node clears it out
		if (dom.vnodes == null) dom.textContent = "";

		if (!Array.isArray(vnodes)) vnodes = [vnodes];
		updateNodes(dom, dom.vnodes, vnode.normalizeChildren(vnodes), false, hooks, null, undefined);
		dom.vnodes = vnodes;
		for (var i = 0; i < hooks.length; i++) hooks[i]();
		if ($doc.activeElement !== active) active.focus();
	}

	return {render: render, setEventCallback: setEventCallback}
};

function throttle(callback) {
	//60fps translates to 16.6ms, round it down since setTimeout requires int
	var time = 16;
	var last = 0, pending = null;
	var timeout = typeof requestAnimationFrame === "function" ? requestAnimationFrame : setTimeout;
	return function() {
		var now = Date.now();
		if (last === 0 || now - last >= time) {
			last = now;
			callback();
		}
		else if (pending === null) {
			pending = timeout(function() {
				pending = null;
				callback();
				last = Date.now();
			}, time - (now - last));
		}
	}
}

var redraw$2 = function($window) {
	var renderService = render($window);
	renderService.setEventCallback(function(e) {
		if (e.redraw !== false) redraw();
	});

	var callbacks = [];
	function subscribe(key, callback) {
		unsubscribe(key);
		callbacks.push(key, throttle(callback));
	}
	function unsubscribe(key) {
		var index = callbacks.indexOf(key);
		if (index > -1) callbacks.splice(index, 2);
	}
	function redraw() {
		for (var i = 1; i < callbacks.length; i += 2) {
			callbacks[i]();
		}
	}
	return {subscribe: subscribe, unsubscribe: unsubscribe, redraw: redraw, render: renderService.render}
};

var redraw = redraw$2(window);

var mount$2 = function(redrawService) {
	return function(root, component) {
		if (component === null) {
			redrawService.render(root, []);
			redrawService.unsubscribe(root);
			return
		}
		
		if (component.view == null && typeof component !== "function") throw new Error("m.mount(element, component) expects a component, not a vnode")
		
		var run = function() {
			redrawService.render(root, vnode(component));
		};
		redrawService.subscribe(root, run);
		redrawService.redraw();
	}
};

var mount = mount$2(redraw);

var parse = function(string) {
	if (string === "" || string == null) return {}
	if (string.charAt(0) === "?") string = string.slice(1);

	var entries = string.split("&"), data = {}, counters = {};
	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i].split("=");
		var key = decodeURIComponent(entry[0]);
		var value = entry.length === 2 ? decodeURIComponent(entry[1]) : "";

		if (value === "true") value = true;
		else if (value === "false") value = false;

		var levels = key.split(/\]\[?|\[/);
		var cursor = data;
		if (key.indexOf("[") > -1) levels.pop();
		for (var j = 0; j < levels.length; j++) {
			var level = levels[j], nextLevel = levels[j + 1];
			var isNumber = nextLevel == "" || !isNaN(parseInt(nextLevel, 10));
			var isValue = j === levels.length - 1;
			if (level === "") {
				var key = levels.slice(0, j).join();
				if (counters[key] == null) counters[key] = 0;
				level = counters[key]++;
			}
			if (cursor[level] == null) {
				cursor[level] = isValue ? value : isNumber ? [] : {};
			}
			cursor = cursor[level];
		}
	}
	return data
};

var router$2 = function($window) {
	var supportsPushState = typeof $window.history.pushState === "function";
	var callAsync = typeof setImmediate === "function" ? setImmediate : setTimeout;

	function normalize(fragment) {
		var data = $window.location[fragment].replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent);
		if (fragment === "pathname" && data[0] !== "/") data = "/" + data;
		return data
	}

	var asyncId;
	function debounceAsync(callback) {
		return function() {
			if (asyncId != null) return
			asyncId = callAsync(function() {
				asyncId = null;
				callback();
			});
		}
	}

	function parsePath(path, queryData, hashData) {
		var queryIndex = path.indexOf("?");
		var hashIndex = path.indexOf("#");
		var pathEnd = queryIndex > -1 ? queryIndex : hashIndex > -1 ? hashIndex : path.length;
		if (queryIndex > -1) {
			var queryEnd = hashIndex > -1 ? hashIndex : path.length;
			var queryParams = parse(path.slice(queryIndex + 1, queryEnd));
			for (var key in queryParams) queryData[key] = queryParams[key];
		}
		if (hashIndex > -1) {
			var hashParams = parse(path.slice(hashIndex + 1));
			for (var key in hashParams) hashData[key] = hashParams[key];
		}
		return path.slice(0, pathEnd)
	}

	var router = {prefix: "#!"};
	router.getPath = function() {
		var type = router.prefix.charAt(0);
		switch (type) {
			case "#": return normalize("hash").slice(router.prefix.length)
			case "?": return normalize("search").slice(router.prefix.length) + normalize("hash")
			default: return normalize("pathname").slice(router.prefix.length) + normalize("search") + normalize("hash")
		}
	};
	router.setPath = function(path, data, options) {
		var queryData = {}, hashData = {};
		path = parsePath(path, queryData, hashData);
		if (data != null) {
			for (var key in data) queryData[key] = data[key];
			path = path.replace(/:([^\/]+)/g, function(match, token) {
				delete queryData[token];
				return data[token]
			});
		}

		var query = build(queryData);
		if (query) path += "?" + query;

		var hash = build(hashData);
		if (hash) path += "#" + hash;

		if (supportsPushState) {
			var state = options ? options.state : null;
			var title = options ? options.title : null;
			$window.onpopstate();
			if (options && options.replace) $window.history.replaceState(state, title, router.prefix + path);
			else $window.history.pushState(state, title, router.prefix + path);
		}
		else $window.location.href = router.prefix + path;
	};
	router.defineRoutes = function(routes, resolve, reject) {
		function resolveRoute() {
			var path = router.getPath();
			var params = {};
			var pathname = parsePath(path, params, params);

			var state = $window.history.state;
			if (state != null) {
				for (var k in state) params[k] = state[k];
			}
			for (var route in routes) {
				var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$");

				if (matcher.test(pathname)) {
					pathname.replace(matcher, function() {
						var keys = route.match(/:[^\/]+/g) || [];
						var values = [].slice.call(arguments, 1, -2);
						for (var i = 0; i < keys.length; i++) {
							params[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i]);
						}
						resolve(routes[route], params, path, route);
					});
					return
				}
			}

			reject(path, params);
		}

		if (supportsPushState) $window.onpopstate = debounceAsync(resolveRoute);
		else if (router.prefix.charAt(0) === "#") $window.onhashchange = resolveRoute;
		resolveRoute();
	};

	return router
};

var router = function($window, redrawService) {
	var routeService = router$2($window);

	var identity = function(v) {return v};
	var render, component, attrs, currentPath, lastUpdate;
	var route = function(root, defaultRoute, routes) {
		if (root == null) throw new Error("Ensure the DOM element that was passed to `m.route` is not undefined")
		var run = function() {
			if (render != null) redrawService.render(root, render(vnode(component, attrs.key, attrs)));
		};
		var bail = function(path) {
			if (path !== defaultRoute) routeService.setPath(defaultRoute, null, {replace: true});
			else throw new Error("Could not resolve default route " + defaultRoute)
		};
		routeService.defineRoutes(routes, function(payload, params, path) {
			var update = lastUpdate = function(routeResolver, comp) {
				if (update !== lastUpdate) return
				component = comp != null && (typeof comp.view === "function" || typeof comp === "function")? comp : "div";
				attrs = params, currentPath = path, lastUpdate = null;
				render = (routeResolver.render || identity).bind(routeResolver);
				run();
			};
			if (payload.view || typeof payload === "function") update({}, payload);
			else {
				if (payload.onmatch) {
					promise.resolve(payload.onmatch(params, path)).then(function(resolved) {
						update(payload, resolved);
					}, bail);
				}
				else update(payload, "div");
			}
		}, bail);
		redrawService.subscribe(root, run);
	};
	route.set = function(path, data, options) {
		if (lastUpdate != null) options = {replace: true};
		lastUpdate = null;
		routeService.setPath(path, data, options);
	};
	route.get = function() {return currentPath};
	route.prefix = function(prefix) {routeService.prefix = prefix;};
	route.link = function(vnode$$1) {
		vnode$$1.dom.setAttribute("href", routeService.prefix + vnode$$1.attrs.href);
		vnode$$1.dom.onclick = function(e) {
			if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) return
			e.preventDefault();
			e.redraw = false;
			var href = this.getAttribute("href");
			if (href.indexOf(routeService.prefix) === 0) href = href.slice(routeService.prefix.length);
			route.set(href, undefined, undefined);
		};
	};
	route.param = function(key) {
		if(typeof attrs !== "undefined" && typeof key !== "undefined") return attrs[key]
		return attrs
	};

	return route
};

var route = router(window, redraw);

var withAttr = function(attrName, callback, context) {
	return function(e) {
		callback.call(context || this, attrName in e.currentTarget ? e.currentTarget[attrName] : e.currentTarget.getAttribute(attrName));
	}
};

var render$2 = render(window);

request.setCompletionCallback(redraw.redraw);

hyperscript_1.mount = mount;
hyperscript_1.route = route;
hyperscript_1.withAttr = withAttr;
hyperscript_1.render = render$2.render;
hyperscript_1.redraw = redraw.redraw;
hyperscript_1.request = request.request;
hyperscript_1.jsonp = request.jsonp;
hyperscript_1.parseQueryString = parse;
hyperscript_1.buildQueryString = build;
hyperscript_1.version = "bleeding-edge";
hyperscript_1.vnode = vnode;

var index = hyperscript_1;

var stream$2 = createCommonjsModule(function (module) {
"use strict"

;(function() {

var guid = 0, HALT = {};
function createStream() {
	function stream() {
		if (arguments.length > 0 && arguments[0] !== HALT) updateStream(stream, arguments[0]);
		return stream._state.value
	}
	initStream(stream);

	if (arguments.length > 0 && arguments[0] !== HALT) updateStream(stream, arguments[0]);

	return stream
}
function initStream(stream) {
	stream.constructor = createStream;
	stream._state = {id: guid++, value: undefined, state: 0, derive: undefined, recover: undefined, deps: {}, parents: [], endStream: undefined, unregister: undefined};
	stream.map = stream["fantasy-land/map"] = map, stream["fantasy-land/ap"] = ap, stream["fantasy-land/of"] = createStream;
	stream.valueOf = valueOf, stream.toJSON = toJSON, stream.toString = valueOf;

	Object.defineProperties(stream, {
		end: {get: function() {
			if (!stream._state.endStream) {
				var endStream = createStream();
				endStream.map(function(value) {
					if (value === true) {
						unregisterStream(stream);
						endStream._state.unregister = function(){unregisterStream(endStream);};
					}
					return value
				});
				stream._state.endStream = endStream;
			}
			return stream._state.endStream
		}}
	});
}
function updateStream(stream, value) {
	updateState(stream, value);
	for (var id in stream._state.deps) updateDependency(stream._state.deps[id], false);
	if (stream._state.unregister != null) stream._state.unregister();
	finalize(stream);
}
function updateState(stream, value) {
	stream._state.value = value;
	stream._state.changed = true;
	if (stream._state.state !== 2) stream._state.state = 1;
}
function updateDependency(stream, mustSync) {
	var state = stream._state, parents = state.parents;
	if (parents.length > 0 && parents.every(active) && (mustSync || parents.some(changed))) {
		var value = stream._state.derive();
		if (value === HALT) return false
		updateState(stream, value);
	}
}
function finalize(stream) {
	stream._state.changed = false;
	for (var id in stream._state.deps) stream._state.deps[id]._state.changed = false;
}

function combine(fn, streams) {
	if (!streams.every(valid)) throw new Error("Ensure that each item passed to stream.combine/stream.merge is a stream")
	return initDependency(createStream(), streams, function() {
		return fn.apply(this, streams.concat([streams.filter(changed)]))
	})
}

function initDependency(dep, streams, derive) {
	var state = dep._state;
	state.derive = derive;
	state.parents = streams.filter(notEnded);

	registerDependency(dep, state.parents);
	updateDependency(dep, true);

	return dep
}
function registerDependency(stream, parents) {
	for (var i = 0; i < parents.length; i++) {
		parents[i]._state.deps[stream._state.id] = stream;
		registerDependency(stream, parents[i]._state.parents);
	}
}
function unregisterStream(stream) {
	for (var i = 0; i < stream._state.parents.length; i++) {
		var parent = stream._state.parents[i];
		delete parent._state.deps[stream._state.id];
	}
	for (var id in stream._state.deps) {
		var dependent = stream._state.deps[id];
		var index = dependent._state.parents.indexOf(stream);
		if (index > -1) dependent._state.parents.splice(index, 1);
	}
	stream._state.state = 2; //ended
	stream._state.deps = {};
}

function map(fn) {return combine(function(stream) {return fn(stream())}, [this])}
function ap(stream) {return combine(function(s1, s2) {return s1()(s2())}, [stream, this])}
function valueOf() {return this._state.value}
function toJSON() {return this._state.value != null && typeof this._state.value.toJSON === "function" ? this._state.value.toJSON() : this._state.value}

function valid(stream) {return stream._state }
function active(stream) {return stream._state.state === 1}
function changed(stream) {return stream._state.changed}
function notEnded(stream) {return stream._state.state !== 2}

function merge(streams) {
	return combine(function() {
		return streams.map(function(s) {return s()})
	}, streams)
}

function scan(reducer, seed, stream) {
	var newStream = combine(function (s) {
		return seed = reducer(seed, s._state.value)
	}, [stream]);

	if (newStream._state.state === 0) newStream(seed);

	return newStream
}

function scanMerge(tuples, seed) {
	var streams = tuples.map(function(tuple) {
		var stream = tuple[0];
		if (stream._state.state === 0) stream(undefined);
		return stream
	});

	var newStream = combine(function() {
		var changed = arguments[arguments.length - 1];

		streams.forEach(function(stream, idx) {
			if (changed.indexOf(stream) > -1) {
				seed = tuples[idx][1](seed, stream._state.value);
			}
		});

		return seed
	}, streams);

	return newStream
}

createStream["fantasy-land/of"] = createStream;
createStream.merge = merge;
createStream.combine = combine;
createStream.scan = scan;
createStream.scanMerge = scanMerge;
createStream.HALT = HALT;

module["exports"] = createStream;

}());
});

var stream = stream$2;

var Hello = (function () {
    function Hello() {
    }
    Hello.prototype.view = function (vnode) {
        var store = vnode.attrs.store;
        return index("h1", null,
            "Hello ",
            store.who(),
            "!");
    };
    return Hello;
}());
var ChangeName = (function () {
    function ChangeName() {
    }
    ChangeName.prototype.view = function (vnode) {
        var store = vnode.attrs.store;
        return index("p", null,
            "Your name: ",
            index("input", { onchange: function (event) { return store.who(event.target.value); }, value: store.who() }));
    };
    return ChangeName;
}());
function MainStore() {
    this.who = stream();
}
function NameCountStore(mainStore) {
    var count = 0;
    this.counter = mainStore.who.map(function () { return ++count; });
}
var NameCount = (function () {
    function NameCount() {
    }
    NameCount.prototype.view = function (vnode) {
        var store = vnode.attrs.store;
        return index("p", null,
            "Count of names you have had: ",
            store.counter());
    };
    return NameCount;
}());
function NameCountCommentaryStore(nameCountStore) {
    var comments = ['',
        'Way to be consistent!',
        'That\'s how many moons Mars has.',
        'That\'s how many sides a triangle has.',
        'That\'s a typical number of beats in a measure of music.',
        'Jackson 5 was a great band.'];
    this.comment = nameCountStore.counter.map(function (count) {
        return (count > comments.length) ? 'That\'s a lot of names!' :
            comments[count];
    });
}
var NameCountCommentary = (function () {
    function NameCountCommentary() {
    }
    NameCountCommentary.prototype.view = function (vnode) {
        var store = vnode.attrs.store;
        return index("p", null, store.comment());
    };
    return NameCountCommentary;
}());
/*
 * Up to this point everything's been a reusable store or Mithril
 * component. Now it's time to tie it all together into an app. We
 * instantiate a single dispatcher and use tie it to our stores.
 */
var mainStore = new MainStore();
var nameCountStore = new NameCountStore(mainStore);
var nameCountCommentaryStore = new NameCountCommentaryStore(nameCountStore);
mainStore.who('World');
/*
 * Now the main Mithril component connects individual components to
 * their stores. Look at JSX documentation to understand the
 * syntax. If you decide you don't like JSX don't worry, it's easy
 * not to use it. The Mithril documentation eschews it.
 */
var Main = (function () {
    function Main() {
    }
    Main.prototype.view = function () {
        return index("div", null,
            index(Hello, { store: mainStore }),
            index(ChangeName, { store: mainStore }),
            index(NameCount, { store: nameCountStore }),
            index(NameCountCommentary, { store: nameCountCommentaryStore }));
    };
    return Main;
}());
/*
 * Finally we start our Mithril app.
 */
console.log('starting...');
index.mount(document.getElementById('app'), Main);

}());
