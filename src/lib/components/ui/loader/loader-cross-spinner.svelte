<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A thick plus sign that turns a quarter at a time, easing into and out of every step.
	 *
	 * THE ROTATION LIVES ON AN INNER WRAPPER, NOT THE ROOT. The
	 * root is the element carrying a caller's `class`, the a11y
	 * pair and `data-slot="loader"`, and the shared reduced-motion rule in `src/app.css` claims the
	 * root's own `animation` with `!important` to pulse it. Keeping our transform one level in means
	 * the two never contend for the same property.
	 *
	 * WHY THE FIVE-STOP KEYFRAME IS NOT ONE 360° SWEEP. `rotate: [0, 90, 180, 270, 360]` with
	 * `easeInOut` applies the easing to each of the four intervals, not to
	 * the whole turn, so the cross accelerates and settles four times per cycle. Collapsing it to a
	 * single `from`/`to` would give a smooth continuous spin, which is a different animation.
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
	data-loader="cross-spinner"
	{role}
	aria-label={ariaLabel}
	class={cn("size-8", className)}
>
	<div class="cross relative flex size-full items-center justify-center">
		<!-- `bg-zinc-800 dark:bg-white` is the primary mark, so `bg-foreground` on the light shade. -->
		<span class="absolute h-1.5 w-full rounded-full bg-foreground"></span>
		<span class="absolute h-full w-1.5 rounded-full bg-foreground"></span>
	</div>
</div>

<style>
	@keyframes loader-cross-spinner-step {
		0% {
			transform: rotate(0deg);
		}
		25% {
			transform: rotate(90deg);
		}
		50% {
			transform: rotate(180deg);
		}
		75% {
			transform: rotate(270deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.cross {
		/* The rest state is the cross as drawn, and that is not a compromise: a plus sign has 90°
		   rotational symmetry, so all five keyframe stops are literally the same
		   picture. Freezing on any of them freezes on a real frame of the loop. */
		transform: rotate(0deg);

		/* `ease-in-out` here is the CSS keyword — cubic-bezier(0.42, 0, 0.58, 1) —
		   not Tailwind's Material-tuned `--ease-in-out`. */
		animation: loader-cross-spinner-step 2s ease-in-out infinite;
	}
</style>
