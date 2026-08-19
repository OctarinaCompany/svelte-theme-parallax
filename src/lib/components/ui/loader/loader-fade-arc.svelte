<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A fixed arc turning over a quiet ring — the plainest member of the stroke-dash family, and the
	 * only one whose dash never moves.
	 *
	 * NO KEYFRAMES OF OUR OWN, ON PURPOSE: the whole
	 * animation is Tailwind's `animate-spin` on the `<svg>`. That utility
	 * references Tailwind's own `spin` keyframes rather than a name this component declares, so it is
	 * not caught by the hashing trap that makes an arbitrary `animate-[…]` utility a silent no-op,
	 * and the house already uses it (`ui/spinner` is `size-4 animate-spin`).
	 *
	 * `pathLength="1"` MAKES THE DASH VALUES RADIUS-FREE. The circle
	 * has radius 20, so its circumference is 2π·20 = 125.664 user units; a dash of
	 * 80 with an offset of 28 is therefore 2/π and
	 * 0.7/π of the path. Normalising the path to one unit long makes those fractions the literal
	 * attribute values and removes the dependency on the radius, the same move
	 * `loader-arc-tracer.svelte` documents. Both numbers multiply back to 80.000 and 28.000.
	 *
	 * NO `vector-effect="non-scaling-stroke"`, for the reason `ui/circular-progress` records in
	 * `circular-progress-range.svelte:25-30`: it strokes in screen space, so at any effective scale
	 * other than 1 a dash pattern measured in user units stops covering the path and paints a phantom
	 * second arc.
	 *
	 * SVG SPELLING: `stroke-width` / `stroke-dasharray` / `stroke-dashoffset` /
	 * `stroke-linecap` are presentation attributes and go kebab; `viewBox` and `pathLength` are
	 * camelCase because that is what the SVG specification calls them, and writing either in kebab
	 * would be a legal attribute that does nothing at all.
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
	data-loader="fade-arc"
	{role}
	aria-label={ariaLabel}
	class={cn("relative size-9", className)}
>
	<svg class="dial size-full animate-spin" viewBox="0 0 50 50" aria-hidden="true">
		<!-- The unlit ring: `stroke-zinc-200 dark:stroke-zinc-800` is a track, not a mark, so `/20`. -->
		<circle
			cx="25"
			cy="25"
			r="20"
			class="fill-none stroke-muted-foreground/20"
			stroke-width="3.5"
		/>
		<circle
			cx="25"
			cy="25"
			r="20"
			class="fill-none stroke-foreground"
			stroke-width="3.5"
			stroke-linecap="round"
			pathLength="1"
			stroke-dasharray="0.63662"
			stroke-dashoffset="0.22282"
		/>
	</svg>
</div>

<style>
	.dial {
		/* Stated rather than inherited: an `<svg>`'s transform reference box is `transform-box:
		   view-box`, so `origin-*` utilities do not mean here what they mean on a `<div>`, and the
		   turn has to pivot on the centre of the 50×50 viewBox.

		   There is no rest state to declare. The only animated property is the `transform` Tailwind's
		   `spin` keyframes write, whose resting value is the identity — and the frozen frame is
		   already a busy one, because the arc covers about two thirds of the ring at a fixed offset
		   whatever the angle. */
		transform-origin: center;
	}
</style>
