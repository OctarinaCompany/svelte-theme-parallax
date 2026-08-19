<script lang="ts">
	import { cn } from "$lib/utils.js";

	import type { LoaderTextProps } from "./loader.svelte.js";

	/**
	 * One word breathing between full strength and almost gone.
	 *
	 * THE WORD IS A PROP, NOT A LITERAL. A hardcoded "Thinking" would
	 * make the loader useless for any other wait. `label` supplies the visible string and defaults
	 * the root's `aria-label`, so the two cannot drift apart.
	 *
	 * THE BLINK SITS ON AN INNER `<span>`, not on the root. The reduced-motion block in
	 * `src/app.css` replaces the root's own animation with the shared `loader-rest` pulse, so an
	 * animation declared on the root would be the one thing that rule overwrites rather than freezes
	 * — and the rest state below would never be seen. On a child it is stopped, and the frozen frame
	 * is the one this file chose.
	 *
	 * `text-zinc-900 dark:text-white` is the primary ink: the light-mode shade picks the token and
	 * the `dark:` half is dropped, because `--foreground` already carries both themes.
	 */
	let {
		ref = $bindable(null),
		label = "Thinking",
		class: className,
		role = "status",
		"aria-label": ariaLabel = label,
		...restProps
	}: LoaderTextProps = $props();
</script>

<!--
	`w-fit` because a block `<div>` with no width of its own stretches to whatever container it lands
	in, and a word that is 64px wide would then sit hard left in a tile that is centring its
	contents. The word's own advance width is the loader's width.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="text-blink"
	{role}
	aria-label={ariaLabel}
	class={cn("w-fit text-lg font-medium text-foreground", className)}
>
	<!-- The word is the picture, not a second name. The root already carries `aria-label`, and
	     `role="img"` only collapses its subtree to presentational while nothing inside claims to be
	     text — an unhidden word is announced a second time. Every other text loader in this folder
	     (`loader-text-shimmer.svelte`, `loader-text-morph.svelte`, …) hides its word for this. -->
	<span class="word" aria-hidden="true">{label}</span>
</div>

<style>
	/* The breath: `opacity` 1 → 0.2 → 1 over 1.5s. Three
	   evenly spaced stops — and because the first and last are the same
	   value they share a selector. The bare `ease-in-out`
	   keyword here is the CSS curve, not Tailwind's Material redefinition of the same name. */
	@keyframes loader-text-blink-blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.2;
		}
	}

	.word {
		/* The rest state: caught part-way down rather than at either end. A word frozen at full
		   strength reads as finished text and a word frozen at 0.2 reads as disabled; 0.6 reads as
		   mid-fade, which is what the shared `loader-rest` pulse on the root then breathes. While
		   the animation runs this value never shows — the keyframes declare opacity at both ends. */
		opacity: 0.6;

		animation: loader-text-blink-blink 1.5s ease-in-out infinite;
	}
</style>
