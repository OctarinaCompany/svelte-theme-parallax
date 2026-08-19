<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A clock face whose two hands sweep at different speeds.
	 *
	 * Decisions worth naming:
	 * - `border-zinc-800 dark:border-zinc-700` is an opaque ink ring at full opacity — it is the
	 *   visible object of the loader, not a hairline — so it takes `border-foreground`. A hairline
	 *   token here would paint a near-invisible circle and the loader would read as two loose bars.
	 * - `bg-zinc-800 dark:bg-white` on the hands is `bg-foreground`, same ink as the ring.
	 * - The hands' anchor is the utility `bottom-1/2`, not an inline style; the value is on the
	 *   utility scale, so there is no reason to reach past it.
	 *
	 * The hands set no horizontal offset on purpose. They are `absolute` inside a flex container that
	 * centres its children, and an absolutely positioned child's static-position rectangle is the
	 * ALIGNED one — so each hand lands horizontally centred with no `left` of its own, and
	 * `origin-bottom` + `bottom-1/2` puts its pivot exactly on the centre of the circle. It looks
	 * like an omission and it is not; adding a `left` would break it.
	 *
	 * There is no `animation-delay` here: both hands start at
	 * 0° on the first painted frame, which is already the steady state, so there is nothing to
	 * un-wind.
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
	data-loader="clock-spinner"
	{role}
	aria-label={ariaLabel}
	class={cn(
		"relative flex size-10 items-center justify-center rounded-full border-2 border-foreground",
		className,
	)}
>
	<span
		class="hand hand-fast absolute bottom-1/2 h-3.5 w-0.5 origin-bottom rounded-full bg-foreground"
	></span>
	<span
		class="hand hand-slow absolute bottom-1/2 h-2.5 w-0.5 origin-bottom rounded-full bg-foreground"
	></span>
</div>

<style>
	@keyframes loader-clock-spinner-sweep {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.hand {
		/* The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		   animation but does not choose what it stops on). A clock has a real resting pose — any
		   time it can show — so it freezes as a clock rather than mid-sweep. NOT both hands at 0°,
		   which is where the first painted frame puts them: the hands share a pivot and a width, so
		   at 0° the short one disappears entirely behind the long one and a two-handed clock reads
		   as a one-handed one. Quarter past keeps both visible and is still a clock.
		   Never seen while the animation runs, because the keyframes declare `transform` at both
		   ends. */
		transform: rotate(var(--rest-angle));
		animation: loader-clock-spinner-sweep var(--duration) linear infinite;
	}

	/* The two hands' speeds. Named classes rather than an
	   `:nth-of-type` chain, so the compiler's unused-selector pass can see them used. */
	.hand-fast {
		--duration: 2s;
		--rest-angle: 90deg;
	}

	.hand-slow {
		--duration: 12s;
		--rest-angle: 0deg;
	}
</style>
