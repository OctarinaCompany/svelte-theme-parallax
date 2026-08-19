<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A single bar sweeping round inside a quiet ring, like a compass needle.
	 *
	 * TWO WEIGHTS, TWO TOKENS. The ring is `border-zinc-200 dark:border-zinc-800`
	 * — an unlit track rather than a mark, so it takes the `/20` weight, the
	 * same one `ui/circular-progress`'s track uses. The bar is `bg-zinc-800 dark:bg-white`, the
	 * primary mark, so `bg-foreground`. Mapping both to the same token would delete the loader: a
	 * bar on a ring of identical weight is a single blob.
	 *
	 * THE BAR IS THE FLEX ITEM, THE RING IS THE ABSOLUTE ONE. The bar
	 * is centred by the flex container, so its rotation pivots on the box's centre with no
	 * `transform-origin` of its own.
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
	data-loader="line-spinner"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex size-10 items-center justify-center", className)}
>
	<span class="absolute size-10 rounded-full border-2 border-muted-foreground/20"></span>
	<span class="needle h-1 w-8 rounded-full bg-foreground"></span>
</div>

<style>
	/* One full turn over 1.2s linear. The
	   loop snaps 360° back to 0° each cycle — invisible here, since a full turn ends where it
	   began. */
	@keyframes loader-line-spinner-sweep {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.needle {
		/* The rest state is the bar as drawn. A bar with round caps is its own 180° rotation and the
		   sweep is continuous, so no angle in the cycle is more "mid-motion" than another; the ring
		   around it is what says this is a spinner rather than a dash. */
		transform: rotate(0deg);

		animation: loader-line-spinner-sweep 1.2s linear infinite;
	}
</style>
