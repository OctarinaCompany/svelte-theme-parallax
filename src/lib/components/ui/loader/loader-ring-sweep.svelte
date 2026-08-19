<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * The plainest spinner in the catalog: a faint ring with one ink arc at the top, turning once a
	 * second.
	 *
	 * TWO BORDER COLOURS DOING TWO DIFFERENT JOBS, and they map to two different tokens.
	 * `border-zinc-200 dark:border-zinc-800` is the unlit track the arc runs on,
	 * so it takes `border-muted-foreground/20`, the same weight `ui/progress` gives its track.
	 * `border-t-zinc-800 dark:border-t-white` is the mark itself — the whole visible object of this
	 * loader — so it takes `border-t-foreground`. Routing an opaque ink border to `border-border`
	 * because it is spelled `border-*` is the commonest way to end up with an invisible loader.
	 *
	 * THE RING IS AN INNER ELEMENT: spinning the root
	 * would mean spinning the element carrying a caller's `class` and this loader's a11y attributes.
	 * `loader-gradient-arc.svelte` splits them for the same reason.
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
	data-loader="ring-sweep"
	{role}
	aria-label={ariaLabel}
	class={cn("flex size-10 items-center justify-center", className)}
>
	<!--
		`border-[3px]` is geometry rather than colour, so it stays an arbitrary value.

		The root centres a flex item on purpose, and that is what makes `size-full` mean anything here:
		a `<span>` is inline, `width`/`height` do not apply to a non-replaced inline box, and an inline
		ring would collapse to its 3px borders around zero content — a 6px blob instead of a 40px ring,
		with nothing in `prettier`, `svelte-check` or the console to say so. Being a flex item
		blockifies it. `loader-haptic-ring.svelte` and `loader-gradient-arc.svelte` carry the identical
		span over the identical flex root; the loaders that keep a non-flex root spell the `block` out
		instead (`loader-pulse-square.svelte`, `loader-flip-square.svelte`).

		The hook class is `arc`, NOT `ring`: `ring` is a real Tailwind utility (a box-shadow ring), so
		a scoped rule named `.ring` would compile and animate correctly while silently painting an
		extra shadow ring around the loader — and `prettier-plugin-tailwindcss` would sort it into the
		utility half of the class list, which is how it announces itself. Every loader in this folder
		that spins a border picks a hook name Tailwind does not define.
	-->
	<span
		class="arc size-full rounded-full border-[3px] border-muted-foreground/20 border-t-foreground"
	></span>
</div>

<style>
	@keyframes loader-ring-sweep-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.arc {
		/* The rest state, and the only thing visible under `prefers-reduced-motion: reduce` (the
		   shared rule in `src/app.css` stops the animation but does not choose what it stops on). A
		   ring is the same picture at every angle, so any frame is as good as any other and this is
		   simply the one the animation starts on: the ink arc parked at the top. Never seen while the
		   animation runs, because the keyframes declare `transform` at both ends of the cycle. */
		transform: rotate(0deg);

		animation: loader-ring-sweep-spin 1s linear infinite;
	}
</style>
