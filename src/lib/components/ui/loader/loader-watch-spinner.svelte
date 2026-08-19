<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Three nested dials, each a single lit arc, turning at three different speeds.
	 *
	 * Decisions worth naming:
	 * - `border-t-zinc-800 dark:border-t-white` is the mark — the only painted edge of each dial — so
	 *   it is `border-t-foreground`. `border-transparent` on the other three edges is not a colour
	 *   with theme meaning (it is how a ring is reduced to an arc) and stays verbatim.
	 * - Each dial's size stays an inline value, as
	 *   `--size`, rather than becoming three utility classes. It is geometry driven by the index, and
	 *   keeping it in the `{#each}` is what lets the three dials share one class list.
	 *
	 * There is no `animation-delay`, deliberately. The three dials genuinely
	 * start together; what separates them is `duration: 1 + i * 0.5`.
	 *
	 * `ease-in-out` is the CSS keyword, kept as-is. A dial's turn is not a pendulum, so the
	 * `--ease-loader-swing-*` pair does not apply — this reads as a deliberate mechanical stutter
	 * each revolution, and that is the picture.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const dials = [0, 1, 2].map((index) => ({
		index,
		/** Each dial's size: `44 - i * 12` — 44, 32, 20 px. */
		size: 44 - index * 12,
		/** Each dial's period: `1 + i * 0.5` — 1s, 1.5s, 2s. */
		duration: 1 + index * 0.5,
		/**
		 * The rest angle, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		 * animation but does not choose what it stops on). NOT 0° for all three, which is where the
		 * first painted frame puts them: the three durations only ever coincide once every 6s, so
		 * freezing on that single instant would show three arcs stacked at twelve o'clock and read as
		 * a deliberate static target rather than as a spinner held still. A third of a turn apart is a
		 * frame this loader really does show, and each dial stays separately visible.
		 */
		restAngle: index * 120,
	}));
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="watch-spinner"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex size-12 items-center justify-center", className)}
>
	{#each dials as dial (dial.index)}
		<!--
			No `left`/`top` on purpose: these are `absolute` inside a flex container that centres its
			children, and an absolutely positioned child's static-position rectangle is the ALIGNED one,
			so each dial lands concentric with no offset of its own.
		-->
		<span
			class="dial absolute rounded-full border-[3px] border-transparent border-t-foreground"
			style:--size="{dial.size}px"
			style:--duration="{dial.duration}s"
			style:--rest-angle="{dial.restAngle}deg"
		></span>
	{/each}
</div>

<style>
	@keyframes loader-watch-spinner-turn {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.dial {
		/* Said out loud because a Svelte scoped rule is unlayered and therefore outranks any utility:
		   these two beat a caller's `size-*` on a dial. That is intended — the three radii are what
		   makes the picture nested — and a caller who wants it smaller scales the root instead. */
		width: var(--size);
		height: var(--size);

		/* The rest state, computed per dial in the script block above. Never seen while the animation
		   runs, because the keyframes declare `transform` at both ends. */
		transform: rotate(var(--rest-angle));

		animation: loader-watch-spinner-turn var(--duration) ease-in-out infinite;
	}
</style>
