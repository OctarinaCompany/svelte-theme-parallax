<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * An avatar and three text lines pulsing in sequence — a card's shape before its content
	 * arrives.
	 *
	 * EVERY PART IS `bg-muted-foreground/20`, AND `ui/skeleton`'s `bg-muted` WAS TRIED FIRST AND
	 * MEASURED INVISIBLE. `bg-muted` is the obvious choice, because this repo ships `ui/skeleton` as
	 * `animate-pulse rounded-md bg-muted` and these four parts are exactly that object. In this
	 * palette that choice does not survive contact with the page. The gallery
	 * draws every specimen on a `bg-card` tile, and `--muted` (#162b48) is SEVEN levels from `--card`
	 * (#182f4f) in dark. Measured in Chrome on the rendered tile — 16 frames over 5.4s, the loader's
	 * own box — `bg-muted` gave a peak departure from its ground of 7/255 dark, 13/255 light, and
	 * ZERO pixels changing by 6/255 over the whole run: a blank card, while `getAnimations()`
	 * cheerfully reported four running animations with advancing `currentTime`.
	 *
	 * `bg-muted-foreground/20` is the house unlit-track weight, the one `ui/circular-progress`
	 * already paints its track (`circular-progress-track.svelte:42`). Measured the same way it gives
	 * 18/255 dark and 21/255 light, with about a fifth of the loader's box in dark and a quarter in
	 * light now at least 12/255 from the ground (it was none, and a tenth), and the pulse swinging
	 * 9-10/255 instead of 4-6 — the contrast a skeleton needs to read as one (`zinc-200` on white,
	 * for scale, is 27/255). `/30` was measured too and gives 26/255 dark, past that, which is a
	 * louder skeleton than the quiet placeholder this wants to be. The fix is the token, not the
	 * dial. Do not "correct" this back to `bg-muted`: in a palette whose `--muted` and `--card` are
	 * one step apart, matching the house component costs the loader its existence.
	 *
	 * WHAT IS NOT BORROWED FROM `ui/skeleton` IS ITS `animate-pulse`. Tailwind's built-in pulse is
	 * one 2s cycle with no way to phase-shift it, and the stagger IS this loader — four parts
	 * lighting in turn rather than four parts breathing together. So the keyframes and the delays
	 * are local.
	 *
	 * THE FLUID WIDTH IS DELIBERATE. `w-full max-w-[120px]` is the one shape in this family that is
	 * deliberately elastic — a placeholder takes the width of the content it stands in for. The rule
	 * that a loader root must carry its own width is about not letting a fixed picture stretch; it
	 * is not a licence to force a fixed width on the one loader whose job is to be fluid.
	 *
	 * `space-y-2` / `space-x-2` become `flex flex-col gap-2` / `gap-2`, which is the house spelling
	 * everywhere.
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
	data-loader="skeleton-loader"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-full max-w-[120px] flex-col gap-2", className)}
>
	<!-- `--index` is the part's position in the stagger `delay: 0, 0.2, 0.4, 0.6` ladder;
	     the arithmetic stays in the block so the markup carries
	     no magic numbers. -->
	<div class="flex items-center gap-2">
		<span class="part size-8 shrink-0 rounded-full bg-muted-foreground/20" style:--index={0}></span>
		<span class="part h-3 w-full rounded-full bg-muted-foreground/20" style:--index={1}></span>
	</div>
	<span class="part h-2 w-full rounded-full bg-muted-foreground/20" style:--index={2}></span>
	<span class="part h-2 w-4/5 rounded-full bg-muted-foreground/20" style:--index={3}></span>
</div>

<style>
	/* The pulse: `opacity` 0.5 → 1 → 0.5 over 1.5s, ease-in-out — three evenly
	   spaced stops whose ends match, so they share a selector. */
	@keyframes loader-skeleton-loader-pulse {
		0%,
		100% {
			opacity: 0.5;
		}
		50% {
			opacity: 1;
		}
	}

	.part {
		--duration: 1.5s;
		--stagger: 0.2s; /* the four delays are exactly `index * 0.2` in DOM order */

		/* The rest state: a 0.5 → 0.9 ramp down the card rather than four parts at one opacity. It
		   is the keyframe triangle evaluated at each part's phase on the first painted frame —
		   phases 0, 0.867, 0.733 and 0.6 of a cycle peaking at 0.5 put part i exactly `i × 0.2667`
		   of the way up it, and the triangle spans 0.5 to 1, hence `0.5 + i × 0.1333`. The 0.5 and
		   the span are the keyframes' own endpoints written a second way; the two have to agree. */
		opacity: calc(0.5 + var(--index) * 0.1333);

		animation: loader-skeleton-loader-pulse var(--duration) ease-in-out infinite;

		/* The stagger delay shifted back one whole cycle: the phase order is kept, so the ripple
		   still runs top to bottom, and every delay is negative, so the card is already mid-pulse on
		   the first painted frame instead of sitting flat for 600ms while the last line waits. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
