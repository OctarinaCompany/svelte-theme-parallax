<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two triangles, tip to tip, turned over twice a cycle.
	 *
	 * THE SHAPE IS TWO CSS BORDER TRIANGLES, which is why the geometry looks odd written out. Each
	 * half is a zero-height box with a 16px coloured border on one side and 16px transparent borders
	 * left and right; the coloured border collapses into a triangle 32px across and 16px tall. `w-8`
	 * is the whole 32px including those side borders, because Tailwind's preflight makes every box
	 * `border-box`. `transparent` is not a colour with theme meaning here — it is the absence of two
	 * of the four borders — so it stays a keyword and no token applies.
	 *
	 * FIVE ROTATION STOPS, FOUR EQUAL INTERVALS: `[0, 180, 180, 360, 360]` with
	 * no `times:`, so the glass turns over during the first quarter, stands still for the second,
	 * turns again in the third and stands still in the fourth. The pauses are the loader — an
	 * hourglass that never stopped would just be a spinner.
	 *
	 * The two halves carry no `origin-bottom` / `origin-top`: nothing transforms
	 * either half on its own, so both would be dead classes. The rotation belongs to the wrapper,
	 * whose origin is its centre — the waist of the glass.
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
	data-loader="hourglass"
	{role}
	aria-label={ariaLabel}
	class={cn("h-10 w-8", className)}
>
	<div class="glass flex size-full flex-col items-center justify-between">
		<!-- `border-t-zinc-800 dark:border-t-white` → `border-t-foreground`, and likewise below. -->
		<span
			class="h-0 w-8 border-t-[16px] border-r-[16px] border-l-[16px] border-t-foreground border-r-transparent border-l-transparent"
		></span>
		<span
			class="h-0 w-8 border-r-[16px] border-b-[16px] border-l-[16px] border-r-transparent border-b-foreground border-l-transparent"
		></span>
	</div>
</div>

<style>
	@keyframes loader-hourglass-turn {
		0% {
			transform: rotate(0deg);
		}
		25% {
			transform: rotate(180deg);
		}
		50% {
			transform: rotate(180deg);
		}
		75% {
			transform: rotate(360deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.glass {
		/* The rest state: the glass standing upright, which is what an hourglass at rest is and also
		   half of what this animation spends its time doing — two of the four intervals are a
		   deliberate pause. Freezing it part-way through a turn would read as a shape lying on its
		   side. */
		transform: rotate(0deg);

		animation: loader-hourglass-turn 3s ease-in-out infinite;
	}
</style>
