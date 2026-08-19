<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two concentric part-rings turning opposite ways, a fifth of a second out of step.
	 *
	 * ONE KEYFRAME SET, TWO DIRECTIONS. The outer ring runs 0 → 180 → 360 and the inner one
	 * 0 → -180 → -360 — the same three-stop shape with the sign
	 * flipped — so the two share a single `@keyframes` that reads its endpoint from `--turn`. `var()`
	 * inside a keyframe is substituted against the animated element, so one motion serves both
	 * without either borrowing the other's direction.
	 *
	 * Decisions worth naming:
	 * - `border-zinc-800 dark:border-zinc-700` on the outer ring is an opaque ink ring at full
	 *   opacity, so it is `border-foreground`. `border-zinc-500` on the inner one is the quiet ring
	 *   of the pair: `border-muted-foreground`. Two weights of the same ink is the whole design here,
	 *   and collapsing them would flatten it.
	 * - `border-x-transparent` / `border-y-transparent` are not colours with theme meaning — they are
	 *   how each ring is cut down to a pair of opposite arcs — and stay verbatim. They beat the
	 *   all-sides colour beside them because Tailwind emits the two-sided `border-x-*` / `border-y-*`
	 *   utilities AFTER the all-sides `border-*` one, not because of where they sit in the `class`
	 *   attribute — the order of names in a class list has no effect on the cascade.
	 * - The stagger `delay: 0.2` on the inner ring winds up: a positive `animation-delay` would park
	 *   it on its base value for 200ms while the outer one already turns. Shifting it back one whole
	 *   cycle keeps the 0.2s offset — which is the "offset" the loader is named for — with no
	 *   start-up.
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
	data-loader="offset-rings"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex size-12 items-center justify-center", className)}
>
	<!--
		No `left`/`top` on either band: they are `absolute` inside a flex container that centres its
		children, and an absolutely positioned child's static-position rectangle is the ALIGNED one, so
		both land concentric with no offset of their own.
	-->
	<span
		class="band band-outer absolute size-12 rounded-full border-2 border-foreground border-x-transparent"
	></span>
	<span
		class="band band-inner absolute size-8 rounded-full border-2 border-muted-foreground border-y-transparent"
	></span>
</div>

<style>
	/* The three-stop turn. The endpoint comes from the element so one set can run both ways;
	   the midpoint is half of it — 180 / -180 exactly. */
	@keyframes loader-offset-rings-turn {
		0% {
			transform: rotate(0deg);
		}
		50% {
			transform: rotate(calc(var(--turn) / 2));
		}
		100% {
			transform: rotate(var(--turn));
		}
	}

	.band {
		--duration: 2s;

		/* The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		   animation but does not choose what it stops on): each band's real angle on the first
		   painted frame, given the delay below. Never seen while the animation runs, because the
		   keyframes declare `transform` at both ends. */
		transform: rotate(var(--rest-angle));

		/* `ease-in-out` is exactly CSS's keyword and not Tailwind's
		   `--ease-in-out`. */
		animation: loader-offset-rings-turn var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase order, no wind-up. */
		animation-delay: calc(var(--delay) - var(--duration));
	}

	/* Named classes rather than an `:nth-of-type` chain, so the compiler's unused-selector pass can
	   see them used — `loader-clock-spinner.svelte` records the same choice. */
	.band-outer {
		--turn: 360deg;
		--delay: 0s;
		--rest-angle: 0deg; /* phase 0: its arcs sit top and bottom, as drawn */
	}

	.band-inner {
		--turn: -360deg;
		--delay: 0.2s;
		/* Its delay puts it at phase 0.9 on the first painted frame; ease-in-out returns ≈0.92 there,
		   so the second interval has carried it to −180 − 180×0.92 ≈ −345°. Its arcs sit left and
		   right, a right angle away from the outer band's, which is what keeps the frozen picture
		   legible as two rings rather than one. */
		--rest-angle: -345deg;
	}
</style>
