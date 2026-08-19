<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Four stacked lines contracting toward their left edge one after another, like a list collapsing
	 * and reopening.
	 *
	 * `scaleX` FROM A LEFT ORIGIN — the cheap composited spelling. A 4px-tall `rounded-full` line
	 * does have caps whose radius is half its height, but they are on the ENDS, and `scaleX` is the
	 * axis they are swept along — the cap that gets narrower is the only distortion, and it is
	 * barely visible. Nothing here needs the layout-property exception.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const lines = Array.from({ length: 4 }, (_, index) => index);
</script>

<!--
	`size-10` is a real fixed box: the lines are `w-full`, so the root's width IS their length.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="accordion-loader"
	{role}
	aria-label={ariaLabel}
	class={cn("flex size-10 flex-col justify-center gap-1.5", className)}
>
	{#each lines as index (index)}
		<!-- `bg-zinc-800 dark:bg-white` is the primary mark: map on the light-mode shade and drop the
		     `dark:` half, because `--foreground` already carries both themes. -->
		<span class="line h-1 w-full origin-left rounded-full bg-foreground" style:--index={index}
		></span>
	{/each}
</div>

<style>
	/* `scaleX` runs 1 → 0.2 → 1 over three equal intervals — evenly spaced stops whose first and
	   last values match. */
	@keyframes loader-accordion-loader-collapse {
		0%,
		100% {
			transform: scaleX(1);
		}
		50% {
			transform: scaleX(0.2);
		}
	}

	.line {
		--duration: 1.5s;
		/* The stagger, `delay: i * 0.15`. */
		--stagger: 0.15s;

		/* The rest state: 1 / 0.84 / 0.68 / 0.52, a real staircase rather than four full-width lines
		   that would read as a finished block. With `animation-delay: i*0.15s - 1.5s` a line's phase
		   on the first painted frame is `1 - 0.1i`, and the keyframe triangle above evaluated there
		   is exactly `1 - 0.16i`. The 1 is the keyframes' own maximum and the 0.16 is 0.8 of swing
		   spent over each tenth of the cycle — two spellings of one fact, and nothing will warn you
		   when they drift. */
		transform: scaleX(calc(1 - var(--index) * 0.16));

		animation: loader-accordion-loader-collapse var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: every delay goes negative, so the stack is
		   already mid-collapse on the first painted frame instead of standing open for the first
		   half second. Subtracted rather than negated, which is what keeps the collapse running top
		   to bottom. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
