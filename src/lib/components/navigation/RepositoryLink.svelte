<script lang="ts">
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { REPOSITORY_URL } from "$lib/data/repository.js";

	/**
	 * The header bar's link to this gallery's source.
	 *
	 * IT LIVES IN `navigation/`, NOT IN `PageHeader`, and that is the whole point. The header ships
	 * in `parallax-shell`: a link baked into it would point every consumer's application at THIS
	 * repository. So it rides in through the `controls` snippet, the same seam the command palette
	 * uses for `search` — the published component stays ignorant, and the demo supplies what only
	 * the demo knows.
	 *
	 * THE MARK IS DRAWN HERE because Lucide ships none — brand glyphs left the set — and it is the
	 * same path the Button and Card pages already inline for the same reason. Those two stay
	 * inline on purpose: they are demo content, and a copied example that imported a gallery
	 * component would list it as missing. This is the third copy and the only one that is chrome.
	 *
	 * GitHub's brand terms allow the Invertocat to link to GitHub, which is exactly what this does
	 * and all it does. `currentColor` and `size-4` put it on the same footing as the toggle beside
	 * it, so it inherits whatever ink the bar is wearing.
	 *
	 * `target="_blank"` with `rel="noreferrer"` matches the fifty-odd outbound links the gallery
	 * already carries: leaving the site is a deliberate move, and a reader who wanted to lose the
	 * page they were reading would have used Back.
	 */
</script>

<a
	href={REPOSITORY_URL}
	target="_blank"
	rel="noreferrer"
	aria-label="This gallery's source on GitHub"
	data-slot="repository-link"
	class={buttonVariants({ variant: "ghost", size: "icon" })}
>
	<!--
		PADDED BY ONE UNIT ON EVERY SIDE. The mark is drawn edge to edge in a 24 box, while a Lucide
		glyph occupies 22 of its 24 — so at the same rendered size this one reads a fraction larger
		than the toggle it sits beside. `-1 -1 26 26` puts it on the same 22-of-24 proportion. The
		remaining difference is mass rather than size, and it is inherent: a solid mark carries more
		ink than a 2px outline set, and redrawing it thinner would be altering it.
	-->
	<svg viewBox="-1 -1 26 26" aria-hidden="true" fill="currentColor" class="size-4">
		<path
			d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
		/>
	</svg>
</a>
