// node_modules/@lit/reactive-element/css-tag.js
var e = globalThis, t = e.ShadowRoot && (e.ShadyCSS === void 0 || e.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, n = Symbol(), r = /* @__PURE__ */ new WeakMap(), i = class {
	constructor(e, t, r) {
		if (this._$cssResult$ = !0, r !== n) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, n = this.t;
		if (t && e === void 0) {
			let t = n !== void 0 && n.length === 1;
			t && (e = r.get(n)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), t && r.set(n, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, a = (e) => new i(typeof e == "string" ? e : e + "", void 0, n), o = (e, ...t) => new i(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, n), s = (n, r) => {
	if (t) n.adoptedStyleSheets = r.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let t of r) {
		let r = document.createElement("style"), i = e.litNonce;
		i !== void 0 && r.setAttribute("nonce", i), r.textContent = t.cssText, n.appendChild(r);
	}
}, c = t ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return a(t);
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: f, getOwnPropertySymbols: ee, getPrototypeOf: te } = Object, p = globalThis, m = p.trustedTypes, ne = m ? m.emptyScript : "", re = p.reactiveElementPolyfillSupport, h = (e, t) => e, g = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? ne : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, _ = (e, t) => !l(e, t), v = {
	attribute: !0,
	type: String,
	converter: g,
	reflect: !1,
	useDefault: !1,
	hasChanged: _
};
Symbol.metadata ??= Symbol("metadata"), p.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var y = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = v) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && u(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = d(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? v;
	}
	static _$Ei() {
		if (this.hasOwnProperty(h("elementProperties"))) return;
		let e = te(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(h("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(h("properties"))) {
			let e = this.properties, t = [...f(e), ...ee(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(c(e));
		} else e !== void 0 && t.push(c(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return s(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? g : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? g : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? _)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[h("elementProperties")] = /* @__PURE__ */ new Map(), y[h("finalized")] = /* @__PURE__ */ new Map(), re?.({ ReactiveElement: y }), (p.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/lit-html/lit-html.js
var b = globalThis, ie = (e) => e, x = b.trustedTypes, ae = x ? x.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, oe = "$lit$", S = `lit$${Math.random().toFixed(9).slice(2)}$`, C = "?" + S, se = `<${C}>`, w = document, T = () => w.createComment(""), E = (e) => e === null || typeof e != "object" && typeof e != "function", D = Array.isArray, ce = (e) => D(e) || typeof e?.[Symbol.iterator] == "function", O = "[ 	\n\f\r]", k = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, le = /-->/g, ue = />/g, A = RegExp(`>|${O}(?:([^\\s"'>=/]+)(${O}*=${O}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), de = /'/g, j = /"/g, M = /^(?:script|style|textarea|title)$/i, N = ((e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}))(1), P = Symbol.for("lit-noChange"), F = Symbol.for("lit-nothing"), I = /* @__PURE__ */ new WeakMap(), L = w.createTreeWalker(w, 129);
function R(e, t) {
	if (!D(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return ae === void 0 ? t : ae.createHTML(t);
}
var fe = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = k;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === k ? c[1] === "!--" ? o = le : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = A) : (M.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = A) : o = ue : o === A ? c[0] === ">" ? (o = i ?? k, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? A : c[3] === "\"" ? j : de) : o === j || o === de ? o = A : o === le || o === ue ? o = k : (o = A, i = void 0);
		let d = o === A && e[t + 1].startsWith("/>") ? " " : "";
		a += o === k ? n + se : l >= 0 ? (r.push(s), n.slice(0, l) + oe + n.slice(l) + S + d) : n + S + (l === -2 ? t : d);
	}
	return [R(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, z = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = fe(t, n);
		if (this.el = e.createElement(l, r), L.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = L.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(oe)) {
					let t = u[o++], n = i.getAttribute(e).split(S), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? me : r[1] === "?" ? he : r[1] === "@" ? ge : H
					}), i.removeAttribute(e);
				} else e.startsWith(S) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (M.test(i.tagName)) {
					let e = i.textContent.split(S), t = e.length - 1;
					if (t > 0) {
						i.textContent = x ? x.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], T()), L.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], T());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === C) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(S, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += S.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = w.createElement("template");
		return n.innerHTML = e, n;
	}
};
function B(e, t, n = e, r) {
	if (t === P) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = E(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = B(e, i._$AS(e, t.values), i, r)), t;
}
var pe = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? w).importNode(t, !0);
		L.currentNode = r;
		let i = L.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new V(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new _e(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = L.nextNode(), a++);
		}
		return L.currentNode = w, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, V = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = F, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = B(this, e, t), E(e) ? e === F || e == null || e === "" ? (this._$AH !== F && this._$AR(), this._$AH = F) : e !== this._$AH && e !== P && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? ce(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== F && E(this._$AH) ? this._$AA.nextSibling.data = e : this.T(w.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = z.createElement(R(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new pe(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = I.get(e.strings);
		return t === void 0 && I.set(e.strings, t = new z(e)), t;
	}
	k(t) {
		D(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(T()), this.O(T()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = ie(e).nextSibling;
			ie(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, H = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = F, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = F;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = B(this, e, t, 0), a = !E(e) || e !== this._$AH && e !== P, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = B(this, r[n + o], t, o), s === P && (s = this._$AH[o]), a ||= !E(s) || s !== this._$AH[o], s === F ? e = F : e !== F && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === F ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, me = class extends H {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === F ? void 0 : e;
	}
}, he = class extends H {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== F);
	}
}, ge = class extends H {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = B(this, e, t, 0) ?? F) === P) return;
		let n = this._$AH, r = e === F && n !== F || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== F && (n === F || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, _e = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		B(this, e);
	}
}, ve = b.litHtmlPolyfillSupport;
ve?.(z, V), (b.litHtmlVersions ??= []).push("3.3.3");
var ye = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new V(t.insertBefore(T(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, U = globalThis, W = class extends y {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = ye(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return P;
	}
};
W._$litElement$ = !0, W.finalized = !0, U.litElementHydrateSupport?.({ LitElement: W });
var be = U.litElementPolyfillSupport;
be?.({ LitElement: W }), (U.litElementVersions ??= []).push("4.2.2");
// node_modules/@lit/reactive-element/decorators/custom-element.js
var xe = (e) => (t, n) => {
	n === void 0 ? customElements.define(e, t) : n.addInitializer(() => {
		customElements.define(e, t);
	});
}, Se = {
	attribute: !0,
	type: String,
	converter: g,
	reflect: !1,
	hasChanged: _
}, Ce = (e = Se, t, n) => {
	let { kind: r, metadata: i } = n, a = globalThis.litPropertyMetadata.get(i);
	if (a === void 0 && globalThis.litPropertyMetadata.set(i, a = /* @__PURE__ */ new Map()), r === "setter" && ((e = Object.create(e)).wrapped = !0), a.set(n.name, e), r === "accessor") {
		let { name: r } = n;
		return {
			set(n) {
				let i = t.get.call(this);
				t.set.call(this, n), this.requestUpdate(r, i, e, !0, n);
			},
			init(t) {
				return t !== void 0 && this.C(r, void 0, e, t), t;
			}
		};
	}
	if (r === "setter") {
		let { name: r } = n;
		return function(n) {
			let i = this[r];
			t.call(this, n), this.requestUpdate(r, i, e, !0, n);
		};
	}
	throw Error("Unsupported decorator location: " + r);
};
function G(e) {
	return (t, n) => typeof n == "object" ? Ce(e, t, n) : ((e, t, n) => {
		let r = t.hasOwnProperty(n);
		return t.constructor.createProperty(n, e), r ? Object.getOwnPropertyDescriptor(t, n) : void 0;
	})(e, t, n);
}
// node_modules/@lit/reactive-element/decorators/state.js
function K(e) {
	return G({
		...e,
		state: !0,
		attribute: !1
	});
}
// src/templates/secure.ts
var we = {
	name: "SECURE",
	defaultIcon: "mdi:shield-check",
	styles: o`
    /* SECURE remains static (no flashing) with a green theme-aware accent color */
    .template-secure {
      --template-accent-color: var(
        --success-color,
        var(--label-badge-green, #22c55e)
      );
      --surface-tint: 12%;
      --facet-alpha-strong: 18%;
      --facet-alpha-soft: 10%;
    }
  `
}, Te = {
	name: "INFO",
	defaultIcon: "mdi:information-outline",
	styles: o`
    /* INFO remains static (no flashing) and adapts to HA theme info/primary/icon colors */
    .template-info {
      --template-accent-color: var(
        --info-color,
        var(--primary-color, var(--label-badge-blue, #38bdf8))
      );
      --surface-tint: 10%;
      --facet-alpha-strong: 16%;
      --facet-alpha-soft: 8%;
    }
  `
}, Ee = {
	name: "WARNING",
	defaultIcon: "mdi:alert",
	styles: o`
    .template-warning {
      --template-accent-color: var(
        --warning-color,
        var(--state-active-color, var(--label-badge-yellow, #f59e0b))
      );
      --surface-tint: 14%;
      --facet-alpha-strong: 22%;
      --facet-alpha-soft: 12%;
      animation: origami-warning-flash 3.8s infinite ease-in-out;
    }

    .template-warning .icon-wrap ha-icon {
      animation: origami-warning-icon 3.8s infinite ease-in-out;
    }

    @keyframes origami-warning-flash {
      0%, 100% {
        background-color: color-mix(in srgb, var(--template-accent-color) 10%, var(--base-surface));
        box-shadow: inset 0 0 0 0 transparent;
      }
      50% {
        background-color: color-mix(in srgb, var(--template-accent-color) 26%, var(--base-surface));
        box-shadow: inset 0 0 18px color-mix(in srgb, var(--template-accent-color) 28%, transparent);
      }
    }

    @keyframes origami-warning-icon {
      0%, 100% {
        opacity: 0.82;
        transform: scale(0.97);
      }
      50% {
        opacity: 1;
        transform: scale(1.06);
      }
    }
  `
}, De = {
	name: "CRITICAL",
	defaultIcon: "mdi:shield-alert",
	styles: o`
    .template-critical {
      --template-accent-color: var(
        --error-color,
        var(--label-badge-red, #ef4444)
      );
      --surface-tint: 18%;
      --facet-alpha-strong: 28%;
      --facet-alpha-soft: 16%;
      animation: origami-critical-flash 2.6s infinite ease-in-out;
    }

    .template-critical .icon-wrap ha-icon {
      animation: origami-critical-icon 2.6s infinite ease-in-out;
    }

    @keyframes origami-critical-flash {
      0%, 100% {
        background-color: color-mix(in srgb, var(--template-accent-color) 12%, var(--base-surface));
        box-shadow: inset 0 0 0 0 transparent;
      }
      50% {
        background-color: color-mix(in srgb, var(--template-accent-color) 34%, var(--base-surface));
        box-shadow: inset 0 0 24px color-mix(in srgb, var(--template-accent-color) 42%, transparent);
      }
    }

    @keyframes origami-critical-icon {
      0%, 100% {
        opacity: 0.8;
        transform: scale(0.95);
      }
      50% {
        opacity: 1;
        transform: scale(1.1);
      }
    }
  `
}, Oe = o`
  :host {
    display: block;
    --base-surface: var(--ha-card-background, var(--card-background-color, #1e293b));
    --base-icon-theme: var(--state-icon-color, var(--paper-item-icon-color, var(--primary-text-color, #f8fafc)));
  }

  .banner-wrapper {
    position: relative;
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.16));
    transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), filter 0.18s ease;
  }

  .banner-wrapper:hover {
    transform: translateY(-1px);
  }

  .banner-wrapper:active {
    transform: scale(0.988);
  }

  .banner {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 13px 18px 18px 16px;
    border-radius: var(--ha-card-border-radius, 12px);
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    overflow: hidden;

    /* Multi-faceted origami paper planes tinted by HA theme + template accent */
    background:
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--template-accent-color) var(--facet-alpha-strong, 18%), transparent) 0%,
        transparent 50%
      ),
      linear-gradient(
        225deg,
        color-mix(in srgb, var(--template-accent-color) var(--facet-alpha-soft, 10%), transparent) 0%,
        transparent 58%
      ),
      color-mix(in srgb, var(--template-accent-color) var(--surface-tint, 12%), var(--base-surface));

    box-shadow:
      inset 0 1px 0 color-mix(in srgb, var(--template-accent-color) 28%, rgba(255, 255, 255, 0.12)),
      inset 0 0 0 1px color-mix(in srgb, var(--template-accent-color) 22%, transparent);
  }

  /* Subtle diagonal origami paper crease across the surface */
  .banner::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      118deg,
      transparent 44%,
      color-mix(in srgb, var(--template-accent-color) 14%, rgba(255, 255, 255, 0.05)) 44.3%,
      transparent 45%
    );
    pointer-events: none;
  }

  /* Bottom origami ribbon / tape strip in the color of the alert */
  .bottom-ribbon {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 6px;
    background: linear-gradient(
      90deg,
      var(--template-accent-color) 0%,
      color-mix(in srgb, var(--template-accent-color) 82%, #ffffff) 35%,
      var(--template-accent-color) 72%,
      color-mix(in srgb, var(--template-accent-color) 70%, #000000) 100%
    );
    box-shadow: 0 -1px 6px color-mix(in srgb, var(--template-accent-color) 45%, transparent);
    pointer-events: none;
    z-index: 2;
  }

  /* Folded tape accent crease on the bottom ribbon */
  .bottom-ribbon::after {
    content: '';
    position: absolute;
    top: -3px;
    left: 18px;
    width: 44px;
    height: 6px;
    background: var(--template-accent-color);
    clip-path: polygon(6px 0, calc(100% - 6px) 0, 100% 100%, 0 100%);
    box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.2);
  }

  /* Folded geometric origami medallion for the icon */
  .icon-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    flex-shrink: 0;
    clip-path: polygon(22% 0%, 100% 0%, 100% 78%, 78% 100%, 0% 100%, 0% 22%);
    background: linear-gradient(
      145deg,
      color-mix(in srgb, var(--template-accent-color) 28%, var(--base-surface)),
      color-mix(in srgb, var(--template-accent-color) 12%, var(--base-surface))
    );
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--template-accent-color) 45%, transparent);
  }

  /* Theme-aware icon color: blends HA theme icon color with template accent (or explicit override) */
  .icon-wrap ha-icon {
    --mdc-icon-size: 24px;
    color: var(
      --custom-icon-color,
      var(
        --guardian-icon-color,
        color-mix(in srgb, var(--template-accent-color) 72%, var(--base-icon-theme) 28%)
      )
    );
    filter: drop-shadow(0 1px 4px color-mix(in srgb, var(--template-accent-color) 45%, transparent));
    transition: color 0.25s ease, transform 0.25s ease;
  }

  .content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    flex: 1;
    min-width: 0;
  }

  .badge-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    width: 100%;
  }

  .badge {
    display: inline-block;
    padding: 2px 10px 2px 7px;
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--template-accent-color);
    background: color-mix(in srgb, var(--template-accent-color) 18%, var(--base-surface));
    clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 100%, 0 100%);
  }

  .last-changed-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: var(--secondary-text-color, #cbd5e1);
    background: color-mix(in srgb, var(--template-accent-color) 10%, var(--base-surface));
    border: 1px solid color-mix(in srgb, var(--template-accent-color) 26%, transparent);
    border-radius: 4px;
  }

  .message {
    width: 100%;
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--primary-text-color, #f3f4f6);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* On-Hold action choice overlay (Snooze 30m / Dismiss) */
  .hold-menu-overlay {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0 16px 6px 16px;
    background: color-mix(in srgb, var(--base-surface) 92%, #000000 8%);
    backdrop-filter: blur(6px);
    animation: fadeInHoldMenu 0.15s ease-out;
  }

  @keyframes fadeInHoldMenu {
    from {
      opacity: 0;
      transform: scale(0.98);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .hold-menu-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--secondary-text-color, #cbd5e1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hold-menu-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .hold-btn {
    cursor: pointer;
    border-radius: 6px;
    font-size: 0.76rem;
    font-weight: 700;
    padding: 6px 11px;
    border: 1px solid transparent;
    transition: transform 0.12s ease, filter 0.12s ease;
  }

  .hold-btn:hover {
    filter: brightness(1.12);
  }

  .hold-btn:active {
    transform: scale(0.96);
  }

  .hold-btn-snooze {
    background: color-mix(in srgb, var(--warning-color, #f59e0b) 22%, var(--base-surface));
    color: var(--warning-color, #fbbf24);
    border-color: color-mix(in srgb, var(--warning-color, #f59e0b) 45%, transparent);
  }

  .hold-btn-dismiss {
    background: color-mix(in srgb, var(--error-color, #ef4444) 22%, var(--base-surface));
    color: var(--error-color, #f87171);
    border-color: color-mix(in srgb, var(--error-color, #ef4444) 45%, transparent);
  }

  .hold-btn-cancel {
    background: rgba(255, 255, 255, 0.08);
    color: var(--primary-text-color, #f3f4f6);
    border-color: rgba(255, 255, 255, 0.14);
  }
`, ke = {
	SECURE: we,
	INFO: Te,
	WARNING: Ee,
	CRITICAL: De
};
function q(e) {
	return ke[(e || "INFO").toUpperCase()] || ke.INFO;
}
// src/chime.ts
var J = null;
function Ae() {
	if (typeof window > "u") return null;
	let e = window.AudioContext || window.webkitAudioContext;
	return e ? (J ||= new e(), J.state === "suspended" && J.resume().catch(() => {}), J) : null;
}
function Y(e, t, n, r, i = "sine", a = .22) {
	let o = e.createOscillator(), s = e.createGain();
	o.type = i, o.frequency.setValueAtTime(t, e.currentTime + n);
	let c = e.currentTime + n, l = c + r;
	s.gain.setValueAtTime(1e-4, c), s.gain.linearRampToValueAtTime(a, c + .018), s.gain.exponentialRampToValueAtTime(1e-4, l), o.connect(s), s.connect(e.destination), o.start(c), o.stop(l + .02);
}
function X(e) {
	return !e || e === "none" ? "none" : e === !0 || e === "soft_chime" ? "soft_chime" : e === "double_beep" ? "double_beep" : e === "urgent_alarm" ? "urgent_alarm" : "none";
}
function je(e) {
	let t = X(e);
	if (t !== "none") try {
		let e = Ae();
		if (!e) return;
		t === "soft_chime" ? (Y(e, 523.25, 0, .28, "sine", .2), Y(e, 783.99, .14, .45, "triangle", .22)) : t === "double_beep" ? (Y(e, 880, 0, .11, "sine", .22), Y(e, 880, .16, .14, "sine", .22)) : t === "urgent_alarm" && (Y(e, 987.77, 0, .14, "sawtooth", .16), Y(e, 1318.51, .15, .14, "sawtooth", .18), Y(e, 987.77, .3, .14, "sawtooth", .16), Y(e, 1318.51, .45, .22, "sawtooth", .2));
	} catch {}
}
// \0@oxc-project+runtime@0.156.0/helpers/esm/decorate.js
function Z(e, t, n, r) {
	var i = arguments.length, a = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, o;
	if (typeof Reflect == "object" && typeof Reflect.decorate == "function") a = Reflect.decorate(e, t, n, r);
	else for (var s = e.length - 1; s >= 0; s--) (o = e[s]) && (a = (i < 3 ? o(a) : i > 3 ? o(t, n, a) : o(t, n)) || a);
	return i > 3 && a && Object.defineProperty(t, n, a), a;
}
// src/editor.ts
var Me = {
	P1: 1,
	P2: 2,
	P3: 3,
	P4: 4
}, Ne = [
	{
		value: "P1",
		label: "P1 — Highest Priority (Top of Alert List)"
	},
	{
		value: "P2",
		label: "P2 — High Priority"
	},
	{
		value: "P3",
		label: "P3 — Medium Priority"
	},
	{
		value: "P4",
		label: "P4 — Low Priority"
	}
], Pe = [
	{
		value: "SECURE",
		label: "SECURE (Green — Static Shield)"
	},
	{
		value: "INFO",
		label: "INFO (Blue — Static)"
	},
	{
		value: "WARNING",
		label: "WARNING (Amber — Slow Flash)"
	},
	{
		value: "CRITICAL",
		label: "CRITICAL (Red — Slow Flash)"
	}
], Fe = [{
	value: "equals",
	label: "Equal (=) — Matches any selected state"
}, {
	value: "not_equals",
	label: "Not Equal (≠) — Does not match selected state(s)"
}], Ie = [
	{
		value: "none",
		label: "None (Silent)"
	},
	{
		value: "soft_chime",
		label: "Soft Chime (Warm Two-Tone Bell)"
	},
	{
		value: "double_beep",
		label: "Double Beep (Crisp Alert Pip)"
	},
	{
		value: "urgent_alarm",
		label: "Urgent Alarm (High-Priority Pulse)"
	}
], Le = {
	binary_sensor: [
		"on",
		"off",
		"unavailable",
		"unknown"
	],
	switch: [
		"on",
		"off",
		"unavailable"
	],
	light: [
		"on",
		"off",
		"unavailable"
	],
	input_boolean: ["on", "off"],
	fan: [
		"on",
		"off",
		"unavailable"
	],
	alarm_control_panel: [
		"disarmed",
		"armed_home",
		"armed_away",
		"armed_night",
		"armed_vacation",
		"armed_custom_bypass",
		"pending",
		"arming",
		"triggered",
		"unavailable"
	],
	lock: [
		"locked",
		"unlocked",
		"locking",
		"unlocking",
		"jammed",
		"open",
		"opening",
		"unavailable"
	],
	cover: [
		"open",
		"closed",
		"opening",
		"closing",
		"stopped",
		"unavailable"
	],
	person: [
		"home",
		"not_home",
		"unavailable"
	],
	device_tracker: [
		"home",
		"not_home",
		"unavailable"
	],
	media_player: [
		"playing",
		"paused",
		"idle",
		"standby",
		"off",
		"on",
		"buffering",
		"unavailable"
	],
	climate: [
		"off",
		"heat",
		"cool",
		"heat_cool",
		"auto",
		"dry",
		"fan_only",
		"unavailable"
	],
	weather: [
		"clear-night",
		"cloudy",
		"exceptional",
		"fog",
		"hail",
		"lightning",
		"lightning-rainy",
		"partlycloudy",
		"pouring",
		"rainy",
		"snowy",
		"snowy-rainy",
		"sunny",
		"windy",
		"windy-variant"
	],
	sun: ["above_horizon", "below_horizon"],
	vacuum: [
		"cleaning",
		"docked",
		"idle",
		"paused",
		"returning",
		"error",
		"unavailable"
	],
	water_heater: [
		"off",
		"eco",
		"electric",
		"performance",
		"high_demand",
		"heat_pump",
		"gas"
	]
}, Q = class extends W {
	constructor(...e) {
		super(...e), this.expandedRuleIndex = 0, this.defaultSchemaCache = /* @__PURE__ */ new Map(), this.ruleSchemaCache = /* @__PURE__ */ new Map(), this.computeLabel = (e) => e.label || e.name, this.computeHelper = (e) => e.helper || "";
	}
	connectedCallback() {
		super.connectedCallback(), this.ensureHaComponentsLoaded();
	}
	async ensureHaComponentsLoaded() {
		if (!(customElements.get("ha-form") && customElements.get("ha-entity-picker"))) try {
			let e = window.loadCardHelpers;
			typeof e == "function" && (await (await (await e()).createCardElement({
				type: "entities",
				entities: []
			}))?.constructor?.getConfigElement?.(), this.requestUpdate());
		} catch {}
	}
	setConfig(e) {
		let t = Array.isArray(e?.alerts) ? e.alerts.map((e) => ({ ...e })) : [];
		this.config = {
			...e,
			show_default_alert: e?.show_default_alert ?? !0,
			default_alert: {
				template: "SECURE",
				message: "All Secured",
				icon: "mdi:shield-check",
				...e?.default_alert || {}
			},
			alerts: t
		}, this.expandedRuleIndex !== null && this.expandedRuleIndex >= 0 && this.expandedRuleIndex >= t.length && (this.expandedRuleIndex = t.length > 0 ? 0 : null);
	}
	toggleAccordion(e) {
		this.expandedRuleIndex = this.expandedRuleIndex === e ? null : e;
	}
	sortAlertsByPriority(e, t) {
		let n = e.map((e, t) => ({
			rule: e,
			idx: t
		}));
		n.sort((e, t) => {
			let n = Me[(e.rule.priority || "P2").toUpperCase()] ?? 2, r = Me[(t.rule.priority || "P2").toUpperCase()] ?? 2;
			return n === r ? e.idx - t.idx : n - r;
		});
		let r = t === void 0 ? this.expandedRuleIndex : n.findIndex((e) => e.idx === t);
		return {
			sorted: n.map((e) => e.rule),
			newActiveIndex: r === -1 ? this.expandedRuleIndex : r
		};
	}
	emitConfigChanged(e) {
		this.config = e, this.dispatchEvent(new CustomEvent("config-changed", {
			detail: { config: e },
			bubbles: !0,
			composed: !0
		}));
	}
	normalizeRuleEntities(e) {
		let t = [];
		if (Array.isArray(e.entities)) for (let n of e.entities) typeof n == "string" && n.trim() !== "" && t.push(n.trim());
		return typeof e.entity == "string" && e.entity.trim() !== "" && t.push(e.entity.trim()), Array.from(new Set(t));
	}
	normalizeRuleStates(e) {
		let t = [];
		return Array.isArray(e.states) && t.push(...e.states), Array.isArray(e.state) ? t.push(...e.state) : e.state !== void 0 && e.state !== null && String(e.state).trim() !== "" && t.push(e.state), Array.from(new Set(t.map((e) => String(e).trim()).filter((e) => e !== "")));
	}
	normalizeDurationObject(e) {
		if (!e) return {
			hours: 0,
			minutes: 0,
			seconds: 0
		};
		if (typeof e == "number") {
			let t = Math.max(0, Math.floor(e));
			return {
				hours: Math.floor(t / 3600),
				minutes: Math.floor(t % 3600 / 60),
				seconds: t % 60
			};
		}
		if (typeof e == "string") {
			let t = e.trim(), n = t.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
			if (n) {
				let e = n[3] !== void 0;
				return {
					hours: e ? Number(n[1]) : 0,
					minutes: Number(e ? n[2] : n[1]),
					seconds: Number(e ? n[3] : n[2])
				};
			}
			let r = Number(t);
			return !Number.isNaN(r) && r > 0 ? this.normalizeDurationObject(r) : {
				hours: 0,
				minutes: 0,
				seconds: 0
			};
		}
		return {
			hours: Number(e.hours || 0),
			minutes: Number(e.minutes || 0),
			seconds: Number(e.seconds || 0)
		};
	}
	isZeroDuration(e) {
		return !e || !Number(e.days || 0) && !Number(e.hours || 0) && !Number(e.minutes || 0) && !Number(e.seconds || 0) && !Number(e.milliseconds || 0);
	}
	getStateOptionsForEntities(e, t) {
		let n = /* @__PURE__ */ new Set(), r = [], i = (e, t) => {
			let i = String(e).trim();
			i && !n.has(i) && (n.add(i), r.push({
				value: i,
				label: t || i
			}));
		};
		for (let e of t) i(e);
		for (let t of e) {
			let e = (t || "").trim(), n = e ? this.hass?.states?.[e] : void 0;
			if (n) {
				if (n.state !== void 0 && n.state !== null) {
					let e = String(n.state).trim();
					i(e, `${e} (Current State)`);
				}
				let e = n.attributes || {}, t = [
					e.options,
					e.hvac_modes,
					e.preset_modes,
					e.operation_list,
					e.fan_modes,
					e.swing_modes,
					e.effect_list,
					e.source_list
				];
				for (let e of t) if (Array.isArray(e)) for (let t of e) i(String(t));
			}
			let r = e.includes(".") ? e.split(".")[0] : "";
			if (r && Le[r]) for (let e of Le[r]) i(e);
			if ((r === "person" || r === "device_tracker") && this.hass?.states) for (let [e, t] of Object.entries(this.hass.states)) e.startsWith("zone.") && t?.attributes?.friendly_name && i(String(t.attributes.friendly_name));
		}
		for (let e of [
			"on",
			"off",
			"triggered",
			"disarmed",
			"open",
			"closed",
			"home",
			"not_home",
			"unavailable"
		]) i(e);
		return r;
	}
	getDefaultAlertSchema(e) {
		let t = this.defaultSchemaCache.get(e);
		if (t) return t;
		let n = [{
			name: "show_default_alert",
			label: "Show \"All Secured\" banner when no alerts are active",
			selector: { boolean: {} }
		}];
		return e && n.push({
			name: "message",
			label: "Default Secured Message",
			selector: { text: {} }
		}, {
			name: "template",
			label: "Default Banner Color / Template",
			selector: { select: {
				mode: "dropdown",
				options: Pe
			} }
		}, {
			name: "icon",
			label: "Default Shield Icon",
			selector: { icon: { placeholder: "mdi:shield-check" } }
		}, {
			name: "entity",
			label: "Optional Entity (for Tap More-Info)",
			selector: { entity: {} }
		}), this.defaultSchemaCache.set(e, n), n;
	}
	getRuleSchema(e, t, n, r) {
		let i = e.join(","), a = this.getStateOptionsForEntities(e, n), o = a.map((e) => e.value).join("|"), s = `${i}::${t}::${r || ""}::${o}`, c = this.ruleSchemaCache.get(s);
		if (c) return c;
		let l = r ? `Trigger State(s) / Value(s) (Current: ${r})` : "Trigger State(s) / Value(s)", u = [
			{
				name: "priority",
				label: "Priority Level (Reorders alerts: P1 first -> P4 last)",
				selector: { select: {
					mode: "dropdown",
					options: Ne
				} }
			},
			{
				name: "template",
				label: "Alert Template / Severity Color",
				selector: { select: {
					mode: "dropdown",
					options: Pe
				} }
			},
			{
				name: "entities",
				label: "Entities to Monitor (Select one or more sensors/entities)",
				helper: "Alert triggers independently for any selected entity that matches the state below",
				required: !0,
				selector: { entity: { multiple: !0 } }
			},
			{
				name: "operator",
				label: "State Match Condition",
				selector: { select: {
					mode: "dropdown",
					options: Fe
				} }
			},
			{
				name: "states",
				label: l,
				helper: "Select one or more states, or type any custom value/text and press Enter",
				required: !0,
				selector: { select: {
					multiple: !0,
					custom_value: !0,
					mode: "dropdown",
					options: a
				} }
			},
			{
				name: "for",
				label: "Time in State Before Alerting (hh:mm:ss)",
				helper: "How long an entity must stay in the matching state before the alert shows (00:00:00 = immediately)",
				selector: { duration: {} }
			},
			{
				name: "chime",
				label: "Chime Notification Sound (Plays when alert activates)",
				helper: "Selecting a chime plays a preview sound",
				selector: { select: {
					mode: "dropdown",
					options: Ie
				} }
			},
			{
				name: "icon",
				label: `Icon (default: ${t})`,
				selector: { icon: { placeholder: t } }
			},
			{
				name: "message",
				label: "Alert Message (Optional)",
				helper: "Supports {{ name }}, {{ state }}, and {{ entity }}. Leave empty to show \"<entity name> is <state>\". Hold any active alert banner on the card to Snooze (30m) or Dismiss.",
				selector: { text: {} }
			}
		];
		return this.ruleSchemaCache.set(s, u), u;
	}
	onDefaultAlertFormChanged(e) {
		if (e.stopPropagation(), !this.config) return;
		let t = e.detail?.value;
		if (!t) return;
		let n = t.show_default_alert !== !1, r = {
			...this.config.default_alert || {},
			template: t.template || "SECURE",
			message: t.message ?? "All Secured",
			icon: t.icon || "mdi:shield-check"
		};
		t.entity && t.entity.trim() !== "" ? r.entity = t.entity.trim() : delete r.entity, this.emitConfigChanged({
			...this.config,
			type: this.config.type || "custom:guardian-alerts-card",
			show_default_alert: n,
			default_alert: r
		});
	}
	onRuleFormChanged(e, t) {
		if (t.stopPropagation(), !this.config) return;
		let n = t.detail?.value;
		if (!n) return;
		let r = this.config.alerts[e], i = (r?.priority || "P2").toUpperCase(), a = (n.priority || i).toUpperCase(), o = X(r?.chime), s = X(n.chime);
		s !== o && s !== "none" && je(s);
		let c = this.config.alerts.map((t, r) => {
			if (r !== e) return t;
			let i = Array.isArray(n.entities) ? n.entities.map((e) => String(e).trim()).filter(Boolean) : typeof n.entities == "string" && n.entities.trim() !== "" ? [n.entities.trim()] : [], o = Array.isArray(n.states) ? n.states.map((e) => String(e).trim()).filter(Boolean) : n.states !== void 0 && String(n.states).trim() !== "" ? [String(n.states).trim()] : [], c = {
				...t,
				priority: a,
				operator: n.operator || t.operator || "equals",
				state: o.length === 1 ? o[0] : o,
				template: (n.template || t.template || "INFO").toUpperCase(),
				message: n.message ?? t.message ?? ""
			};
			return i.length === 1 ? (c.entity = i[0], delete c.entities) : (c.entities = i, delete c.entity), delete c.states, n.for && !this.isZeroDuration(n.for) ? c.for = {
				hours: Number(n.for.hours || 0),
				minutes: Number(n.for.minutes || 0),
				seconds: Number(n.for.seconds || 0)
			} : (delete c.for, delete c.duration), s === "none" ? delete c.chime : c.chime = s, n.icon && n.icon.trim() !== "" ? c.icon = n.icon.trim() : delete c.icon, c;
		}), l = c;
		if (a !== i) {
			let { sorted: t, newActiveIndex: n } = this.sortAlertsByPriority(c, e);
			l = t, this.expandedRuleIndex = n;
		}
		this.emitConfigChanged({
			...this.config,
			type: this.config.type || "custom:guardian-alerts-card",
			alerts: l
		});
	}
	addRule() {
		if (!this.config) return;
		let e = this.config.alerts || [], t = {
			priority: "P2",
			entities: [],
			state: [],
			operator: "equals",
			template: "WARNING",
			chime: "none",
			message: ""
		}, n = [...e, t], { sorted: r, newActiveIndex: i } = this.sortAlertsByPriority(n, n.length - 1);
		this.expandedRuleIndex = i, this.emitConfigChanged({
			...this.config,
			type: this.config.type || "custom:guardian-alerts-card",
			alerts: r
		});
	}
	removeRule(e, t) {
		if (t.stopPropagation(), !this.config) return;
		let n = this.config.alerts.filter((t, n) => n !== e);
		this.expandedRuleIndex === e ? this.expandedRuleIndex = n.length > 0 ? 0 : null : this.expandedRuleIndex !== null && this.expandedRuleIndex > e && --this.expandedRuleIndex, this.emitConfigChanged({
			...this.config,
			type: this.config.type || "custom:guardian-alerts-card",
			alerts: n
		});
	}
	render() {
		if (!this.config) return F;
		let e = this.config.show_default_alert !== !1, t = this.expandedRuleIndex === -1, n = {
			show_default_alert: e,
			message: this.config.default_alert?.message ?? "All Secured",
			template: (this.config.default_alert?.template || "SECURE").toUpperCase(),
			icon: this.config.default_alert?.icon || "mdi:shield-check",
			entity: this.config.default_alert?.entity || ""
		};
		return N`
      <div class="editor-container">
        <!-- Default "All Secured" Rule Card (Collapsible) -->
        <div class="rule-card secure-card">
          <div
            class="rule-header clickable"
            @click=${() => this.toggleAccordion(-1)}
          >
            <div class="rule-header-left">
              <span class="priority-pill priority-secure">DEFAULT</span>
              <span class="rule-title">
                🛡️ ${n.message || "All Secured"} (${e ? "Enabled" : "Disabled"})
              </span>
            </div>
            <div class="rule-header-actions">
              <button
                type="button"
                class="btn-collapse"
                title=${t ? "Collapse" : "Expand"}
              >
                <span class="chevron ${t ? "open" : ""}">▼</span>
              </button>
            </div>
          </div>

          ${t ? N`
                <div class="rule-body">
                  <ha-form
                    .hass=${this.hass}
                    .data=${n}
                    .schema=${this.getDefaultAlertSchema(e)}
                    .computeLabel=${this.computeLabel}
                    .computeHelper=${this.computeHelper}
                    @value-changed=${(e) => this.onDefaultAlertFormChanged(e)}
                  ></ha-form>
                </div>
              ` : F}
        </div>

        <!-- Collapsible Alert Rules List (Only 1 open at a time) -->
        ${this.config.alerts.map((e, t) => {
			let n = this.expandedRuleIndex === t, r = (e.priority || "P2").toUpperCase(), i = q(e.template || e.severity), a = this.normalizeRuleEntities(e), o = this.normalizeRuleStates(e), s = X(e.chime), c = a[0], l = c ? this.hass?.states?.[c] : void 0, u = l?.attributes?.unit_of_measurement, d = l?.state === void 0 ? void 0 : `${l.state}${u ? ` ${u}` : ""}`, f = {
				priority: r,
				entities: a,
				operator: e.operator || "equals",
				states: o,
				for: this.normalizeDurationObject(e.for ?? e.duration),
				template: (e.template || e.severity || "INFO").toUpperCase(),
				chime: s,
				icon: e.icon || "",
				message: e.message || ""
			}, ee = a.length === 0 ? "No entity selected" : a.length === 1 ? a[0] : `${a[0]} +${a.length - 1} more`;
			return N`
            <div class="rule-card ${n ? "expanded" : "collapsed"}">
              <div
                class="rule-header clickable"
                @click=${() => this.toggleAccordion(t)}
              >
                <div class="rule-header-left">
                  <span class="priority-pill priority-${r.toLowerCase()}">${r}</span>
                  <div class="rule-summary">
                    <span class="rule-title">
                      ${e.message || `Alert Rule #${t + 1}`} (${i.name})
                    </span>
                    <span class="rule-subtitle">
                      ${ee}
                      ${o.length > 0 ? ` · [${o.join(", ")}]` : ""}
                      ${s === "none" ? "" : ` · 🔔 ${s}`}
                    </span>
                  </div>
                </div>
                <div class="rule-header-actions">
                  <button
                    type="button"
                    class="btn-danger-sm"
                    title="Remove Rule"
                    @click=${(e) => this.removeRule(t, e)}
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    class="btn-collapse"
                    title=${n ? "Collapse rule" : "Expand rule"}
                  >
                    <span class="chevron ${n ? "open" : ""}">▼</span>
                  </button>
                </div>
              </div>

              ${n ? N`
                    <div class="rule-body">
                      <ha-form
                        .hass=${this.hass}
                        .data=${f}
                        .schema=${this.getRuleSchema(a, i.defaultIcon, o, d)}
                        .computeLabel=${this.computeLabel}
                        .computeHelper=${this.computeHelper}
                        @value-changed=${(e) => this.onRuleFormChanged(t, e)}
                      ></ha-form>
                    </div>
                  ` : F}
            </div>
          `;
		})}

        <button type="button" class="btn-primary" @click=${() => this.addRule()}>
          + Add Alert Rule
        </button>
      </div>
    `;
	}
	static {
		this.styles = o`
    .editor-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 0;
      color: var(--primary-text-color, #f3f4f6);
    }

    .rule-card {
      background: var(--secondary-background-color, rgba(255, 255, 255, 0.04));
      border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
      border-radius: 12px;
      overflow: hidden;
      transition: border-color 0.2s ease;
    }

    .rule-card.expanded {
      border-color: var(--primary-color, #38bdf8);
    }

    .secure-card {
      border-color: color-mix(
        in srgb,
        var(--success-color, #22c55e) 40%,
        var(--divider-color, rgba(255, 255, 255, 0.12))
      );
    }

    .rule-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      user-select: none;
    }

    .rule-header.clickable {
      cursor: pointer;
    }

    .rule-header.clickable:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .rule-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1;
    }

    .rule-summary {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .rule-title {
      font-weight: 700;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .rule-subtitle {
      font-size: 0.76rem;
      color: var(--secondary-text-color, #9ca3af);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .rule-header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .priority-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      flex-shrink: 0;
    }

    .priority-p1 {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.45);
    }

    .priority-p2 {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.45);
    }

    .priority-p3 {
      background: rgba(56, 189, 248, 0.2);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.45);
    }

    .priority-p4 {
      background: rgba(148, 163, 184, 0.2);
      color: #cbd5e1;
      border: 1px solid rgba(148, 163, 184, 0.4);
    }

    .priority-secure {
      background: rgba(34, 197, 94, 0.2);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.45);
    }

    .btn-collapse {
      background: rgba(255, 255, 255, 0.06);
      color: var(--primary-text-color, #f3f4f6);
      padding: 5px 9px;
      border-radius: 6px;
    }

    .chevron {
      display: inline-block;
      font-size: 0.75rem;
      transition: transform 0.2s ease;
    }

    .chevron.open {
      transform: rotate(180deg);
    }

    .rule-body {
      padding: 4px 16px 16px 16px;
      border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.08));
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    button {
      cursor: pointer;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 6px 12px;
      border: none;
    }

    .btn-primary {
      background: var(--primary-color, #0284c7);
      color: #fff;
      padding: 10px 16px;
      align-self: flex-start;
    }

    .btn-danger-sm {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      padding: 4px 10px;
    }
  `;
	}
};
Z([G({ attribute: !1 })], Q.prototype, "hass", void 0), Z([K()], Q.prototype, "config", void 0), Z([K()], Q.prototype, "expandedRuleIndex", void 0), Q = Z([xe("guardian-alerts-card-editor")], Q);
// src/guardian-alerts-card.ts
var Re = {
	P1: 1,
	P2: 2,
	P3: 3,
	P4: 4
};
window.customCards = window.customCards || [], window.customCards.some((e) => e.type === "guardian-alerts-card") || window.customCards.push({
	type: "guardian-alerts-card",
	name: "Guardian Alerts Card",
	description: "Origami-styled security & status alert banners with multi-entity monitoring, chime notifications, last-changed badge, and on-hold snooze/dismiss.",
	preview: !0
});
var $ = class extends W {
	constructor(...e) {
		super(...e), this.holdMenuKey = null, this.isHolding = !1, this.activeEntryKeys = /* @__PURE__ */ new Set(), this.matchedSinceMap = /* @__PURE__ */ new Map(), this.durationTimers = /* @__PURE__ */ new Map(), this.dismissedEntryKeys = /* @__PURE__ */ new Set(), this.snoozedUntilMap = /* @__PURE__ */ new Map(), this.snoozeTimers = /* @__PURE__ */ new Map(), this.hasInitializedStates = !1;
	}
	connectedCallback() {
		super.connectedCallback(), this.relativeTimeInterval = window.setInterval(() => {
			this.requestUpdate();
		}, 3e4);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.relativeTimeInterval !== void 0 && (window.clearInterval(this.relativeTimeInterval), this.relativeTimeInterval = void 0), this.clearAllTimers();
	}
	clearAllTimers() {
		window.clearTimeout(this.holdTimeout);
		for (let e of this.durationTimers.values()) window.clearTimeout(e);
		this.durationTimers.clear();
		for (let e of this.snoozeTimers.values()) window.clearTimeout(e);
		this.snoozeTimers.clear();
	}
	clearSnoozeForEntry(e) {
		this.snoozedUntilMap.delete(e);
		let t = this.snoozeTimers.get(e);
		t !== void 0 && (window.clearTimeout(t), this.snoozeTimers.delete(e));
	}
	static getConfigElement() {
		return document.createElement("guardian-alerts-card-editor");
	}
	static getStubConfig() {
		return {
			type: "custom:guardian-alerts-card",
			show_default_alert: !0,
			default_alert: {
				template: "SECURE",
				message: "All Secured",
				icon: "mdi:shield-check"
			},
			alerts: [{
				entities: [],
				state: [],
				operator: "equals",
				priority: "P1",
				template: "WARNING",
				chime: "none",
				message: ""
			}]
		};
	}
	setConfig(e) {
		if (!e) throw Error("Invalid configuration");
		this.clearAllTimers(), this.config = {
			...e,
			alerts: Array.isArray(e.alerts) ? e.alerts : []
		}, this.holdMenuKey = null, this.activeEntryKeys.clear(), this.matchedSinceMap.clear(), this.dismissedEntryKeys.clear(), this.snoozedUntilMap.clear(), this.hasInitializedStates = !1;
	}
	getMonitoredEntities(e) {
		let t = [];
		if (Array.isArray(e.entities)) for (let n of e.entities) typeof n == "string" && n.trim() !== "" && t.push(n.trim());
		return typeof e.entity == "string" && e.entity.trim() !== "" && t.push(e.entity.trim()), Array.from(new Set(t));
	}
	getTargetStates(e) {
		let t = [];
		return Array.isArray(e.states) && t.push(...e.states), Array.isArray(e.state) ? t.push(...e.state) : e.state !== void 0 && e.state !== null && String(e.state).trim() !== "" && t.push(e.state), Array.from(new Set(t.map((e) => String(e).trim()).filter((e) => e !== "")));
	}
	parseDurationMs(e) {
		if (e == null || e === "") return 0;
		if (typeof e == "number") return Number.isFinite(e) ? Math.max(0, e * 1e3) : 0;
		if (typeof e == "string") {
			let t = e.trim();
			if (!t) return 0;
			if (/^\d+(\.\d+)?$/.test(t)) return Math.max(0, Number(t) * 1e3);
			let n = t.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
			if (n) {
				let e = n[3] !== void 0, t = e ? Number(n[1]) : 0, r = Number(e ? n[2] : n[1]), i = Number(e ? n[3] : n[2]);
				return Math.max(0, ((t * 60 + r) * 60 + i) * 1e3);
			}
			let r = t.match(/^(\d+(?:\.\d+)?)\s*(ms|s|sec|m|min|h|hr|d)$/i);
			if (r) {
				let e = Number(r[1]), t = r[2].toLowerCase();
				if (t === "ms") return e;
				if (t === "s" || t === "sec") return e * 1e3;
				if (t === "m" || t === "min") return e * 6e4;
				if (t === "h" || t === "hr") return e * 36e5;
				if (t === "d") return e * 864e5;
			}
			return 0;
		}
		if (typeof e == "object") {
			let t = Number(e.days || 0), n = Number(e.hours || 0), r = Number(e.minutes || 0), i = Number(e.seconds || 0), a = Number(e.milliseconds || 0);
			return Math.max(0, (((t * 24 + n) * 60 + r) * 60 + i) * 1e3 + a);
		}
		return 0;
	}
	getEntryKey(e, t, n) {
		let r = this.getTargetStates(e).map((e) => e.toLowerCase()).join("|");
		return `${t}::${n}::${e.operator || "equals"}::${r}::${this.parseDurationMs(e.for ?? e.duration)}`;
	}
	matchesSingleExpected(e, t, n) {
		if (n === "contains") return e.toLowerCase().includes(t.toLowerCase());
		let r = t.match(/^(>=|<=|!=|==|>|<)\s*(.+)$/);
		if (r) {
			let [, t, n] = r, i = Number(e), a = Number(n);
			if (e !== "" && n.trim() !== "" && !Number.isNaN(i) && !Number.isNaN(a)) {
				if (t === ">") return i > a;
				if (t === ">=") return i >= a;
				if (t === "<") return i < a;
				if (t === "<=") return i <= a;
				if (t === "==") return i === a;
				if (t === "!=") return i !== a;
			}
			if (t === "!=") return e.toLowerCase() !== n.trim().toLowerCase();
			if (t === "==") return e.toLowerCase() === n.trim().toLowerCase();
		}
		let i = Number(e), a = Number(t);
		return e !== "" && !Number.isNaN(i) && !Number.isNaN(a) ? i === a : e.toLowerCase() === t.toLowerCase();
	}
	doesEntityMatchRule(e, t) {
		if (!t) return !1;
		let n = this.getTargetStates(e);
		if (n.length === 0) return !1;
		let r = this.hass?.states?.[t];
		if (!r || r.state === void 0 || r.state === null) return !1;
		let i = String(r.state).trim(), a = e.operator || "equals";
		return a === "not_equals" ? n.every((e) => !this.matchesSingleExpected(i, e, "equals")) : a === "contains" ? n.some((e) => this.matchesSingleExpected(i, e, "contains")) : n.some((e) => this.matchesSingleExpected(i, e, "equals"));
	}
	isEntityEntryActive(e, t, n) {
		let r = this.getEntryKey(e, t, n);
		if (!this.doesEntityMatchRule(e, n)) {
			this.matchedSinceMap.delete(r);
			let e = this.durationTimers.get(r);
			return e !== void 0 && (window.clearTimeout(e), this.durationTimers.delete(r)), !1;
		}
		let i = this.parseDurationMs(e.for ?? e.duration);
		if (i <= 0) return !0;
		let a = this.matchedSinceMap.get(r);
		if (a === void 0) {
			let e = this.hass?.states?.[n], t = e?.last_changed ? Date.parse(e.last_changed) : NaN;
			a = !this.hasInitializedStates && !Number.isNaN(t) && t <= Date.now() || !Number.isNaN(t) && Math.abs(Date.now() - t) < 2e3 ? t : Date.now(), this.matchedSinceMap.set(r, a);
		}
		let o = Date.now() - a;
		if (o >= i) {
			let e = this.durationTimers.get(r);
			return e !== void 0 && (window.clearTimeout(e), this.durationTimers.delete(r)), !0;
		}
		if (!this.durationTimers.has(r)) {
			let e = Math.max(20, i - o + 25), t = window.setTimeout(() => {
				this.durationTimers.delete(r), this.evaluateRules(), this.requestUpdate();
			}, e);
			this.durationTimers.set(r, t);
		}
		return !1;
	}
	isEntrySuppressed(e) {
		if (this.dismissedEntryKeys.has(e)) return !0;
		let t = this.snoozedUntilMap.get(e);
		if (t !== void 0) {
			if (Date.now() < t) return !0;
			this.clearSnoozeForEntry(e);
		}
		return !1;
	}
	evaluateRules() {
		if (!this.hass || !this.config) return;
		let e = /* @__PURE__ */ new Set();
		(this.config.alerts || []).forEach((t, n) => {
			let r = this.getMonitoredEntities(t);
			for (let i of r) {
				let r = this.getEntryKey(t, n, i);
				this.isEntityEntryActive(t, n, i) ? (e.add(r), this.hasInitializedStates && !this.activeEntryKeys.has(r) && !this.isEntrySuppressed(r) && t.chime && t.chime !== "none" && je(t.chime)) : (this.dismissedEntryKeys.delete(r), this.clearSnoozeForEntry(r), this.holdMenuKey === r && (this.holdMenuKey = null));
			}
		}), this.activeEntryKeys = e, this.hasInitializedStates = !0;
	}
	formatMessage(e, t) {
		let n = (e.message || "").trim();
		if (!t) return n;
		let r = this.hass?.states?.[t], i = r?.state ?? "", a = r?.attributes?.friendly_name || t;
		return n ? n.replace(/\{\{\s*state\s*\}\}/g, String(i)).replace(/\{\{\s*entity\s*\}\}/g, t).replace(/\{\{\s*(?:name|friendly_name)\s*\}\}/g, String(a)) : r ? `${a} is ${i}` : String(a);
	}
	formatLastChanged(e) {
		if (!e) return null;
		let t = this.hass?.states?.[e]?.last_changed;
		if (!t) return null;
		let n = Date.parse(t);
		if (Number.isNaN(n)) return null;
		let r = Math.max(0, Math.floor((Date.now() - n) / 1e3)), i = new Date(n).toLocaleString();
		if (r < 15) return {
			relative: "Just now",
			full: i
		};
		if (r < 60) return {
			relative: `${r}s ago`,
			full: i
		};
		let a = Math.floor(r / 60);
		if (a < 60) return {
			relative: `${a}m ago`,
			full: i
		};
		let o = Math.floor(a / 60), s = a % 60;
		return o < 24 ? {
			relative: s > 0 ? `${o}h ${s}m ago` : `${o}h ago`,
			full: i
		} : {
			relative: `${Math.floor(o / 24)}d ago`,
			full: i
		};
	}
	updated(e) {
		super.updated(e), this.hass && this.config && (e.has("hass") || e.has("config")) && this.evaluateRules();
	}
	onBannerPointerDown(e) {
		e && this.holdMenuKey !== e && (this.isHolding = !1, window.clearTimeout(this.holdTimeout), this.holdTimeout = window.setTimeout(() => {
			this.isHolding = !0, this.holdMenuKey = e;
		}, 450));
	}
	onBannerPointerUp(e, t) {
		window.clearTimeout(this.holdTimeout), this.isHolding ? this.isHolding = !1 : t && this.holdMenuKey === t || e && window.dispatchEvent(new CustomEvent("hass-more-info", {
			bubbles: !0,
			composed: !0,
			detail: { entityId: e }
		}));
	}
	onBannerPointerCancel() {
		window.clearTimeout(this.holdTimeout), this.isHolding = !1;
	}
	onBannerContextMenu(e, t) {
		t && (e.preventDefault(), window.clearTimeout(this.holdTimeout), this.isHolding = !1, this.holdMenuKey = t);
	}
	handleDismiss(e, t) {
		t.stopPropagation(), this.dismissedEntryKeys.add(e), this.holdMenuKey === e && (this.holdMenuKey = null), this.requestUpdate();
	}
	handleSnooze30m(e, t) {
		t.stopPropagation(), this.clearSnoozeForEntry(e), this.snoozedUntilMap.set(e, Date.now() + 18e5);
		let n = window.setTimeout(() => {
			this.snoozeTimers.delete(e), this.snoozedUntilMap.delete(e), this.requestUpdate();
		}, 1800050);
		this.snoozeTimers.set(e, n), this.holdMenuKey === e && (this.holdMenuKey = null), this.requestUpdate();
	}
	handleCancelHoldMenu(e) {
		e.stopPropagation(), this.holdMenuKey = null;
	}
	render() {
		if (!this.hass || !this.config) return F;
		let e = [];
		(this.config.alerts || []).forEach((t, n) => {
			let r = this.getMonitoredEntities(t);
			for (let i of r) {
				let r = this.getEntryKey(t, n, i);
				this.isEntityEntryActive(t, n, i) && !this.isEntrySuppressed(r) && e.push({
					rule: t,
					index: n,
					entityId: i,
					key: r
				});
			}
		}), e.sort((e, t) => {
			let n = Re[(e.rule.priority || "P2").toUpperCase()] ?? 2, r = Re[(t.rule.priority || "P2").toUpperCase()] ?? 2;
			return n === r ? (e.index ?? 0) - (t.index ?? 0) : n - r;
		});
		let t = e;
		if (t.length === 0) {
			if (this.config.show_default_alert === !1) return F;
			let e = this.config.default_alert;
			t = [{
				index: null,
				key: null,
				entityId: e?.entity || "",
				rule: {
					entity: e?.entity || "",
					state: "",
					template: e?.template || "SECURE",
					message: e?.message || "All Secured",
					icon: e?.icon || "mdi:shield-check",
					icon_color: e?.icon_color
				}
			}];
		}
		return N`
      <div class="card-container">
        ${t.map(({ rule: e, index: t, entityId: n, key: r }) => {
			let i = q(e.template || e.severity), a = e.icon?.trim() || i.defaultIcon, o = t === null ? null : (e.priority || "P2").toUpperCase(), s = o ? `${o} · ${i.name}` : i.name, c = t === null ? null : this.formatLastChanged(n), l = r !== null && this.holdMenuKey === r;
			return N`
            <div class="banner-wrapper">
              <div
                class="banner template-${i.name.toLowerCase()}"
                style=${e.icon_color ? `--custom-icon-color: ${e.icon_color};` : ""}
                title=${t === null ? "" : "Hold to Snooze or Dismiss"}
                @pointerdown=${() => this.onBannerPointerDown(r)}
                @pointerup=${() => this.onBannerPointerUp(n, r)}
                @pointercancel=${() => this.onBannerPointerCancel()}
                @pointerleave=${() => this.onBannerPointerCancel()}
                @contextmenu=${(e) => this.onBannerContextMenu(e, r)}
              >
                <div class="icon-wrap">
                  <ha-icon .icon="${a}"></ha-icon>
                </div>
                <div class="content">
                  <div class="badge-row">
                    <span class="badge">${s}</span>
                    ${c ? N`
                          <span
                            class="last-changed-badge"
                            title="Last changed: ${c.full}"
                          >
                            🕒 ${c.relative}
                          </span>
                        ` : F}
                  </div>
                  <span class="message">${this.formatMessage(e, n)}</span>
                </div>

                ${l && r ? N`
                      <div
                        class="hold-menu-overlay"
                        @pointerdown=${(e) => e.stopPropagation()}
                        @pointerup=${(e) => e.stopPropagation()}
                        @click=${(e) => e.stopPropagation()}
                      >
                        <span class="hold-menu-label">Alert Action:</span>
                        <div class="hold-menu-actions">
                          <button
                            type="button"
                            class="hold-btn hold-btn-snooze"
                            @click=${(e) => this.handleSnooze30m(r, e)}
                          >
                            ⏱️ Snooze 30m
                          </button>
                          <button
                            type="button"
                            class="hold-btn hold-btn-dismiss"
                            @click=${(e) => this.handleDismiss(r, e)}
                          >
                            ✕ Dismiss
                          </button>
                          <button
                            type="button"
                            class="hold-btn hold-btn-cancel"
                            @click=${(e) => this.handleCancelHoldMenu(e)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ` : F}

                <span class="bottom-ribbon" aria-hidden="true"></span>
              </div>
            </div>
          `;
		})}
      </div>
    `;
	}
	static {
		this.styles = [
			Oe,
			q("SECURE").styles,
			q("INFO").styles,
			q("WARNING").styles,
			q("CRITICAL").styles,
			o`
      .card-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    `
		];
	}
};
Z([G({ attribute: !1 })], $.prototype, "hass", void 0), Z([K()], $.prototype, "config", void 0), Z([K()], $.prototype, "holdMenuKey", void 0), $ = Z([xe("guardian-alerts-card")], $);
export { $ as GuardianAlertsCard };
