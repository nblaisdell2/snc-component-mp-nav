import { createCustomElement } from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import styles from './styles.scss';
import { SAMPLE_DASHBOARDS } from './sampleData';

/**
 * x-1295779-metrics-nav-uic — config-driven Metrics Portal navigation bar.
 *
 * Pure presentation: it NEVER fetches its own data (build spec §10). The page
 * binds `dashboards` to the active-dashboards Data Resource and `currentKey` to
 * the route param. Clicking an item dispatches NAVIGATE({ key }); the page wires
 * that to route the generic dashboard page (build spec §7 / §11).
 *
 * Information architecture: the TOP-LEVEL nav items are the `nav_group` values.
 * A group is NOT navigable — it only opens a popup listing the dashboards in that
 * group (and each dashboard's `children`). Dashboards with no nav_group are
 * hidden. `childDisplayMode` chooses how sub-pages (children) are shown:
 *   - 'inline'  — children always shown, indented beneath their parent dashboard
 *   - 'flyout'  — first popup shows titles only; children open in a secondary popup
 *
 * Rendered declaratively with snabbdom — the view reads `state.properties`, so it
 * re-renders automatically whenever a UI Builder property changes (no imperative
 * lifecycle handlers needed, unlike the D3 chart components).
 */

/** Coerce a UI Builder value into a CSS length ("12px", "1rem"; bare number -> px). */
const cssLen = (v, fallback) => {
	if (v === undefined || v === null || v === '') return fallback;
	return /^\d+(\.\d+)?$/.test(String(v)) ? `${v}px` : String(v);
};

const asArray = (v) => (Array.isArray(v) ? v : []);

const isActive = (d) =>
	d.active === undefined || d.active === true || d.active === 'true' || d.active === 1;

/**
 * Normalize a Dashboard record (snake_case or camelCase) into the nav's shape.
 * `children` (sub-dashboards from the hierarchical /nav endpoint) are normalized
 * recursively so a dashboard can render its children in the popup hierarchy.
 */
const normalize = (d) => ({
	key: d.key != null ? String(d.key) : '',
	title: d.title || d.name || d.label || (d.key != null ? String(d.key) : '(untitled)'),
	navGroup: d.nav_group != null ? d.nav_group : d.navGroup != null ? d.navGroup : '',
	navOrder: Number(d.nav_order != null ? d.nav_order : d.navOrder != null ? d.navOrder : 0) || 0,
	icon: d.icon || '',
	children: normalizeList(d.children)
});

/** Active-filter, normalize, and order a raw dashboards array (any nesting level). */
const normalizeList = (list) => {
	const items = asArray(list)
		.filter((d) => d && isActive(d))
		.map(normalize)
		.filter((d) => d.key);
	items.sort((a, b) => a.navOrder - b.navOrder || a.title.localeCompare(b.title));
	return items;
};

/**
 * Build the top-level groups: dashboards bucketed by `navGroup`. Dashboards with
 * no nav_group are hidden. Items within a group are ordered by nav_order; groups
 * themselves are ordered by their lowest nav_order, tie-broken by the order they
 * first appear in the data. Each group is `{ label, items }` and every item keeps
 * its `children` (already sorted by `normalize`).
 */
const buildGroups = (dashboards) => {
	const items = asArray(dashboards)
		.filter((d) => d && isActive(d))
		.map(normalize)
		.filter((d) => d.key);
	const groups = [];
	const byLabel = Object.create(null);
	items.forEach((it) => {
		const label = it.navGroup || '';
		if (!label) return; // hide ungrouped dashboards
		if (!byLabel[label]) {
			byLabel[label] = { label, items: [], order: it.navOrder, seq: groups.length };
			groups.push(byLabel[label]);
		} else {
			byLabel[label].order = Math.min(byLabel[label].order, it.navOrder);
		}
		byLabel[label].items.push(it);
	});
	groups.forEach((g) =>
		g.items.sort((a, b) => a.navOrder - b.navOrder || a.title.localeCompare(b.title))
	);
	groups.sort((a, b) => a.order - b.order || a.seq - b.seq);
	return groups;
};

/** True when `key` matches any dashboard or descendant child in `items`. */
const anyActive = (items, key) =>
	asArray(items).some((it) => it.key === key || anyActive(it.children, key));

