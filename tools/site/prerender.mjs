/**
 * Writes one file per route from the built `dist/index.html`, so a deep link answers **200**
 * and carries **its own title**.
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
 * WHY THE COPIES ARE NOT BYTE-IDENTICAL ANY MORE. They were, and it cost the whole point of a
 * shareable address: all 133 documents carried the front page's `<title>` and Open Graph tags,
 * so an unfurled link to `/components/button` showed the same card as one to `/components/chart`,
 * and a browser tab said "Parallax theme kit for shadcn-svelte" whichever page was open. Each
 * file is now written with the page's own title in both places. The rest of the head — the
 * description, `og:description`, `og:type`, the `theme-color` pair, `og:image` and its
 * dimensions — is the site's rather than the page's, and stays shared: the catalog declares a
 * title and a slug per page and nothing else, so 131 invented sentences would be worse than one
 * true one, and 131 screenshots are not a build step this project wants.
 *
 * THE TITLE IS COMPOSED TWICE, AND THE TWO MUST AGREE. `route.svelte.ts` writes
 * `<page> · Parallax` into `document.title` on every navigation; this writes the same string
 * into the document a visitor is served. If they disagree, the tab silently changes wording the
 * moment the app hydrates — so {@link pageTitle} composes it exactly as `routeTitle()` does,
 * and the catalog both of them read is the same declaration.
 *
 * @see tools/shared/catalog.mjs — the catalog parser, shared with the registry generator
 * @see src/lib/hooks/route.svelte.ts — where the routes are declared, and only there
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { parseCatalog } from "../shared/catalog.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const dist = resolve(root, "dist");
const source = resolve(dist, "index.html");

if (!existsSync(source)) {
	throw new Error("dist/index.html is missing — run `vite build` before prerendering");
}

const document = readFileSync(source, "utf8");

/*
 * The route list, rebuilt from the catalog exactly as `ROUTES` in `route.svelte.ts` builds it:
 * the catalog page, the four destinations, one page per group, then every item — each paired
 * with the name `routeTitle()` gives it, which is the catalog's own label for all but the
 * index. The two path SHAPES below (`/components` and `/components/group/<slug>`) and the
 * index's name are the only route knowledge this file holds that the catalog literal does not
 * carry; they mirror `CATALOG_PATH`, `groupPath()` and `routeTitle()`'s first line, and would
 * have to change with them.
 */
const CATALOG_PATH = "/components";
const CATALOG_TITLE = "Components";
const destinations = parseCatalog("DESTINATIONS")[0].items;
const categories = parseCatalog("CATEGORIES");
const pages = [
	{ route: CATALOG_PATH, title: CATALOG_TITLE },
	...destinations.map((destination) => ({
		route: destination.slug,
		title: destination.title,
	})),
	...categories.map((category) => ({
		route: `${CATALOG_PATH}/group/${category.slug}`,
		title: category.title,
	})),
	...categories.flatMap((category) =>
		category.items.map((item) => ({ route: item.slug, title: item.title })),
	),
];

/*
 * Every route lives under `/components`, and that is load-bearing here: it is what guarantees a
 * prerendered file can never land on top of a build artefact (`assets/`, `favicon.svg`,
 * `llms.txt`, the registry's `r/`). A route that broke the rule would need this script to learn
 * about collisions with the bundler's output, so it refuses instead.
 */
for (const { route } of pages) {
	if (!route.startsWith(`${CATALOG_PATH}/`) && route !== CATALOG_PATH) {
		throw new Error(`route ${route} is outside ${CATALOG_PATH}/ — see the comment above`);
	}
}

/**
 * The files to write, as paths relative to `dist/`, each with the page name it is titled by.
 *
 * THE ONE COLLISION. The catalog route `/components` wants `components.html`, while the item
 * pages need `components/` to exist as a real directory — and which of the two Pages prefers
 * for the extensionless request is the one thing here that has NOT been measured. Emitting both
 * spellings makes the answer stop mattering: if the flat file wins, `/components` is a plain
 * 200; if the directory wins, it is a 301 to `/components/`, which `components/index.html` then
 * answers 200. Neither branch is a 404, which is the whole point of this script, and the extra
 * file costs 9 KB.
 *
 * `404.html` is titled for what it IS — the answer to an address that names nothing — matching
 * the string `route.svelte.ts` writes when the router finds no route. The two retired aliases
 * are served from it and are retitled the moment the router redirects them, which is the same
 * order of events as their 404 status: this file publishes the routes that exist.
 */
const NOT_FOUND_TITLE = "Page not found";
const targets = [
	// The catch-all, written here rather than by the deploy workflow so that ONE command
	// produces the whole deployable tree: what CI builds, what `npm run preview` serves and
	// what Pages uploads are then the same directory, and no shipped file exists only in YAML.
	{ file: "404.html", title: NOT_FOUND_TITLE },
	...pages.flatMap(({ route, title }) => {
		const path = route.slice(1);
		return route === CATALOG_PATH
			? [
					{ file: `${path}.html`, title },
					{ file: `${path}/index.html`, title },
				]
			: [{ file: `${path}.html`, title }];
	}),
];

/** The document title and the Open Graph title, as the browser and an unfurler read them. */
const pageTitle = (page) => `${page} · Parallax`;

/**
 * HTML-escape a title before it goes into an element and into an attribute.
 *
 * The catalog's labels are plain words today, so this escapes nothing — which is exactly why
 * it is here: a future title with an ampersand in it would otherwise ship a broken attribute
 * to 133 files at once, and the failure would look like a rendering bug rather than a build one.
 */
const escapeHtml = (text) =>
	text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");

/**
 * Replace the one occurrence of `pattern`, or fail by name.
 *
 * A silent miss is the failure mode worth spending a check on: the substitution is the whole
 * value this script adds beyond a copy, and a `<title>` written differently in `index.html`
 * would leave 133 files quietly carrying the front page's title again — the exact defect this
 * replaced. The replacement goes through a function so a `$` in a title cannot be read as a
 * capture reference.
 */
function replaceOnce(html, pattern, replacement, what) {
	const found = html.match(new RegExp(pattern.source, "g"))?.length ?? 0;
	if (found !== 1) {
		throw new Error(
			`prerender: expected exactly one ${what} in dist/index.html, found ${found} — index.html changed shape, so the per-route title would be silently dropped`,
		);
	}
	return html.replace(pattern, () => replacement);
}

const TITLE_ELEMENT = /<title>[^<]*<\/title>/;
const OG_TITLE_META = /<meta property="og:title" content="[^"]*" \/>/;

function titled(page) {
	const title = escapeHtml(pageTitle(page));
	const withTitle = replaceOnce(document, TITLE_ELEMENT, `<title>${title}</title>`, "<title>");
	return replaceOnce(
		withTitle,
		OG_TITLE_META,
		`<meta property="og:title" content="${title}" />`,
		'<meta property="og:title">',
	);
}

for (const { file, title } of targets) {
	const target = resolve(dist, file);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, titled(title), "utf8");
}

console.log(
	`prerendered ${targets.length} titled files from dist/index.html — 404 fallback and ` +
		`${pages.length} routes (1 catalog, ${destinations.length} destinations, ` +
		`${categories.length} groups, ${pages.length - destinations.length - categories.length - 1} items)`,
);
