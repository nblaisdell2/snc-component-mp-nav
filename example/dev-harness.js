/*
 * Dev-harness controls — DEV ONLY. Never deployed.
 *
 * This module builds a UI-Builder-like "controls" panel around the component so
 * you can exercise every property locally and watch the NAVIGATE event fire.
 *
 * Why it is safe to keep in the repo: `snc ui-component develop` uses
 * example/element.js as the webpack dev-server entry, and example/element.js is
 * the only thing that imports this file. The deployable component is defined by
 * now-ui.json (scopeName + components -> src/x-1295779-metrics-nav-uic), which
 * does NOT reference example/. So nothing under example/ is ever packaged by
 * `generate-update-set` / `deploy`.
 *
 * NOTE on styling: the snc webpack pipeline only injects the COMPONENT's .scss
 * (via `import styles from './styles.scss'` -> createCustomElement). A plain
 * `import './x.css'` is NOT given a style-loader and never reaches the DOM, so
 * the harness CSS is injected here as a <style> tag instead (see DH_STYLES).
 *
 * Layout: the main stage holds ONLY the component; all controls live in a
 * collapsible right-side drawer. The control list is generated FROM now-ui.json's
 * `properties` block, so it stays in sync automatically — add a property to the
 * manifest and a matching control appears here with no extra code.
 */

import nowUi from '../now-ui.json';
import { SAMPLE_DASHBOARDS } from '../src/x-1295779-metrics-nav-uic/sampleData';

const TAG = 'x-1295779-metrics-nav-uic';
const componentDef = nowUi.components[TAG];
const PROP_DEFS = componentDef.properties || [];
const ACTION_DEFS = componentDef.actions || [];

/*
 * Dev-only logo. The component's `logoImageUrl` would normally point at a
 * db_image attachment on the instance, which isn't reachable from the dev
 * server. So for local preview we inline the image as a base64 data URI here and
 * use it as the seed value for `logoImageUrl` (the control still lets you change
 * it live). Inlining avoids depending on a webpack image loader — same rationale
 * as the DH_STYLES <style> injection below.
 *
 * To set it: drop the PNG at example/assets/logo.png, then paste its data URI
 * ("data:image/png;base64,....") between the quotes. Leave '' for the text logo.
 */
const LOGO_DATA_URI = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAhwAAABkCAMAAAD6zhnLAAACdlBMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8FmJb///////////////////8Lp2b///////8AjrH///////////////8AjrH///////////////////////////////////////8AjrH///////////////////////////////8Mp2b///////////////////////////////8HnYX///////////8Mp2b///////////////////8LpmX///8Mp2b///////8AjrH///////////////8LpWQAjrH///////////////////////////////8AjrEAjrEAjrAAjrH///8Mp2YMp2YAjrEAjrEAjrEAjrEAjrEAjrEKomIAjrEMp2YAjrH///8AjrEAjrEAjrH///8AjrELp2b///8AjrEMp2YAjrEAjrEAjrELp2YAjrEMp2b///8Lp2YAjrEAjrELpmYAj6wMp2YLp2YAjrEAjrEMp2YKpHEMp2YMp2YAjrEMp2YAjq0Mp2YGkFgDlZ0Mp2YMp2YMp2YMp2YAjrILo2MAjrEIoHsHnYUAjrEMp2YAjrEBiIADiFMMp2YJn2EEl5UMp2YMp2YMp2YAhHYAfUsMp2YBgE0CgU0AjrEEi1QJnV8JoXkGkFgGklkCgk8GklkDg1AHllsHnIj///8AjrEMp2YAekoLo2MEiVMAeUkDh1EAfU8BkaYHmFwAiI4KomICgk4AipwAgGEFmZEDQLi4AAAAwXRSTlMA+/H9Bkrdb1rnpcqrL8P2+HKayGb6TJctIwrgkA/ZBeQMOggE/VXP/ruzhxv86tLzWBK/fBQHjfjslEcqHa41MvjMwbein51PIgkgEWkvGO7bqF0N2MJsYRbUUkM3HQ9AJYN4dT0nDeXWwpuAZ7eG792zo202Guusjk0y9Om6pIpbb2RSKCTrroaFRCQT/uXPypFW/teOfXt2Gf348ciWRisqH/77z148+E9N/uvg2j/+9ErknYFvaubd1sO+uKeILyFFwwAAFWpJREFUeNrtnfdf20YUwJ8t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`;

