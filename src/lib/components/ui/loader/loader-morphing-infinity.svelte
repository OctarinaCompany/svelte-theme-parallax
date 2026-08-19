<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two rings trading places, each shrinking as it crosses.
	 *
	 * Decisions worth naming:
	 * - The rings are `border-foreground`: an opaque ink ring at full opacity is the visible object
	 *   of this loader, not a hairline. A hairline token here would paint two near-invisible circles
	 *   and the loader would read as an empty box — `loader-clock-spinner.svelte` makes the same
	 *   call for the same reason. And because `--foreground` inverts with the theme, the rings stay
	 *   legible in both, where a fixed dark shade would be a dark ring on a dark ground.
	 * - No `justify-between` on the outer box: only one of the two rings is in flow (the other is
	 *   `absolute top-0 left-0`), and a single flex item sits at the start line either way. The
	 *   utility would suggest the two rings are laid out against each other, which they are not —
	 *   they are stacked at the left edge and separated entirely by the keyframes.
	 *
	 * THE TWO RINGS SHARE ONE KEYFRAME AND DIFFER ONLY IN THEIR ENDPOINTS, which is the idiom
	 * `loader-liquid-dots.svelte` establishes: `var()` inside a `@keyframes` is substituted against
	 * the element being animated, so two named modifier classes give one motion two sets of ends.
	 * That matters more than the tidiness — a half-cycle `animation-delay` would produce the same
	 * antiphase while running, but under `prefers-reduced-motion` both rings would freeze in the same
	 * place and stack into one.
	 *
	 * The marker classes are `loop*` rather than the obvious `ring*`: `ring` is a real Tailwind
	 * utility (the focus-ring box-shadow), so a class of that name in the markup would paint a shadow
	 * nobody asked for on top of doing its job as a selector.
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
	data-loader="morphing-infinity"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex h-6 w-12 items-center", className)}
>
	<span class="loop loop-out size-6 rounded-full border-2 border-foreground"></span>
	<span class="loop loop-back absolute top-0 left-0 size-6 rounded-full border-2 border-foreground"
	></span>
</div>

<style>
	/* One ring runs `x` 0 → 24px → 0 with `scale` 1 → 0.5 → 1; the other runs `x` 24px → 0 → 24px
	   with `scale` 0.5 → 1 → 0.5 — three evenly spaced stops whose
	   first and last frames are the same picture. The travel and the scale merge into one
	   `transform` per stop: CSS has a single `transform` property, and two animations would be free
	   to drift apart. */
	@keyframes loader-morphing-infinity-cross {
		0%,
		100% {
			transform: translateX(var(--from-x)) scale(var(--from-scale));
		}
		50% {
			transform: translateX(var(--to-x)) scale(var(--to-scale));
		}
	}

	.loop {
		/* The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		   animation but does not choose what it stops on): each ring parked at its own end of the
		   travel, one large and one small, which is a legible still picture of what this loader does.
		   Never seen while the animation runs, because the keyframes declare `transform` at both
		   ends. */
		transform: translateX(var(--from-x)) scale(var(--from-scale));

		animation: loader-morphing-infinity-cross 2s ease-in-out infinite;
	}

	/* The 24px is the root's 48px less the 24px ring: the travel runs from one
	   edge of the box to the other. Named classes rather than an `:nth-of-type` chain, so the
	   compiler's unused-selector pass can see them used. */
	.loop-out {
		--from-x: 0px;
		--to-x: 24px;
		--from-scale: 1;
		--to-scale: 0.5;
	}

	.loop-back {
		--from-x: 24px;
		--to-x: 0px;
		--from-scale: 0.5;
		--to-scale: 1;
	}
</style>