const view = (state, { dispatch }) => {
	const p = state.properties;
	const dashboards = asArray(p.dashboards).length ? p.dashboards : SAMPLE_DASHBOARDS;
	const groups = buildGroups(dashboards);
	const horizontal = p.orientation !== 'vertical';
	const current = p.currentKey != null ? String(p.currentKey) : '';
	const empty = groups.length === 0;
	const flyout = p.childDisplayMode === 'flyout';

	// Inline mode wraps a group's dashboards into columns of at most this many
	// items, so a large group reads across the popup instead of scrolling.
	const colSize = Math.max(1, parseInt(p.inlineColumnSize, 10) || 8);
	const lineColor = p.childLineColor || '#d1d5db';

	// An item is highlighted when it IS the current page or an ANCESTOR of it, so
	// the whole path (group → dashboard → child) reads as selected.
	const onPath = (item) => item.key === current || anyActive(item.children, current);

	const rootStyle = {
		background: p.backgroundColor || 'transparent',
		color: p.textColor || '#374151',
		fontFamily: p.fontFamily || 'inherit',
		fontSize: cssLen(p.fontSize, '14px'),
		fontWeight: p.fontWeight || 'normal',
		textTransform: p.textTransform || 'none',
		letterSpacing: cssLen(p.letterSpacing, 'normal'),
		borderBottomStyle: 'solid',
		borderBottomWidth: cssLen(p.borderBottomWidth, '1px'),
		borderBottomColor: p.borderBottomColor || 'transparent',
		// Padding around the whole bar — grows the nav's height / side insets
		// without touching the individual item sizing (that's `itemPadding`).
		padding: p.navPadding || '0'
	};
	const listStyle = { gap: cssLen(p.itemGap, '4px') };
	const linkStyle = (active) => {
		const base = {
			padding: p.itemPadding || '8px 12px',
			borderRadius: cssLen(p.itemRadius, '6px')
		};
		if (active) {
			base.background = p.activeBackgroundColor || '#2E93fA';
			base.color = p.activeTextColor || '#ffffff';
		}
		return base;
	};

	const popupStyle = { background: p.popupBackgroundColor || '#ffffff' };

	const onItemClick = (item) => (e) => {
		if (e && e.preventDefault) e.preventDefault();
		// Bubble the selection up for the page to route on (build spec §7).
		dispatch('NAVIGATE', { key: item.key, title: item.title, navGroup: item.navGroup });
	};

	// A leaf link inside a popup (a dashboard title or one of its children).
	const renderLink = (item, extraClass) => {
		const active = onPath(item);
		return (
			<a
				className={`mn-popup-link${extraClass ? ` ${extraClass}` : ''}${active ? ' mn-popup-link--active' : ''}`}
				href={`#${item.key}`}
				title={item.title}
				aria-current={active ? 'page' : undefined}
				role="menuitem"
				style={linkStyle(active)}
				on-click={onItemClick(item)}
			>
				<span className="mn-label">{item.title}</span>
			</a>
		);
	};

	// One dashboard row in a group popup, with its children rendered either
	// inline (indented sub-list) or as a secondary flyout popup.
	const renderDashboard = (dash) => {
		const hasChildren = dash.children.length > 0;

		if (hasChildren && flyout) {
			const active = onPath(dash);
			return (
				<li className="mn-popup-item mn-popup-item--has-children" key={dash.key}>
					<a
						className={`mn-popup-link${active ? ' mn-popup-link--active' : ''}`}
						href={`#${dash.key}`}
						title={dash.title}
						aria-current={active ? 'page' : undefined}
						aria-haspopup="true"
						role="menuitem"
						style={linkStyle(active)}
						on-click={onItemClick(dash)}
					>
						<span className="mn-label">{dash.title}</span>
						<span className="mn-caret mn-caret--side" aria-hidden="true" />
					</a>
					<div className="mn-popup mn-popup--sub" role="menu" style={popupStyle}>
						<ul className="mn-popup-list">{dash.children.map((c) => renderDashboard(c))}</ul>
					</div>
				</li>
			);
		}

		// Inline mode (or a dashboard with no children): link, then any children
		// as an indented sub-list in the same popup.
		return (
			<li className="mn-popup-item" key={dash.key}>
				{renderLink(dash)}
				{hasChildren ? (
					<ul className="mn-popup-sublist" style={{ borderLeftColor: lineColor }}>
						{dash.children.map((c) => (
							<li className="mn-popup-item" key={c.key}>
								{renderLink(c, 'mn-popup-link--child')}
							</li>
						))}
					</ul>
				) : null}
			</li>
		);
	};

	// The body of a group popup. Flyout = a single list (children open to the
	// side). Inline = the dashboards split into columns of `colSize`, so a large
	// group widens the popup rather than forcing a scroll.
	const renderGroupPopupBody = (items) => {
		if (flyout) {
			return <ul className="mn-popup-list">{items.map(renderDashboard)}</ul>;
		}
		const cols = [];
		for (let i = 0; i < items.length; i += colSize) cols.push(items.slice(i, i + colSize));
		return (
			<div className="mn-popup-cols">
				{cols.map((chunk, ci) => (
					<ul className="mn-popup-list" key={`col${ci}`}>
						{chunk.map(renderDashboard)}
					</ul>
				))}
			</div>
		);
	};

	// A top-level group: a non-navigable trigger that opens the group popup.
	const renderGroup = (group) => {
		const active = anyActive(group.items, current);
		return (
			<li className="mn-item mn-item--group mn-item--has-children" key={group.label}>
				<button
					type="button"
					className={`mn-link mn-trigger${active ? ' mn-link--active' : ''}`}
					aria-haspopup="true"
					title={group.label}
					style={linkStyle(active)}
					// Don't let a mouse click pin focus on the trigger — otherwise
					// :focus-within keeps this popup open after the pointer moves to
					// another item. Keyboard Tab focus still works.
					on-mousedown={(e) => {
						if (e && e.preventDefault) e.preventDefault();
					}}
				>
					<span className="mn-label">{group.label}</span>
					<span className="mn-caret" aria-hidden="true" />
				</button>
				<div className="mn-popup" role="menu" style={popupStyle}>
					{renderGroupPopupBody(group.items)}
				</div>
			</li>
		);
	};

	// Far-left brand lockup: optional image + optional wordmark. Pure presentation
	// (not clickable) — bind `logoText`/`logoImageUrl` per experience to rebrand.
	const logoText = p.logoText != null ? String(p.logoText) : '';
	const logoImageUrl = p.logoImageUrl != null ? String(p.logoImageUrl) : '';
	const renderLogo = () => {
		if (p.showLogo === false || (!logoText && !logoImageUrl)) return null;
		return (
			<div className="mn-logo">
				{logoImageUrl ? (
					<img
						className="mn-logo-img"
						src={logoImageUrl}
						alt={p.logoImageAlt || logoText || 'Metrics Portal'}
						style={{ height: cssLen(p.logoImageHeight, '24px') }}
					/>
				) : null}
				{logoText ? <span className="mn-logo-text">{logoText}</span> : null}
			</div>
		);
	};

	// Where the nav items sit along the bar (horizontal) / sidebar (vertical).
	const alignment = ['left', 'center', 'right'].includes(p.itemAlignment)
		? p.itemAlignment
		: 'center';

	return (
		<nav
			className={`mn-root mn-root--${horizontal ? 'horizontal' : 'vertical'} mn-align-${alignment}`}
			style={rootStyle}
			aria-label={p.ariaLabel || 'Metrics navigation'}
		>
			{/* Start zone (logo + brand). In center alignment it is a flex spacer
			    that balances `.mn-end`, so items center against the whole bar —
			    not just the space to the right of the logo. */}
			<div className="mn-start">
				{renderLogo()}
				{p.brandLabel ? <div className="mn-brand">{p.brandLabel}</div> : null}
			</div>
			<div className={`mn-items mn-items--${alignment}`}>
				{empty ? (
					<div className="mn-empty">{p.emptyMessage || 'No dashboards configured.'}</div>
				) : (
					<ul className="mn-list" style={listStyle}>
						{groups.map(renderGroup)}
					</ul>
				)}
			</div>
			{/* Empty spacer mirroring `.mn-start` so center alignment is symmetric. */}
			<div className="mn-end" aria-hidden="true" />
		</nav>
	);
};

