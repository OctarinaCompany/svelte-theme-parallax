<script module lang="ts">
	/**
	 * The cycle and travel: `duration: 1` and `y: [4, -4, 4]`.
	 *
	 * These three constants are spelled again as literals in the `@keyframes` block below, because a
	 * `<script module>` const cannot reach a CSS rule. They are two spellings of one fact and nothing
	 * will report it if they drift, so both sites carry a note.
	 */
	const DURATION_S = 1;
	/** The bottom of the row, and both ends of the `y` ramp. */
	const Y_LOW = 4;
	/** The top of the row, the middle of that array. */
	const Y_HIGH = -4;

	const dots = Array.from({ length: 5 }, (_, index) => {
		// The stagger: `delay: i * 0.15`.
		const delay = index * 0.15;

		// The rest state, for `prefers-reduced-motion` — the shared rule in `src/app.css` stops the
		// animation but does not choose what it stops on. The block below shifts every dot back one
		// whole cycle, so this dot's phase on the first painted frame is `((-delay) mod D) / D`;
		// evaluating the keyframe triangle there freezes the row on a real frame of its own wave.
		//
		// It has to be computed here rather than said in `calc()`, because the fifth dot's phase
		// crosses the apex and starts back down: the frozen offsets run 4 / 1.6 / −0.8 / −3.2 /
		// −2.4px, which is a wave, where any `i × k` ramp would be a straight diagonal line.
		const phase = ((DURATION_S - delay) % DURATION_S) / DURATION_S;
		const lift = 1 - 2 * Math.abs(phase - 0.5);

		return {
			index,
			delay,
			y: Number((Y_LOW + (Y_HIGH - Y_LOW) * lift).toFixed(3)),
		};
	});
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Five dots rolling through a standing wave.
	 *
	 * THE TRAVEL IS CENTRED ON THE ROW, NOT HUNG FROM IT. The `y: [4, -4, 4]` ramp starts BELOW the
	 * baseline and rises through it, so the dot spends half its cycle each side of centre — which is
	 * why the root states `h-6 items-center` and the 8px of travel fits inside the 24px box with room
	 * to spare. Writing the array as `[0, -8, 0]` would look identical in isolation and sit wrong in
	 * the row.
	 *
	 * Decisions worth naming:
	 * - The dots are the single token `bg-foreground`, which carries both themes on its own.
	 * - The travel is an explicit `translateY()`, so the wave stays composited.
	 * - The delay is shifted back one whole cycle, so the wave is already rolling on the first
	 *   painted frame instead of winding up over 600ms.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();
</script>

<!-- `w-fit` so the five dots size the row rather than it stretching to its container. -->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="wave-dots"
	{role}
	aria-label={ariaLabel}
	class={cn("flex h-6 w-fit items-center gap-1.5", className)}
>
	{#each dots as dot (dot.index)}
		<span
			class="dot size-2 rounded-full bg-foreground"
			style:--delay="{dot.delay}s"
			style:--rest="{dot.y}px"
		></span>
	{/each}
</div>

<style>
	/* The roll, `y` 4px → -4px → 4px, over two equal intervals — the apex is
	   at 50%. The two 4px and the −4px are `Y_LOW` and `Y_HIGH` in the module block, which evaluates
	   this same triangle to pick each dot's rest frame; change one, change both. */
	@keyframes loader-wave-dots-roll {
		0%,
		100% {
			transform: translateY(4px);
		}
		50% {
			transform: translateY(-4px);
		}
	}

	.dot {
		--duration: 1s;

		/* The rest frame, computed per dot in the module block. Never seen while the animation runs,
		   because the keyframes declare the transform at both 0% and 100%. */
		transform: translateY(var(--rest));

		animation: loader-wave-dots-roll var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase ORDER, which is the direction the
		   crest travels along the row, and no wind-up on mount. Negating each delay instead would run
		   the wave backwards. */
		animation-delay: calc(var(--delay) - var(--duration));
	}
</style>
