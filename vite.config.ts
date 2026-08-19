import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vite.dev/config/
export default defineConfig({
	/*
	 * RELATIVE, so the same build works at a domain root and under a GitHub Pages project path
	 * (`/svelte-theme-parallax/`) without a second configuration. It is safe here precisely
	 * because the router is hash-based: the document's own path never changes as you navigate,
	 * so `./` keeps resolving against the page that loaded. A history router would need the
	 * absolute base instead.
	 */
	base: "./",
	plugins: [tailwindcss(), svelte()],
	resolve: {
		// `$lib` is a SvelteKit convention, not a Svelte one. shadcn-svelte generates
		// imports such as `$lib/components/ui/...`, so a plain Vite app has to declare
		// the alias itself — here for the bundler, and in tsconfig for the type checker.
		// Both declarations must stay in sync.
		alias: {
			$lib: path.resolve("./src/lib"),
		},
	},
});
