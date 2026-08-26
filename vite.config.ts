import { readFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

import { docSections } from "./tools/site/vite-plugin-doc-sections.mjs";

/**
 * The gallery's own repository, as a URL a browser can open.
 *
 * `package.json` states it in npm's shapes, and none of them is a page: the object form carries
 * `git+https://…​.git`, the string shorthand is `github:owner/repo`, and a clone URL may be `ssh`
 * or `git@host:owner/repo`. Deriving it here rather than writing the plain form somewhere in
 * `src/` keeps one truth — a fork that changes its remote gets the right link in the header and in
 * every copied example with nothing else to edit — and that promise is only worth making if the
 * shapes a fork might actually have all resolve.
 *
 * IT THROWS rather than falling back. The value reaches a link's `href` and the header of every
 * copied example, so the alternative to a hard failure at build time is a site that ships the word
 * `undefined` twice over and says nothing about it.
 */
const packageJson = JSON.parse(readFileSync(new URL("package.json", import.meta.url), "utf8"));

function resolveRepositoryUrl(repository: unknown): string {
	const raw = typeof repository === "string" ? repository : (repository as { url?: string })?.url;
	if (typeof raw !== "string" || raw === "") {
		throw new Error("package.json: `repository` is missing — the gallery links to it.");
	}

	// `github:owner/repo`, and the bare `owner/repo` npm also accepts.
	const shorthand = /^(?:(github|gitlab|bitbucket):)?([\w.-]+)\/([\w.-]+)$/.exec(raw);
	if (shorthand) {
		const host = { github: "github.com", gitlab: "gitlab.com", bitbucket: "bitbucket.org" }[
			shorthand[1] ?? "github"
		];
		return `https://${host}/${shorthand[2]}/${shorthand[3]}`;
	}

	const url = raw
		.replace(/^git\+/, "")
		// `git@host:owner/repo` is scp syntax, not a URL; `ssh://` and `git://` are not pages.
		.replace(/^git@([^:]+):/, "https://$1/")
		.replace(/^(?:ssh|git):\/\/(?:git@)?/, "https://")
		.replace(/\.git$/, "");

	if (!url.startsWith("https://")) {
		throw new Error(`package.json: cannot turn \`repository\` into a web URL: ${raw}`);
	}
	return url;
}

const repositoryUrl = resolveRepositoryUrl(packageJson.repository);

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
	define: {
		"import.meta.env.REPOSITORY_URL": JSON.stringify(repositoryUrl),
	},
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
