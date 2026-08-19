<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A thick plus sign turning half a turn at a time.
	 *
	 * `animate={{ rotate: 180 }}` IS NOT A KEYFRAME ARRAY. It is a single
	 * target, so Motion runs 0° → 180° and then, because `repeat: Infinity` defaults to
	 * `repeatType: "loop"`, snaps back to 0° and does it again. `from` / `to` with a hard snap at the
	 * loop point is that exactly — and on a plus sign, which is its own image under a half-turn, the
	 * snap is invisible. Writing `alternate` here would give a rocking motion — a different
	 * loader.
	 *
	 * THE ROTATION IS ON AN INNER WRAPPER, not on the root:
	 * the root is the element a caller's `class` and the a11y attributes
	 * land on, and the reduced-motion rule in `src/app.css` puts its own animation on it. Keeping the
	 * two apart means the shared rule never has to fight this file's, and it is the shape
	 * `loader-spring-hexagon.svelte` already uses.
	 *
	 * The two bars are both
	 * `bg-foreground` — one semantic token, carrying both themes.
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
	data-loader="rotating-cross"
	{role}
	aria-label={ariaLabel}
	class={cn("size-8", className)}
>
	<!--
		The bars are `absolute` inside a centring flex container, which is deliberate and looks like a
		mistake: an absolutely positioned child with no inset resolves to its static position, and the
		static position inside `items-center justify-center` is the centred one. So `w-full h-1.5`
		lands as a horizontal bar through the middle and `h-full w-1.5` as a vertical one, without
		either needing a coordinate.
	-->
	<div class="cross relative flex size-full items-center justify-center">
		<span class="absolute h-1.5 w-full rounded-sm bg-foreground"></span>
		<span class="absolute h-full w-1.5 rounded-sm bg-foreground"></span>
	</div>
</div>

<style>
	@keyframes loader-rotating-cross-turn {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(180deg);
		}
	}

	.cross {
		/* The rest state: the cross square-on, which is what this object is when it is not turning —
		   `loader-newtons-cradle.svelte`'s reasoning, not `loader-classic-spinner.svelte`'s. A plus
		   sign frozen at 43° would read as a broken layout rather than as a paused animation. */
		transform: rotate(0deg);

		/* `ease-in-out` is the CSS keyword: the CSS keyword, not Tailwind's `--ease-in-out`. */
		animation: loader-rotating-cross-turn 0.8s ease-in-out infinite;
	}
</style>
