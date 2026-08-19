<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two dashed rings overlapping at the rim and turning in opposite directions, which reads as a
	 * pair of meshed gears.
	 *
	 * THE TEETH ARE A DASHED BORDER. There is no gear path anywhere — `border-dashed` on a
	 * `rounded-full` box gives the browser's own dash pattern round the circle, and that is the whole
	 * illustration. It also means there is nothing to normalise: the dash count is the browser's
	 * business, not a hand-computed number.
	 *
	 * THE OVERLAP IS A NEGATIVE MARGIN, NOT A NEGATIVE GAP.
	 * `CONVENTIONS.md`-style flex spacing is `gap-*`, but `gap` cannot go negative, so the honest
	 * spelling of a negative overlap is the margin `space-x-[-4px]` was always shorthand for: `-ml-1` on the
	 * small gear. Overlapping the two rims is the point — spaced apart they stop looking meshed.
	 *
	 * TOKENS. `border-zinc-800 dark:border-zinc-700` is an opaque ink ring, i.e. the visible object,
	 * so it is `border-foreground` and not `border-border`; `border-zinc-500` on the small gear is a
	 * deliberately quieter ring and takes `border-muted-foreground`. The two weights
	 * are what gives the pair its sense of depth.
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
	data-loader="gears"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-fit", className)}
>
	<span class="gear gear-large size-8 rounded-full border-4 border-dashed border-foreground"></span>
	<span
		class="gear gear-small mt-3 -ml-1 size-6 rounded-full border-[3px] border-dashed border-muted-foreground"
	></span>
</div>

<style>
	/* `rotate: 360` over 4s linear and `rotate: -360` over 3s linear. The mismatched periods are
	   what stop the pair from looking like one rigid object turning. */
	@keyframes loader-gears-turn {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes loader-gears-counter-turn {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(-360deg);
		}
	}

	.gear {
		/* The rest state is the shape as drawn. The turn is constant-speed and the ring has no
		   beginning or end, so no angle in the cycle is more "caught mid-turn" than another and 0°
		   is as true a frame as any. (The dashes themselves are NOT evenly spaced: a browser dashes
		   each of the four border sides separately, so a `rounded-full` dashed border joins at the
		   diagonals with dashes of slightly different lengths — which is fine, because
		   it is what makes the rotation visible at all.) */
		transform: rotate(0deg);

		animation-timing-function: linear;
		animation-iteration-count: infinite;
	}

	.gear-large {
		animation-name: loader-gears-turn;
		animation-duration: 4s;
	}

	.gear-small {
		animation-name: loader-gears-counter-turn;
		animation-duration: 3s;
	}
</style>
