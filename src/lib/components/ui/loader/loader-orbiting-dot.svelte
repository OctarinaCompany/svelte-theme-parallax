<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A single dot running round a faint track, with a small hub at the centre.
	 *
	 * THREE ZINC SHADES, THREE ROWS OF THE TOKEN MAP, and getting them apart is the whole loader.
	 * `bg-zinc-800 dark:bg-white` on the travelling dot is the primary mark, `bg-foreground`.
	 * `border-zinc-200 dark:border-zinc-800` on the track and `bg-zinc-300 dark:bg-zinc-700` on the
	 * hub are both unlit — the things the dot moves against, not marks in their own right — so both
	 * take the `/20` weight, `border-muted-foreground/20` and `bg-muted-foreground/20`. Painting the
	 * hub at full ink would make it compete with the dot, and the loader would read as two objects
	 * rather than one in motion.
	 *
	 * The dot does not move: the TRACK rotates and carries it, which
	 * is why one `rotate` animation is enough for a circular orbit —
	 * no per-frame trigonometry, and the dot's own geometry stays a plain `top`/`left` offset.
	 *
	 * `shadow-sm` is deliberate and stays; it is depth rather than colour, so nothing in the token map
	 * applies to it and there is nothing to convert.
	 *
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
	data-loader="orbiting-dot"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex size-10 items-center justify-center", className)}
>
	<span class="size-2 rounded-full bg-muted-foreground/20"></span>

	<span class="track absolute inset-0 rounded-full border border-muted-foreground/20">
		<!--
			`-mt-1.5 -ml-1.5` pull the dot back by half its own size so that `top-0 left-1/2` puts its
			CENTRE on the track rather than its top-left corner.
		-->
		<span
			class="absolute top-0 left-1/2 -mt-1.5 -ml-1.5 size-3 rounded-full bg-foreground shadow-sm"
		></span>
	</span>
</div>

<style>
	@keyframes loader-orbiting-dot-orbit {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.track {
		/* The rest state, and the only thing visible under `prefers-reduced-motion: reduce` (the
		   shared rule in `src/app.css` stops the animation but does not choose what it stops on). The
		   track is a plain circle, so every angle shows the same picture and this is simply the frame
		   the animation starts on, with the dot at twelve o'clock. Never seen while the animation
		   runs, because the keyframes declare `transform` at both ends. */
		transform: rotate(0deg);

		animation: loader-orbiting-dot-orbit 2s linear infinite;
	}
</style>
