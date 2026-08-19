<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * An outlined square that flips a quarter turn every 0.6s around a small solid centre.
	 *
	 * THE 90° IS LOAD-BEARING. The animation loops, which
	 * snaps back to the start value rather than easing back — so the square eases from 0° to 90° and
	 * then jumps. On a square, 90° and 0° are the same picture, so the jump is invisible and what you
	 * see is an endless series of quarter turns. `loader-spring-hexagon.svelte` records the same
	 * trick at 60° on a hexagon. Writing `alternate` here would give a ping-pong — a different
	 * loader.
	 *
	 * THE ROTATION MOVED OFF THE ROOT ONTO AN INNER WRAPPER, for the reason
	 * `loader-cross-spinner.svelte` gives: the shared reduced-motion rule in `src/app.css` claims the
	 * root's own `animation` with `!important`, and the root is also where a caller's `class` lands.
	 *
	 * TOKENS. `border-zinc-800 dark:border-zinc-700` is an opaque ink ring — the visible object —
	 * so `border-foreground`, not `border-border`. The 8px centre is `bg-foreground` from
	 * `bg-zinc-800 dark:bg-white`.
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
	data-loader="square-spinner"
	{role}
	aria-label={ariaLabel}
	class={cn("size-8", className)}
>
	<div class="square flex size-full items-center justify-center border-2 border-foreground">
		<span class="size-2 bg-foreground"></span>
	</div>
</div>

<style>
	@keyframes loader-square-spinner-quarter {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(90deg);
		}
	}

	.square {
		/* The rest state is the square as drawn, which is also both ends of the keyframe: 0° and 90°
		   are indistinguishable on a square, so the frozen frame is a true frame of the animation. */
		transform: rotate(0deg);

		animation: loader-square-spinner-quarter 0.6s ease-in-out infinite;
	}
</style>
