<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A diamond that stretches along one diagonal and flattens along the other, like a drop of liquid
	 * being pulled.
	 *
	 * THE ORDER OF THE TRANSFORM FUNCTIONS IS THE WHOLE PICTURE, and it is the one thing here that is
	 * easy to get backwards. The tilt is static and the stretch animates over it, in an order
	 * that puts the scales BEFORE the rotation:
	 * `scaleX(…) scaleY(…) rotate(45deg)`. In CSS the RIGHTMOST function is
	 * the one applied to the shape first, so that string means: stand the square on its corner, then
	 * stretch the diamond along the SCREEN axes — it widens and flattens, like a drop being pulled
	 * sideways. Putting `rotate(45deg)` first instead would stretch the square along its own edges
	 * before tilting it, which makes a thin bar leaning at 45° — a different animation, which is why
	 * the order is spelled out here rather than left looking arbitrary.
	 *
	 * `[a, b, a]` starts and ends on the same value, so this is the `0%, 100% { … } 50% { … }` shape
	 * and the loop point is seamless. There is no snap to preserve here.
	 *
	 * THE SHAPE OVERFLOWS ITS ROOT, ON PURPOSE. A 24px square stood on its corner already measures
	 * ~34px across, and the 1.5× stretch takes that to ~52px, against the `size-6`
	 * root. Nothing clips it: the visibility gate in
	 * `src/app.css` sits on the gallery tile, never on `[data-slot="loader"]`, precisely so ports
	 * like this one can spill.
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
	data-loader="fluid-diamond"
	{role}
	aria-label={ariaLabel}
	class={cn("size-6", className)}
>
	<!-- The diamond is the single token `bg-foreground`, which carries both themes. -->
	<span class="diamond block size-full rounded-sm bg-foreground"></span>
</div>

<style>
	/* Scales first, rotation last — in CSS that means the
	   rotation is applied to the shape first and the stretch then runs along the screen axes. */
	@keyframes loader-fluid-diamond-stretch {
		0%,
		100% {
			transform: scaleX(1) scaleY(1) rotate(45deg);
		}
		50% {
			transform: scaleX(1.5) scaleY(0.5) rotate(45deg);
		}
	}

	.diamond {
		/* The rest state: the square stood on its corner and unstretched — the pose the keyframes
		   name at both ends of the cycle. */
		transform: scaleX(1) scaleY(1) rotate(45deg);

		/* `ease-in-out` is the CSS keyword, not Tailwind's `--ease-in-out`. */
		animation: loader-fluid-diamond-stretch 1.5s ease-in-out infinite;
	}
</style>
