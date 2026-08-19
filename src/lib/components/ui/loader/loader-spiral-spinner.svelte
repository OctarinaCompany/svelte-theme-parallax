<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A gapped ring that turns while breathing in and out, so the gap appears to spiral.
	 *
	 * Decisions worth naming:
	 * - The ring is `border-[3px] border-foreground`: an opaque ink ring at full opacity is the
	 *   visible object of this loader, not a hairline. A hairline token here would paint a
	 *   near-invisible circle and the loader would read as an empty box —
	 *   `loader-clock-spinner.svelte` makes the same call for the same reason. And because
	 *   `--foreground` inverts with the theme, the hoop stays legible in both, where a fixed dark
	 *   shade would be a dark ring on a dark ground. The `3px` stays an arbitrary value: it is
	 *   geometry, and there is no utility on the scale for it.
	 * - `border-t-transparent` takes no token. `transparent` is not a colour with theme meaning
	 *   here — it is how the gap in the ring is cut.
	 * - The ring is a child of the root rather than the root itself, so the root keeps the fixed
	 *   attribute block every loader in this folder shares and the ring can shrink inside it. Its
	 *   marker class is `hoop` rather than the obvious `ring`: `ring` is a real Tailwind utility (the
	 *   focus-ring box-shadow), so a class of that name would paint a shadow nobody asked for on top
	 *   of doing its job as a selector.
	 *
	 * THE TWO MOTIONS MERGE INTO ONE `transform`, AND THAT CHANGES THE PACING SLIGHTLY. The
	 * design pairs a full turn (a single ramp, eased across the whole cycle) with a breath of
	 * `scale: 1 → 0.8 → 1` (three stops). CSS has one `transform` property, so
	 * they have to share a keyframe set — and an `ease-in-out` applied per interval means the turn
	 * now eases through the half-way point instead of running fastest there. Both spellings pass
	 * through 180° at exactly half a cycle, so the picture is the same and only the pacing inside
	 * each half differs. Running them as two animations on two nested elements would keep the
	 * original pacing at the cost of an element that exists only to hold a timing function, and of
	 * two animations free to drift apart.
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
	data-loader="spiral-spinner"
	{role}
	aria-label={ariaLabel}
	class={cn("size-10", className)}
>
	<span
		class="hoop block size-full rounded-full border-[3px] border-foreground border-t-transparent"
	></span>
</div>

<style>
	/* The breath, `scale` 1 → 0.8 → 1, over three evenly spaced stops —
	   with the full turn interpolated onto the same stops. The animation loops,
	   and 360° back to 0° is the same picture, so the loop point cannot be seen. */
	@keyframes loader-spiral-spinner-wind {
		0% {
			transform: rotate(0deg) scale(1);
		}
		50% {
			transform: rotate(180deg) scale(0.8);
		}
		100% {
			transform: rotate(360deg) scale(1);
		}
	}

	.hoop {
		/* The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		   animation but does not choose what it stops on): the ring at full size with its gap at the
		   top, which is an unclosed ring and so still reads as something in progress rather than as a
		   finished circle. Never seen while the animation runs, because the keyframes declare
		   `transform` at both ends. */
		transform: rotate(0deg) scale(1);

		animation: loader-spiral-spinner-wind 1.5s ease-in-out infinite;
	}
</style>
