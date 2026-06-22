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
 * recursively so a parent item can render its children in a hover popup.
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

/** Ordered, optionally-grouped model of the top-level (root) nav items. */
const buildModel = (dashboards, groupByCategory) => {
	const items = normalizeList(dashboards);
	if (!groupByCategory) return [{ label: '', items }];
	const groups = [];
	const byLabel = Object.create(null);
	items.forEach((it) => {
		const label = it.navGroup || '';
		if (!byLabel[label]) {
			byLabel[label] = { label, items: [] };
			groups.push(byLabel[label]);
		}
		byLabel[label].items.push(it);
	});
	return groups;
};

const view = (state, { dispatch }) => {
	const p = state.properties;
	const dashboards = asArray(p.dashboards).length ? p.dashboards : SAMPLE_DASHBOARDS;
	const groups = buildModel(dashboards, p.groupByCategory);
	const horizontal = p.orientation !== 'vertical';
	const current = p.currentKey != null ? String(p.currentKey) : '';
	const empty = groups.every((g) => !g.items.length);

	const rootStyle = {
		background: p.backgroundColor || 'transparent',
		color: p.textColor || '#374151',
		fontFamily: p.fontFamily || 'inherit',
		fontSize: cssLen(p.fontSize, '14px')
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

	// A child dashboard inside a parent's hover popup.
	const renderChild = (child) => {
		const active = child.key === current;
		return (
			<li className="mn-popup-item" key={child.key}>
				<a
					className={`mn-popup-link${active ? ' mn-popup-link--active' : ''}`}
					href={`#${child.key}`}
					title={child.title}
					aria-current={active ? 'page' : undefined}
					role="menuitem"
					style={linkStyle(active)}
					on-click={onItemClick(child)}
				>
					{p.showIcons && child.icon ? (
						<span className="mn-icon" aria-hidden="true" />
					) : null}
					<span className="mn-label">{child.title}</span>
				</a>
			</li>
		);
	};

	const renderItem = (item) => {
		const active = item.key === current;
		const hasChildren = item.children.length > 0;
		return (
			<li
				className={`mn-item${hasChildren ? ' mn-item--has-children' : ''}`}
				key={item.key}
			>
				<a
					className={`mn-link${active ? ' mn-link--active' : ''}`}
					href={`#${item.key}`}
					title={item.title}
					aria-current={active ? 'page' : undefined}
					aria-haspopup={hasChildren ? 'true' : undefined}
					style={linkStyle(active)}
					on-click={onItemClick(item)}
				>
					{p.showIcons && item.icon ? (
						<span className="mn-icon" aria-hidden="true" />
					) : null}
					<span className="mn-label">{item.title}</span>
					{hasChildren ? (
						<span className="mn-caret" aria-hidden="true" />
					) : null}
				</a>
				{hasChildren ? (
					<div className="mn-popup" role="menu" style={popupStyle}>
						<ul className="mn-popup-list">{item.children.map(renderChild)}</ul>
					</div>
				) : null}
			</li>
		);
	};

	const renderGroup = (g, idx) => (
		<div className="mn-group" key={`g${idx}`}>
			{p.groupByCategory && p.showGroupLabels && g.label ? (
				<div className="mn-group-label">{g.label}</div>
			) : null}
			<ul className="mn-list" style={listStyle}>
				{g.items.map(renderItem)}
			</ul>
		</div>
	);

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
			className={`mn-root mn-root--${horizontal ? 'horizontal' : 'vertical'}`}
			style={rootStyle}
			aria-label={p.ariaLabel || 'Metrics navigation'}
		>
			{renderLogo()}
			{p.brandLabel ? <div className="mn-brand">{p.brandLabel}</div> : null}
			<div className={`mn-items mn-items--${alignment}`}>
				{empty ? (
					<div className="mn-empty">{p.emptyMessage || 'No dashboards configured.'}</div>
				) : (
					groups.map(renderGroup)
				)}
			</div>
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
		groupByCategory: { default: false },
		showGroupLabels: { default: true },
		showIcons: { default: false },
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
		itemGap: { default: '4px' },
		itemRadius: { default: '6px' },
		itemPadding: { default: '8px 12px' },
		fontSize: { default: '14px' },
		fontFamily: { default: '' }
	}
});
