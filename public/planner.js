(function () {
	'use strict';

	/** @returns {void} */
	function noop() {}

	/**
	 * @template T
	 * @template S
	 * @param {T} tar
	 * @param {S} src
	 * @returns {T & S}
	 */
	function assign(tar, src) {
		// @ts-ignore
		for (const k in src) tar[k] = src[k];
		return /** @type {T & S} */ (tar);
	}

	// Adapted from https://github.com/then/is-promise/blob/master/index.js
	// Distributed under MIT License https://github.com/then/is-promise/blob/master/LICENSE
	/**
	 * @param {any} value
	 * @returns {value is PromiseLike<any>}
	 */
	function is_promise(value) {
		return (
			!!value &&
			(typeof value === 'object' || typeof value === 'function') &&
			typeof (/** @type {any} */ (value).then) === 'function'
		);
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	/**
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function run_all(fns) {
		fns.forEach(run);
	}

	/**
	 * @param {any} thing
	 * @returns {thing is Function}
	 */
	function is_function(thing) {
		return typeof thing === 'function';
	}

	/** @returns {boolean} */
	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
	}

	/** @returns {boolean} */
	function is_empty(obj) {
		return Object.keys(obj).length === 0;
	}

	function subscribe(store, ...callbacks) {
		if (store == null) {
			for (const callback of callbacks) {
				callback(undefined);
			}
			return noop;
		}
		const unsub = store.subscribe(...callbacks);
		return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
	}

	/** @returns {void} */
	function component_subscribe(component, store, callback) {
		component.$$.on_destroy.push(subscribe(store, callback));
	}

	function create_slot(definition, ctx, $$scope, fn) {
		if (definition) {
			const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
			return definition[0](slot_ctx);
		}
	}

	function get_slot_context(definition, ctx, $$scope, fn) {
		return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
	}

	function get_slot_changes(definition, $$scope, dirty, fn) {
		if (definition[2] && fn) {
			const lets = definition[2](fn(dirty));
			if ($$scope.dirty === undefined) {
				return lets;
			}
			if (typeof lets === 'object') {
				const merged = [];
				const len = Math.max($$scope.dirty.length, lets.length);
				for (let i = 0; i < len; i += 1) {
					merged[i] = $$scope.dirty[i] | lets[i];
				}
				return merged;
			}
			return $$scope.dirty | lets;
		}
		return $$scope.dirty;
	}

	/** @returns {void} */
	function update_slot_base(
		slot,
		slot_definition,
		ctx,
		$$scope,
		slot_changes,
		get_slot_context_fn
	) {
		if (slot_changes) {
			const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
			slot.p(slot_context, slot_changes);
		}
	}

	/** @returns {any[] | -1} */
	function get_all_dirty_from_scope($$scope) {
		if ($$scope.ctx.length > 32) {
			const dirty = [];
			const length = $$scope.ctx.length / 32;
			for (let i = 0; i < length; i++) {
				dirty[i] = -1;
			}
			return dirty;
		}
		return -1;
	}

	function set_store_value(store, ret, value) {
		store.set(value);
		return ret;
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append(target, node) {
		target.appendChild(node);
	}

	/**
	 * @param {Node} target
	 * @param {string} style_sheet_id
	 * @param {string} styles
	 * @returns {void}
	 */
	function append_styles(target, style_sheet_id, styles) {
		const append_styles_to = get_root_for_style(target);
		if (!append_styles_to.getElementById(style_sheet_id)) {
			const style = element('style');
			style.id = style_sheet_id;
			style.textContent = styles;
			append_stylesheet(append_styles_to, style);
		}
	}

	/**
	 * @param {Node} node
	 * @returns {ShadowRoot | Document}
	 */
	function get_root_for_style(node) {
		if (!node) return document;
		const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
		if (root && /** @type {ShadowRoot} */ (root).host) {
			return /** @type {ShadowRoot} */ (root);
		}
		return node.ownerDocument;
	}

	/**
	 * @param {ShadowRoot | Document} node
	 * @param {HTMLStyleElement} style
	 * @returns {CSSStyleSheet}
	 */
	function append_stylesheet(node, style) {
		append(/** @type {Document} */ (node).head || node, style);
		return style.sheet;
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach(node) {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	/**
	 * @returns {void} */
	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	/**
	 * @template {keyof HTMLElementTagNameMap} K
	 * @param {K} name
	 * @returns {HTMLElementTagNameMap[K]}
	 */
	function element(name) {
		return document.createElement(name);
	}

	/**
	 * @param {string} data
	 * @returns {Text}
	 */
	function text(data) {
		return document.createTextNode(data);
	}

	/**
	 * @returns {Text} */
	function space() {
		return text(' ');
	}

	/**
	 * @returns {Text} */
	function empty() {
		return text('');
	}

	/**
	 * @param {EventTarget} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @returns {() => void}
	 */
	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
	}

	/**
	 * @param {Element} element
	 * @returns {ChildNode[]}
	 */
	function children(element) {
		return Array.from(element.childNodes);
	}

	/**
	 * @param {Text} text
	 * @param {unknown} data
	 * @returns {void}
	 */
	function set_data(text, data) {
		data = '' + data;
		if (text.data === data) return;
		text.data = /** @type {string} */ (data);
	}

	/**
	 * @returns {void} */
	function toggle_class(element, name, toggle) {
		// The `!!` is required because an `undefined` flag means flipping the current state.
		element.classList.toggle(name, !!toggle);
	}

	function construct_svelte_component(component, props) {
		return new component(props);
	}

	/**
	 * @typedef {Node & {
	 * 	claim_order?: number;
	 * 	hydrate_init?: true;
	 * 	actual_end_child?: NodeEx;
	 * 	childNodes: NodeListOf<NodeEx>;
	 * }} NodeEx
	 */

	/** @typedef {ChildNode & NodeEx} ChildNodeEx */

	/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

	/**
	 * @typedef {ChildNodeEx[] & {
	 * 	claim_info?: {
	 * 		last_index: number;
	 * 		total_claimed: number;
	 * 	};
	 * }} ChildNodeArray
	 */

	let current_component;

	/** @returns {void} */
	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error('Function called outside component initialization');
		return current_component;
	}

	const dirty_components = [];
	const binding_callbacks = [];

	let render_callbacks = [];

	const flush_callbacks = [];

	const resolved_promise = /* @__PURE__ */ Promise.resolve();

	let update_scheduled = false;

	/** @returns {void} */
	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	/** @returns {void} */
	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	// flush() calls callbacks in this order:
	// 1. All beforeUpdate callbacks, in order: parents before children
	// 2. All bind:this callbacks, in reverse order: children before parents.
	// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
	//    for afterUpdates called during the initial onMount, which are called in
	//    reverse order: children before parents.
	// Since callbacks might update component values, which could trigger another
	// call to flush(), the following steps guard against this:
	// 1. During beforeUpdate, any updated components will be added to the
	//    dirty_components array and will cause a reentrant call to flush(). Because
	//    the flush index is kept outside the function, the reentrant call will pick
	//    up where the earlier call left off and go through all dirty components. The
	//    current_component value is saved and restored so that the reentrant call will
	//    not interfere with the "parent" flush() call.
	// 2. bind:this callbacks cannot trigger new flush() calls.
	// 3. During afterUpdate, any updated components will NOT have their afterUpdate
	//    callback called a second time; the seen_callbacks set, outside the flush()
	//    function, guarantees this behavior.
	const seen_callbacks = new Set();

	let flushidx = 0; // Do *not* move this inside the flush() function

	/** @returns {void} */
	function flush() {
		// Do not reenter flush while dirty components are updated, as this can
		// result in an infinite loop. Instead, let the inner flush handle it.
		// Reentrancy is ok afterwards for bindings etc.
		if (flushidx !== 0) {
			return;
		}
		const saved_component = current_component;
		do {
			// first, call beforeUpdate functions
			// and update components
			try {
				while (flushidx < dirty_components.length) {
					const component = dirty_components[flushidx];
					flushidx++;
					set_current_component(component);
					update(component.$$);
				}
			} catch (e) {
				// reset dirty state to not end up in a deadlocked state and then rethrow
				dirty_components.length = 0;
				flushidx = 0;
				throw e;
			}
			set_current_component(null);
			dirty_components.length = 0;
			flushidx = 0;
			while (binding_callbacks.length) binding_callbacks.pop()();
			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			for (let i = 0; i < render_callbacks.length; i += 1) {
				const callback = render_callbacks[i];
				if (!seen_callbacks.has(callback)) {
					// ...so guard against infinite loops
					seen_callbacks.add(callback);
					callback();
				}
			}
			render_callbacks.length = 0;
		} while (dirty_components.length);
		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}
		update_scheduled = false;
		seen_callbacks.clear();
		set_current_component(saved_component);
	}

	/** @returns {void} */
	function update($$) {
		if ($$.fragment !== null) {
			$$.update();
			run_all($$.before_update);
			const dirty = $$.dirty;
			$$.dirty = [-1];
			$$.fragment && $$.fragment.p($$.ctx, dirty);
			$$.after_update.forEach(add_render_callback);
		}
	}

	/**
	 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function flush_render_callbacks(fns) {
		const filtered = [];
		const targets = [];
		render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
		targets.forEach((c) => c());
		render_callbacks = filtered;
	}

	const outroing = new Set();

	/**
	 * @type {Outro}
	 */
	let outros;

	/**
	 * @returns {void} */
	function group_outros() {
		outros = {
			r: 0,
			c: [],
			p: outros // parent group
		};
	}

	/**
	 * @returns {void} */
	function check_outros() {
		if (!outros.r) {
			run_all(outros.c);
		}
		outros = outros.p;
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} [local]
	 * @returns {void}
	 */
	function transition_in(block, local) {
		if (block && block.i) {
			outroing.delete(block);
			block.i(local);
		}
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} local
	 * @param {0 | 1} [detach]
	 * @param {() => void} [callback]
	 * @returns {void}
	 */
	function transition_out(block, local, detach, callback) {
		if (block && block.o) {
			if (outroing.has(block)) return;
			outroing.add(block);
			outros.c.push(() => {
				outroing.delete(block);
				if (callback) {
					if (detach) block.d(1);
					callback();
				}
			});
			block.o(local);
		} else if (callback) {
			callback();
		}
	}

	/** @typedef {1} INTRO */
	/** @typedef {0} OUTRO */
	/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
	/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

	/**
	 * @typedef {Object} Outro
	 * @property {number} r
	 * @property {Function[]} c
	 * @property {Object} p
	 */

	/**
	 * @typedef {Object} PendingProgram
	 * @property {number} start
	 * @property {INTRO|OUTRO} b
	 * @property {Outro} [group]
	 */

	/**
	 * @typedef {Object} Program
	 * @property {number} a
	 * @property {INTRO|OUTRO} b
	 * @property {1|-1} d
	 * @property {number} duration
	 * @property {number} start
	 * @property {number} end
	 * @property {Outro} [group]
	 */

	/**
	 * @template T
	 * @param {Promise<T>} promise
	 * @param {import('./private.js').PromiseInfo<T>} info
	 * @returns {boolean}
	 */
	function handle_promise(promise, info) {
		const token = (info.token = {});
		/**
		 * @param {import('./private.js').FragmentFactory} type
		 * @param {0 | 1 | 2} index
		 * @param {number} [key]
		 * @param {any} [value]
		 * @returns {void}
		 */
		function update(type, index, key, value) {
			if (info.token !== token) return;
			info.resolved = value;
			let child_ctx = info.ctx;
			if (key !== undefined) {
				child_ctx = child_ctx.slice();
				child_ctx[key] = value;
			}
			const block = type && (info.current = type)(child_ctx);
			let needs_flush = false;
			if (info.block) {
				if (info.blocks) {
					info.blocks.forEach((block, i) => {
						if (i !== index && block) {
							group_outros();
							transition_out(block, 1, 1, () => {
								if (info.blocks[i] === block) {
									info.blocks[i] = null;
								}
							});
							check_outros();
						}
					});
				} else {
					info.block.d(1);
				}
				block.c();
				transition_in(block, 1);
				block.m(info.mount(), info.anchor);
				needs_flush = true;
			}
			info.block = block;
			if (info.blocks) info.blocks[index] = block;
			if (needs_flush) {
				flush();
			}
		}
		if (is_promise(promise)) {
			const current_component = get_current_component();
			promise.then(
				(value) => {
					set_current_component(current_component);
					update(info.then, 1, info.value, value);
					set_current_component(null);
				},
				(error) => {
					set_current_component(current_component);
					update(info.catch, 2, info.error, error);
					set_current_component(null);
					if (!info.hasCatch) {
						throw error;
					}
				}
			);
			// if we previously had a then/catch block, destroy it
			if (info.current !== info.pending) {
				update(info.pending, 0);
				return true;
			}
		} else {
			if (info.current !== info.then) {
				update(info.then, 1, info.value, promise);
				return true;
			}
			info.resolved = /** @type {T} */ (promise);
		}
	}

	/** @returns {void} */
	function update_await_block_branch(info, ctx, dirty) {
		const child_ctx = ctx.slice();
		const { resolved } = info;
		if (info.current === info.then) {
			child_ctx[info.value] = resolved;
		}
		if (info.current === info.catch) {
			child_ctx[info.error] = resolved;
		}
		info.block.p(child_ctx, dirty);
	}

	// general each functions:

	function ensure_array_like(array_like_or_iterator) {
		return array_like_or_iterator?.length !== undefined
			? array_like_or_iterator
			: Array.from(array_like_or_iterator);
	}

	/** @returns {{}} */
	function get_spread_update(levels, updates) {
		const update = {};
		const to_null_out = {};
		const accounted_for = { $$scope: 1 };
		let i = levels.length;
		while (i--) {
			const o = levels[i];
			const n = updates[i];
			if (n) {
				for (const key in o) {
					if (!(key in n)) to_null_out[key] = 1;
				}
				for (const key in n) {
					if (!accounted_for[key]) {
						update[key] = n[key];
						accounted_for[key] = 1;
					}
				}
				levels[i] = n;
			} else {
				for (const key in o) {
					accounted_for[key] = 1;
				}
			}
		}
		for (const key in to_null_out) {
			if (!(key in update)) update[key] = undefined;
		}
		return update;
	}

	function get_spread_object(spread_props) {
		return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
	}

	/** @returns {void} */
	function create_component(block) {
		block && block.c();
	}

	/** @returns {void} */
	function mount_component(component, target, anchor) {
		const { fragment, after_update } = component.$$;
		fragment && fragment.m(target, anchor);
		// onMount happens before the initial afterUpdate
		add_render_callback(() => {
			const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
			// if the component was destroyed immediately
			// it will update the `$$.on_destroy` reference to `null`.
			// the destructured on_destroy may still reference to the old array
			if (component.$$.on_destroy) {
				component.$$.on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});
		after_update.forEach(add_render_callback);
	}

	/** @returns {void} */
	function destroy_component(component, detaching) {
		const $$ = component.$$;
		if ($$.fragment !== null) {
			flush_render_callbacks($$.after_update);
			run_all($$.on_destroy);
			$$.fragment && $$.fragment.d(detaching);
			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			$$.on_destroy = $$.fragment = null;
			$$.ctx = [];
		}
	}

	/** @returns {void} */
	function make_dirty(component, i) {
		if (component.$$.dirty[0] === -1) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty.fill(0);
		}
		component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
	}

	/** @returns {void} */
	function init(
		component,
		options,
		instance,
		create_fragment,
		not_equal,
		props,
		append_styles,
		dirty = [-1]
	) {
		const parent_component = current_component;
		set_current_component(component);
		/** @type {import('./private.js').T$$} */
		const $$ = (component.$$ = {
			fragment: null,
			ctx: [],
			// state
			props,
			update: noop,
			not_equal,
			bound: blank_object(),
			// lifecycle
			on_mount: [],
			on_destroy: [],
			on_disconnect: [],
			before_update: [],
			after_update: [],
			context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
			// everything else
			callbacks: blank_object(),
			dirty,
			skip_bound: false,
			root: options.target || parent_component.$$.root
		});
		append_styles && append_styles($$.root);
		let ready = false;
		$$.ctx = instance
			? instance(component, options.props || {}, (i, ret, ...rest) => {
					const value = rest.length ? rest[0] : ret;
					if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
						if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
						if (ready) make_dirty(component, i);
					}
					return ret;
			  })
			: [];
		$$.update();
		ready = true;
		run_all($$.before_update);
		// `false` as a special case of no DOM component
		$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
		if (options.target) {
			if (options.hydrate) {
				const nodes = children(options.target);
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				$$.fragment && $$.fragment.l(nodes);
				nodes.forEach(detach);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				$$.fragment && $$.fragment.c();
			}
			if (options.intro) transition_in(component.$$.fragment);
			mount_component(component, options.target, options.anchor);
			flush();
		}
		set_current_component(parent_component);
	}

	/**
	 * Base class for Svelte components. Used when dev=false.
	 *
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 */
	class SvelteComponent {
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$ = undefined;
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$set = undefined;

		/** @returns {void} */
		$destroy() {
			destroy_component(this, 1);
			this.$destroy = noop;
		}

		/**
		 * @template {Extract<keyof Events, string>} K
		 * @param {K} type
		 * @param {((e: Events[K]) => void) | null | undefined} callback
		 * @returns {() => void}
		 */
		$on(type, callback) {
			if (!is_function(callback)) {
				return noop;
			}
			const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
			callbacks.push(callback);
			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		/**
		 * @param {Partial<Props>} props
		 * @returns {void}
		 */
		$set(props) {
			if (this.$$set && !is_empty(props)) {
				this.$$.skip_bound = true;
				this.$$set(props);
				this.$$.skip_bound = false;
			}
		}
	}

	/**
	 * @typedef {Object} CustomElementPropDefinition
	 * @property {string} [attribute]
	 * @property {boolean} [reflect]
	 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
	 */

	// generated during release, do not modify

	const PUBLIC_VERSION = '4';

	if (typeof window !== 'undefined')
		// @ts-ignore
		(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

	var GeneralEducation;
	(function (GeneralEducation) {
	    GeneralEducation["MF"] = "MF";
	})(GeneralEducation || (GeneralEducation = {}));

	const subscriber_queue = [];

	/**
	 * Creates a `Readable` store that allows reading by subscription.
	 *
	 * https://svelte.dev/docs/svelte-store#readable
	 * @template T
	 * @param {T} [value] initial value
	 * @param {import('./public.js').StartStopNotifier<T>} [start]
	 * @returns {import('./public.js').Readable<T>}
	 */
	function readable(value, start) {
		return {
			subscribe: writable(value, start).subscribe
		};
	}

	/**
	 * Create a `Writable` store that allows both updating and reading by subscription.
	 *
	 * https://svelte.dev/docs/svelte-store#writable
	 * @template T
	 * @param {T} [value] initial value
	 * @param {import('./public.js').StartStopNotifier<T>} [start]
	 * @returns {import('./public.js').Writable<T>}
	 */
	function writable(value, start = noop) {
		/** @type {import('./public.js').Unsubscriber} */
		let stop;
		/** @type {Set<import('./private.js').SubscribeInvalidateTuple<T>>} */
		const subscribers = new Set();
		/** @param {T} new_value
		 * @returns {void}
		 */
		function set(new_value) {
			if (safe_not_equal(value, new_value)) {
				value = new_value;
				if (stop) {
					// store is ready
					const run_queue = !subscriber_queue.length;
					for (const subscriber of subscribers) {
						subscriber[1]();
						subscriber_queue.push(subscriber, value);
					}
					if (run_queue) {
						for (let i = 0; i < subscriber_queue.length; i += 2) {
							subscriber_queue[i][0](subscriber_queue[i + 1]);
						}
						subscriber_queue.length = 0;
					}
				}
			}
		}

		/**
		 * @param {import('./public.js').Updater<T>} fn
		 * @returns {void}
		 */
		function update(fn) {
			set(fn(value));
		}

		/**
		 * @param {import('./public.js').Subscriber<T>} run
		 * @param {import('./private.js').Invalidator<T>} [invalidate]
		 * @returns {import('./public.js').Unsubscriber}
		 */
		function subscribe(run, invalidate = noop) {
			/** @type {import('./private.js').SubscribeInvalidateTuple<T>} */
			const subscriber = [run, invalidate];
			subscribers.add(subscriber);
			if (subscribers.size === 1) {
				stop = start(set, update) || noop;
			}
			run(value);
			return () => {
				subscribers.delete(subscriber);
				if (subscribers.size === 0 && stop) {
					stop();
					stop = null;
				}
			};
		}
		return { set, update, subscribe };
	}

	var TermType;
	(function (TermType) {
	    TermType["Winter"] = "Winter";
	    TermType["Spring"] = "Spring";
	    // TODO: summer1, summer2?
	    TermType["Summer"] = "Summer";
	    TermType["Fall"] = "Fall";
	})(TermType || (TermType = {}));

	const _classes = {
	    "CLNI": {
	        "1A": {
	            code: { department: "CLNI", number: "1A" },
	            name: "Introduction to University Life and Learning",
	            description: "Orientation to and exploration of the nature of the liberal arts, and of learning at research universities. Topics include: academic planning for upper-division coursework; enrollment processes; and understanding pathways to degree completion; UCSC resources that support health and well-being strategies for academic success; the cultivation of just communities; the prevention of sexual harassment and violence; campus conduct policies; awareness of risks associated with drug and/or alcohol use; and an introduction to traditions of community-engaged learning, ground-breaking research, and interdisciplinary thinking that define a UC Santa Cruz degree. This course can be taken for Pass/No Pass grading only.",
	            units: 1,
	        },
	    },
	    "CSE": {
	        "20": {
	            code: { department: "CSE", number: "20" },
	            name: "Beginning Programming in Python",
	            description: "Provides students with Python programming skills and the ability to design programs and read Python code. Topics include data types, control flow, methods and advanced functions, built-in data structures, and introduction to OOP. No prior programming experience is required. Students may not receive credit for CSE 20 after receiving credit for CSE 30. Students with prior programming experience (especially in Python) are encouraged to take CSE Testout Exam to be evaluated for their readiness to take CSE 30 directly: https://undergrad.soe.ucsc.edu/cse-20-testout-exam.",
	            units: 5,
	            geCode: GeneralEducation.MF,
	        }
	    }
	};
	class Api {
	    constructor() {
	    }
	    async getClass(classCode) {
	        return Promise.resolve(_classes[classCode.department][classCode.number]);
	    }
	    async getPlanner() {
	        return Promise.resolve({
	            terms: [
	                {
	                    type: TermType.Summer,
	                    year: 2023,
	                    classes: [
	                        _classes["CLNI"]["1A"],
	                    ],
	                },
	                {
	                    type: TermType.Fall,
	                    year: 2023,
	                    classes: [
	                        _classes["CSE"]["20"],
	                    ],
	                },
	            ],
	        });
	    }
	}

	const path = writable(window.location.pathname);
	// TODO initialize API elsewhere
	const api = readable(new Api());

	/* src/pages/Class.svelte generated by Svelte v4.2.0 */

	function add_css$1(target) {
		append_styles(target, "svelte-vu0nbs", ".code.svelte-vu0nbs{font-weight:bold}.label.svelte-vu0nbs{font-weight:bold}");
	}

	// (1:0) <script lang="ts">import {}
	function create_catch_block$1(ctx) {
		return { c: noop, m: noop, p: noop, d: noop };
	}

	// (14:0) {:then info}
	function create_then_block$1(ctx) {
		let h1;
		let span0;
		let t0_value = /*info*/ ctx[4].code.department + "";
		let t0;
		let t1;
		let t2_value = /*info*/ ctx[4].code.number + "";
		let t2;
		let t3;
		let t4_value = /*info*/ ctx[4].name + "";
		let t4;
		let t5;
		let p;
		let t6_value = /*info*/ ctx[4].description + "";
		let t6;
		let t7;
		let ul;
		let li;
		let span1;
		let t9_value = /*info*/ ctx[4].units + "";
		let t9;
		let t10;
		let if_block = /*info*/ ctx[4].geCode && create_if_block(ctx);

		return {
			c() {
				h1 = element("h1");
				span0 = element("span");
				t0 = text(t0_value);
				t1 = space();
				t2 = text(t2_value);
				t3 = text(" - ");
				t4 = text(t4_value);
				t5 = space();
				p = element("p");
				t6 = text(t6_value);
				t7 = space();
				ul = element("ul");
				li = element("li");
				span1 = element("span");
				span1.textContent = "Credits: ";
				t9 = text(t9_value);
				t10 = space();
				if (if_block) if_block.c();
				attr(span0, "class", "code svelte-vu0nbs");
				attr(p, "class", "description");
				attr(span1, "class", "label svelte-vu0nbs");
			},
			m(target, anchor) {
				insert(target, h1, anchor);
				append(h1, span0);
				append(span0, t0);
				append(span0, t1);
				append(span0, t2);
				append(h1, t3);
				append(h1, t4);
				insert(target, t5, anchor);
				insert(target, p, anchor);
				append(p, t6);
				insert(target, t7, anchor);
				insert(target, ul, anchor);
				append(ul, li);
				append(li, span1);
				append(li, t9);
				append(ul, t10);
				if (if_block) if_block.m(ul, null);
			},
			p(ctx, dirty) {
				if (dirty & /*infoPromise*/ 4 && t0_value !== (t0_value = /*info*/ ctx[4].code.department + "")) set_data(t0, t0_value);
				if (dirty & /*infoPromise*/ 4 && t2_value !== (t2_value = /*info*/ ctx[4].code.number + "")) set_data(t2, t2_value);
				if (dirty & /*infoPromise*/ 4 && t4_value !== (t4_value = /*info*/ ctx[4].name + "")) set_data(t4, t4_value);
				if (dirty & /*infoPromise*/ 4 && t6_value !== (t6_value = /*info*/ ctx[4].description + "")) set_data(t6, t6_value);
				if (dirty & /*infoPromise*/ 4 && t9_value !== (t9_value = /*info*/ ctx[4].units + "")) set_data(t9, t9_value);

				if (/*info*/ ctx[4].geCode) {
					if (if_block) {
						if_block.p(ctx, dirty);
					} else {
						if_block = create_if_block(ctx);
						if_block.c();
						if_block.m(ul, null);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}
			},
			d(detaching) {
				if (detaching) {
					detach(h1);
					detach(t5);
					detach(p);
					detach(t7);
					detach(ul);
				}

				if (if_block) if_block.d();
			}
		};
	}

	// (23:2) {#if info.geCode}
	function create_if_block(ctx) {
		let li;
		let span;
		let t1_value = /*info*/ ctx[4].geCode + "";
		let t1;

		return {
			c() {
				li = element("li");
				span = element("span");
				span.textContent = "General education: ";
				t1 = text(t1_value);
				attr(span, "class", "label svelte-vu0nbs");
			},
			m(target, anchor) {
				insert(target, li, anchor);
				append(li, span);
				append(li, t1);
			},
			p(ctx, dirty) {
				if (dirty & /*infoPromise*/ 4 && t1_value !== (t1_value = /*info*/ ctx[4].geCode + "")) set_data(t1, t1_value);
			},
			d(detaching) {
				if (detaching) {
					detach(li);
				}
			}
		};
	}

	// (12:20)   Loading {department}
	function create_pending_block$1(ctx) {
		let t0;
		let t1;
		let t2;
		let t3;

		return {
			c() {
				t0 = text("Loading ");
				t1 = text(/*department*/ ctx[0]);
				t2 = space();
				t3 = text(/*number*/ ctx[1]);
			},
			m(target, anchor) {
				insert(target, t0, anchor);
				insert(target, t1, anchor);
				insert(target, t2, anchor);
				insert(target, t3, anchor);
			},
			p(ctx, dirty) {
				if (dirty & /*department*/ 1) set_data(t1, /*department*/ ctx[0]);
				if (dirty & /*number*/ 2) set_data(t3, /*number*/ ctx[1]);
			},
			d(detaching) {
				if (detaching) {
					detach(t0);
					detach(t1);
					detach(t2);
					detach(t3);
				}
			}
		};
	}

	function create_fragment$6(ctx) {
		let await_block_anchor;
		let promise;

		let info_1 = {
			ctx,
			current: null,
			token: null,
			hasCatch: false,
			pending: create_pending_block$1,
			then: create_then_block$1,
			catch: create_catch_block$1,
			value: 4
		};

		handle_promise(promise = /*infoPromise*/ ctx[2], info_1);

		return {
			c() {
				await_block_anchor = empty();
				info_1.block.c();
			},
			m(target, anchor) {
				insert(target, await_block_anchor, anchor);
				info_1.block.m(target, info_1.anchor = anchor);
				info_1.mount = () => await_block_anchor.parentNode;
				info_1.anchor = await_block_anchor;
			},
			p(new_ctx, [dirty]) {
				ctx = new_ctx;
				info_1.ctx = ctx;

				if (dirty & /*infoPromise*/ 4 && promise !== (promise = /*infoPromise*/ ctx[2]) && handle_promise(promise, info_1)) ; else {
					update_await_block_branch(info_1, ctx, dirty);
				}
			},
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(await_block_anchor);
				}

				info_1.block.d(detaching);
				info_1.token = null;
				info_1 = null;
			}
		};
	}

	function instance$5($$self, $$props, $$invalidate) {
		let $api;
		component_subscribe($$self, api, $$value => $$invalidate(3, $api = $$value));
		let { department } = $$props;
		let { number } = $$props;
		let infoPromise;

		$$self.$$set = $$props => {
			if ('department' in $$props) $$invalidate(0, department = $$props.department);
			if ('number' in $$props) $$invalidate(1, number = $$props.number);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*$api, department, number*/ 11) {
				$$invalidate(2, infoPromise = $api.getClass({ department, number }).then(cls => {
					console.dir(cls);
					return cls;
				}));
			}
		};

		return [department, number, infoPromise, $api];
	}

	class Class extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$5, create_fragment$6, safe_not_equal, { department: 0, number: 1 }, add_css$1);
		}
	}

	/* src/components/Hoverable.svelte generated by Svelte v4.2.0 */

	function add_css(target) {
		append_styles(target, "svelte-1agl6rb", ".inline.svelte-1agl6rb{display:inline}.hide.svelte-1agl6rb{display:none}.tooltip.svelte-1agl6rb{position:absolute;padding:8px;background-color:#8d8;width:min(80vw, 30em)}");
	}

	const get_tooltip_slot_changes = dirty => ({});
	const get_tooltip_slot_context = ctx => ({});

	function create_fragment$5(ctx) {
		let div1;
		let t;
		let div0;
		let current;
		let mounted;
		let dispose;
		const default_slot_template = /*#slots*/ ctx[3].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);
		const tooltip_slot_template = /*#slots*/ ctx[3].tooltip;
		const tooltip_slot = create_slot(tooltip_slot_template, ctx, /*$$scope*/ ctx[2], get_tooltip_slot_context);

		return {
			c() {
				div1 = element("div");
				if (default_slot) default_slot.c();
				t = space();
				div0 = element("div");
				if (tooltip_slot) tooltip_slot.c();
				attr(div0, "class", "tooltip svelte-1agl6rb");
				toggle_class(div0, "hide", /*hide*/ ctx[1]);
				attr(div1, "class", "hover svelte-1agl6rb");
				attr(div1, "tabindex", 4);
				attr(div1, "role", "tooltip");
				toggle_class(div1, "inline", /*inline*/ ctx[0]);
			},
			m(target, anchor) {
				insert(target, div1, anchor);

				if (default_slot) {
					default_slot.m(div1, null);
				}

				append(div1, t);
				append(div1, div0);

				if (tooltip_slot) {
					tooltip_slot.m(div0, null);
				}

				current = true;

				if (!mounted) {
					dispose = [
						listen(div1, "mouseenter", /*mouseenter_handler*/ ctx[4]),
						listen(div1, "mouseleave", /*mouseleave_handler*/ ctx[5]),
						listen(div1, "focus", /*focus_handler*/ ctx[6]),
						listen(div1, "blur", /*blur_handler*/ ctx[7])
					];

					mounted = true;
				}
			},
			p(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[2],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
							null
						);
					}
				}

				if (tooltip_slot) {
					if (tooltip_slot.p && (!current || dirty & /*$$scope*/ 4)) {
						update_slot_base(
							tooltip_slot,
							tooltip_slot_template,
							ctx,
							/*$$scope*/ ctx[2],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
							: get_slot_changes(tooltip_slot_template, /*$$scope*/ ctx[2], dirty, get_tooltip_slot_changes),
							get_tooltip_slot_context
						);
					}
				}

				if (!current || dirty & /*hide*/ 2) {
					toggle_class(div0, "hide", /*hide*/ ctx[1]);
				}

				if (!current || dirty & /*inline*/ 1) {
					toggle_class(div1, "inline", /*inline*/ ctx[0]);
				}
			},
			i(local) {
				if (current) return;
				transition_in(default_slot, local);
				transition_in(tooltip_slot, local);
				current = true;
			},
			o(local) {
				transition_out(default_slot, local);
				transition_out(tooltip_slot, local);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(div1);
				}

				if (default_slot) default_slot.d(detaching);
				if (tooltip_slot) tooltip_slot.d(detaching);
				mounted = false;
				run_all(dispose);
			}
		};
	}

	function instance$4($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		let hide = true;
		let { inline = false } = $$props;
		const mouseenter_handler = () => $$invalidate(1, hide = false);
		const mouseleave_handler = () => $$invalidate(1, hide = true);
		const focus_handler = () => $$invalidate(1, hide = false);
		const blur_handler = () => $$invalidate(1, hide = true);

		$$self.$$set = $$props => {
			if ('inline' in $$props) $$invalidate(0, inline = $$props.inline);
			if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
		};

		return [
			inline,
			hide,
			$$scope,
			slots,
			mouseenter_handler,
			mouseleave_handler,
			focus_handler,
			blur_handler
		];
	}

	class Hoverable extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$4, create_fragment$5, safe_not_equal, { inline: 0 }, add_css);
		}
	}

	/* src/components/Link.svelte generated by Svelte v4.2.0 */

	function create_fragment$4(ctx) {
		let a;
		let current;
		let mounted;
		let dispose;
		const default_slot_template = /*#slots*/ ctx[3].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

		return {
			c() {
				a = element("a");
				if (default_slot) default_slot.c();
				attr(a, "href", /*href*/ ctx[0]);
			},
			m(target, anchor) {
				insert(target, a, anchor);

				if (default_slot) {
					default_slot.m(a, null);
				}

				current = true;

				if (!mounted) {
					dispose = listen(a, "click", /*onClick*/ ctx[1]);
					mounted = true;
				}
			},
			p(ctx, [dirty]) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[2],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
							null
						);
					}
				}

				if (!current || dirty & /*href*/ 1) {
					attr(a, "href", /*href*/ ctx[0]);
				}
			},
			i(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(a);
				}

				if (default_slot) default_slot.d(detaching);
				mounted = false;
				dispose();
			}
		};
	}

	function instance$3($$self, $$props, $$invalidate) {
		let $path;
		component_subscribe($$self, path, $$value => $$invalidate(4, $path = $$value));
		let { $$slots: slots = {}, $$scope } = $$props;
		let { href } = $$props;

		function onClick(evt) {
			evt.preventDefault();
			console.dir($path);
			set_store_value(path, $path = href, $path);
		}

		$$self.$$set = $$props => {
			if ('href' in $$props) $$invalidate(0, href = $$props.href);
			if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
		};

		return [href, onClick, $$scope, slots];
	}

	class Link extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$3, create_fragment$4, safe_not_equal, { href: 0 });
		}
	}

	/* src/pages/Planner.svelte generated by Svelte v4.2.0 */

	function get_each_context(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[2] = list[i];
		return child_ctx;
	}

	function get_each_context_1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[5] = list[i];
		return child_ctx;
	}

	// (1:0) <script lang="ts">import Hoverable from "../components/Hoverable.svelte"; import Link from "../components/Link.svelte"; import { api }
	function create_catch_block(ctx) {
		return {
			c: noop,
			m: noop,
			p: noop,
			i: noop,
			o: noop,
			d: noop
		};
	}

	// (13:0) {:then planner}
	function create_then_block(ctx) {
		let table;
		let thead;
		let t5;
		let tbody;
		let t6;
		let button;
		let current;
		let each_value = ensure_array_like(/*planner*/ ctx[0].terms);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		return {
			c() {
				table = element("table");
				thead = element("thead");
				thead.innerHTML = `<th>Code</th> <th>Name</th> <th>Units</th>`;
				t5 = space();
				tbody = element("tbody");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t6 = space();
				button = element("button");
				button.textContent = "Add a term";
			},
			m(target, anchor) {
				insert(target, table, anchor);
				append(table, thead);
				append(table, t5);
				append(table, tbody);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(tbody, null);
					}
				}

				append(tbody, t6);
				append(tbody, button);
				current = true;
			},
			p(ctx, dirty) {
				if (dirty & /*planner*/ 1) {
					each_value = ensure_array_like(/*planner*/ ctx[0].terms);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(tbody, t6);
						}
					}

					group_outros();

					for (i = each_value.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}
			},
			i(local) {
				if (current) return;

				for (let i = 0; i < each_value.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o(local) {
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(table);
				}

				destroy_each(each_blocks, detaching);
			}
		};
	}

	// (27:8) <Link          href="/class/{cls.code.department}/{cls.code           .number}"          >
	function create_default_slot_1(ctx) {
		let t0_value = /*cls*/ ctx[5].code.department + "";
		let t0;
		let t1;
		let t2_value = /*cls*/ ctx[5].code.number + "";
		let t2;

		return {
			c() {
				t0 = text(t0_value);
				t1 = space();
				t2 = text(t2_value);
			},
			m(target, anchor) {
				insert(target, t0, anchor);
				insert(target, t1, anchor);
				insert(target, t2, anchor);
			},
			p(ctx, dirty) {
				if (dirty & /*planner*/ 1 && t0_value !== (t0_value = /*cls*/ ctx[5].code.department + "")) set_data(t0, t0_value);
				if (dirty & /*planner*/ 1 && t2_value !== (t2_value = /*cls*/ ctx[5].code.number + "")) set_data(t2, t2_value);
			},
			d(detaching) {
				if (detaching) {
					detach(t0);
					detach(t1);
					detach(t2);
				}
			}
		};
	}

	// (26:7) <Hoverable inline>
	function create_default_slot(ctx) {
		let link;
		let current;

		link = new Link({
				props: {
					href: "/class/" + /*cls*/ ctx[5].code.department + "/" + /*cls*/ ctx[5].code.number,
					$$slots: { default: [create_default_slot_1] },
					$$scope: { ctx }
				}
			});

		return {
			c() {
				create_component(link.$$.fragment);
			},
			m(target, anchor) {
				mount_component(link, target, anchor);
				current = true;
			},
			p(ctx, dirty) {
				const link_changes = {};
				if (dirty & /*planner*/ 1) link_changes.href = "/class/" + /*cls*/ ctx[5].code.department + "/" + /*cls*/ ctx[5].code.number;

				if (dirty & /*$$scope, planner*/ 257) {
					link_changes.$$scope = { dirty, ctx };
				}

				link.$set(link_changes);
			},
			i(local) {
				if (current) return;
				transition_in(link.$$.fragment, local);
				current = true;
			},
			o(local) {
				transition_out(link.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				destroy_component(link, detaching);
			}
		};
	}

	// (33:8) 
	function create_tooltip_slot(ctx) {
		let div;
		let class_1;
		let current;

		class_1 = new Class({
				props: {
					department: /*cls*/ ctx[5].code.department,
					number: /*cls*/ ctx[5].code.number
				}
			});

		return {
			c() {
				div = element("div");
				create_component(class_1.$$.fragment);
				attr(div, "slot", "tooltip");
			},
			m(target, anchor) {
				insert(target, div, anchor);
				mount_component(class_1, div, null);
				current = true;
			},
			p(ctx, dirty) {
				const class_1_changes = {};
				if (dirty & /*planner*/ 1) class_1_changes.department = /*cls*/ ctx[5].code.department;
				if (dirty & /*planner*/ 1) class_1_changes.number = /*cls*/ ctx[5].code.number;
				class_1.$set(class_1_changes);
			},
			i(local) {
				if (current) return;
				transition_in(class_1.$$.fragment, local);
				current = true;
			},
			o(local) {
				transition_out(class_1.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(div);
				}

				destroy_component(class_1);
			}
		};
	}

	// (23:4) {#each term.classes as cls}
	function create_each_block_1(ctx) {
		let tr;
		let td0;
		let hoverable;
		let t0;
		let td1;
		let t1_value = /*cls*/ ctx[5].name + "";
		let t1;
		let t2;
		let td2;
		let t3_value = /*cls*/ ctx[5].units + "";
		let t3;
		let current;

		hoverable = new Hoverable({
				props: {
					inline: true,
					$$slots: {
						tooltip: [create_tooltip_slot],
						default: [create_default_slot]
					},
					$$scope: { ctx }
				}
			});

		return {
			c() {
				tr = element("tr");
				td0 = element("td");
				create_component(hoverable.$$.fragment);
				t0 = space();
				td1 = element("td");
				t1 = text(t1_value);
				t2 = space();
				td2 = element("td");
				t3 = text(t3_value);
			},
			m(target, anchor) {
				insert(target, tr, anchor);
				append(tr, td0);
				mount_component(hoverable, td0, null);
				append(tr, t0);
				append(tr, td1);
				append(td1, t1);
				append(tr, t2);
				append(tr, td2);
				append(td2, t3);
				current = true;
			},
			p(ctx, dirty) {
				const hoverable_changes = {};

				if (dirty & /*$$scope, planner*/ 257) {
					hoverable_changes.$$scope = { dirty, ctx };
				}

				hoverable.$set(hoverable_changes);
				if ((!current || dirty & /*planner*/ 1) && t1_value !== (t1_value = /*cls*/ ctx[5].name + "")) set_data(t1, t1_value);
				if ((!current || dirty & /*planner*/ 1) && t3_value !== (t3_value = /*cls*/ ctx[5].units + "")) set_data(t3, t3_value);
			},
			i(local) {
				if (current) return;
				transition_in(hoverable.$$.fragment, local);
				current = true;
			},
			o(local) {
				transition_out(hoverable.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(tr);
				}

				destroy_component(hoverable);
			}
		};
	}

	// (21:3) {#each planner.terms as term}
	function create_each_block(ctx) {
		let h2;
		let t0_value = /*term*/ ctx[2].type + "";
		let t0;
		let t1;
		let t2_value = /*term*/ ctx[2].year + "";
		let t2;
		let t3;
		let t4;
		let button;
		let current;
		let each_value_1 = ensure_array_like(/*term*/ ctx[2].classes);
		let each_blocks = [];

		for (let i = 0; i < each_value_1.length; i += 1) {
			each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		return {
			c() {
				h2 = element("h2");
				t0 = text(t0_value);
				t1 = space();
				t2 = text(t2_value);
				t3 = space();

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t4 = space();
				button = element("button");
				button.textContent = "Add a class";
			},
			m(target, anchor) {
				insert(target, h2, anchor);
				append(h2, t0);
				append(h2, t1);
				append(h2, t2);
				insert(target, t3, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(target, anchor);
					}
				}

				insert(target, t4, anchor);
				insert(target, button, anchor);
				current = true;
			},
			p(ctx, dirty) {
				if ((!current || dirty & /*planner*/ 1) && t0_value !== (t0_value = /*term*/ ctx[2].type + "")) set_data(t0, t0_value);
				if ((!current || dirty & /*planner*/ 1) && t2_value !== (t2_value = /*term*/ ctx[2].year + "")) set_data(t2, t2_value);

				if (dirty & /*planner*/ 1) {
					each_value_1 = ensure_array_like(/*term*/ ctx[2].classes);
					let i;

					for (i = 0; i < each_value_1.length; i += 1) {
						const child_ctx = get_each_context_1(ctx, each_value_1, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block_1(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(t4.parentNode, t4);
						}
					}

					group_outros();

					for (i = each_value_1.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}
			},
			i(local) {
				if (current) return;

				for (let i = 0; i < each_value_1.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o(local) {
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(h2);
					detach(t3);
					detach(t4);
					detach(button);
				}

				destroy_each(each_blocks, detaching);
			}
		};
	}

	// (11:16)   Loading planner... {:then planner}
	function create_pending_block(ctx) {
		let t;

		return {
			c() {
				t = text("Loading planner...");
			},
			m(target, anchor) {
				insert(target, t, anchor);
			},
			p: noop,
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(t);
				}
			}
		};
	}

	function create_fragment$3(ctx) {
		let await_block_anchor;
		let promise;
		let current;

		let info = {
			ctx,
			current: null,
			token: null,
			hasCatch: false,
			pending: create_pending_block,
			then: create_then_block,
			catch: create_catch_block,
			value: 0,
			blocks: [,,,]
		};

		handle_promise(promise = /*planner*/ ctx[0], info);

		return {
			c() {
				await_block_anchor = empty();
				info.block.c();
			},
			m(target, anchor) {
				insert(target, await_block_anchor, anchor);
				info.block.m(target, info.anchor = anchor);
				info.mount = () => await_block_anchor.parentNode;
				info.anchor = await_block_anchor;
				current = true;
			},
			p(new_ctx, [dirty]) {
				ctx = new_ctx;
				info.ctx = ctx;

				if (dirty & /*planner*/ 1 && promise !== (promise = /*planner*/ ctx[0]) && handle_promise(promise, info)) ; else {
					update_await_block_branch(info, ctx, dirty);
				}
			},
			i(local) {
				if (current) return;
				transition_in(info.block);
				current = true;
			},
			o(local) {
				for (let i = 0; i < 3; i += 1) {
					const block = info.blocks[i];
					transition_out(block);
				}

				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(await_block_anchor);
				}

				info.block.d(detaching);
				info.token = null;
				info = null;
			}
		};
	}

	function instance$2($$self, $$props, $$invalidate) {
		let $api;
		component_subscribe($$self, api, $$value => $$invalidate(1, $api = $$value));
		let { planner = null } = $$props;

		$$self.$$set = $$props => {
			if ('planner' in $$props) $$invalidate(0, planner = $$props.planner);
		};

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*planner, $api*/ 3) {
				if (!planner) {
					$$invalidate(0, planner = $api.getPlanner());
				}
			}
		};

		return [planner, $api];
	}

	class Planner extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$2, create_fragment$3, safe_not_equal, { planner: 0 });
		}
	}

	/* src/Router.svelte generated by Svelte v4.2.0 */

	function create_fragment$2(ctx) {
		let switch_instance;
		let switch_instance_anchor;
		let current;
		const switch_instance_spread_levels = [/*props*/ ctx[1]];
		var switch_value = /*currentComponent*/ ctx[0];

		function switch_props(ctx, dirty) {
			let switch_instance_props = {};

			if (dirty !== undefined && dirty & /*props*/ 2) {
				switch_instance_props = get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[1])]);
			} else {
				for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
					switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
				}
			}

			return { props: switch_instance_props };
		}

		if (switch_value) {
			switch_instance = construct_svelte_component(switch_value, switch_props(ctx));
		}

		return {
			c() {
				if (switch_instance) create_component(switch_instance.$$.fragment);
				switch_instance_anchor = empty();
			},
			m(target, anchor) {
				if (switch_instance) mount_component(switch_instance, target, anchor);
				insert(target, switch_instance_anchor, anchor);
				current = true;
			},
			p(ctx, [dirty]) {
				if (dirty & /*currentComponent*/ 1 && switch_value !== (switch_value = /*currentComponent*/ ctx[0])) {
					if (switch_instance) {
						group_outros();
						const old_component = switch_instance;

						transition_out(old_component.$$.fragment, 1, 0, () => {
							destroy_component(old_component, 1);
						});

						check_outros();
					}

					if (switch_value) {
						switch_instance = construct_svelte_component(switch_value, switch_props(ctx, dirty));
						create_component(switch_instance.$$.fragment);
						transition_in(switch_instance.$$.fragment, 1);
						mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
					} else {
						switch_instance = null;
					}
				} else if (switch_value) {
					const switch_instance_changes = (dirty & /*props*/ 2)
					? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[1])])
					: {};

					switch_instance.$set(switch_instance_changes);
				}
			},
			i(local) {
				if (current) return;
				if (switch_instance) transition_in(switch_instance.$$.fragment, local);
				current = true;
			},
			o(local) {
				if (switch_instance) transition_out(switch_instance.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(switch_instance_anchor);
				}

				if (switch_instance) destroy_component(switch_instance, detaching);
			}
		};
	}

	const PREFIX = "";

	function isOptions(component) {
		return Object.hasOwn(component, "component");
	}

	function instance$1($$self, $$props, $$invalidate) {
		const routes = {
			"/class/(?<department>\\w+)/(?<number>[\\w\\d]+)": {
				component: Class,
				transform: ({ department, number }) => ({
					department: department.toUpperCase(),
					number: number.toUpperCase()
				})
			},
			"/planner": Planner
		};

		const compiled = Object.entries(routes).map(([route, component]) => [
			new RegExp("^" + PREFIX + route + "$"),
			isOptions(component) ? component : { component }
		]);

		let { defaultComponent } = $$props;
		let currentComponent = defaultComponent;
		let props = {};

		path.subscribe(path => {
			history.pushState({}, "", path);
			updateRoute(path);
		});

		window.onpopstate = () => {
			// updateRoute(window.location.pathname);
			path.set(window.location.pathname);
		};

		function updateRoute(path) {
			var _a;

			for (const [route, options] of compiled) {
				let match = path.match(route);

				if (match) {
					$$invalidate(1, props = ((_a = options.transform) !== null && _a !== void 0
					? _a
					: x => x)(match.groups));

					$$invalidate(0, currentComponent = options.component);
					return;
				}
			}

			$$invalidate(1, props = {});
			$$invalidate(0, currentComponent = defaultComponent);
		}

		updateRoute(window.location.pathname);

		$$self.$$set = $$props => {
			if ('defaultComponent' in $$props) $$invalidate(2, defaultComponent = $$props.defaultComponent);
		};

		return [currentComponent, props, defaultComponent];
	}

	class Router extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$1, create_fragment$2, safe_not_equal, { defaultComponent: 2 });
		}
	}

	/* src/pages/Home.svelte generated by Svelte v4.2.0 */

	function create_fragment$1(ctx) {
		let button;
		let mounted;
		let dispose;

		return {
			c() {
				button = element("button");
				button.textContent = "Say hi!";
			},
			m(target, anchor) {
				insert(target, button, anchor);

				if (!mounted) {
					dispose = listen(button, "click", /*click_handler*/ ctx[1]);
					mounted = true;
				}
			},
			p: noop,
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(button);
				}

				mounted = false;
				dispose();
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		let $path;
		component_subscribe($$self, path, $$value => $$invalidate(0, $path = $$value));
		const click_handler = () => set_store_value(path, $path = "/class/cse/20", $path);
		return [$path, click_handler];
	}

	class Home extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance, create_fragment$1, safe_not_equal, {});
		}
	}

	/* src/App.svelte generated by Svelte v4.2.0 */

	function create_fragment(ctx) {
		let router;
		let current;
		router = new Router({ props: { defaultComponent: Home } });

		return {
			c() {
				create_component(router.$$.fragment);
			},
			m(target, anchor) {
				mount_component(router, target, anchor);
				current = true;
			},
			p: noop,
			i(local) {
				if (current) return;
				transition_in(router.$$.fragment, local);
				current = true;
			},
			o(local) {
				transition_out(router.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				destroy_component(router, detaching);
			}
		};
	}

	class App extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, null, create_fragment, safe_not_equal, {});
		}
	}

	var index = new App({ target: document.body });

	return index;

})();