/* Tiny DOM helper: h('div', { class: 'x' }, [childNodes | strings]). */
const h = (tag, attrs = {}, kids = []) => {
	const el = document.createElement(tag);
	Object.entries(attrs).forEach(([k, v]) => {
		if (v == null) return;
		if (k === 'class') el.className = v;
		else if (k === 'text') el.textContent = v;
		else el.setAttribute(k, v);
	});
	(Array.isArray(kids) ? kids : [kids]).forEach((kid) => {
		if (kid == null) return;
		el.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
	});
	return el;
};

/* "Layout · Orientation" -> { group: 'Layout', label: 'Orientation' }. */
const splitLabel = (label, name) => {
	const raw = label || name;
	const idx = raw.indexOf('·');
	if (idx === -1) return { group: 'General', label: raw.trim() };
	return { group: raw.slice(0, idx).trim(), label: raw.slice(idx + 1).trim() };
};

const isColorProp = (def) =>
	/color/i.test(def.name) && def.fieldType === 'string';

const looksLikeHex = (v) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v || '').trim());

/* The starting value for a property: its manifest default, with `dashboards`
 * prefilled from the sample so there is something editable on screen. */
const initialValue = (def) => {
	if (def.name === 'dashboards') return SAMPLE_DASHBOARDS;
	if (def.name === 'logoImageUrl' && LOGO_DATA_URI) return LOGO_DATA_URI; // dev logo
	if (def.fieldType === 'boolean') return def.defaultValue === true;
	return def.defaultValue != null ? def.defaultValue : '';
};

/* Inject the harness stylesheet once (plain CSS imports are not loaded here). */
const injectStyles = () => {
	if (document.getElementById('dh-styles')) return;
	const style = document.createElement('style');
	style.id = 'dh-styles';
	style.textContent = DH_STYLES;
	document.head.appendChild(style);
};

