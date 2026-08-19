<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two bars parked at the top and bottom of a small square, sliding past each other and back.
	 *
	 *
	 * TWO WEIGHTS OF INK, WHICH IS THE WHOLE READ OF THIS LOADER. The upper bar is
	 * `bg-foreground` and the lower one `bg-muted-foreground`, so one leads and
	 * one trails — a relationship the two tokens keep in both themes without a `dark:` override.
	 * The quiet bar really is
	 * faint on the light page ground — that is a decision the token map
	 * owns for the whole catalogue, not something to fix in one file.
	 *
	 * THE TWO ENDPOINTS ARE PER-BAR CUSTOM PROPERTIES, NOT A HALF-CYCLE DELAY. Both bars start and end
	 * a cycle at `translateY(0)` — the two travels, 0 → 24px → 0 and 0 → -24px → 0,
	 * are in phase with each other and differ only in the SIGN of the
	 * excursion, so what makes them pass rather than travel together is the sign, not an offset. A
	 * shared keyframe plus a half-cycle delay would look like the same trick and is not: it would put
	 * the trailing bar at `translateY(+24px)` on the first painted frame, which from `bottom-0` is
	 * 24px below the floor of the box.
	 *
	 * The rest state falls out of the same shape and is worth stating: reduced motion freezes both
	 * bars at their base `translateY(0)`, i.e. at the `top-0` / `bottom-0` they are laid out on, which
	 * is this pair at opposite ends of the box rather than stacked in the middle.
	 * `ui/loader/loader-liquid-dots.svelte` carries per-element `--from` / `--to` through one keyframe
	 * the same way, for its own reason.
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
	data-loader="sliding-bars"
	{role}
	aria-label={ariaLabel}
	class={cn("relative size-8", className)}
>
	<span class="bar bar-lead absolute top-0 left-0 h-1.5 w-8 rounded-full bg-foreground"></span>
	<span class="bar bar-trail absolute bottom-0 left-0 h-1.5 w-8 rounded-full bg-muted-foreground"
	></span>
</div>

<style>
	/* The two travels over three equal intervals — evenly spaced
	   stops, both starting and ending on 0, which is why 0% and
	   100% share a selector. `var()` inside a keyframe is substituted against the animated element,
	   so one set of stops serves both directions. */
	@keyframes loader-sliding-bars-slide {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(var(--travel));
		}
	}

	.bar {
		transform: translateY(0); /* the rest state: each bar parked at its own end of the box */
		animation: loader-sliding-bars-slide 1.5s ease-in-out infinite;
	}

	.bar-lead {
		--travel: 24px;
	}

	.bar-trail {
		--travel: -24px;
	}
</style>
