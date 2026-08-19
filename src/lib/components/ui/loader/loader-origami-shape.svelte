<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two paper squares hinged at opposite edges, folding over and back.
	 *
	 * THE HINGE IS THE WHOLE TRICK. Each panel rotates about the Y axis with its `transform-origin`
	 * on the edge it shares with the middle of the box — `origin-right` for the top-left panel,
	 * `origin-left` for the bottom-right one — so each sweeps across the
	 * empty half of the square rather than spinning in place. `origin-*` is a Tailwind utility here
	 * and the animated `transform` is in the block below; they are different properties, so nothing
	 * fights.
	 *
	 * THE SECOND PANEL IS THE QUIET MARK,
	 * `bg-muted-foreground`, against the first panel's `bg-foreground` — one semantic token per
	 * panel, each carrying both themes, where a hand-picked shade pair could quietly break in one
	 * of them.
	 *
	 * NO `perspective` AND NO `transform-style: preserve-3d`. CSS adds neither
	 * implicitly, so the panels foreshorten flat — which is the intended picture.
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
	data-loader="origami-shape"
	{role}
	aria-label={ariaLabel}
	class={cn("relative size-10", className)}
>
	<span class="panel absolute top-0 left-0 size-5 origin-right rounded-tl-md bg-foreground"></span>
	<span class="panel absolute right-0 bottom-0 size-5 origin-left rounded-br-md bg-muted-foreground"
	></span>
</div>

<style>
	@keyframes loader-origami-shape-fold {
		0%,
		100% {
			transform: rotateY(0deg);
		}
		50% {
			transform: rotateY(180deg);
		}
	}

	.panel {
		/* The rest state: both panels lying flat in their own corners, which is the sheet before
		   anybody folds it. `[0, 180, 0]` starts and ends on the same value, so the keyframes declare
		   this pose at both ends of the cycle and it never shows while the animation runs.

		   The two panels share one keyframe and one rest pose on purpose — they differ by their
		   hinge, not by their phase, so there is no half-cycle delay here that reduced motion could
		   collapse into a single stacked panel. */
		transform: rotateY(0deg);

		/* `ease-in-out` is the CSS keyword: the CSS keyword, cubic-bezier(0.42, 0, 0.58, 1),
		   not Tailwind's `--ease-in-out`. */
		animation: loader-origami-shape-fold 2s ease-in-out infinite;
	}
</style>
