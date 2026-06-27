/*
 * Local dev-server entry — DEV ONLY, not part of the deployed component.
 *
 * `snc ui-component develop` bundles this file for the webpack hot-reload
 * harness. The deployed component is defined by now-ui.json (which does not
 * reference example/), so this harness — and the controls panel it mounts —
 * never ships to ServiceNow.
 *
 * To preview the bare component without the controls chrome, comment out the
 * mountDevHarness() call and uncomment the plain-element block below.
 */

import '../src/x-1295779-metrics-nav-uic';
import { mountDevHarness } from './dev-harness';

mountDevHarness(document.body);

// --- Plain element (no controls) -------------------------------------------
// const el = document.createElement('DIV');
// document.body.appendChild(el);
// el.innerHTML = `
// 	<x-1295779-metrics-nav-uic></x-1295779-metrics-nav-uic>
// `;
