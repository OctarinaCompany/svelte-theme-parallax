<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two dots that lean into each other and merge into one blob.
	 *
	 * THE FILTER ID IS PER INSTANCE, NEVER A HARDCODED `id="goo"` — this loader and
	 * `loader-liquid-dots.svelte` both carry a goo filter, with a different
	 * blur radius (2 vs 4), a different alpha row and a different final compositing primitive
	 * (`feComposite operator="atop"` vs `feBlend`). An `id` is document-wide: render both loaders on
	 * one page — which the gallery does by construction — and every `filter: url(#goo)` on that page
	 * resolves to whichever `<filter>` the browser parsed first, so one of the two silently wears the
	 * other's filter with nothing in the console to say so. `$props.id()` is the house answer
	 * (`ui/circular-progress`, `ui/autocomplete`, `ui/chart` all use it) and yields a plain `c1`-style
	 * token, safe inside `url(#…)` without escaping. `loader-liquid-dots.svelte` carries the same fix.
	 *
	 * THE FILTER IS ON AN INNER WRAPPER, not on the root. The root is the element
	 * a caller's `class` and this loader's a11y attributes land on; a `filter` establishes a
	 * containing block and a stacking context, which does not belong in that contract, and moving it
	 * inward also lets the `<svg>` holding the definition sit outside the subtree the filter applies
	 * to.
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
	data-loader="magnetic-dots"
	{role}
	aria-label={ariaLabel}
	class={cn("relative w-fit", className)}
>
	<!--
		The gaussian blur widens each dot's alpha, and the colour matrix's alpha row (`0 0 0 15 -7`)
		multiplies that soft alpha by 15 and shifts it down by 7 — a steep contrast curve that snaps
		the blur back to a hard edge everywhere except where two blurs overlap, which is what lets the
		pair bridge into one body as they close. `feComposite operator="atop"` then paints the original
		dots back over that body. All of it is geometry
		and alpha, so this theme has no opinion on any of it.

		`size-0` and `absolute` because the element exists only to hold the definition — nothing in it
		renders, and it must not contribute to the root's `w-fit` width. The root carries `relative`
		so this one stays anchored inside the component instead of resolving against whatever
		positioned ancestor the page happens to provide; `loader-liquid-dots.svelte` gets the same
		containing block out of the geometry its root already states.
	-->
	<svg class="absolute size-0" aria-hidden="true">
		<defs>
			<filter id={filterId}>
				<feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
				<feColorMatrix
					in="blur"
					mode="matrix"
					values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 15 -7"
					result="goo"
				/>
				<feComposite in="SourceGraphic" in2="goo" operator="atop" />
			</filter>
		</defs>
	</svg>

	<!-- `flex gap-1.5`, per this repo's layout rules. -->
	<div class="flex gap-1.5" style:filter={`url(#${filterId})`}>
		<span class="dot dot-left size-4 rounded-full bg-foreground"></span>
		<span class="dot dot-right size-4 rounded-full bg-foreground"></span>
	</div>
</div>

<style>
	/* One keyframe for both dots, with the endpoint coming from the element: they run the same
	   motion, in opposite directions, in phase. `var()` inside `@keyframes` is substituted against
	   the animated element, the same mechanism `loader-liquid-dots.svelte` uses. The travel is
	   0 → ±8px → 0 — three values, equal intervals, so the meeting point is at 50%. */
	@keyframes loader-magnetic-dots-attract {
		0%,
		100% {
			transform: translateX(0);
		}
		50% {
			transform: translateX(var(--to));
		}
	}

	.dot {
		/* The rest state, and what reduced motion leaves on screen: the two dots apart, which is what
		   this pair looks like when nothing is pulling them together. Both share it, so unlike
		   `loader-liquid-dots.svelte` there is no risk of the pair stacking. */
		transform: translateX(0);

		/* `ease-in-out` is the bare CSS keyword, cubic-bezier(0.42, 0, 0.58, 1). */
		animation: loader-magnetic-dots-attract 1.5s ease-in-out infinite;
	}

	/* The endpoints are fixed constants, so they live here rather than riding in on the markup. The
	   6px gap plus 8px of travel each means the pair overlap by 10px at the meeting point, which is
	   what gives the filter something to bridge. */
	.dot-left {
		--to: 8px;
	}

	.dot-right {
		--to: -8px;
	}
</style>
