/**
 * Built-in sample dashboards so the nav renders something meaningful the moment
 * it is dropped onto a page, before the author binds the `dashboards` property to
 * the active-dashboards Data Resource (a query of `x_gdn_metrics_dashboard`,
 * active=true, ordered by nav_order).
 *
 * Shape per item (a subset of the Dashboard record — see build spec §4.1 / §7):
 *   { key, title|name, nav_group, nav_order, icon, active, children }
 *
 * Information architecture: dashboards are grouped by `nav_group`. Each nav_group
 * becomes a (non-navigable) top-level nav item whose popup lists the dashboards in
 * that group and each dashboard's `children` (sub-pages). Dashboards with no
 * nav_group are hidden. camelCase aliases (navGroup / navOrder) are also accepted.
 *
 * The sample below is generated deterministically as a layout stress-test: 6
 * top-level groups, each with a different number of dashboards (8–24), and each
 * dashboard with 0–6 children. Edit the `dashboards` JSON in the dev harness to
 * try your own shapes.
 */

const slug = (s) =>
	String(s)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');

// Pool of dashboard-style names (>= 24, so a group of up to 24 items never repeats).
const ITEM_NAMES = [
	'Overview', 'Pipeline', 'Bookings', 'Forecast', 'Win Rate', 'Conversion',
	'Leads', 'Quota Attainment', 'Renewals', 'Expansion', 'Churn', 'Revenue',
	'Gross Margin', 'Operating Cost', 'Budget', 'Variance', 'Headcount', 'Attrition',
	'Hiring Funnel', 'Utilization', 'Backlog', 'Throughput', 'Cycle Time', 'SLA Compliance'
];

// Sub-page names used for children (a group of <= 6 children never repeats).
const CHILD_NAMES = ['Summary', 'Trend', 'By Region', 'By Segment', 'History', 'Breakdown'];

// 6 top-level groups, each with a deliberately different item count (all 8–24).
const GROUPS = [
	['Sales', 12],
	['Marketing', 16],
	['Product', 24],
	['Operations', 9],
	['Finance', 8],
	['People', 14]
];

const buildSample = () => {
	const out = [];
	GROUPS.forEach(([group, count], gi) => {
		const gslug = slug(group);
		for (let i = 0; i < count; i++) {
			const title = ITEM_NAMES[i % ITEM_NAMES.length];
			const key = `${gslug}-${slug(title)}`;
			// Deterministic 0–6 children — some items intentionally get none.
			const childCount = (i * 3 + gi * 2) % 7;
			const children = [];
			for (let c = 0; c < childCount; c++) {
				const ctitle = CHILD_NAMES[c % CHILD_NAMES.length];
				children.push({
					key: `${key}-${slug(ctitle)}`,
					title: ctitle,
					nav_order: (c + 1) * 10,
					active: true
				});
			}
			out.push({
				key,
				title,
				nav_group: group,
				nav_order: (i + 1) * 10,
				active: true,
				children
			});
		}
	});
	return out;
};

export const SAMPLE_DASHBOARDS = buildSample();
