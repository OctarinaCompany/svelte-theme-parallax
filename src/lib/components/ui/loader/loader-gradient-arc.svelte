<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A ring with a bright leading edge, turning.
	 *
	 * THE GRADIENT IS AN ALPHA RAMP ON ONE TOKEN, not a pair of hex
	 * literals. Two hand-picked hexes carry no semantic meaning and would be right in exactly one
	 * palette. Collapsing both stops to
	 * one flat token is not available either: the only thing this loader animates is rotation, and a disc of
	 * one flat colour turning is a still image, so the gradient IS the animation. What the two stops
	 * are actually doing is putting a bright edge at one end of the ring and a dim one at the other,
	 * which is a ramp in weight rather than in hue — so the ring ramps `--primary` from full to 15%,
	 * the same move `loader-wave-physics-loader.svelte` makes for its lit-to-unlit
	 * interpolation. One token is right in both themes and in all eleven generated palettes.
	 *
	 * `--primary` rather than `--foreground` because the ring is accent-coloured, not ink —
	 * the same reading the other accent loaders in this
	 * folder make. Written as `color-mix(in oklab, var(--primary) 15%, transparent)`, which is exactly
	 * what Tailwind emits for a `/15` alpha suffix and what `src/app.css:1377` already writes by
	 * hand — a token is a colour value, not a channel triple, so there is no `var(--primary)/15`.
	 *
	 * A visible consequence, recorded rather than hidden: a full-to-15% ramp has real contrast
	 * across it, so the ring clearly reads as turning — a quieter ramp would barely read at all.
	 *
	 * THE MASK IS GEOMETRY, NOT COLOUR. `radial-gradient(transparent 55%, black 60%)` punches the
	 * middle out of the disc to leave a ring. A mask reads only the alpha channel, so `transparent`
	 * means "cut out" and `black` means "keep" — no token applies to either, and substituting one
	 * would be a mistake.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="gradient-arc"
	{role}
	aria-label={ariaLabel}
	class={cn("flex size-10 items-center justify-center", className)}
>
	<!--
		The painted layer is an inner element rather than the root, so the mask and the rotation stay
		off the element that carries a caller's `class` and this loader's a11y attributes —
		`loader-liquid-dots.svelte` keeps its filter off the root for the same reason.

		`rounded-full` is load-bearing: the mask cuts the inner hole, the border radius cuts the outer
		edge, and the ring is what is left between them.
	-->
	<span class="arc size-full rounded-full"></span>
</div>

<style>
	@keyframes loader-gradient-arc-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.arc {
		background-image: linear-gradient(
			135deg,
			var(--primary) 0%,
			color-mix(in oklab, var(--primary) 15%, transparent) 100%
		);

		/* BOTH SPELLINGS, BY HAND. Nothing in this build prefixes a Svelte scoped block:
		   `svelte.config.js` declares no preprocessor, there is no postcss config and no browserslist,
		   and `@tailwindcss/vite`'s Lightning CSS pass only sees `src/app.css`. Unprefixed `mask-*`
		   shipped in Chrome 120 and Tailwind v4's baseline reaches back to Chrome 111, so on 111-119
		   an unprefixed-only mask is ignored outright — which here would leave a solid disc instead of
		   a ring. */
		-webkit-mask-image: radial-gradient(transparent 55%, black 60%);
		mask-image: radial-gradient(transparent 55%, black 60%);

		/* The rest state. Any angle is as good as any other — the ring is the same picture rotated —
		   so this is simply the frame the animation starts on, and reduced motion leaves a ring with
		   its bright edge at the top left rather than an empty box. */
		transform: rotate(0deg);

		animation: loader-gradient-arc-spin 1.2s linear infinite;
	}
</style>
