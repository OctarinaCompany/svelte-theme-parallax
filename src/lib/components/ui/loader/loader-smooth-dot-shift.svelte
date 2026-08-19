<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * One lit dot sliding along three unlit stations and back.
	 *
	 * THE THREE STATIONS ARE A TRACK, NOT MARKS — the token map's "unlit track behind a mark"
	 * row, so they take
	 * `bg-muted-foreground/20` — the same weight `ui/circular-progress` already gives its
	 * track (`circular-progress-track.svelte:42`). Not `bg-muted`, which is what the flat
	 * `ui/progress` bar uses (`progress.svelte:18`): that is a filled surface behind a bar, and these
	 * three are separate marks on the page ground. The travelling dot is the mark and takes
	 * `bg-foreground`.
	 *
	 * THE 18px SPACING STAYS AN ARBITRARY VALUE. It is geometry, not colour, and it has to agree
	 * exactly with the keyframe stops below — 0, 18px, 36px — or the dot lands between stations
	 * rather than on one. The root is 48px wide and the dot 12px, so 36 + 12 = 48 fills it exactly.
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
	data-loader="smooth-dot-shift"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex h-3 w-12 items-center", className)}
>
	<!--
		The runner's static position in this flex row is already the
		content-box origin; stating `left-0` says the same thing without depending on the reader
		knowing that rule. `z-10` keeps the lit dot over the station it is sitting on.
	-->
	<span class="runner absolute left-0 z-10 size-3 rounded-full bg-foreground"></span>

	<span class="absolute left-0 size-3 rounded-full bg-muted-foreground/20"></span>
	<span class="absolute left-[18px] size-3 rounded-full bg-muted-foreground/20"></span>
	<span class="absolute left-[36px] size-3 rounded-full bg-muted-foreground/20"></span>
</div>

<style>
	/* The travel: 0 → 18px → 36px → 18px → 0 — five values, equal intervals, so the stops are 0%, 25%,
	   50%, 75%, 100%. The array is a palindrome, so the run out and the run back share stops and the
	   loop point is seamless. */
	@keyframes loader-smooth-dot-shift-travel {
		0%,
		100% {
			transform: translateX(0);
		}
		25%,
		75% {
			transform: translateX(18px);
		}
		50% {
			transform: translateX(36px);
		}
	}

	.runner {
		/* The rest state, and what reduced motion leaves on screen: the dot parked on the middle
		   station, which is a real frame of its own animation and reads as a run in progress. Parking
		   it on the first station instead would look like a row of three dots with the left one
		   highlighted — a stepper, not a loader. */
		transform: translateX(18px);

		/* `ease-in-out` is the bare CSS keyword, cubic-bezier(0.42, 0, 0.58, 1). */
		animation: loader-smooth-dot-shift-travel 2s ease-in-out infinite;
	}
</style>
