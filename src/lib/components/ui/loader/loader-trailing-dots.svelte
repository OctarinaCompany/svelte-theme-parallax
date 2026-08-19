<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A dot circling the box with four fading dots trailing behind it.
	 *
	 * FIVE ARMS, NOT ONE PATH. Five full-size `inset-0` layers each hang a dot off their
	 * top edge and spin, which turns an orbit into a
	 * plain `rotate` about the box centre. The trail is then nothing but the same rotation started
	 * 100ms apart per layer.
	 *
	 * TWO THINGS FADE THE TRAIL, and only one of them animates. The head is
	 * `bg-foreground` and the other four `bg-muted-foreground`;
	 * on top of that each dot carries a static
	 * `opacity: 1 - i * 0.2`. That opacity is a plain style, not a
	 * keyframe, so it is written once as a `calc()` on the same `--index` the stagger uses — the dot
	 * inherits the custom property from its arm.
	 *
	 * THE FROZEN FRAME IS A LINEAR FAN, AND THAT IS A DELIBERATE DIVERGENCE. Every other loader in
	 * this folder freezes on its own keyframe curve evaluated at the phase the shifted delay leaves
	 * it on. Here that curve is the CSS keyword applied to a full turn, which compresses hard
	 * at both ends — and the mount instant lands every arm in that compressed tail: evaluated
	 * honestly the five arms sit at 0°, −3°, −13°, −29° and −53°, so the head and the two dots behind
	 * it are inside 13° of arc, about 3px apart on this 40px box, and read as one smudge with two
	 * stragglers. The rest state below reads the turn linearly instead, 24° per arm, which is the
	 * evenly spaced fan this loader shows through the middle of every cycle and the picture that says
	 * "still going".
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const arms = [0, 1, 2, 3, 4];
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="trailing-dots"
	{role}
	aria-label={ariaLabel}
	class={cn("relative size-10", className)}
>
	{#each arms as index (index)}
		<span class="arm absolute inset-0" style:--index={index}>
			<!-- `-ml-1` is half the dot's own 8px width, so `left-1/2` centres it on the axis rather
			     than starting it there. -->
			<span
				class={cn(
					"arm-dot absolute top-0 left-1/2 -ml-1 size-2 rounded-full",
					index === 0 ? "bg-foreground" : "bg-muted-foreground",
				)}
			></span>
		</span>
	{/each}
</div>

<style>
	/* One full turn: a single ramp from 0 across the whole duration,
	   snapping back at the loop point — which on a full turn is invisible. */
	@keyframes loader-trailing-dots-orbit {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.arm {
		--duration: 1.5s;
		/* The stagger `delay: i * 0.1`, derived from `--duration` rather than written as `100ms` so the
		   two cannot drift apart: 1.5s / 15 = 0.1s. */
		--stagger: calc(var(--duration) / 15);

		/* The rest state: the trail fanned out behind the head, 24° per arm — 360° × (0.1s / 1.5s),
		   the angle one stagger of travel covers. See the note in the script block for why this reads
		   the turn linearly rather than through the easing. */
		transform: rotate(calc(var(--index) * -24deg));

		/* `ease-in-out` on a full turn makes the ring hesitate at
		   each loop point — a deliberate mannerism of this loader, not a physical swing, so
		   it stays as written. */
		animation: loader-trailing-dots-orbit var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase order, no wind-up. Negating it
		   instead would put arm i ahead of the head rather than behind it, and the trail would lead. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}

	.arm-dot {
		/* The static `opacity: 1 - i * 0.2`, inherited from the arm's `--index`. Nothing
		   animates it, so it needs no rest state of its own. */
		opacity: calc(1 - var(--index) * 0.2);
	}
</style>
