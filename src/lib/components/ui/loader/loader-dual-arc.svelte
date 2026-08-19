<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two opposing arcs that spin steadily while the whole ring breathes in and out.
	 *
	 * TWO TRANSFORMS, TWO ELEMENTS — and the split is structural. The design wants
	 * two independently-eased motions: `rotate` on 1.2s `linear` and
	 * `scale` on 1.2s `ease-in-out`. CSS
	 * has a single `transform` property, so two animations on one element would overwrite each other
	 * rather than compose, and merging them into one keyframe set would force one shared easing and
	 * lose the difference being deliberately bought — a constant-speed turn with a soft pulse over
	 * it. So the outer box owns the linear rotation and the inner box, which carries the border, owns
	 * the eased scale. Nested transforms multiply, which is the composition wanted.
	 *
	 * THE ARCS ARE FOUR BORDER SIDES, NOT A PATH. Top and bottom are solid ink and the sides are
	 * transparent, so `border-t-foreground` / `border-b-foreground` —
	 * an opaque ink ring is a mark, so `foreground`
	 * rather than `border`. `transparent` stays literal; it carries no theme meaning.
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
	data-loader="dual-arc"
	{role}
	aria-label={ariaLabel}
	class={cn("relative size-8", className)}
>
	<div class="spin absolute inset-0">
		<div
			class="arc size-full rounded-full border-2 border-t-foreground border-r-transparent border-b-foreground border-l-transparent"
		></div>
	</div>
</div>

<style>
	@keyframes loader-dual-arc-rotate {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* `scale: [1, 0.82, 1]` over three equal intervals — starts and ends on the same value, so it is
	   written as a `0%, 100%` pair with the excursion at the midpoint. */
	@keyframes loader-dual-arc-breathe {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(0.82);
		}
	}

	.spin {
		/* The rest state: the arcs at the top and bottom, where they are drawn. A pair of opposing
		   arcs has 180° symmetry and the turn is constant-speed, so no angle is more mid-motion than
		   another. */
		transform: rotate(0deg);

		animation: loader-dual-arc-rotate 1.2s linear infinite;
	}

	.arc {
		/* The rest state: full size, i.e. both ends of the breath. */
		transform: scale(1);

		animation: loader-dual-arc-breathe 1.2s ease-in-out infinite;
	}
</style>
