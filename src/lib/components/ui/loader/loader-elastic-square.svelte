<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A block that squashes on the floor, springs up thin and tall, and lands flat again.
	 *
	 * THE FLOOR IS A TRACK, NOT A MARK: an unlit line the block bounces
	 * against rather than the object itself — `border-muted-foreground/20`, the same weight
	 * `ui/circular-progress`'s track uses. The block itself is the mark,
	 * `bg-foreground`.
	 *
	 * THE EASING IS NOT `ease-in-out`, DELIBERATELY: that curve
	 * is slow at the floor AND slow at the apex, which is not how anything falls: gravity means a
	 * body is fastest where it leaves the ground and slowest at the top. So the rise takes
	 * `--ease-loader-swing-out` and the fall takes `--ease-loader-swing-in` — the quarter-cosine pair
	 * in `src/app.css` that `loader-newtons-cradle.svelte` established for physical motion. They are
	 * declared per keyframe, which governs the interval STARTING at that keyframe, and the
	 * element-level function is `linear` so that every override is visible rather than fighting an
	 * inherited curve. It also fixes the squash: the block now leaves the floor at speed, so the flat
	 * pose is a moment of impact rather than a pause.
	 *
	 * `translateY` AND `scale` MERGE ONTO ONE TRANSFORM. `y`, `scaleY` and `scaleX` are three
	 * conceptually separate motions; CSS has one `transform` property, and the order here —
	 * translate, then
	 * scale — makes the block scale about `origin-bottom` in its own
	 * frame and then travel.
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
	data-loader="elastic-square"
	{role}
	aria-label={ariaLabel}
	class={cn(
		"flex size-12 items-end justify-center border-b-2 border-muted-foreground/20",
		className,
	)}
>
	<span class="square size-6 origin-bottom rounded-sm bg-foreground"></span>
</div>

<style>
	@keyframes loader-elastic-square-bounce {
		0% {
			transform: translateY(0) scaleX(1.3) scaleY(0.7);
			animation-timing-function: var(--ease-loader-swing-out);
		}
		50% {
			transform: translateY(-20px) scaleX(0.8) scaleY(1.2);
			animation-timing-function: var(--ease-loader-swing-in);
		}
		100% {
			transform: translateY(0) scaleX(1.3) scaleY(0.7);
		}
	}

	.square {
		/* The rest state: squashed flat on the floor, which is where this object sits when nothing is
		   pushing it — `loader-newtons-cradle.svelte`'s reasoning. A block frozen in mid-air would
		   read as a bug rather than as a paused animation. */
		transform: translateY(0) scaleX(1.3) scaleY(0.7);

		/* `linear` at the element level so the two per-keyframe overrides above are the only curves in
		   play. */
		animation: loader-elastic-square-bounce 0.8s linear infinite;
	}
</style>
