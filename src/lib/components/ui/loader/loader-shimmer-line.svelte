<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A short bright segment sweeping along a hairline track.
	 *
	 * THE TRACK IS `bg-muted-foreground/20`, AND `ui/skeleton`'s `bg-muted` WAS TRIED FIRST AND
	 * MEASURED ALL BUT INVISIBLE. `bg-muted` is the tempting choice, on the argument that this line
	 * is a content-shaped placeholder rather than a gauge track. On the gallery's `bg-card` tile that
	 * override erases the track: `--muted` is seven levels from `--card` in dark, and measured in
	 * Chrome over 16 frames the share of the loader's box reading at least 12/255 from its ground was
	 * 0.030 in dark against 0.170 in light — the track vanished and only the bright segment survived,
	 * so the same component showed a sixth as much of itself in one theme as in the other. At
	 * `bg-muted-foreground/20` — the recipe's unlit-track weight, `ui/circular-progress`'s own track
	 * (`circular-progress-track.svelte:42`) — it is 0.170 in BOTH: the track is back, and the two
	 * themes agree. Do not "correct" this back to `bg-muted`. The travelling segment is
	 * a primary mark, so `bg-foreground`.
	 *
	 * THE SEGMENT TRAVELS ON `transform`, not on `left` — the composited spelling. The
	 * percentages of `translateX(-100%)` → `translateX(300%)` resolve against
	 * the segment's own width — one third of the track — so 300% carries it a full track-width past
	 * the right edge. `overflow-hidden` on the root clips both ends of the run.
	 *
	 * TWO VALUES THAT DO NOT MATCH, SO `from`/`to` AND A SNAP. `repeat: Infinity` defaults to
	 * `repeatType: "loop"`, which jumps back to the first value rather than reversing. The jump
	 * happens off-screen, past the right edge, which is what makes the sweep read as one segment
	 * repeatedly crossing rather than one bouncing.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();
</script>

<!--
	`h-1 w-24` is a deliberately fixed width, unlike
	the fluid `w-full max-w-[120px]` its sibling `skeleton-loader` carries.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="shimmer-line"
	{role}
	aria-label={ariaLabel}
	class={cn("relative h-1 w-24 overflow-hidden rounded-full bg-muted-foreground/20", className)}
>
	<span class="segment absolute inset-y-0 left-0 w-1/3 rounded-full bg-foreground"></span>
</div>

<style>
	/* The sweep: -100% → 300% over 1.5s, ease-in-out. */
	@keyframes loader-shimmer-line-sweep {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(300%);
		}
	}

	.segment {
		/* The rest state: the segment parked over the middle of the track. Frame 0 is `-100%`, which
		   is entirely outside the clipped box — an empty track, which says nothing is happening.
		   `100%` puts a third-width segment across the middle third, which reads as a run caught
		   part-way. While the animation runs this value never shows: the keyframes declare both
		   ends. */
		transform: translateX(100%);

		animation: loader-shimmer-line-sweep 1.5s ease-in-out infinite;
	}
</style>
