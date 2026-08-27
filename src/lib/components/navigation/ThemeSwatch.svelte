<script lang="ts">
	import { mode } from "mode-watcher";
	import { cn } from "$lib/utils.js";
	import type { Theme } from "$lib/themes/index.js";

	/**
	 * A theme's palette as a strip: brand, then the four status colours.
	 *
	 * WHY A STRIP AND NOT A SINGLE DOT — one dot only tells you the brand, and two themes can
	 * share a brand while disagreeing about everything else. Five segments is also the point
	 * where the picker stops being a list of names: the difference between Sandstone and Ember
	 * is visible before you read either word.
	 *
	 * THE BRAND TAKES HALF THE STRIP and the four statuses share the other half, which is a
	 * correction of the equal fifths this started with. Across the twelve palettes the brand slot
	 * holds twelve distinct values while the four status slots hold six, six, five and seven — five
	 * of the twelve carry the very same success/warning/destructive triple. That is the brand/status
	 * separation working, not a fault in the data (`npm run themes:audit` is what enforces it), so
	 * the repair is the proportion rather than the colours: at equal fifths four of the five chips
	 * were near-constant and the one chip that actually separates two palettes was a 13px sliver,
	 * which is what made Graphite and Sepia, or Sandstone and Ember, read as the same swatch. At
	 * half the strip they no longer do, and the statuses still say the two palettes agree about
	 * meaning.
	 *
	 * IT FOLLOWS THE CURRENT MODE, on purpose. Every theme defines both, and the two halves are
	 * not tints of each other — a brand is lifted for the dark page, and the statuses with it.
	 * Showing the light strip while the app is dark would advertise colours the click does not
	 * produce.
	 *
	 * The colours come from `palettes.ts` rather than from the stylesheet, because this element
	 * is drawing a palette the document is NOT currently wearing; see the note at the top of
	 * `tools/themes/generate.mjs`.
	 *
	 * `ring` rather than `border`: a border would take a fifth of the height at this size, and
	 * the strip needs its own edge only so a near-white swatch does not bleed into the popover.
	 */
	let {
		theme,
		mode: modeOverride,
		class: className,
	}: {
		theme: Theme;
		/**
		 * Which half of the palette to draw, when it is not the page's.
		 *
		 * The strip exists to show what the surface AROUND it will look like, and every caller in
		 * this application is on the page, so the page mode is the default. The prop serves the one
		 * arrangement that is not: a palette picker placed on the page-header bar, which carries its
		 * own light/dark pin — there a strip following the page would be showing the reader the half
		 * they are not looking at. `ThemeSelector`'s `chromeWear` is what routes it.
		 *
		 * @default the page mode
		 */
		mode?: "light" | "dark";
		class?: string;
	} = $props();

	const resolved = $derived(modeOverride ?? mode.current);
	const colours = $derived(resolved === "dark" ? theme.swatch.dark : theme.swatch.light);
</script>

<span
	class={cn(
		"flex h-4 w-16 shrink-0 overflow-hidden rounded-sm ring-1 ring-foreground/10",
		className,
	)}
	aria-hidden="true"
>
	<!-- Keyed by position, not by value: two of the five can coincide when a brand sits on a
	     status hue, and a duplicate key is a runtime error. -->
	{#each colours as colour, index (index)}
		<span class={index === 0 ? "flex-[4]" : "flex-1"} style="background-color: {colour}"></span>
	{/each}
</span>
