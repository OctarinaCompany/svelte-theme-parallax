<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A weight on a rod, swinging from a rail.
	 *
	 * THE EASING IS THE WHOLE TRICK, exactly as in `loader-newtons-cradle.svelte`. A naive
	 * `ease-in-out` over the swing would make the bob
	 * slow at the top AND slow at the bottom — the one thing a pendulum never does. Small-angle
	 * motion is θ = A·cos(ωt): it leaves rest at the top, is fastest at the bottom, and arrives at
	 * rest at the other top. So each fall eases IN on a quarter-cosine and each rise eases OUT on
	 * one, which are `--ease-loader-swing-in` / `--ease-loader-swing-out` in `src/app.css`.
	 *
	 * That needs FOUR intervals where a plain there-and-back has two, because
	 * the physics changes at the BOTTOM, not at the ends: −45° → 0° → +45° → 0° → −45°.
	 * A timing function declared inside a keyframe block governs the interval starting there, so the
	 * element-level one is `linear` and every leg overrides it.
	 *
	 * The rotating wrapper carries no fill of its own: it would paint a 4px
	 * column that the rod and the bob already cover completely, so it would be invisible anyway.
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
	data-loader="pendulum"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex h-12 w-16 items-start justify-center", className)}
>
	<!--
		The rail the pendulum hangs from: a quiet track behind the
		mark rather than a mark itself, so it takes the `/20` weight. `rounded-b-none` keeps its
		underside flat against the swing.
	-->
	<span class="absolute top-0 h-1 w-full rounded-full rounded-b-none bg-muted-foreground/20"></span>

	<!--
		Absolutely positioned with no `left`, inside a `justify-center` flex row: its static position
		is the centred one, so it hangs from the middle of the rail. `origin-top` is what makes this a
		pendulum rather than a spinning stick.
	-->
	<span class="arm absolute top-0 flex w-1 origin-top flex-col items-center">
		<span class="h-8 w-1 bg-foreground"></span>
		<span class="size-4 rounded-full bg-foreground"></span>
	</span>
</div>

<style>
	@keyframes loader-pendulum-swing {
		0% {
			transform: rotate(-45deg);
			animation-timing-function: var(--ease-loader-swing-in); /* falling: gathering speed */
		}
		25% {
			transform: rotate(0deg);
			animation-timing-function: var(--ease-loader-swing-out); /* rising: running out of speed */
		}
		50% {
			transform: rotate(45deg);
			animation-timing-function: var(--ease-loader-swing-in);
		}
		75% {
			transform: rotate(0deg);
			animation-timing-function: var(--ease-loader-swing-out);
		}
		100% {
			transform: rotate(-45deg);
		}
	}

	.arm {
		/* The rest state: hanging straight down, which is what a pendulum at rest is. Freezing it at
		   −45° would leave a weight held out at an angle by nothing, which reads as broken rather
		   than as paused — the same call `loader-newtons-cradle.svelte` makes for its cradle. */
		transform: rotate(0deg);

		/* Overridden at every leg; see the component comment. */
		animation: loader-pendulum-swing 1.5s linear infinite;
	}
</style>
