<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two graded rings tumbling on different axes inside a shared perspective, so they read as one
	 * gyroscope rather than two spinners.
	 *
	 * THE PERSPECTIVE IS LOAD-BEARING. The wrapper carries
	 * `perspective-[800px]`; without it `rotateX`/`rotateY` project orthographically
	 * and the rings simply squash rather than tumbling. Nothing else 3-D is declared —
	 * no `transform-style` — because CSS
	 * implies none.
	 *
	 * NO `transform-style: preserve-3d`, DELIBERATELY.
	 * `transform-style` decides whether an element's CHILDREN are flattened into its plane, and these
	 * two rings have no children at all, so the declaration could not affect anything —
	 * it would be dead code.
	 *
	 * THE BORDER GRADE IS THE PICTURE. Each ring paints one side solid, the next at 30%, the next at
	 * 10% and the fourth fully transparent, which is what makes a plain circle look like a band
	 * fading away round the back. The solid side is ink,
	 * not a hairline, so it takes `border-foreground`, and the two faded sides are
	 * alphas of the same token. `border-l-transparent` stays literal: transparent
	 * carries no theme meaning.
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
	data-loader="intersecting-rings"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex size-12 items-center justify-center perspective-[800px]", className)}
>
	<!--
		Both rings are absolutely positioned inside a centring flex container, which centres them: the
		static-position rectangle an `absolute` box falls back to is the aligned one. Deliberate,
		not a mistake.
	-->
	<span
		class="tumbler tumbler-a absolute size-10 rounded-full border-2 border-t-foreground border-r-foreground/30 border-b-foreground/10 border-l-transparent"
	></span>
	<span
		class="tumbler tumbler-b absolute size-10 rounded-full border-2 border-t-foreground/30 border-r-transparent border-b-foreground border-l-foreground/10"
	></span>
</div>

<style>
	/* One ring tumbles `rotateX: 360, rotateY: 180` and the other `rotateX: 180, rotateY: 360`,
	   over the same 2.2s linear loop, both starting from 0. CSS has a single
	   `transform` property, so the two axes are written as one function list per stop — animating
	   them as two separate animations would let them drift apart. */
	@keyframes loader-intersecting-rings-a {
		from {
			transform: rotateX(0deg) rotateY(0deg);
		}
		to {
			transform: rotateX(360deg) rotateY(180deg);
		}
	}

	@keyframes loader-intersecting-rings-b {
		from {
			transform: rotateX(0deg) rotateY(0deg);
		}
		to {
			transform: rotateX(180deg) rotateY(360deg);
		}
	}

	.tumbler {
		animation-duration: 2.2s;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
	}

	/* The rest states are both real frames of the loop — one eighth of the way in, where ring A has
	   turned 45°/22.5° and ring B 22.5°/45°. That is the pose the name promises: two ellipses of
	   different aspect crossing each other. Freezing both at 0° would stack two identical circles and
	   read as a single static ring. */
	.tumbler-a {
		transform: rotateX(45deg) rotateY(22.5deg);
		animation-name: loader-intersecting-rings-a;
	}

	.tumbler-b {
		transform: rotateX(22.5deg) rotateY(45deg);
		animation-name: loader-intersecting-rings-b;
	}
</style>
