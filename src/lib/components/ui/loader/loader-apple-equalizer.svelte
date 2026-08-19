<script module lang="ts">
	/**
	 * The cycle and its two height stops: each bar swings 20% → 100% → 20% over 0.8s.
	 *
	 * `HEIGHT_LOW` / `HEIGHT_HIGH` are spelled again as literals in the `@keyframes` block below,
	 * which a `<script module>` const cannot reach. Two spellings of one fact: change one, change
	 * both.
	 */
	const DURATION_S = 0.8;
	const HEIGHT_LOW = 20;
	const HEIGHT_HIGH = 100;

	/**
	 * The stagger is NOT `Math.random() * 0.5`, deliberately. A random delay is not reproducible,
	 * differs on every mount, and differs between the SSR render and hydration, so the server and the
	 * client would draw two different pictures and whichever one hydration kept would win. These four
	 * are chosen by hand from that same 0–0.5s range: uneven enough that the bars never line up,
	 * fixed enough that the loader is the same object every time it mounts.
	 */
	const DELAYS_S = [0, 0.35, 0.15, 0.45];

	const bars = DELAYS_S.map((delay, index) => {
		/**
		 * The frame reduced motion freezes this bar on. The block below shifts every bar back one
		 * whole cycle, so its phase on the first painted frame is `((-delay) mod D) / D`; evaluating
		 * the keyframe triangle there gives 20 / 90 / 50 / 90 percent — a level meter caught
		 * mid-bounce rather than four stubs all sitting at their minimum.
		 *
		 * The triangle is read straight, without the easing applied on top of it: the
		 * still frame only has to be a pose the loader really passes through, and keeping the two
		 * spellings comparable is worth more here than the last few percent of accuracy.
		 */
		const phase = ((DURATION_S - delay) % DURATION_S) / DURATION_S;
		const rise = 1 - 2 * Math.abs(phase - 0.5);

		return {
			index,
			delay,
			height: Number((HEIGHT_LOW + (HEIGHT_HIGH - HEIGHT_LOW) * rise).toFixed(1)),
		};
	});
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Four bars bouncing off a shared baseline, like the level meter on a phone.
	 *
	 * Decisions worth naming:
	 * - The bars are one semantic token, `bg-foreground`, which carries both themes on its own.
	 * - `space-x-1` becomes `flex` + `gap-1`, per `docs/CONVENTIONS.md`.
	 * - The random stagger is pinned to four fixed values — see the module block above.
	 * - An unshifted delay winds up: a positive `animation-delay` holds a bar at its base height until
	 *   it elapses, so the row would visibly assemble itself on mount. Every delay is shifted back one
	 *   whole cycle instead — same phase relationships, no wind-up.
	 *
	 * WHY THIS ANIMATES `height` AND NOT `scaleY()`. A transform is composited and a layout property
	 * is not, so `transform` is the default wherever it is a cheaper spelling of the same picture.
	 * What licenses the exemption here is the DEPTH of the squash, not the radius on its own: a bar is
	 * 6px wide with a 2px `rounded-t-sm` cap, and the floor is 20% of a 32px box, so `scaleY()`
	 * would have to run to 0.2 — flattening that 2px cap to 0.4px and turning the corners into a
	 * chamfer at exactly the moment the bar is shortest. `ui/loader/loader-morphing-bars.svelte` is the
	 * counter-case with the same 2px radius: its floor is 0.5, which is shallow enough that the
	 * corners survive, so it scales. Four bars is a small enough set for the main-thread cost to stay
	 * invisible either way.
	 *
	 * A consequence worth stating out loud: a Svelte scoped rule is unlayered and Tailwind utilities
	 * live in `@layer utilities`, so the `height` below beats an `h-*` class a caller puts on a bar.
	 * These bars are not a caller's to resize — the loader has no `size` prop by design
	 * (`./loader.svelte.ts`) — but the rule is silent, so it is written down.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();
</script>

<!--
	`h-8` is load-bearing twice over: it is what the bars' percentage heights are
	measured against, and `items-end` is what makes them grow upwards off it. `w-fit` because a bare
	block `<div>` stretches to its container and would leave the row pinned to the left of whatever it
	is dropped into.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="apple-equalizer"
	{role}
	aria-label={ariaLabel}
	class={cn("flex h-8 w-fit items-end gap-1", className)}
>
	{#each bars as bar (bar.index)}
		<span
			class="bar w-1.5 rounded-t-sm bg-foreground"
			style:--delay="{bar.delay}s"
			style:--rest="{bar.height}%"
		></span>
	{/each}
</div>

<style>
	/* `height` runs 20% → 100% → 20% over three equal intervals — evenly spaced stops.
	   First and last are the same value, which is why they
	   share a selector. The two literals are `HEIGHT_LOW` / `HEIGHT_HIGH` in the module block, which
	   evaluates this same triangle to pick each bar's rest height. */
	@keyframes loader-apple-equalizer-bounce {
		0%,
		100% {
			height: 20%;
		}
		50% {
			height: 100%;
		}
	}

	.bar {
		--duration: 0.8s;

		/* The rest frame, computed per bar in the module block. Never seen while the animation runs,
		   because the keyframes declare `height` at 0% and at 100%. */
		height: var(--rest);

		/* easeInOutCirc — a snappier start and stop than `ease-in-out`, which is what gives the
		   bars their percussive feel. */
		animation: loader-apple-equalizer-bounce var(--duration) cubic-bezier(0.85, 0, 0.15, 1) infinite;

		/* The stagger delay shifted back one whole cycle: same phase order, no wind-up. */
		animation-delay: calc(var(--delay) - var(--duration));
	}
</style>
