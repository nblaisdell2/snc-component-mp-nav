/**
 * Built-in sample dashboards so the nav renders something meaningful the moment
 * it is dropped onto a page, before the author binds the `dashboards` property to
 * the active-dashboards Data Resource (a query of `x_gdn_metrics_dashboard`,
 * active=true, ordered by nav_order).
 *
 * Shape per item (a subset of the Dashboard record — see build spec §4.1 / §7):
 *   { key, title|name, nav_group, nav_order, icon, active, children }
 *
 * Top-level items are the nav bar entries; each may carry a `children` array of
 * sub-dashboards (the hierarchical /nav endpoint) shown in a hover popup. The
 * component also accepts camelCase aliases (navGroup / navOrder) so it can be
 * bound to either a raw GlideRecord projection or a hand-shaped array.
 */
export const SAMPLE_DASHBOARDS = [
	{
		key: 'sales', title: 'Sales', nav_group: 'Sales', nav_order: 10, icon: 'chart-line', active: true,
		children: [
			{ key: 'sales-overview', title: 'Sales Overview',     nav_order: 10, icon: 'bar-chart', active: true },
			{ key: 'pipeline',       title: 'Pipeline',           nav_order: 20, icon: 'trend',     active: true },
			{ key: 'sales-regional', title: 'Regional Breakdown', nav_order: 30, icon: 'globe',     active: true }
		]
	},
	{
		key: 'operations', title: 'Operations', nav_group: 'Operations', nav_order: 20, icon: 'activity', active: true,
		children: [
			{ key: 'ops-health', title: 'Ops Health',      nav_order: 10, icon: 'pulse', active: true },
			{ key: 'incidents',  title: 'Incident Trends', nav_order: 20, icon: 'alert', active: true }
		]
	},
	{ key: 'finance', title: 'Finance Summary', nav_group: 'Finance', nav_order: 30, icon: 'dollar', active: true }
];
