<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Four dots fading all the way out and back, in a slow left-to-right sweep.
	 *
	 * `linear` IS THE EASE, and it is what makes this read as a sweep
	 * rather than as four separate blinks: the brightness ramps at a constant rate, so the lit band
	 * travels along the row at a constant speed.
	 *
	 * Decisions worth naming:
	 * - `bg-zinc-800 dark:bg-white` is the single token `bg-foreground`; the light-mode shade picks
	 *   the token and the `dark:` half is dropped, because the token already carries both themes.
	 * - `space-x-2` is `gap-2`, the house spelling.
	 * - The stagger `delay: i * 0.2` is shifted back one whole cycle, so the sweep is already running
	 *   on the first painted frame rather than winding up over 600ms.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const dots = [0, 1, 2, 3];
</script>

<!-- `w-fit` so the four dots size the loader instead of it stretching to its container. -->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="fade-dots"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-fit gap-2", className)}
>
	{#each dots as index (index)}
		<span class="dot size-2.5 rounded-full bg-foreground" style:--index={index}></span>
	{/each}
</div>

<style>
	/* `opacity` runs 0 → 1 → 0 over two equal intervals, so the
	   peak is at 50%. Both ends are 0, so the loop has no visible snap. */
	@keyframes loader-fade-dots-sweep {
		0%,
		100% {
			opacity: 0;
		}
		50% {
			opacity: 1;
		}
	}

	.dot {
		--duration: 1.5s;
		/* The stagger: `delay: i * 0.2`. */
		--stagger: 0.2s;

		/* The rest state: a 0.25 → 1 ramp across the four dots, i.e. the sweep caught mid-travel.
		   This is a STYLISED frame rather than the exact one — evaluating the triangle above at each
		   dot's real first-frame phase gives 0, 0.27, 0.53, 0.8, and a leading dot at opacity 0 reads
		   as three dots with a gap rather than as a paused sweep.
		   `loader-classic-spinner.svelte:104` makes the same trade for the same reason: its ramp stops
		   short of the keyframe's floor so no tick disappears. The order and the direction are
		   unchanged. Never seen while the animation runs — the keyframes declare opacity at both
		   ends. */
		opacity: calc(0.25 + var(--index) * 0.25);

		animation: loader-fade-dots-sweep var(--duration) linear infinite;
		/* The stagger delay shifted back one whole cycle: same phase order, so the lit band still
		   travels left to right, and no dot holds still on mount. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
