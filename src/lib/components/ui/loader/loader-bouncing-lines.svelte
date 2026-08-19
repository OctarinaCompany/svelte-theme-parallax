<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Three stacked lines stretching out from their left edge in turn, like text arriving.
	 *
	 * `scaleX` FROM A LEFT ORIGIN — the cheap
	 * composited spelling. The lines are `w-full`, so the root's own `w-8` is what sets their length;
	 * that width is deliberate and stays.
	 *
	 * NOT `ui/skeleton`, despite the shape. A skeleton bar is a content-shaped placeholder and takes
	 * `bg-muted`; these lines are the loader's mark — full ink,
	 * not a pale block — so they take `bg-foreground` like every other bar in this folder.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const lines = Array.from({ length: 3 }, (_, index) => index);
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="bouncing-lines"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-8 flex-col gap-1.5", className)}
>
	{#each lines as index (index)}
		<!-- `bg-zinc-800 dark:bg-white` is the primary mark: map on the light-mode shade and drop the
		     `dark:` half, because `--foreground` already carries both themes. -->
		<span class="line h-1.5 w-full origin-left rounded-full bg-foreground" style:--index={index}
		></span>
	{/each}
</div>

<style>
	/* `scaleX` runs 0.3 → 1 → 0.3 over three equal intervals — evenly spaced stops whose first
	   and last values match. */
	@keyframes loader-bouncing-lines-stretch {
		0%,
		100% {
			transform: scaleX(0.3);
		}
		50% {
			transform: scaleX(1);
		}
	}

	.line {
		--duration: 1s;
		/* The stagger, `delay: i * 0.2`. */
		--stagger: 0.2s;

		/* The rest state: 0.3 / 0.58 / 0.86, the staircase these three would really be caught on.
		   With `animation-delay: i*0.2s - 1s` a line's phase on the first painted frame is
		   `1 - 0.2i`, and the keyframe triangle above evaluated there is exactly `0.3 + 0.28i`. The
		   0.3 is the keyframes' own minimum and the 0.28 is 0.7 of swing spent over each fifth of the
		   cycle — the same fact written twice, and nothing will warn you when the two drift. */
		transform: scaleX(calc(0.3 + var(--index) * 0.28));

		animation: loader-bouncing-lines-stretch var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: every delay goes negative, so the stack is
		   already in motion on the first painted frame instead of starting flush. Subtracted rather
		   than negated, which keeps the wave running top to bottom. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
