<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A single lit arc turning over a quiet ring — the plainest member of the stroke-dash family.
	 *
	 *
	 * THIS FILE DECLARES NO KEYFRAMES, ON PURPOSE:
	 * the whole rotation is Tailwind's own `animate-spin`, whose keyframes are
	 * Tailwind's rather than this component's, so there is nothing for Svelte to hash and nothing to
	 * rewrite. `ui/spinner` uses the same utility for the same reason. The one rule in the block below
	 * is a `transform-origin`, not an animation.
	 *
	 * `pathLength="1"` IS DELIBERATE, the same move `loader-arc-tracer.svelte` records.
	 * A `stroke-dasharray="38 80"` in user units against a circle
	 * whose circumference is 2π·14 = 87.96 makes the lit dash 38/87.96 = 0.432 of the ring and the
	 * gap 80/87.96 = 0.909, a gap long enough that it runs off the end of the path and only one arc is
	 * ever drawn. Normalising the path to one unit long keeps that picture exactly while making the
	 * two numbers readable as fractions and independent of the radius. No `vector-effect`, for the
	 * reason `loader-arc-tracer.svelte` sets out.
	 *
	 * Other divergences, all deliberate:
	 * - `stroke-zinc-200 dark:stroke-zinc-800` is the unlit track the arc runs over, so it takes the
	 *   `/20` weight — the same weight `ui/circular-progress`'s track uses.
	 * - `stroke-zinc-800 dark:stroke-white` is the mark: `stroke-foreground`.
	 * - `fill="none"` moves from an attribute to the `fill-none` utility, matching the rest of the
	 *   family; the presentation attributes keep SVG's kebab spelling and `pathLength` / `viewBox`
	 *   keep SVG's camelCase one.
	 *
	 * The rest state under `prefers-reduced-motion` needs nothing declared here: the shared rule in
	 * `src/app.css` stops `animate-spin`, which leaves the untransformed arc sitting where it is
	 * drawn — a partial ring, which is the "still busy" picture that rule wants.
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
	data-loader="smooth-ring"
	{role}
	aria-label={ariaLabel}
	class={cn("size-9", className)}
>
	<svg class="face size-full animate-spin" viewBox="0 0 32 32" aria-hidden="true">
		<circle cx="16" cy="16" r="14" class="fill-none stroke-muted-foreground/20" stroke-width="3" />
		<circle
			class="fill-none stroke-foreground"
			cx="16"
			cy="16"
			r="14"
			stroke-width="3"
			stroke-linecap="round"
			pathLength="1"
			stroke-dasharray="0.432 0.909"
		/>
	</svg>
</div>

<style>
	.face {
		/* Stated rather than left to the initial value because the reference box for an `<svg>` is
		   `transform-box: view-box`, so reading `center` off the 0 0 32 32 viewport is a different
		   sentence from reading it off the 36×36 border box — they agree here, and saying which one is
		   meant keeps them agreeing if the viewBox ever changes. `loader-spring-hexagon.svelte` states
		   it for the same reason. There is no `origin-center` utility doing this job instead: on an
		   `<svg>` the `origin-*` utilities do not mean what they mean on a `<div>`. */
		transform-origin: center;
	}
</style>