export function mountDevHarness(root = document.body) {
	injectStyles();
	root.innerHTML = '';

	// Live values + the element instance every control writes to.
	const values = {};
	const el = document.createElement(TAG);

	const apply = (name, value) => {
		values[name] = value;
		el[name] = value; // ui-core property accessor -> re-render
	};

	/* ---- main stage: ONLY the component ---- */
	const stage = h('div', { class: 'dh-stage dh-bg-light' }, [el]);

	/* ---- background switcher (lives in the drawer, drives the stage) ---- */
	const bgSeg = h('div', { class: 'dh-seg' });
	[
		['light', 'Light'],
		['dark', 'Dark'],
		['grid', 'Grid']
	].forEach(([key, lbl], i) => {
		const b = h('button', { text: lbl, type: 'button' });
		if (i === 0) b.classList.add('dh-on');
		b.addEventListener('click', () => {
			stage.className = `dh-stage dh-bg-${key}`;
			bgSeg.querySelectorAll('button').forEach((x) => x.classList.remove('dh-on'));
			b.classList.add('dh-on');
		});
		bgSeg.appendChild(b);
	});

	/* ---- event log ---- */
	const logList = h('div', { class: 'dh-log-list' }, [
		h('div', { class: 'dh-log-empty', text: 'No events yet — click a nav item.' })
	]);
	let logCount = 0;
	const pushLog = (name, detail) => {
		if (logCount === 0) logList.innerHTML = '';
		logCount += 1;
		const time = new Date().toLocaleTimeString();
		logList.prepend(
			h('div', { class: 'dh-log-row' }, [
				h('span', { class: 'dh-log-time', text: time }),
				h('span', { class: 'dh-log-name', text: name }),
				h('span', { text: JSON.stringify(detail) })
			])
		);
	};
	const clearLog = () => {
		logCount = 0;
		logList.innerHTML = '';
		logList.appendChild(h('div', { class: 'dh-log-empty', text: 'No events yet — click a nav item.' }));
	};

	// Listen for every declared action (currently NAVIGATE).
	ACTION_DEFS.forEach((a) => {
		el.addEventListener(a.name, (e) => pushLog(a.name, (e.detail && e.detail.payload) || e.detail));
	});

	const logSection = h('div', { class: 'dh-log' }, [
		h('div', { class: 'dh-log-head' }, [
			h('span', { text: `Events · ${ACTION_DEFS.map((a) => a.name).join(', ') || 'none'}` }),
			(() => {
				const b = h('button', { class: 'dh-btn dh-btn-sm', text: 'Clear', type: 'button' });
				b.addEventListener('click', clearLog);
				return b;
			})()
		]),
		logList
	]);

	/* ---- currentKey datalist (quick active-state testing) ---- */
	const keyList = h('datalist', { id: 'dh-keys' });
	const refreshKeys = (arr) => {
		keyList.innerHTML = '';
		const walk = (items) =>
			(Array.isArray(items) ? items : []).forEach((d) => {
				if (d && d.key != null) keyList.appendChild(h('option', { value: String(d.key) }));
				if (d && d.children) walk(d.children);
			});
		walk(arr);
	};
	refreshKeys(SAMPLE_DASHBOARDS);

	// Build a control for one property def.
	const buildField = (def) => {
		const { label } = splitLabel(def.label, def.name);
		const field = h('div', { class: 'dh-field' });

		// boolean -> toggle row (label beside the box)
		if (def.fieldType === 'boolean') {
			const id = `dh-${def.name}`;
			const box = h('input', { type: 'checkbox', id });
			box.checked = values[def.name] === true;
			box.addEventListener('change', () => apply(def.name, box.checked));
			field.appendChild(
				h('div', { class: 'dh-bool' }, [box, h('label', { for: id, text: label })])
			);
			if (def.description) field.appendChild(h('p', { class: 'dh-desc', text: def.description }));
			return field;
		}

		field.appendChild(h('label', { class: 'dh-field-label', text: label }));
		if (def.description) field.appendChild(h('p', { class: 'dh-desc', text: def.description }));

		// choice -> select
		if (def.fieldType === 'choice') {
			const sel = h('select');
			const choices = (def.typeMetadata && def.typeMetadata.choices) || [];
			choices.forEach((c) => {
				const opt = h('option', { value: c.value, text: c.label });
				if (c.value === values[def.name]) opt.selected = true;
				sel.appendChild(opt);
			});
			sel.addEventListener('change', () => apply(def.name, sel.value));
			field.appendChild(sel);
			return field;
		}

		// json -> textarea (parsed on input)
		if (def.fieldType === 'json') {
			const ta = h('textarea', { spellcheck: 'false' });
			ta.value = JSON.stringify(values[def.name], null, 2);
			const err = h('div', { class: 'dh-err' });
			ta.addEventListener('input', () => {
				try {
					const parsed = JSON.parse(ta.value);
					ta.classList.remove('dh-invalid');
					err.textContent = '';
					apply(def.name, parsed);
					if (def.name === 'dashboards') refreshKeys(parsed);
				} catch (ex) {
					ta.classList.add('dh-invalid');
					err.textContent = `Invalid JSON: ${ex.message}`;
				}
			});
			field.appendChild(ta);
			field.appendChild(err);
			return field;
		}

		// string -> text input (+ color picker for *Color props)
		const text = h('input', { type: 'text', value: values[def.name] || '' });
		if (def.name === 'currentKey') text.setAttribute('list', 'dh-keys');

		if (isColorProp(def)) {
			const color = h('input', { type: 'color' });
			if (looksLikeHex(values[def.name])) color.value = values[def.name];
			color.addEventListener('input', () => {
				text.value = color.value;
				apply(def.name, color.value);
			});
			text.addEventListener('input', () => {
				if (looksLikeHex(text.value)) color.value = text.value.trim();
				apply(def.name, text.value);
			});
			field.appendChild(h('div', { class: 'dh-color' }, [color, text]));
			return field;
		}

		text.addEventListener('input', () => apply(def.name, text.value));
		field.appendChild(text);
		return field;
	};

	// Group fields by label prefix, preserving manifest order.
	const groups = [];
	const byGroup = Object.create(null);
	PROP_DEFS.forEach((def) => {
		values[def.name] = initialValue(def); // seed live value
		const { group } = splitLabel(def.label, def.name);
		if (!byGroup[group]) {
			byGroup[group] = h('div', { class: 'dh-fields' });
			groups.push({ group, body: byGroup[group] });
		}
		byGroup[group].appendChild(buildField(def));
	});

	const sectionEls = groups.map(({ group, body }, i) => {
		const details = h('details', { class: 'dh-section' });
		if (i < 3) details.setAttribute('open', '');
		details.appendChild(
			h('summary', {}, [
				h('span', { class: 'dh-section-title', text: group }),
				h('span', { class: 'dh-chevron', 'aria-hidden': 'true' })
			])
		);
		details.appendChild(body);
		return details;
	});

	/* ---- drawer (right, collapsible) ---- */
	const resetBtn = h('button', { class: 'dh-btn', text: 'Reset to defaults', type: 'button' });
	resetBtn.addEventListener('click', () => mountDevHarness(root));

	const collapseBtn = h('button', {
		class: 'dh-collapse',
		type: 'button',
		title: 'Collapse panel',
		'aria-label': 'Collapse panel',
		text: '⟩'
	});

	const drawer = h('aside', { class: 'dh-drawer' }, [
		h('div', { class: 'dh-drawer-head' }, [
			h('span', { class: 'dh-drawer-title', text: 'Properties' }),
			collapseBtn
		]),
		h('div', { class: 'dh-drawer-body' }, [
			h('div', { class: 'dh-tool' }, [
				h('span', { class: 'dh-tool-label', text: 'Stage background' }),
				bgSeg
			]),
			h('div', { class: 'dh-toolbar' }, [resetBtn]),
			...sectionEls,
			logSection
		])
	]);

	// Always-visible handle to reopen when collapsed.
	const handle = h('button', {
		class: 'dh-handle',
		type: 'button',
		title: 'Toggle properties panel',
		'aria-label': 'Toggle properties panel',
		text: 'Properties'
	});

	const wrap = h('div', { class: 'dh-wrap dh-open' }, [stage, drawer, handle, keyList]);
	const toggle = () => wrap.classList.toggle('dh-open');
	collapseBtn.addEventListener('click', toggle);
	handle.addEventListener('click', toggle);

	/* ---- assemble + push initial values ---- */
	root.appendChild(wrap);
	PROP_DEFS.forEach((def) => apply(def.name, values[def.name]));
}

