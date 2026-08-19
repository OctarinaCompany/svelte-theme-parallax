<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A strip of dots sliding endlessly leftwards behind a pill-shaped window.
	 *
	 * THE TRAVEL IS 28px OVER 0.875s, NOT A ROUND 32px OVER 1s, AND THAT IS DELIBERATE. The
	 * strip's pitch is a 6px dot plus an 8px gap — 14px. `repeat: Infinity` loops rather than alternates, so
	 * the strip snaps back to its start at the end of every cycle, and a 32px travel is 2.28 pitches:
	 * such a belt visibly jumps 4px once a second, which is the one thing a conveyor must not do.
	 * 28px is exactly two pitches, so the snap lands on an identical picture and the loop is seamless.
	 * The duration then comes down to 28/32 of a second so the belt still runs at 32px per
	 * second — on a seamless loop the cycle LENGTH is invisible and the belt SPEED is not, so the
	 * figure that must hold steady is the one a viewer can actually read.
	 *
	 * The strip is 104px of dots behind a 64px window, so there is always more of it than the window
	 * can show, on both sides of the travel.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const dots = Array.from({ length: 8 }, (_, index) => index);
</script>

<!--
	`bg-zinc-200 dark:bg-zinc-800` is an unlit track sitting behind a mark, so it takes the unlit
	weight `bg-muted-foreground/20` — the same weight `ui/circular-progress` gives its own track
	(`circular-progress-track.svelte:42`). Not `ui/progress`'s `bg-muted`: that is the filled ground
	of a determinate bar, and this belt is read against its track rather than filling it.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="conveyor-loop"
	{role}
	aria-label={ariaLabel}
	class={cn("relative h-3 w-16 overflow-hidden rounded-full bg-muted-foreground/20", className)}
>
	<div class="strip absolute top-0 flex h-full items-center gap-2">
		{#each dots as index (index)}
			<!-- `bg-zinc-800 dark:bg-white` is the primary mark: map on the light-mode shade and drop
			     the `dark:` half, because `--foreground` already carries both themes. -->
			<span class="size-1.5 shrink-0 rounded-full bg-foreground"></span>
		{/each}
	</div>
</div>

<style>
	/* A `from`/`to` slide with a
	   hard snap at the loop point rather than a there-and-back. The distance is
	   a whole number of 14px pitches (see the note above), which is what makes the snap
	   invisible. `linear`, because a belt does not accelerate. */
	@keyframes loader-conveyor-loop-run {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-28px);
		}
	}

	.strip {
		/* The rest state: one whole dot-pitch in, i.e. the belt caught mid-run. Because the loop is
		   seamless every offset shows the same picture, so this is purely about not freezing on the
		   frame that also happens to be frame 0. */
		transform: translateX(-14px);

		/* 28px ÷ 0.875s keeps the belt at exactly 32px per second. */
		animation: loader-conveyor-loop-run 0.875s linear infinite;
	}
</style>
