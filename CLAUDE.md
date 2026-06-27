# CLAUDE.md — Metrics Nav UI component

Context for Claude (or any agent) continuing work on this project.

## What this is

A ServiceNow **Next Experience / UI Builder** custom component: the **config-driven navigation
bar** for the Metrics Portal. It renders active Dashboard records as nav items and emits a
`NAVIGATE` event. Part of the **Metrics Components** library app (build spec §2/§7/§10); siblings
are `x-1295779-metric-dispatcher-uic` and `x-1295779-metrics-grid-uic`.

- Component tag: `x-1295779-metrics-nav-uic`  ·  Scope: `x_1295779_nav_0`
- Vendor prefix `x_1295779` is shared with the D3 chart components (same publisher/library).

## Architecture (important conventions)

- **Declarative snabbdom view.** Unlike the D3 chart components (which split snabbdom + imperative
  D3), this is a plain Seismic component: `view(state, { dispatch })` reads `state.properties` and
  returns a vnode tree. The framework re-renders it on every property change, so there are **no**
  `COMPONENT_*` lifecycle handlers.
- **Event binding** uses snabbdom JSX `on-click={fn}`; the handler calls `dispatch('NAVIGATE', …)`.
- **Inline styles set concrete CSS properties** (camelCase keys) via the snabbdom `style` module.
  Do **not** use CSS custom properties (`--x`) through the style object — snabbdom assigns
  `el.style[name]`, which silently ignores custom properties. Parameterized theming is applied
  directly to elements; only the (fixed) hover affordance lives in `styles.scss`.
- **Pure presentation — never fetches data** (build spec §10). `dashboards`/`currentKey` are bound
  by the page (Data Resource + route param).
- **Indentation is TABS** in JS (`.editorconfig`); ESLint uses `@tectonic/tectonic/servicenow`.

## Files

- `src/x-1295779-metrics-nav-uic/index.js` — properties + the declarative view; `buildGroups()`
  filters active, sorts by `nav_order`, and buckets dashboards by `nav_group` (the top-level items).
- `src/x-1295779-metrics-nav-uic/sampleData.js` — `SAMPLE_DASHBOARDS` fallback.
- `src/x-1295779-metrics-nav-uic/styles.scss` — host + horizontal/vertical layouts.
- `now-ui.json` — UI Builder manifest: every property + the `NAVIGATE` action. **Keep in sync with
  the `properties` block in `index.js`.**

## Data contract

`dashboards` = `[ { key, title|name, nav_group|navGroup, nav_order|navOrder, icon, active, children } ]`.
`title` falls back to `name`/`label`/`key`; snake_case and camelCase both accepted.

**Top level = `nav_group`.** `buildGroups()` buckets dashboards by `nav_group`; each group is a
**non-navigable** top-level item (a `.mn-trigger` button) whose popup lists the group's dashboards
and their `children`. Dashboards with no `nav_group` are **hidden**. The hierarchical `/nav` endpoint
nests sub-dashboards under each dashboard's `children` array (`normalizeList` normalizes recursively).
`childDisplayMode` controls how children render in the popup: `'inline'` (indented sub-list, default)
or `'flyout'` (secondary `.mn-popup--sub` popup). Only dashboards and children fire `NAVIGATE`
(`{ key, title, navGroup }`) — group triggers never navigate.

## Build / dev / deploy

```bash
npm install
snc ui-component develop --open          # local hot-reload harness (example/element.js)
snc ui-component generate-update-set --offline
snc ui-component deploy                   # push to the connected instance
```
Requires the `snc` CLI + a configured profile; needs a real instance connection to deploy.

## How to verify changes without an instance

The view is a pure function of `state.properties`. Bundle `index.js` with esbuild and call the
exported `view({ properties }, { dispatch })` under jsdom, asserting the expected `.mn-link` count,
the active item, group order, and that clicking dispatches `NAVIGATE` with the right key.

## If adding a property

Update all three: `now-ui.json` (manifest), `index.js` (default in `properties`), and read it in
`view`.