/* ---------------------------------------------------------------------------
 * Harness stylesheet (injected as a <style> tag — see injectStyles()).
 * All selectors are `dh-`-prefixed so they can never collide with the
 * component's own `mn-` classes.
 * ------------------------------------------------------------------------- */
const DH_STYLES = `
:root {
	--dh-border: #e2e8f0;
	--dh-bg: #f1f5f9;
	--dh-panel: #ffffff;
	--dh-panel-2: #f8fafc;
	--dh-text: #0f172a;
	--dh-muted: #64748b;
	--dh-accent: #2563eb;
	--dh-accent-soft: #eff6ff;
	--dh-danger: #dc2626;
	--dh-radius: 8px;
	--dh-shadow: 0 0 24px rgba(15, 23, 42, 0.12);
	--dh-drawer-w: 372px;
}

html, body {
	margin: 0;
	/* The off-screen collapsed drawer (translateX) and wide hover popups would
	   otherwise extend the page's scroll width and add a phantom horizontal
	   scrollbar / gray gutter. Clip horizontally (not 'hidden', so the vertical
	   axis is unaffected). */
	overflow-x: clip;
}
body {
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	color: var(--dh-text);
	background: var(--dh-bg);
}
.dh-wrap, .dh-wrap * { box-sizing: border-box; }

/* ---- Layout wrapper ---- */
.dh-wrap { position: relative; min-height: 100vh; }

/* ---- Stage (component only) ---- */
.dh-stage {
	min-height: 100vh;
	padding: 0;
	/* Reserve room for the open drawer with margin (not padding) so the component
	   stays flush to the top/left page edges; collapses to full width when closed. */
	margin-right: var(--dh-drawer-w);
	transition: margin-right 0.25s ease;
}
.dh-wrap:not(.dh-open) .dh-stage { margin-right: 0; }

.dh-stage.dh-bg-light { background: #ffffff; }
.dh-stage.dh-bg-dark { background: #0f172a; }
.dh-stage.dh-bg-grid {
	background-color: #fff;
	background-image:
		linear-gradient(45deg, #eef2f7 25%, transparent 25%),
		linear-gradient(-45deg, #eef2f7 25%, transparent 25%),
		linear-gradient(45deg, transparent 75%, #eef2f7 75%),
		linear-gradient(-45deg, transparent 75%, #eef2f7 75%);
	background-size: 20px 20px;
	background-position: 0 0, 0 10px, 10px -10px, -10px 0;
}

/* ---- Drawer ---- */
.dh-drawer {
	position: fixed;
	top: 0;
	right: 0;
	width: var(--dh-drawer-w);
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: var(--dh-panel);
	border-left: 1px solid var(--dh-border);
	box-shadow: var(--dh-shadow);
	transform: translateX(0);
	transition: transform 0.25s ease;
	z-index: 20;
}
.dh-wrap:not(.dh-open) .dh-drawer { transform: translateX(100%); }

.dh-drawer-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 14px 16px;
	border-bottom: 1px solid var(--dh-border);
	background: var(--dh-panel-2);
}
.dh-drawer-title {
	font-size: 13px;
	font-weight: 700;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	color: var(--dh-muted);
}
.dh-collapse {
	font-size: 16px;
	line-height: 1;
	width: 30px;
	height: 30px;
	border: 1px solid var(--dh-border);
	background: #fff;
	border-radius: 6px;
	cursor: pointer;
	color: var(--dh-muted);
}
.dh-collapse:hover { border-color: var(--dh-accent); color: var(--dh-accent); }

.dh-drawer-body { flex: 1; overflow-y: auto; padding: 16px; }

/* ---- Reopen handle (visible when collapsed) ---- */
.dh-handle {
	position: fixed;
	top: 50%;
	right: 0;
	transform: translateY(-50%);
	writing-mode: vertical-rl;
	rotate: 180deg;
	padding: 14px 8px;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #fff;
	background: var(--dh-accent);
	border: 0;
	border-radius: 8px 0 0 8px;
	box-shadow: var(--dh-shadow);
	cursor: pointer;
	z-index: 10;
	opacity: 0;
	pointer-events: none;
	transition: opacity 0.2s ease;
}
.dh-wrap:not(.dh-open) .dh-handle { opacity: 1; pointer-events: auto; }

/* ---- Buttons ---- */
.dh-btn {
	font: inherit;
	font-size: 13px;
	font-weight: 500;
	padding: 8px 12px;
	border: 1px solid var(--dh-border);
	background: var(--dh-panel);
	border-radius: 6px;
	cursor: pointer;
	transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}
.dh-btn:hover { border-color: var(--dh-accent); color: var(--dh-accent); background: var(--dh-accent-soft); }
.dh-btn-sm { font-size: 11px; padding: 4px 8px; }
.dh-toolbar { margin-bottom: 16px; }
.dh-toolbar .dh-btn { width: 100%; }

/* ---- Stage-background tool row ---- */
.dh-tool {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	padding: 10px 12px;
	margin-bottom: 12px;
	background: var(--dh-panel-2);
	border: 1px solid var(--dh-border);
	border-radius: var(--dh-radius);
}
.dh-tool-label { font-size: 12px; font-weight: 600; color: var(--dh-muted); }

.dh-seg {
	display: inline-flex;
	border: 1px solid var(--dh-border);
	border-radius: 6px;
	overflow: hidden;
	background: #fff;
}
.dh-seg button {
	font: inherit;
	font-size: 12px;
	padding: 5px 11px;
	border: 0;
	background: #fff;
	cursor: pointer;
	border-left: 1px solid var(--dh-border);
	color: var(--dh-text);
}
.dh-seg button:first-child { border-left: 0; }
.dh-seg button.dh-on { background: var(--dh-accent); color: #fff; }

/* ---- Sections (collapsible groups) ---- */
.dh-section {
	border: 1px solid var(--dh-border);
	border-radius: var(--dh-radius);
	margin-bottom: 10px;
	overflow: hidden;
	background: var(--dh-panel);
}
.dh-section > summary {
	display: flex;
	align-items: center;
	justify-content: space-between;
	cursor: pointer;
	padding: 11px 14px;
	background: var(--dh-panel-2);
	list-style: none;
	user-select: none;
}
.dh-section > summary::-webkit-details-marker { display: none; }
.dh-section-title {
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: var(--dh-muted);
}
.dh-chevron {
	width: 8px;
	height: 8px;
	border-right: 2px solid var(--dh-muted);
	border-bottom: 2px solid var(--dh-muted);
	transform: rotate(45deg);
	transition: transform 0.2s ease;
}
.dh-section[open] > summary { border-bottom: 1px solid var(--dh-border); }
.dh-section[open] > summary .dh-chevron { transform: rotate(-135deg); }
.dh-fields { padding: 14px; }

/* ---- Fields ---- */
.dh-field {
	padding-bottom: 14px;
	margin-bottom: 14px;
	border-bottom: 1px dashed var(--dh-border);
}
.dh-field:last-child { padding-bottom: 0; margin-bottom: 0; border-bottom: 0; }
.dh-field-label {
	display: block;
	font-size: 13px;
	font-weight: 600;
	color: var(--dh-text);
	margin-bottom: 4px;
}
.dh-desc { font-size: 11px; color: var(--dh-muted); margin: 0 0 7px; line-height: 1.4; }

.dh-field input[type='text'],
.dh-field select,
.dh-field textarea {
	width: 100%;
	font: inherit;
	font-size: 13px;
	padding: 8px 10px;
	border: 1px solid var(--dh-border);
	border-radius: 6px;
	background: #fff;
	color: var(--dh-text);
	transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.dh-field input[type='text']:focus,
.dh-field select:focus,
.dh-field textarea:focus {
	outline: none;
	border-color: var(--dh-accent);
	box-shadow: 0 0 0 3px var(--dh-accent-soft);
}
.dh-field select {
	appearance: none;
	-webkit-appearance: none;
	background-image: linear-gradient(45deg, transparent 50%, var(--dh-muted) 50%),
		linear-gradient(135deg, var(--dh-muted) 50%, transparent 50%);
	background-position: calc(100% - 16px) 14px, calc(100% - 11px) 14px;
	background-size: 5px 5px, 5px 5px;
	background-repeat: no-repeat;
	padding-right: 30px;
	cursor: pointer;
}
.dh-field textarea {
	font-family: 'SF Mono', Menlo, Consolas, monospace;
	font-size: 12px;
	line-height: 1.5;
	min-height: 180px;
	resize: vertical;
	white-space: pre;
}
.dh-field textarea.dh-invalid { border-color: var(--dh-danger); background: #fef2f2; }
.dh-err { color: var(--dh-danger); font-size: 11px; margin-top: 5px; min-height: 14px; }

/* Boolean toggle row */
.dh-bool { display: flex; align-items: center; gap: 9px; }
.dh-bool input { width: 16px; height: 16px; accent-color: var(--dh-accent); cursor: pointer; }
.dh-bool > label { margin: 0; font-size: 13px; font-weight: 600; cursor: pointer; }

/* Color picker + text combo */
.dh-color { display: flex; gap: 8px; align-items: center; }
.dh-color input[type='color'] {
	width: 38px;
	height: 36px;
	padding: 0;
	border: 1px solid var(--dh-border);
	border-radius: 6px;
	background: #fff;
	cursor: pointer;
	flex: 0 0 auto;
}
.dh-color input[type='text'] { flex: 1; }

/* ---- Event log ---- */
.dh-log { margin-top: 16px; border: 1px solid var(--dh-border); border-radius: var(--dh-radius); overflow: hidden; }
.dh-log-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 9px 12px;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	color: var(--dh-muted);
	background: var(--dh-panel-2);
	border-bottom: 1px solid var(--dh-border);
}
.dh-log-list {
	max-height: 220px;
	overflow: auto;
	margin: 0;
	padding: 8px 12px;
	font-family: 'SF Mono', Menlo, Consolas, monospace;
	font-size: 12px;
	background: #fff;
}
.dh-log-empty { color: var(--dh-muted); font-style: italic; }
.dh-log-row { padding: 4px 0; border-bottom: 1px dotted var(--dh-border); word-break: break-all; }
.dh-log-row:last-child { border-bottom: 0; }
.dh-log-time { color: var(--dh-muted); margin-right: 8px; }
.dh-log-name { color: var(--dh-accent); font-weight: 700; margin-right: 8px; }
`;
