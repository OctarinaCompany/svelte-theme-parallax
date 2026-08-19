<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A still centre dot with a quieter one orbiting it.
	 *
	 * THE SATELLITE IS ONE SEMANTIC TOKEN, `bg-muted-foreground` — not a hand-picked `zinc` pair.
	 * A per-theme shade is two values that can quietly drift, and a dark shade that misses its mark
	 * paints the orbiting dot no colour at all; one token is legible in both themes with nothing to
	 * keep in sync.
	 *
	 * THE ROTATION IS ON A WRAPPER, not on the satellite: a full-size `inset-0` layer spins with the
	 * dot hung off its top edge, which makes the orbit a plain `rotate` about the box centre rather
	 * than a `translate` + counter-`rotate` pair — and the wrapper is an inner element, so the
	 * rotation stays off the root that carries a caller's `class` and this loader's a11y attributes.
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
	data-loader="fluid-dot-orbit"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex size-10 items-center justify-center", className)}
>
	<span class="size-2.5 rounded-full bg-foreground"></span>

	<span class="orbit absolute inset-0">
		<!-- `-ml-1` is half the dot's own 8px width, so `left-1/2` centres it on the axis rather than
		     starting it there. `top-1` is the 4px inset from the top edge. -->
		<span class="absolute top-1 left-1/2 -ml-1 size-2 rounded-full bg-muted-foreground"></span>
	</span>
</div>

<style>
	/* One full linear turn over 2s. Tailwind's `animate-spin` is the same
	   motion but fixed at 1s, and the arbitrary-value form that would retime it references an
	   unhashed keyframe name and silently does nothing — so the keyframe is written out here. */
	@keyframes loader-fluid-dot-orbit-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.orbit {
		/* The rest state. One angle is as good as another — the picture is the same orbit rotated —
		   so this is simply the frame the animation starts on, and reduced motion leaves a satellite
		   parked above the centre dot rather than an empty box. */
		transform: rotate(0deg);

		animation: loader-fluid-dot-orbit-spin 2s linear infinite;
	}
</style>
