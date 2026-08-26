import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

import { docSections } from "./tools/site/vite-plugin-doc-sections.mjs";

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
	/*
	 * ABSOLUTE, and different between serving and building.
	 *
	 * This was `./` for as long as the router lived in the fragment: the document's own path
	 * never changed, so a relative asset URL always resolved against the page that loaded, and
	 * one build worked at a domain root and under a project path alike. A path router ends
	 * that — at `/svelte-theme-parallax/components/button`, `./assets/index.js` resolves to
	 * `/svelte-theme-parallax/components/assets/index.js`, which does not exist, and the deep
	 * link renders a blank page with no error to explain it.
	 *
	 * Keying on the environment rather than on an environment VARIABLE keeps one truth: `npm run
	 * build` produces the artefact that deploys, in CI and on a laptop alike, with no flag anyone
	 * can forget to pass.
	 *
	 * `isPreview` is not redundant beside `command`. `vite preview` resolves its config as
	 * `command === "serve"` even though every byte it serves came out of a build, so keying on
	 * `command` alone mounts `dist/` at `/` while the HTML inside it asks for
	 * `/svelte-theme-parallax/assets/…`: every module 404s and the page renders blank. Measured,
	 * not theorised — and it matters because `npm run build && npm run preview` is the one local
	 * check that would catch a base mistake before it reaches the deploy.
	 *
	 * The repository name is written here because that is what GitHub Pages serves a project site
	 * from; a fork under another name changes this line.
	 */
	base: command === "build" || isPreview ? "/svelte-theme-parallax/" : "/",
	// `docSections` leads because it answers `X.svelte?sections`, and the Svelte plugin would
	// otherwise claim that request and try to compile the answer. Its own header says why.
	plugins: [docSections(), tailwindcss(), svelte()],
	resolve: {
		// `$lib` is a SvelteKit convention, not a Svelte one. shadcn-svelte generates
		// imports such as `$lib/components/ui/...`, so a plain Vite app has to declare
		// the alias itself — here for the bundler, and in tsconfig for the type checker.
		// Both declarations must stay in sync.
		alias: {
			$lib: path.resolve("./src/lib"),
		},
	},
}));
