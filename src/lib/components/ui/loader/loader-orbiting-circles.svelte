<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two small dots orbiting a hub in opposite directions, meeting at the top and the bottom of
	 * every turn.
	 *
	 * TWO WEIGHTS, TWO TOKENS. The orbiting dots are the
	 * quiet mark, `bg-muted-foreground` — one semantic token, right in both themes, where a
	 * hand-picked shade pair could quietly break in one of them. The hub
	 * is the primary mark, `bg-foreground`, so the hub stays the anchor
	 * and the dots stay subordinate to it.
	 *
	 * The dots do not move: each one sits at the top of a full-size layer that rotates, which
	 * is why one `rotate` animation gives a
	 * circular orbit with no per-frame trigonometry.
	 *
	 * THE TWO LAYERS REST 120° APART, NOT AT 0°. The pair runs the same duration in opposite
	 * directions, so the dots are mirror images at every instant and coincide exactly twice a turn —
	 * at the top and at the bottom. Freezing both at the animation's first frame is one of those two
	 * moments: under `prefers-reduced-motion: reduce` a two-dot loader would collapse into a
	 * one-dot loader. So each layer rests a sixth of a turn in — a real frame of the real animation,
	 * a third of a second after the start, with the two dots a third of a turn apart.
	 * `loader-liquid-dots.svelte` gives its two dots separate endpoints for the same reason.
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
	data-loader="orbiting-circles"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex size-12 items-center justify-center", className)}
>
	<span class="size-3 rounded-full bg-foreground"></span>

	<!-- `-ml-1` pulls each dot back by half its own width so `left-1/2` centres it on the orbit. -->
	<span class="orbit orbit-forward absolute inset-0">
		<span class="absolute top-0 left-1/2 -ml-1 size-2 rounded-full bg-muted-foreground"></span>
	</span>
	<span class="orbit orbit-reverse absolute inset-0">
		<span class="absolute top-0 left-1/2 -ml-1 size-2 rounded-full bg-muted-foreground"></span>
	</span>
</div>

<style>
	/* One keyframe pair for both layers; the direction is a custom property, so the second gets
	   its counter-rotation without a second `@keyframes`. A `var()`
	   inside a keyframe is substituted against the animated element, which is what lets two layers
	   share one motion and not its endpoint. */
	@keyframes loader-orbiting-circles-orbit {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(var(--turn));
		}
	}

	.orbit {
		/* The rest state — a sixth of a turn in, so the two dots sit 120° apart rather than on top of
		   each other. See the note in the script block; never seen while the animation runs, because
		   the keyframes declare `transform` at both ends. */
		transform: rotate(var(--rest-angle));

		/* Both layers run the same 2s cycle; only the sign
		   differs, so the pair is symmetric and meets at the same two points every turn. */
		animation: loader-orbiting-circles-orbit 2s linear infinite;
	}

	.orbit-forward {
		--turn: 360deg;
		--rest-angle: 60deg;
	}

	.orbit-reverse {
		--turn: -360deg;
		--rest-angle: -60deg;
	}
</style>
