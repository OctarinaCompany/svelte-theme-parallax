<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A heart beating twice a cycle.
	 *
	 * Decisions worth naming:
	 * - The heart is one semantic token, `fill-foreground`, which carries both themes on its own.
	 * - The `<svg>` is the
	 *   animated element, not the wrapping `<div>`, so the root keeps the fixed attribute block
	 *   every loader in this folder shares. The picture is identical — the `<svg>` fills the root
	 *   either way.
	 *
	 * THE FIVE-STOP ARRAY IS THE POINT. `scale: [1, 1.25, 1, 1.25, 1]` with no `times:` means five
	 * evenly spaced stops, which is two swells inside one 1.5s cycle — a double beat, the thing a
	 * heart does and a pulse does not. Collapsing it to a single swell would halve the beat and lose
	 * the whole gesture.
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
	data-loader="pumping-heart"
	{role}
	aria-label={ariaLabel}
	class={cn("size-8", className)}
>
	<svg class="heart size-full fill-foreground" viewBox="0 0 24 24" aria-hidden="true">
		<path
			d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
		/>
	</svg>
</div>

<style>
	/* The double beat: `scale` 1 → 1.25 → 1 → 1.25 → 1 — five values, evenly
	   spaced at quarters. */
	@keyframes loader-pumping-heart-beat {
		0%,
		50%,
		100% {
			transform: scale(1);
		}
		25%,
		75% {
			transform: scale(1.25);
		}
	}

	.heart {
		/* The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		   animation but does not choose what it stops on). A heart between beats is a heart at its
		   drawn size, which is also the value the cycle starts, passes through and ends on — freezing
		   it swollen would read as a rendering fault rather than as a paused loader. Never seen while
		   the animation runs, because the keyframes declare `transform` at both ends. */
		transform: scale(1);

		/* Stated rather than left to the initial value, because the reference box for an `<svg>` is
		   `transform-box: view-box`: `center` is read off the 0 0 24 24 viewport rather than off the
		   32px border box. They agree here, and saying which one is meant keeps them agreeing if the
		   viewBox ever changes. */
		transform-origin: center;

		animation: loader-pumping-heart-beat 1.5s ease-in-out infinite;
	}
</style>
