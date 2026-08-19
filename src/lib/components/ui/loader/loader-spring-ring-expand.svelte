<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two rings swelling out of the centre and fading, half a cycle apart — a radar ping.
	 *
	 * THE NAME SAYS SPRING AND THE CURVE DOES NOT: this loader does NOT take
	 * `--ease-loader-spring`; it takes plain `ease-out`. The
	 * display name ("Spring Expand") labels the picture, not
	 * its curve.
	 *
	 * The ring runs scale 0.1 → 1.25 as its opacity fades 1 → 0: one
	 * two-stop keyframe set with a hard snap back at the loop point — the animation loops, it
	 * does not alternate, and the snap from a faded-out ring to a fresh dot is invisible because the
	 * ring is transparent when it happens.
	 *
	 * Decisions worth naming:
	 * - `border-zinc-800 dark:border-white` is an opaque ink ring at full opacity, so it is
	 *   `border-foreground` rather than a hairline token.
	 * - The stagger `delay: i * 0.8` winds up: a positive `animation-delay` parks the second ring on
	 *   its base value for 800ms, so the loader would visibly start up on mount with one ring
	 *   missing. Shifting both delays back one whole cycle keeps their phase relationship — which is
	 *   what makes this read as a repeating ping rather than two rings in lockstep — and starts the
	 *   pair mid-motion.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	/**
	 * The rest frames, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
	 * animation but does not choose what it stops on). Each is the animation's own curve —
	 * `ease-out` is cubic-bezier(0, 0, 0.58, 1) — evaluated at a phase, then read off the keyframe
	 * endpoints:
	 * `scale: 0.1 + 1.15 × p`, `opacity: 1 − p`.
	 *
	 * Ring 1 is frozen at the phase it really has on the first painted frame. With the block's
	 * `animation-delay: i·0.8s − 1.6s` that is 0.5, where the curve returns ≈0.685, giving
	 * `scale ≈ 0.888` and `opacity ≈ 0.315`.
	 *
	 * RING 0 IS NOT, AND THAT IS THE POINT. Its true first-frame phase is 0, i.e. `scale(0.1)` — and
	 * `scale` shrinks the 2px border with everything else, so that frame is a 4px circle drawn with a
	 * 0.2px stroke: sub-pixel, and all but gone. Freezing it there would leave the whole frozen
	 * loader resting on ring 1's 31%-opacity outline, which the shared pulse then dims further.
	 * Phase 0.25 instead, where the curve returns ≈0.378: `scale ≈ 0.535`, `opacity ≈ 0.622` — a
	 * 21px ring at a bit over half strength, nested inside ring 1's wide faint one. Both are frames
	 * this ping really paints, a quarter cycle apart rather than a half, which is exactly what a ping
	 * looks like when two rings are in the air at once. `loader-watch-spinner.svelte` picks its rest
	 * angles away from the true first frame for the same kind of reason.
	 *
	 * The numbers restate the scale endpoints from the `@keyframes` block below. They are two
	 * spellings of one fact and nothing will report it if they drift, so both sites carry a note.
	 */
	const rings = [
		{ index: 0, scale: 0.535, opacity: 0.622 },
		{ index: 1, scale: 0.888, opacity: 0.315 },
	];
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="spring-ring-expand"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex size-12 items-center justify-center", className)}
>
	{#each rings as ring (ring.index)}
		<!--
			No `left`/`top` on purpose. These are `absolute` inside a flex container that centres its
			children, and an absolutely positioned child's static-position rectangle is the ALIGNED one,
			so each ring lands centred with no offset of its own. `loader-clock-spinner.svelte` depends
			on the same rule.
		-->
		<span
			class="ripple absolute size-10 rounded-full border-2 border-foreground"
			style:--index={ring.index}
			style:--rest-scale={ring.scale}
			style:--rest-opacity={ring.opacity}
		></span>
	{/each}
</div>

<style>
	/* The swell-and-fade as one interval. The two scale endpoints are spelled again in
	   the script block, which evaluates this curve to pick each ring's rest frame; change one,
	   change both. */
	@keyframes loader-spring-ring-expand-swell {
		from {
			opacity: 1;
			transform: scale(0.1);
		}
		to {
			opacity: 0;
			transform: scale(1.25);
		}
	}

	.ripple {
		--duration: 1.6s;
		--stagger: 0.8s; /* the stagger `delay: i * 0.8` */

		/* The rest frame, computed per ring in the script block. Never seen while the animation runs,
		   because the keyframes declare both properties at each end. */
		opacity: var(--rest-opacity);
		transform: scale(var(--rest-scale));

		animation: loader-spring-ring-expand-swell var(--duration) ease-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase order, no wind-up. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
