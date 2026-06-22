# Metrics Nav — UI Builder custom component

Config-driven **navigation bar** for the ServiceNow **Metrics Portal**. It renders the portal's
list of active Dashboard records as nav items (ordered by `nav_order`, optionally grouped by
`nav_group`), highlights the dashboard currently in view, and emits a **Navigate** event when an
item is clicked so the page can route the generic dashboard page to that key.

- **Component tag:** `x-1295779-metrics-nav-uic`
- **Scope:** `x_1295779_nav_0`
- **Renderer:** Seismic (`@servicenow/ui-renderer-snabbdom`) — declarative view, no D3

> Part of the **Metrics Components** library app described in the Metrics Portal build spec
> (§2, §7, §10). Sibling components: `x-1295779-metric-dispatcher-uic` and
> `x-1295779-metrics-grid-uic`. Shares the vendor prefix `x_1295779` with the D3 chart
> components so they can ship together.

---

## What it does (build spec §7)

- Reads **active Dashboard records, ordered by `nav_order`**, optionally grouped by `nav_group`.
- The simplest wiring binds `dashboards` to a UI Builder **Data Resource** that queries
  `x_gdn_metrics_dashboard` (`active=true`, order by `nav_order`) — **no custom API required**.
  Use the resolver's `/metrics/nav` endpoint only if you need server-side grouping.
- Clicking a nav item dispatches **`NAVIGATE`** with the dashboard `key`; the current item is
  highlighted from `currentKey` (bind it to the active route param).
- **Adding a Dashboard record automatically adds a nav entry** — no UI Builder authoring.

This component is **pure presentation — it never fetches its own data** (build spec §10).

---

## Project layout

```
src/x-1295779-metrics-nav-uic/
├── index.js        # createCustomElement: properties + declarative snabbdom view
├── sampleData.js   # SAMPLE_DASHBOARDS fallback so it renders on drop
├── styles.scss     # host + horizontal/vertical layout + active/hover affordances
└── __tests__/
now-ui.json         # UI Builder manifest: properties + the NAVIGATE action
now-cli.json        # CLI build config
package.json        # deps (ui-core + snabbdom renderer; no D3)
```

The view reads `state.properties` and re-renders automatically on every property change, so there
are no imperative lifecycle handlers (unlike the D3 chart components, which own the DOM via D3).

---

## Data shape (`dashboards` property)

```jsonc
[
  { "key": "sales-overview", "title": "Sales Overview", "nav_group": "Sales",
    "nav_order": 10, "icon": "bar-chart", "active": true },
  { "key": "ops-health", "title": "Ops Health", "nav_group": "Operations",
    "nav_order": 20, "icon": "pulse", "active": true }
]
```

Each item is a (subset of a) Dashboard record. `title` falls back to `name`/`label`/`key`.
Both snake_case (`nav_group`, `nav_order`) and camelCase (`navGroup`, `navOrder`) are accepted, so
you can bind a raw GlideRecord projection or a hand-shaped array. Items with `active === false` are
dropped; leave `dashboards` empty/unbound to render built-in sample items.

---

## Events

| Action | When | Payload |
|---|---|---|
| `NAVIGATE` | A nav item is clicked | `key`, `title`, `navGroup` |

Wire `NAVIGATE` in the component's **Events** panel to set the generic page's `key` route param.

---

## Develop & deploy

> Requires the `snc` CLI with the `ui-component` extension and a configured connection profile.

```powershell
npm install -g @servicenow/cli
snc configure profile set            # instance URL + credentials
npm install
snc ui-component develop --open      # local hot-reload harness (example/element.js)
snc ui-component generate-update-set --offline
snc ui-component deploy              # push to the connected instance
```

After deploying, open **UI Builder → add component → "Metrics Nav"** (category *Primitives*),
place it in the experience chrome, bind `dashboards` + `currentKey`, and wire `NAVIGATE`.
