<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A thin ring with a comet's head and tail chasing round it.
	 *
	 * THE COMET IS AN ALPHA RAMP ON ONE TOKEN: a conic gradient of one ink
	 * at three alphas — a ramp in weight rather than in hue — expressed as `--foreground`
	 * fading to nothing. Written with `color-mix(in oklab, …)`, which is what Tailwind emits for a
	 * `/10` alpha suffix; a token is a colour value, not a channel triple, so there is no
	 * `var(--foreground)/10`. The `transparent` stop stays truly transparent — the
	 * 10-to-20% floor the other ports use is for ramps whose faint end would otherwise vanish, and
	 * this one is meant to vanish: it is where the tail ends.
	 *
	 * Collapsing the gradient to one flat colour is not available. Rotation is the only thing this
	 * loader animates, and a disc of one flat colour turning is a still image — the gradient IS the
	 * animation. Also worth saying out loud: a hardcoded near-black ramp would only be right in
	 * light mode, because a near-black tail on a near-black page is invisible. One token carries
	 * both themes.
	 *
	 * THE HOLE IS A MASK, NOT A STACKED DISC. Punching the
	 * middle out by stacking an opaque page-coloured circle on top only works on
	 * one ground — drop the loader on a card or a toolbar and
	 * the coin shows. A `radial-gradient` mask cuts the same hole out of the
	 * gradient itself, which is right in both themes AND on any ground the loader is dropped onto: a
	 * card, a popover, a toolbar. `loader-gradient-arc.svelte` makes its ring the same way. The hole's
	 * 16px radius is the 32px disc measured from the centre of the same box.
	 *
	 * The outer edge is the unlit ring the comet runs
	 * along, so it takes `border-muted-foreground/20` rather than the `border-border` hairline.
	 *
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
	data-loader="comet-spinner"
	{role}
	aria-label={ariaLabel}
	class={cn(
		"relative flex size-10 items-center justify-center rounded-full border border-muted-foreground/20",
		className,
	)}
>
	<!--
		The painted layer is an inner element rather than the root, so the mask and the rotation stay
		off the element that carries a caller's `class` and this loader's a11y attributes.
		`rounded-full` is load-bearing: the mask cuts the inner hole, the border radius cuts the outer
		edge, and the comet is what is left between them.
	-->
	<span class="comet absolute inset-0 rounded-full"></span>
</div>

<style>
	@keyframes loader-comet-spinner-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.comet {
		background-image: conic-gradient(
			from 0deg,
			transparent 0%,
			color-mix(in oklab, var(--foreground) 10%, transparent) 60%,
			var(--foreground) 100%
		);

		/* BOTH SPELLINGS, BY HAND. Nothing in this build prefixes a Svelte scoped block:
		   `svelte.config.js` declares no preprocessor, there is no postcss config and no browserslist,
		   and `@tailwindcss/vite`'s Lightning CSS pass only sees `src/app.css`. Unprefixed `mask-*`
		   shipped in Chrome 120 and Tailwind v4's baseline reaches back to Chrome 111, so on 111-119
		   an unprefixed-only mask is ignored outright — which here would leave a solid disc instead of
		   a ring. The stops are pure geometry: a mask reads only the alpha channel, so `black` means
		   "keep" and `transparent` means "cut out", and no token applies to either. */
		-webkit-mask-image: radial-gradient(circle at center, transparent 15px, black 16px);
		mask-image: radial-gradient(circle at center, transparent 15px, black 16px);

		/* The rest state, and the only thing visible under `prefers-reduced-motion: reduce` (the
		   shared rule in `src/app.css` stops the animation but does not choose what it stops on). A
		   ring is the same picture at every angle, so this is simply the frame the animation starts
		   on: the comet's head at twelve o'clock with its tail behind it. Never seen while the
		   animation runs, because the keyframes declare `transform` at both ends. */
		transform: rotate(0deg);

		animation: loader-comet-spinner-spin 1s linear infinite;
	}
</style>