createCustomElement('x-1295779-metrics-nav-uic', {
	renderer: { type: snabbdom },
	view,
	styles,
	properties: {
		dashboards: { default: SAMPLE_DASHBOARDS },
		currentKey: { default: '' },
		orientation: { default: 'horizontal' },
		childDisplayMode: { default: 'inline' },
		inlineColumnSize: { default: '8' },
		childLineColor: { default: '#d1d5db' },
		itemAlignment: { default: 'center' },
		showLogo: { default: true },
		logoText: { default: 'Metrics Portal' },
		logoImageUrl: { default: '' },
		logoImageAlt: { default: '' },
		logoImageHeight: { default: '24px' },
		brandLabel: { default: '' },
		emptyMessage: { default: 'No dashboards configured.' },
		ariaLabel: { default: 'Metrics navigation' },
		backgroundColor: { default: 'transparent' },
		textColor: { default: '#374151' },
		activeBackgroundColor: { default: '#2E93fA' },
		activeTextColor: { default: '#ffffff' },
		popupBackgroundColor: { default: '#ffffff' },
		borderBottomColor: { default: 'transparent' },
		borderBottomWidth: { default: '1px' },
		navPadding: { default: '0' },
		itemGap: { default: '4px' },
		itemRadius: { default: '6px' },
		itemPadding: { default: '8px 12px' },
		fontSize: { default: '14px' },
		fontWeight: { default: 'normal' },
		textTransform: { default: 'none' },
		letterSpacing: { default: 'normal' },
		fontFamily: { default: '' }
	}
});
