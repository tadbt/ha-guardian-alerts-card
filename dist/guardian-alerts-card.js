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
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: ee, getOwnPropertySymbols: te, getPrototypeOf: ne } = Object, f = globalThis, re = f.trustedTypes, ie = re ? re.emptyScript : "", ae = f.reactiveElementPolyfillSupport, p = (e, t) => e, m = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? ie : null;
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
}, h = (e, t) => !l(e, t), g = {
	attribute: !0,
	type: String,
	converter: m,
	reflect: !1,
	useDefault: !1,
	hasChanged: h
};
Symbol.metadata ??= Symbol("metadata"), f.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var _ = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = g) {
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
		return this.elementProperties.get(e) ?? g;
	}
	static _$Ei() {
		if (this.hasOwnProperty(p("elementProperties"))) return;
		let e = ne(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(p("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(p("properties"))) {
			let e = this.properties, t = [...ee(e), ...te(e)];
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
			let i = (n.converter?.toAttribute === void 0 ? m : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? m : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? h)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
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
_.elementStyles = [], _.shadowRootOptions = { mode: "open" }, _[p("elementProperties")] = /* @__PURE__ */ new Map(), _[p("finalized")] = /* @__PURE__ */ new Map(), ae?.({ ReactiveElement: _ }), (f.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/lit-html/lit-html.js
var v = globalThis, y = (e) => e, b = v.trustedTypes, x = b ? b.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, S = "$lit$", C = `lit$${Math.random().toFixed(9).slice(2)}$`, oe = "?" + C, se = `<${oe}>`, w = document, T = () => w.createComment(""), E = (e) => e === null || typeof e != "object" && typeof e != "function", D = Array.isArray, ce = (e) => D(e) || typeof e?.[Symbol.iterator] == "function", O = "[ 	\n\f\r]", k = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, A = /-->/g, j = />/g, M = RegExp(`>|${O}(?:([^\\s"'>=/]+)(${O}*=${O}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), N = /'/g, P = /"/g, F = /^(?:script|style|textarea|title)$/i, I = ((e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}))(1), L = Symbol.for("lit-noChange"), R = Symbol.for("lit-nothing"), z = /* @__PURE__ */ new WeakMap(), B = w.createTreeWalker(w, 129);
function V(e, t) {
	if (!D(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return x === void 0 ? t : x.createHTML(t);
}
var le = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = k;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === k ? c[1] === "!--" ? o = A : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = M) : (F.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = M) : o = j : o === M ? c[0] === ">" ? (o = i ?? k, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? M : c[3] === "\"" ? P : N) : o === P || o === N ? o = M : o === A || o === j ? o = k : (o = M, i = void 0);
		let d = o === M && e[t + 1].startsWith("/>") ? " " : "";
		a += o === k ? n + se : l >= 0 ? (r.push(s), n.slice(0, l) + S + n.slice(l) + C + d) : n + C + (l === -2 ? t : d);
	}
	return [V(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, H = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = le(t, n);
		if (this.el = e.createElement(l, r), B.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = B.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(S)) {
					let t = u[o++], n = i.getAttribute(e).split(C), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? de : r[1] === "?" ? fe : r[1] === "@" ? pe : G
					}), i.removeAttribute(e);
				} else e.startsWith(C) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (F.test(i.tagName)) {
					let e = i.textContent.split(C), t = e.length - 1;
					if (t > 0) {
						i.textContent = b ? b.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], T()), B.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], T());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === oe) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(C, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += C.length - 1;
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
function U(e, t, n = e, r) {
	if (t === L) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = E(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = U(e, i._$AS(e, t.values), i, r)), t;
}
var ue = class {
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
		B.currentNode = r;
		let i = B.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new W(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new me(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = B.nextNode(), a++);
		}
		return B.currentNode = w, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, W = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = R, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
		e = U(this, e, t), E(e) ? e === R || e == null || e === "" ? (this._$AH !== R && this._$AR(), this._$AH = R) : e !== this._$AH && e !== L && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? ce(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== R && E(this._$AH) ? this._$AA.nextSibling.data = e : this.T(w.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = H.createElement(V(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new ue(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = z.get(e.strings);
		return t === void 0 && z.set(e.strings, t = new H(e)), t;
	}
	k(t) {
		D(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(T()), this.O(T()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = y(e).nextSibling;
			y(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, G = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = R, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = R;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = U(this, e, t, 0), a = !E(e) || e !== this._$AH && e !== L, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = U(this, r[n + o], t, o), s === L && (s = this._$AH[o]), a ||= !E(s) || s !== this._$AH[o], s === R ? e = R : e !== R && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === R ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, de = class extends G {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === R ? void 0 : e;
	}
}, fe = class extends G {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== R);
	}
}, pe = class extends G {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = U(this, e, t, 0) ?? R) === L) return;
		let n = this._$AH, r = e === R && n !== R || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== R && (n === R || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, me = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		U(this, e);
	}
}, he = v.litHtmlPolyfillSupport;
he?.(H, W), (v.litHtmlVersions ??= []).push("3.3.3");
var ge = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new W(t.insertBefore(T(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, K = globalThis, q = class extends _ {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = ge(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return L;
	}
};
q._$litElement$ = !0, q.finalized = !0, K.litElementHydrateSupport?.({ LitElement: q });
var _e = K.litElementPolyfillSupport;
_e?.({ LitElement: q }), (K.litElementVersions ??= []).push("4.2.2");
// node_modules/@lit/reactive-element/decorators/custom-element.js
var ve = (e) => (t, n) => {
	n === void 0 ? customElements.define(e, t) : n.addInitializer(() => {
		customElements.define(e, t);
	});
}, ye = {
	attribute: !0,
	type: String,
	converter: m,
	reflect: !1,
	hasChanged: h
}, be = (e = ye, t, n) => {
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
function J(e) {
	return (t, n) => typeof n == "object" ? be(e, t, n) : ((e, t, n) => {
		let r = t.hasOwnProperty(n);
		return t.constructor.createProperty(n, e), r ? Object.getOwnPropertyDescriptor(t, n) : void 0;
	})(e, t, n);
}
// node_modules/@lit/reactive-element/decorators/state.js
function xe(e) {
	return J({
		...e,
		state: !0,
		attribute: !1
	});
}
// src/templates/secure.ts
var Se = {
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
}, Ce = {
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
}, we = {
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
}, Te = {
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
}, Ee = o`
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
`, De = {
	SECURE: Se,
	INFO: Ce,
	WARNING: we,
	CRITICAL: Te
};
function Y(e) {
	return De[(e || "INFO").toUpperCase()] || De.INFO;
}
// src/utils/action-handler.ts
function Oe(e, t) {
	if (!e) return;
	let n = {};
	for (let [r, i] of Object.entries(e)) n[r] = typeof i == "string" ? i.replace(/\{\{\s*message\s*\}\}/g, t.message ?? "").replace(/\{\{\s*entity\s*\}\}/g, t.entity ?? "") : i;
	return n;
}
function ke(e, t, n) {
	let r = t.service || t.perform_action || (t.action && t.action.includes(".") ? t.action : void 0);
	if (!r) return;
	let [i, a] = r.split(".");
	if (!i || !a) return;
	let o = Oe(t.service_data ?? t.data, n);
	e.callService(i, a, o, t.target);
}
function Ae(e, t, n) {
	let r = t;
	if (Array.isArray(r.services) && r.services.length > 0) {
		for (let t of r.services) ke(e, t, n);
		if (!r.service && !r.perform_action) return;
	}
	let i = !!(r.service || r.perform_action || r.action && r.action.includes(".")), a = r.action && !r.action.includes(".") ? r.action : i ? "call-service" : "none";
	if (a !== "none") switch (a) {
		case "more-info": {
			let e = r.target?.entity_id || n.entity;
			if (!e) return;
			let t = new CustomEvent("hass-more-info", {
				bubbles: !0,
				composed: !0,
				detail: { entityId: Array.isArray(e) ? e[0] : e }
			});
			window.dispatchEvent(t);
			break;
		}
		case "toggle": {
			let t = r.target?.entity_id || n.entity;
			if (!t) return;
			e.callService("homeassistant", "toggle", void 0, { entity_id: t });
			break;
		}
		case "navigate": {
			if (!r.navigation_path) return;
			window.history.pushState(null, "", r.navigation_path);
			let e = new CustomEvent("location-changed", {
				bubbles: !0,
				composed: !0
			});
			window.dispatchEvent(e);
			break;
		}
		case "url":
			r.url_path && window.open(r.url_path);
			break;
		case "perform-action":
		case "call-service": ke(e, r, n);
	}
}
function X({ hass: e, config: t, defaultEntity: n, defaultMessage: r }) {
	if (!e || !t) return;
	let i = {
		entity: n,
		message: r
	};
	if (Array.isArray(t)) for (let n of t) n && Ae(e, n, i);
	else Ae(e, t, i);
}
// \0@oxc-project+runtime@0.156.0/helpers/esm/decorate.js
function Z(e, t, n, r) {
	var i = arguments.length, a = i < 3 ? t : r === null ? r = Object.getOwnPropertyDescriptor(t, n) : r, o;
	if (typeof Reflect == "object" && typeof Reflect.decorate == "function") a = Reflect.decorate(e, t, n, r);
	else for (var s = e.length - 1; s >= 0; s--) (o = e[s]) && (a = (i < 3 ? o(a) : i > 3 ? o(t, n, a) : o(t, n)) || a);
	return i > 3 && a && Object.defineProperty(t, n, a), a;
}
// src/editor.ts
var je = [
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
], Me = [
	{
		value: "equals",
		label: "Equal (=) — Matches any selected state"
	},
	{
		value: "not_equals",
		label: "Not Equal (≠) — Does not match selected state(s)"
	},
	{
		value: "contains",
		label: "Contains — State contains any selected value"
	}
], Ne = {
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
}, Q = class extends q {
	constructor(...e) {
		super(...e), this.defaultSchemaCache = /* @__PURE__ */ new Map(), this.ruleSchemaCache = /* @__PURE__ */ new Map(), this.serviceSchemaCache = /* @__PURE__ */ new Map(), this.cachedServiceOptions = [], this.computeLabel = (e) => e.label || e.name, this.computeHelper = (e) => e.helper || "";
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
		this.config = {
			...e,
			show_default_alert: e?.show_default_alert ?? !0,
			default_alert: {
				template: "SECURE",
				message: "All Secured",
				icon: "mdi:shield-check",
				...e?.default_alert || {}
			},
			alerts: Array.isArray(e?.alerts) ? e.alerts.map((e) => ({ ...e })) : []
		};
	}
	emitConfigChanged(e) {
		this.config = e, this.dispatchEvent(new CustomEvent("config-changed", {
			detail: { config: e },
			bubbles: !0,
			composed: !0
		}));
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
	getStateOptionsForEntity(e, t) {
		let n = /* @__PURE__ */ new Set(), r = [], i = (e, t) => {
			let i = String(e).trim();
			i && !n.has(i) && (n.add(i), r.push({
				value: i,
				label: t || i
			}));
		};
		for (let e of t) i(e);
		let a = (e || "").trim(), o = a ? this.hass?.states?.[a] : void 0;
		if (o) {
			if (o.state !== void 0 && o.state !== null) {
				let e = String(o.state).trim();
				i(e, `${e} (Current State)`);
			}
			let e = o.attributes || {}, t = [
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
		let s = a.includes(".") ? a.split(".")[0] : "";
		if (s && Ne[s]) for (let e of Ne[s]) i(e);
		if ((s === "person" || s === "device_tracker") && this.hass?.states) for (let [e, t] of Object.entries(this.hass.states)) e.startsWith("zone.") && t?.attributes?.friendly_name && i(String(t.attributes.friendly_name));
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
				options: je
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
		let i = (e || "").trim(), a = this.getStateOptionsForEntity(i, n), o = a.map((e) => e.value).join("|"), s = `${i}::${t}::${r || ""}::${o}`, c = this.ruleSchemaCache.get(s);
		if (c) return c;
		let l = r ? `Trigger State(s) / Value(s) (Current: ${r})` : "Trigger State(s) / Value(s)", u = [
			{
				name: "entity",
				label: "Entity (Search any sensor or entity)",
				required: !0,
				selector: { entity: {} }
			},
			{
				name: "operator",
				label: "State Match Condition",
				selector: { select: {
					mode: "dropdown",
					options: Me
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
				label: "Duration in State Before Triggering (hh:mm:ss)",
				helper: "How long the entity must stay in the matching state to trigger (00:00:00 = immediate)",
				selector: { duration: {} }
			},
			{
				name: "template",
				label: "Alert Template / Severity Color",
				selector: { select: {
					mode: "dropdown",
					options: je
				} }
			},
			{
				name: "icon",
				label: `Icon (default: ${t})`,
				selector: { icon: { placeholder: t } }
			},
			{
				name: "message",
				label: "Alert Message (supports {{ state }} and {{ entity }})",
				required: !0,
				selector: { text: {} }
			},
			{
				name: "tap_action",
				label: "Tap Action",
				selector: { ui_action: { default_action: "more-info" } }
			}
		];
		return this.ruleSchemaCache.set(s, u), u;
	}
	getServiceOptions() {
		let e = this.hass?.services;
		if (e && e === this.cachedServicesRef && this.cachedServiceOptions.length > 0) return this.cachedServiceOptions;
		let t = [];
		if (e) {
			for (let [n, r] of Object.entries(e)) for (let [e, i] of Object.entries(r || {})) {
				let r = `${n}.${e}`, a = i?.name;
				t.push({
					value: r,
					label: a ? `${r} — ${a}` : r
				});
			}
			t.sort((e, t) => e.value.localeCompare(t.value));
		} else t.push({
			value: "scene.turn_on",
			label: "scene.turn_on — Activate Scene"
		}, {
			value: "script.turn_on",
			label: "script.turn_on — Run Script"
		}, {
			value: "script.tts_announce",
			label: "script.tts_announce — TTS Announce Script"
		}, {
			value: "light.turn_on",
			label: "light.turn_on — Turn On Light"
		}, {
			value: "light.turn_off",
			label: "light.turn_off — Turn Off Light"
		}, {
			value: "input_boolean.toggle",
			label: "input_boolean.toggle — Toggle Input Boolean"
		}, {
			value: "notify.notify",
			label: "notify.notify — Send Notification"
		});
		return this.cachedServicesRef = e, this.cachedServiceOptions = t, this.serviceSchemaCache.clear(), t;
	}
	getServiceCallSchema(e) {
		let t = this.getServiceOptions(), n = (e || "").trim(), r = `${t.length}::${n}`, i = this.serviceSchemaCache.get(r);
		if (i) return i;
		let a = [
			{
				name: "service",
				label: "Service Call (search domain.service)",
				selector: { select: {
					mode: "dropdown",
					custom_value: !0,
					options: n && !t.some((e) => e.value === n) ? [{
						value: n,
						label: n
					}, ...t] : t
				} }
			},
			{
				name: "target",
				label: "Target (Search Entities, Devices, or Areas)",
				selector: { target: {} }
			},
			{
				name: "message",
				label: "Message Parameter (optional, supports {{ message }} & {{ entity }})",
				selector: { text: {} }
			}
		];
		return this.serviceSchemaCache.set(r, a), a;
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
		let r = this.config.alerts.map((t, r) => {
			if (r !== e) return t;
			let i = Array.isArray(n.states) ? n.states.map((e) => String(e).trim()).filter(Boolean) : n.states !== void 0 && String(n.states).trim() !== "" ? [String(n.states).trim()] : [], a = {
				...t,
				entity: n.entity ?? t.entity ?? "",
				operator: n.operator || t.operator || "equals",
				state: i.length === 1 ? i[0] : i,
				template: (n.template || t.template || "INFO").toUpperCase(),
				message: n.message ?? t.message ?? ""
			};
			return delete a.states, n.for && !this.isZeroDuration(n.for) ? a.for = {
				hours: Number(n.for.hours || 0),
				minutes: Number(n.for.minutes || 0),
				seconds: Number(n.for.seconds || 0)
			} : (delete a.for, delete a.duration), n.icon && n.icon.trim() !== "" ? a.icon = n.icon.trim() : delete a.icon, n.tap_action && !Array.isArray(t.tap_action) && (a.tap_action = n.tap_action), a;
		});
		this.emitConfigChanged({
			...this.config,
			type: this.config.type || "custom:guardian-alerts-card",
			alerts: r
		});
	}
	addRule() {
		if (!this.config) return;
		let e = this.config.alerts || [];
		this.emitConfigChanged({
			...this.config,
			type: this.config.type || "custom:guardian-alerts-card",
			alerts: [...e, {
				entity: "",
				state: [],
				operator: "equals",
				template: "WARNING",
				message: "New Guardian Alert"
			}]
		});
	}
	removeRule(e) {
		if (!this.config) return;
		let t = this.config.alerts.filter((t, n) => n !== e);
		this.emitConfigChanged({
			...this.config,
			type: this.config.type || "custom:guardian-alerts-card",
			alerts: t
		});
	}
	normalizeOnActiveList(e) {
		if (!e.on_active) return [];
		if (Array.isArray(e.on_active)) return e.on_active.map((e) => ({
			service: e.service || e.perform_action || "",
			target: e.target,
			service_data: e.service_data ?? e.data
		}));
		let t = e.on_active;
		return t.service || t.perform_action ? [{
			service: t.service || t.perform_action || "",
			target: t.target,
			service_data: t.service_data ?? t.data
		}] : [];
	}
	addOnActiveService(e) {
		if (!this.config) return;
		let t = this.config.alerts[e], n = this.normalizeOnActiveList(t), r = this.config.alerts.map((t, r) => r === e ? {
			...t,
			on_active: [...n, { service: "scene.turn_on" }]
		} : t);
		this.emitConfigChanged({
			...this.config,
			alerts: r
		});
	}
	onServiceCallFormChanged(e, t, n) {
		if (n.stopPropagation(), !this.config) return;
		let r = n.detail?.value;
		if (!r) return;
		let i = this.config.alerts[e], a = this.normalizeOnActiveList(i).map((e, n) => {
			if (n !== t) return e;
			let i = {
				...e,
				service: r.service ?? e.service ?? ""
			}, a = r.target;
			a && typeof a == "object" && Object.keys(a).some((e) => {
				let t = a[e];
				return Array.isArray(t) ? t.length > 0 : !!t;
			}) ? i.target = a : delete i.target;
			let o = { ...i.service_data || {} };
			return typeof r.message == "string" && r.message.trim() !== "" ? (o.message = r.message, i.service_data = o) : (delete o.message, i.service_data = Object.keys(o).length > 0 ? o : void 0), i;
		}), o = this.config.alerts.map((t, n) => n === e ? {
			...t,
			on_active: a.length > 0 ? a : void 0
		} : t);
		this.emitConfigChanged({
			...this.config,
			alerts: o
		});
	}
	removeOnActiveService(e, t) {
		if (!this.config) return;
		let n = this.config.alerts[e], r = this.normalizeOnActiveList(n).filter((e, n) => n !== t), i = this.config.alerts.map((t, n) => n === e ? {
			...t,
			on_active: r.length > 0 ? r : void 0
		} : t);
		this.emitConfigChanged({
			...this.config,
			alerts: i
		});
	}
	render() {
		if (!this.config) return R;
		let e = this.config.show_default_alert !== !1, t = {
			show_default_alert: e,
			message: this.config.default_alert?.message ?? "All Secured",
			template: (this.config.default_alert?.template || "SECURE").toUpperCase(),
			icon: this.config.default_alert?.icon || "mdi:shield-check",
			entity: this.config.default_alert?.entity || ""
		};
		return I`
      <div class="editor-container">
        <!-- Default "All Secured" Banner Section -->
        <div class="rule-card secure-card">
          <div class="rule-header">
            <span class="rule-title">🛡️ Default Rule (When All Secured)</span>
          </div>
          <ha-form
            .hass=${this.hass}
            .data=${t}
            .schema=${this.getDefaultAlertSchema(e)}
            .computeLabel=${this.computeLabel}
            .computeHelper=${this.computeHelper}
            @value-changed=${(e) => this.onDefaultAlertFormChanged(e)}
          ></ha-form>
        </div>

        <!-- Alert Rules Section -->
        ${this.config.alerts.map((e, t) => {
			let n = Y(e.template || e.severity), r = this.normalizeOnActiveList(e), i = this.normalizeRuleStates(e), a = e.entity ? this.hass?.states?.[e.entity] : void 0, o = a?.attributes?.unit_of_measurement, s = a?.state === void 0 ? void 0 : `${a.state}${o ? ` ${o}` : ""}`, c = {
				entity: e.entity || "",
				operator: e.operator || "equals",
				states: i,
				for: this.normalizeDurationObject(e.for ?? e.duration),
				template: (e.template || e.severity || "INFO").toUpperCase(),
				icon: e.icon || "",
				message: e.message || "",
				tap_action: Array.isArray(e.tap_action) ? { action: "more-info" } : e.tap_action || { action: "more-info" }
			};
			return I`
            <div class="rule-card">
              <div class="rule-header">
                <span class="rule-title">Alert Rule #${t + 1} (${n.name})</span>
                <button
                  type="button"
                  class="btn-danger"
                  @click=${() => this.removeRule(t)}
                >
                  Remove Rule
                </button>
              </div>

              <ha-form
                .hass=${this.hass}
                .data=${c}
                .schema=${this.getRuleSchema(e.entity, n.defaultIcon, i, s)}
                .computeLabel=${this.computeLabel}
                .computeHelper=${this.computeHelper}
                @value-changed=${(e) => this.onRuleFormChanged(t, e)}
              ></ha-form>

              <div class="services-section">
                <div class="services-header">
                  <span>On-Active Service Calls (${r.length})</span>
                  <button
                    type="button"
                    class="btn-secondary"
                    @click=${() => this.addOnActiveService(t)}
                  >
                    + Add Service Call
                  </button>
                </div>

                ${r.map((e, n) => {
				let r = {
					service: e.service || "",
					target: e.target || {},
					message: e.service_data?.message ?? ""
				};
				return I`
                    <div class="service-card">
                      <div class="service-card-header">
                        <span>Service Call #${n + 1}</span>
                        <button
                          type="button"
                          class="btn-danger-sm"
                          title="Remove Service Call"
                          @click=${() => this.removeOnActiveService(t, n)}
                        >
                          Remove
                        </button>
                      </div>
                      <ha-form
                        .hass=${this.hass}
                        .data=${r}
                        .schema=${this.getServiceCallSchema(e.service)}
                        .computeLabel=${this.computeLabel}
                        .computeHelper=${this.computeHelper}
                        @value-changed=${(e) => this.onServiceCallFormChanged(t, n, e)}
                      ></ha-form>
                    </div>
                  `;
			})}
              </div>
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
      gap: 16px;
      padding: 8px 0;
      color: var(--primary-text-color, #f3f4f6);
    }

    .rule-card {
      background: var(--secondary-background-color, rgba(255, 255, 255, 0.04));
      border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .secure-card {
      border-color: color-mix(in srgb, var(--success-color, #22c55e) 40%, var(--divider-color, rgba(255, 255, 255, 0.12)));
    }

    .rule-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      font-size: 0.95rem;
    }

    .services-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-top: 12px;
      border-top: 1px dashed var(--divider-color, rgba(255, 255, 255, 0.16));
    }

    .services-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--secondary-text-color, #9ca3af);
    }

    .service-card {
      background: var(--card-background-color, rgba(15, 23, 42, 0.45));
      border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.1));
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .service-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--secondary-text-color, #9ca3af);
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

    .btn-secondary {
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary-color, #38bdf8);
      border: 1px solid rgba(56, 189, 248, 0.35);
    }

    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.35);
    }

    .btn-danger-sm {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      padding: 4px 10px;
    }
  `;
	}
};
Z([J({ attribute: !1 })], Q.prototype, "hass", void 0), Z([xe()], Q.prototype, "config", void 0), Q = Z([ve("guardian-alerts-card-editor")], Q), window.customCards = window.customCards || [], window.customCards.some((e) => e.type === "guardian-alerts-card") || window.customCards.push({
	type: "guardian-alerts-card",
	name: "Guardian Alerts Card",
	description: "Origami-styled security & status alert banners with slow flashing and multi-service actions.",
	preview: !0
});
var $ = class extends q {
	constructor(...e) {
		super(...e), this.isHolding = !1, this.activeRuleKeys = /* @__PURE__ */ new Set(), this.matchedSinceMap = /* @__PURE__ */ new Map(), this.durationTimers = /* @__PURE__ */ new Map(), this.hasInitializedStates = !1;
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.clearAllDurationTimers();
	}
	clearAllDurationTimers() {
		for (let e of this.durationTimers.values()) window.clearTimeout(e);
		this.durationTimers.clear();
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
				entity: "",
				state: [],
				operator: "equals",
				template: "WARNING",
				message: "Guardian Alert Triggered"
			}]
		};
	}
	setConfig(e) {
		if (!e) throw Error("Invalid configuration");
		this.clearAllDurationTimers(), this.config = {
			...e,
			alerts: Array.isArray(e.alerts) ? e.alerts : []
		}, this.activeRuleKeys.clear(), this.matchedSinceMap.clear(), this.hasInitializedStates = !1;
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
	getRuleKey(e, t) {
		let n = this.getTargetStates(e).map((e) => e.toLowerCase()).join("|"), r = e.operator || "equals", i = this.parseDurationMs(e.for ?? e.duration);
		return `${t}:${e.entity || ""}:${r}:${n}:${i}`;
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
	doesStateMatch(e) {
		if (!e.entity) return !1;
		let t = this.getTargetStates(e);
		if (t.length === 0) return !1;
		let n = this.hass?.states?.[e.entity];
		if (!n || n.state === void 0 || n.state === null) return !1;
		let r = String(n.state).trim(), i = e.operator || "equals";
		return i === "not_equals" ? t.every((e) => !this.matchesSingleExpected(r, e, "equals")) : i === "contains" ? t.some((e) => this.matchesSingleExpected(r, e, "contains")) : t.some((e) => this.matchesSingleExpected(r, e, "equals"));
	}
	isRuleActive(e, t) {
		let n = this.getRuleKey(e, t);
		if (!this.doesStateMatch(e)) {
			this.matchedSinceMap.delete(n);
			let e = this.durationTimers.get(n);
			return e !== void 0 && (window.clearTimeout(e), this.durationTimers.delete(n)), !1;
		}
		let r = this.parseDurationMs(e.for ?? e.duration);
		if (r <= 0) return !0;
		let i = this.matchedSinceMap.get(n);
		if (i === void 0) {
			let t = this.hass?.states?.[e.entity], r = t?.last_changed ? Date.parse(t.last_changed) : NaN;
			i = !this.hasInitializedStates && !Number.isNaN(r) && r <= Date.now() || !Number.isNaN(r) && Math.abs(Date.now() - r) < 2e3 ? r : Date.now(), this.matchedSinceMap.set(n, i);
		}
		let a = Date.now() - i;
		if (a >= r) {
			let e = this.durationTimers.get(n);
			return e !== void 0 && (window.clearTimeout(e), this.durationTimers.delete(n)), !0;
		}
		if (!this.durationTimers.has(n)) {
			let e = Math.max(20, r - a + 25), t = window.setTimeout(() => {
				this.durationTimers.delete(n), this.evaluateAndTriggerRules(), this.requestUpdate();
			}, e);
			this.durationTimers.set(n, t);
		}
		return !1;
	}
	evaluateAndTriggerRules() {
		if (!this.hass || !this.config) return;
		let e = /* @__PURE__ */ new Set();
		(this.config.alerts || []).forEach((t, n) => {
			let r = this.getRuleKey(t, n);
			this.isRuleActive(t, n) && (e.add(r), this.hasInitializedStates && !this.activeRuleKeys.has(r) && t.on_active && X({
				hass: this.hass,
				config: t.on_active,
				defaultEntity: t.entity,
				defaultMessage: this.formatMessage(t)
			}));
		}), this.activeRuleKeys = e, this.hasInitializedStates = !0;
	}
	formatMessage(e) {
		let t = e.message || "";
		if (!e.entity) return t;
		let n = this.hass?.states?.[e.entity]?.state ?? "";
		return t.replace(/\{\{\s*state\s*\}\}/g, String(n)).replace(/\{\{\s*entity\s*\}\}/g, e.entity);
	}
	updated(e) {
		super.updated(e), this.hass && this.config && (e.has("hass") || e.has("config")) && this.evaluateAndTriggerRules();
	}
	onPointerDown(e) {
		this.isHolding = !1, this.holdTimeout = window.setTimeout(() => {
			this.isHolding = !0, X({
				hass: this.hass,
				config: e.hold_action || { action: "more-info" },
				defaultEntity: e.entity,
				defaultMessage: this.formatMessage(e)
			});
		}, 500);
	}
	onPointerUp(e) {
		clearTimeout(this.holdTimeout), this.isHolding || X({
			hass: this.hass,
			config: e.tap_action || { action: "more-info" },
			defaultEntity: e.entity,
			defaultMessage: this.formatMessage(e)
		});
	}
	onPointerCancel() {
		clearTimeout(this.holdTimeout), this.isHolding = !1;
	}
	render() {
		if (!this.hass || !this.config) return R;
		let e = (this.config.alerts || []).filter((e, t) => this.isRuleActive(e, t));
		if (e.length === 0) {
			if (this.config.show_default_alert === !1) return R;
			let t = this.config.default_alert;
			e = [{
				entity: t?.entity || this.config.alerts?.[0]?.entity || "",
				state: "",
				template: t?.template || "SECURE",
				message: t?.message || "All Secured",
				icon: t?.icon || "mdi:shield-check",
				icon_color: t?.icon_color,
				tap_action: t?.tap_action || (t?.entity ? { action: "more-info" } : { action: "none" }),
				hold_action: t?.hold_action || (t?.entity ? { action: "more-info" } : { action: "none" })
			}];
		}
		return I`
      <div class="card-container">
        ${e.map((e) => {
			let t = Y(e.template || e.severity), n = e.icon?.trim() || t.defaultIcon;
			return I`
            <div class="banner-wrapper">
              <div
                class="banner template-${t.name.toLowerCase()}"
                style=${e.icon_color ? `--custom-icon-color: ${e.icon_color};` : ""}
                @pointerdown=${() => this.onPointerDown(e)}
                @pointerup=${() => this.onPointerUp(e)}
                @pointercancel=${() => this.onPointerCancel()}
              >
                <div class="icon-wrap">
                  <ha-icon .icon="${n}"></ha-icon>
                </div>
                <div class="content">
                  <span class="badge">${t.name}</span>
                  <span class="message">${this.formatMessage(e)}</span>
                </div>
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
			Ee,
			Y("SECURE").styles,
			Y("INFO").styles,
			Y("WARNING").styles,
			Y("CRITICAL").styles,
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
Z([J({ attribute: !1 })], $.prototype, "hass", void 0), Z([xe()], $.prototype, "config", void 0), $ = Z([ve("guardian-alerts-card")], $);
export { $ as GuardianAlertsCard };
