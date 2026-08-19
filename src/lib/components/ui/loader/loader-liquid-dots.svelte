<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two dots that swap places and merge into one blob as they pass.
	 *
	 * THE FILTER ID IS PER INSTANCE, NEVER A HARDCODED `id="goo"` — this loader and
	 * `loader-magnetic-dots.svelte` both carry a goo filter, with a different
	 * blur radius and a different final compositing operator. An `id` is document-wide: render both
	 * loaders on one page — which the gallery does by construction — and every `filter: url(#goo)`
	 * on that page resolves to whichever `<filter>` the browser parsed first. Magnetic Dots would
	 * silently wear Liquid Dots' filter, with nothing in the console to say so. `$props.id()` is the
	 * house answer (`ui/circular-progress`, `ui/autocomplete`, `ui/chart` all use it) and it yields a
	 * plain `c1`-style token, safe inside `url(#…)` without escaping.
	 *
	 * THE FILTER IS ON AN INNER WRAPPER, not on the root. The root is the element
	 * this component's a11y attributes and a caller's `class` land on; wrapping the filtered layer
	 * keeps a `filter` — which establishes a containing block and a stacking context — out of that
	 * contract, and lets the `<svg>` holding the filter definition sit outside the subtree the
	 * filter applies to.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const uid = $props.id();
	const filterId = `${uid}-goo`;
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="liquid-dots"
	{role}
	aria-label={ariaLabel}
	class={cn("relative h-8 w-16", className)}
>
	<!--
		The gaussian blur widens each dot's alpha, and the colour matrix's alpha row (`0 0 0 18 -7`)
		multiplies that soft alpha by 18 and shifts it down by 7 — a steep contrast curve that snaps
		the blur back to a hard edge everywhere except where two blurs overlap, which is what makes
		the pair look like one liquid body as they cross. All four numbers are geometry and alpha,
		so this theme has no opinion on them.

		`size-0` because the element exists only to hold the definition — nothing in it renders.
	-->
	<svg class="absolute size-0" aria-hidden="true">
		<defs>
			<filter id={filterId}>
				<feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
				<feColorMatrix
					in="blur"
					mode="matrix"
					values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
					result="goo"
				/>
				<feBlend in="SourceGraphic" in2="goo" />
			</filter>
		</defs>
	</svg>

	<!--
		The dots are `absolute` inside a centring flex container, which looks contradictory and is
		not: an absolutely positioned child with `auto` offsets resolves to its static position, and
		in a flex container that rectangle is the one `items-center justify-center` produces. So the
		pair start centred and the keyframes below move them from there.
	-->
	<div class="absolute inset-0 flex items-center justify-center" style:filter={`url(#${filterId})`}>
		<span class="dot dot-left absolute size-6 rounded-full bg-foreground"></span>
		<span class="dot dot-right absolute size-6 rounded-full bg-foreground"></span>
	</div>
</div>

<style>
	/* One keyframe for both dots. The endpoints come from the element rather than from the keyframe,
	   because the two dots run the same motion out of phase AND rest in different places — a shared
	   keyframe plus a negative delay would give them the same rest position, and under reduced
	   motion they would stack into a single dot. `var()` inside `@keyframes` is substituted against
	   the animated element, the same mechanism the marquee keyframes in `src/app.css` use for
	   `--marquee-gap`. */
	@keyframes loader-liquid-dots-swap {
		0%,
		100% {
			transform: translateX(var(--from));
		}
		50% {
			transform: translateX(var(--to));
		}
	}

	.dot {
		/* The rest state, and what reduced motion leaves on screen: the two dots parked one rem
		   either side of centre — the pose the pair dwell on, because `ease-in-out` is slowest at
		   the ends of the swap.

		   THEY FREEZE AS TWO DOTS, NOT AS ONE MERGED BODY, and the comment used to claim otherwise.
		   At one rem the 24px dots leave an 8px gap, and the filter above bridges nothing at that
		   distance: it is a 4px blur pushed through a steep alpha curve, so the two alphas have to
		   come within about 3px of each other before the curve joins them. Measured at 4x in Chrome,
		   the frozen pair are two separate circles with clean ground between them. That is still the
		   right frame — a pair of dots either side of centre is what this loader is between merges,
		   and the only offsets that DO merge sit within a few pixels of the crossing, where the two
		   dots are nearly on top of each other and read as one blob rather than as a pair. The
		   endpoints differ per dot, which is the other half of the point: a shared rest state plus a
		   half-cycle delay would stack them into a single dot. */
		transform: translateX(var(--from));

		/* `ease-in-out` is the bare CSS keyword, cubic-bezier(0.42, 0, 0.58, 1). */
		animation: loader-liquid-dots-swap 2s ease-in-out infinite;
	}

	/* The endpoints are fixed, so they are written here rather than passed in from the markup. The
	   inline `style:--index` form belongs to loaders whose per-element value comes from data — the
	   twelve ticks in `loader-classic-spinner.svelte`. Two named classes cannot be pruned by the
	   compiler's unused-selector pass the way an `:nth-of-type` chain might. */
	.dot-left {
		--from: -1rem;
		--to: 1rem;
	}

	.dot-right {
		--from: 1rem;
		--to: -1rem;
	}
</style>
