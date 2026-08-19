<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Three dots breathing from faint to solid, one fifth of a second apart.
	 *
	 * THE EASING IS THE BARE `ease-in-out` KEYWORD,
	 * cubic-bezier(0.42, 0, 0.58, 1). (Tailwind's `ease-in-out` utility is a
	 * different, Material curve; inside a style block the bare keyword is the right one, which is one
	 * reason animations live here rather than in the markup.)
	 *
	 * Decisions worth naming:
	 * - `bg-zinc-800 dark:bg-white` is one semantic token, `bg-foreground`. The light-mode shade picks
	 *   the token and the `dark:` half is dropped, because the token already carries both themes.
	 * - `space-x-1.5` is `gap-1.5`, the house spelling for a spaced row.
	 * - The stagger `delay: i * 0.2` is shifted back one whole cycle so the row starts in its steady
	 *   state instead of holding all three dots at their base opacity for up to 400ms on mount.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const dots = [0, 1, 2];
</script>

<!-- `w-fit` because a bare block <div> would stretch to its container and strand the row on the
     left edge of whatever it is dropped into. The three dots size this loader. -->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="pulse-dots"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-fit gap-1.5", className)}
>
	{#each dots as index (index)}
		<span class="dot size-2.5 rounded-full bg-foreground" style:--index={index}></span>
	{/each}
</div>

<style>
	/* `opacity` runs 0.2 → 1 → 0.2 over two equal intervals, so
	   the middle stop sits at 50%. First and last are the same value, hence the shared
	   selector; a loop whose ends agree has no visible snap. */
	@keyframes loader-pulse-dots-breathe {
		0%,
		100% {
			opacity: 0.2;
		}
		50% {
			opacity: 1;
		}
	}

	.dot {
		--duration: 1.4s;
		/* The stagger: `delay: i * 0.2`. */
		--stagger: 0.2s;

		/* The rest state, and the only thing reduced motion leaves on screen: a static ramp 0.2 →
		   0.43 → 0.66 across the three dots. It is a real frame of this animation, not a decoration.
		   With `animation-delay: i·0.2s − 1.4s` a dot's phase on the first painted frame is
		   (1.4 − 0.2i)/1.4 — past the halfway point for all three, so all three sit on the FALLING leg
		   of the triangle, measured back from its far end: `0.2 + 0.8 × (2 × 0.2i / 1.4)`, i.e. 0.229
		   per dot. That 0.8 and that 0.2 are the keyframe's two stops, spelled again here; the two have
		   to agree. */
		opacity: calc(0.2 + var(--index) * 0.229);

		animation: loader-pulse-dots-breathe var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase ORDER — which is the direction the
		   bright dot travels along the row — with no wind-up. Negating each delay instead would run
		   the pulse the other way. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
