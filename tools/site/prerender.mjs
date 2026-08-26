/**
 * Copies the built `dist/index.html` to one file per route, so a deep link answers **200**.
 *
 * WHY, precisely. The gallery is a single-page app: every route renders from the same document,
 * and GitHub Pages knows nothing about routes. The SPA convention — copy `index.html` to
 * `404.html` — makes a deep link *render*, and it does so with HTTP **404**. A browser does not
 * care. A crawler, an unfurler, an uptime check and `curl -f` all do, and `/components/button`
 * is the address this project asks people to link to.
 *
 * HOW PAGES RESOLVES A PATH (measured against this site, not assumed): an extensionless request
 * for `/name` is served `name.html` with a **200 and no redirect**. A request for `/name/` with
 * only `name.html` present is a 404, and a real directory requested without its trailing slash
 * is a 301 to the slash form. That is why the spelling here is the flat `<route>.html` and not
 * `<route>/index.html`: the flat file answers the exact URL the application puts in the address
 * bar, with no redirect in front of it.
 *
 * WHAT STILL FALLS BACK. `404.html` is written here too, and is still doing work: the two retired routes in `ALIASES` — `/components/label` and `/components/range-calendar`
 * — and every genuinely unknown path land there, render, and let the router redirect them. They
 * are deliberately NOT prerendered: an old bookmark is not an address this site publishes, and
 * giving a retired route a 200 would say it is one. Prerendering is for the 131 that are real.
 *
 * WHY IT RUNS INSIDE `npm run build`. Chained after `vite build` rather than bolted onto the
 * deploy workflow, because three things then agree: CI's `npm run build` exercises this script
 * on every pull request (a catalog parse that breaks fails at review time, not at deploy time),
 * `npm run preview` serves the very directory that gets uploaded, and one command produces the
 * artefact that ships. The cost is ~1.2 MB of copies of a 9 KB document, and milliseconds.
 *
 * WHAT IT DOES NOT BUY. The copies are byte-identical, so all 133 carry the same `<title>` and
 * the same Open Graph tags as the front page. The status code is the whole of the gain: an
 * uptime check and `curl -f` are satisfied, a crawler is not misled into a 404, but an unfurled
 * link to `/components/button` shows the same card as one to `/components/chart`. Fixing that
 * means per-route metadata here AND a `document.title` the router keeps current — the application
 * has never had one — so it is named as missing rather than half-done.
 *
 * @see tools/shared/catalog.mjs — the catalog parser, shared with the registry generator
 * @see src/lib/hooks/route.svelte.ts — where the routes are declared, and only there
 */

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { parseCatalog } from "../shared/catalog.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const dist = resolve(root, "dist");
const source = resolve(dist, "index.html");

if (!existsSync(source)) {
	throw new Error("dist/index.html is missing — run `vite build` before prerendering");
}

/*
 * The route list, rebuilt from the catalog exactly as `ROUTES` in `route.svelte.ts` builds it:
 * the catalog page, the four destinations, one page per group, then every item. The two path
 * SHAPES below (`/components` and `/components/group/<slug>`) are the only route knowledge this
 * file holds that the catalog literal does not carry; they mirror `CATALOG_PATH` and
 * `groupPath()` and would have to change with them.
 */
const CATALOG_PATH = "/components";
const destinations = parseCatalog("DESTINATIONS")[0].items;
const categories = parseCatalog("CATEGORIES");
const routes = [
	CATALOG_PATH,
	...destinations.map((destination) => destination.slug),
	...categories.map((category) => `${CATALOG_PATH}/group/${category.slug}`),
	...categories.flatMap((category) => category.items.map((item) => item.slug)),
];

/*
 * Every route lives under `/components`, and that is load-bearing here: it is what guarantees a
 * prerendered file can never land on top of a build artefact (`assets/`, `favicon.svg`,
 * `llms.txt`, the registry's `r/`). A route that broke the rule would need this script to learn
 * about collisions with the bundler's output, so it refuses instead.
 */
for (const route of routes) {
	if (!route.startsWith(`${CATALOG_PATH}/`) && route !== CATALOG_PATH) {
		throw new Error(`route ${route} is outside ${CATALOG_PATH}/ — see the comment above`);
	}
}

/**
 * The files to write, as paths relative to `dist/`.
 *
 * THE ONE COLLISION. The catalog route `/components` wants `components.html`, while the item
 * pages need `components/` to exist as a real directory — and which of the two Pages prefers
 * for the extensionless request is the one thing here that has NOT been measured. Emitting both
 * spellings makes the answer stop mattering: if the flat file wins, `/components` is a plain
 * 200; if the directory wins, it is a 301 to `/components/`, which `components/index.html` then
 * answers 200. Neither branch is a 404, which is the whole point of this script, and the extra
 * file costs 9 KB.
 */
const targets = [
	// The catch-all, written here rather than by the deploy workflow so that ONE command
	// produces the whole deployable tree: what CI builds, what `npm run preview` serves and
	// what Pages uploads are then the same directory, and no shipped file exists only in YAML.
	"404.html",
	...routes.flatMap((route) => {
		const path = route.slice(1);
		return route === CATALOG_PATH ? [`${path}.html`, `${path}/index.html`] : [`${path}.html`];
	}),
];

for (const target of targets) {
	const file = resolve(dist, target);
	mkdirSync(dirname(file), { recursive: true });
	copyFileSync(source, file);
}

console.log(
	`prerendered ${targets.length} files from dist/index.html — 404 fallback and ` +
		`${routes.length} routes (1 catalog, ${destinations.length} destinations, ` +
		`${categories.length} groups, ${routes.length - destinations.length - categories.length - 1} items)`,
);
