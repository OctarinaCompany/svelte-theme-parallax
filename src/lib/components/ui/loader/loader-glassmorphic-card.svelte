<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A frosted tile with a spinner on it and a soft blob drifting behind the glass.
	 *
	 * NOT AN INVERTED CHIP, despite sitting next to `dynamic-island` and `mac-terminal` in the
	 * catalog. The inverted-chip rule is for a surface that stays dark in BOTH themes
	 * (`bg-zinc-950 dark:bg-zinc-900`); this card is `bg-zinc-100 dark:bg-zinc-800/50`
	 * — light on light, dark on dark, i.e. an ordinary quiet panel. So it
	 * takes `bg-muted`, the panel row of the token map, and everything inside keeps the page-ground
	 * family rather than flipping to `-background`.
	 *
	 * THE GROUND IS OPAQUE, DELIBERATELY. An opaque card under `backdrop-blur-md` makes the
	 * blur a no-op on the card itself, and that is fine — a translucent `/50` fill
	 * would halve the only contrast this card has. `--muted` is `#eef3fa` against a
	 * `--card` of `#fbfbfb`, a delta of thirteen values at full strength and six at half, so a
	 * translucent version of this tile is a tile you cannot see.
	 *
	 * `backdrop-blur-md` STAYS ANYWAY, BECAUSE IT IS THE LAYERING. A backdrop filter makes the card a
	 * stacking context, which is what lets the blob's `-z-10` put it behind the spinner and still in
	 * front of the card's own background — a negative z-index child paints after its stacking
	 * context's background, not behind it. Remove the blur and the blob disappears under the card.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();
</script>

<!--
	`border-white/50` is a hairline rather than a mark — an alpha-suffixed edge on a panel — so it
	takes `border-border`, the token this repo hands every hairline. In the light theme `--border` and
	`--muted` are the same `#eef3fa`, so that edge disappears into the fill and the tile reads by its
	fill alone, exactly as every other `bg-muted` panel in this repo does; in dark the two differ and
	the hairline shows. `h-16 w-20` and the radius are the card's fixed geometry, and
	`overflow-hidden` is what keeps the drifting blob inside the glass.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="glassmorphic-card"
	{role}
	aria-label={ariaLabel}
	class={cn(
		"relative flex h-16 w-20 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted shadow-sm backdrop-blur-md",
		className,
	)}
>
	<!--
		The blob: a quiet unlit shape behind the mark rather
		than a mark itself, so it takes the `/20` weight the token map gives a track.
	-->
	<span class="blob absolute -z-10 size-12 rounded-full bg-muted-foreground/20 blur-xl"></span>

	<!--
		The ring: `border-zinc-800 dark:border-zinc-700` at full opacity is a solid ink ring — the
		visible object of the loader — so it is `border-foreground` and not `border-border`. The open
		top edge is what makes the rotation legible. `animate-spin` is Tailwind's own keyframe, not one
		of ours, so the utility is safe here where an arbitrary `animate-[…]` would silently do nothing.
	-->
	<span class="size-5 animate-spin rounded-full border-2 border-foreground border-t-transparent"
	></span>
</div>

<style>
	/* The drift — `x` -20 → 20 → -20, `y` -10 → 10 → -10 — over three
	   equal intervals, merged into one `transform` because CSS has a single such property — two
	   animations would be free to drift apart. First and last values are equal, which is why they
	   share a selector. */
	@keyframes loader-glassmorphic-card-drift {
		0%,
		100% {
			transform: translate(-20px, -10px);
		}
		50% {
			transform: translate(20px, 10px);
		}
	}

	.blob {
		/* The rest state: the blob centred behind the ring, which is the midpoint of its travel rather
		   than either end of it. Frozen at an endpoint it would sit hard against a corner and read as
		   a layout mistake. */
		transform: translate(0, 0);

		/* `ease-in-out` is exactly CSS's keyword —
		   cubic-bezier(0.42, 0, 0.58, 1) — and not Tailwind's `--ease-in-out`. */
		animation: loader-glassmorphic-card-drift 3s ease-in-out infinite;
	}
</style>
