<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * The chat bubble with three bobbing dots.
	 *
	 * THE PILL IS A PANEL, THE DOTS ARE MARKS, AND THAT SPLIT DECIDES BOTH TOKENS. The bubble
	 * is a surface with content on it, not
	 * a mark on the page, so it takes `bg-muted` rather than the `muted-foreground/20` an unlit
	 * TRACK would take. The dots are a quiet mark, so
	 * `bg-muted-foreground` — one token carrying both themes, with no second half free to be wrong.
	 *
	 * The dots travel on `transform`; nothing here
	 * needs a layout property.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const dots = Array.from({ length: 3 }, (_, index) => index);
</script>

<!--
	`w-fit`: the three dots and the padding size this bubble, and a bare block `<div>` would stretch
	the pill across whatever container it lands in.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="typing-indicator"
	{role}
	aria-label={ariaLabel}
	class={cn(
		"flex w-fit items-center justify-center gap-1 rounded-full bg-muted px-4 py-2",
		className,
	)}
>
	{#each dots as index (index)}
		<span class="dot size-1.5 rounded-full bg-muted-foreground" style:--index={index}></span>
	{/each}
</div>

<style>
	/* The bob: `y` 0 → -4px → 0 over 0.6s — three evenly
	   spaced stops with matching ends, so they share a selector. */
	@keyframes loader-typing-indicator-bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-4px);
		}
	}

	.dot {
		--duration: 0.6s;
		--stagger: 0.15s; /* the stagger `delay: i * 0.15` */

		/* The rest state: a 0 / -2 / -4px staircase rather than three dots in a row. That is not a
		   decorative guess — with the delay below, dot i sits `i / 2` of the way up the keyframe
		   triangle on the first painted frame (phases 0, 0.75 and 0.5 of a cycle whose peak is at
		   0.5), which is exactly `i × -2px`. So the frame reduced motion freezes on is the wave the
		   loader would really be showing. */
		transform: translateY(calc(var(--index) * -2px));

		animation: loader-typing-indicator-bob var(--duration) ease-in-out infinite;

		/* The stagger delay shifted back one whole cycle: same phase order, so the bob still runs
		   left to right, but every delay is negative, so the dots are already staggered on the first
		   painted frame instead of starting flush and drifting apart over the first cycle. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
