<script module lang="ts">
	/** The orbit radius the cosine and sine below are multiplied by. */
	const RADIUS_PX = 11;

	const dots = [0, 60, 120, 180, 240, 300].map((angle, index) => {
		const radians = (angle * Math.PI) / 180;

		return {
			index,
			// The endpoint of this dot's breath, from its angle.
			// CSS has one `transform`, so the pair is resolved here into the offset the dot reaches at
			// the top of its breath and handed to the block as two custom properties.
			x: Number((Math.cos(radians) * RADIUS_PX).toFixed(3)),
			y: Number((Math.sin(radians) * RADIUS_PX).toFixed(3)),
			// The tints alternate teal and cyan by index. Both are
			// decorative status-family tints at low alpha, which is exactly the `bg-success/35` and
			// `bg-info/35` pair; a semantic token
			// already carries both themes.
			tint: index % 2 === 0 ? "bg-success/35" : "bg-info/35",
		};
	});
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Six tinted dots that swell out of one point into a ring and fall back.
	 *
	 * ALL SIX SHARE ONE PHASE — no dot carries a `delay`, so the ring opens
	 * and closes as a single breath rather than chasing. The only thing that differs per dot is where
	 * it travels to, which is why the endpoints ride in as `--x` / `--y` on the element and the
	 * keyframes are shared (`loader-liquid-dots.svelte` does the same for its two dots).
	 *
	 * THE FROZEN FRAME IS THE OPEN RING, not frame 0. Every dot starts and ends the cycle at the
	 * centre, so freezing on frame 0 would stack six dots into one — recognisably broken rather than
	 * recognisably paused. The rest state below is the 50% keyframe instead: a real frame of this
	 * loader's own animation, and the one that reads as the object.
	 *
	 * `transformOrigin: 'center'` is dropped: it is already the default for
	 * a `<div>`, and only matters on an `<svg>` (`loader-spring-hexagon.svelte`).
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
	data-loader="apple-breathe"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex size-12 items-center justify-center", className)}
>
	{#each dots as dot (dot.index)}
		<!--
			`absolute` inside a centring flex container is not a contradiction: a child with `auto`
			offsets resolves to its static position, and in a flex container that rectangle is the one
			`items-center justify-center` produces. So all six start stacked at the centre and the
			keyframes push them out from there.
		-->
		<span
			class={cn("dot absolute size-3.5 rounded-full", dot.tint)}
			style:--x="{dot.x}px"
			style:--y="{dot.y}px"
		></span>
	{/each}
</div>

<style>
	/* `scale` runs 1 → 1.75 → 1 with `x`/`y` ramps of the same shape — three values, equal
	   intervals, so the middle one is 50%. `var()` inside `@keyframes` is substituted against the
	   animated element, so one keyframe serves all six directions. */
	@keyframes loader-apple-breathe-bloom {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(var(--x), var(--y)) scale(1.75);
		}
	}

	.dot {
		/* The rest state: the 50% keyframe, restated. The two numbers here are the same fact as the
		   ones above and nothing will report it if they drift. */
		transform: translate(var(--x), var(--y)) scale(1.75);

		animation: loader-apple-breathe-bloom 3.6s ease-in-out infinite;
	}
</style>
