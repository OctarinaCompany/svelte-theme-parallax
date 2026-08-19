<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A solid core dot sitting on a halo that breathes in and out.
	 *
	 * THE TWO COLOURS ARE A PAIR, not two independent lookups. The halo is the brand accent,
	 * `bg-primary`; the core is a mark sitting ON that accent, and a mark on a `primary`
	 * ground is `primary-foreground`, which is `#fbfbfb` in both themes here (`src/app.css:54,170`).
	 * That is the token that means "ink on
	 * the accent", not a literal. Reaching for `foreground` instead would put dark ink
	 * on a blue halo in the light theme — a different loader.
	 *
	 * `blur-md` and `shadow-sm` are kept as utilities: neither carries a colour, and both are
	 * geometry of the glow.
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
	data-loader="breathing-glow"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex size-12 items-center justify-center", className)}
>
	<span class="glow absolute size-8 rounded-full bg-primary blur-md"></span>
	<!--
		`relative` with no offsets does nothing to the position — it only lifts the core above the
		absolutely positioned halo without needing a `z-*`.
	-->
	<span class="relative size-6 rounded-full bg-primary-foreground shadow-sm"></span>
</div>

<style>
	/* `scale` runs 1 → 1.5 → 1 as `opacity` runs 0.5 → 0.8 → 0.5 over one 2s cycle — three
	   values, equal intervals, so the middle one lands at 50%. Both ramps start and end on the same
	   value, so the loop point is seamless and no snap is wanted here. */
	@keyframes loader-breathing-glow-breathe {
		0%,
		100% {
			opacity: 0.5;
			transform: scale(1);
		}
		50% {
			opacity: 0.8;
			transform: scale(1.5);
		}
	}

	.glow {
		/* The rest state, and the only thing reduced motion leaves on screen: the halo at the bottom
		   of its breath. There is no stagger in this loader, so frame 0 is the honest frozen frame,
		   and a half-lit halo behind a solid core still reads as an indicator rather than as a blank
		   box. Never seen while the animation runs — the keyframes declare both properties at 0% and
		   at 100%. */
		opacity: 0.5;
		transform: scale(1);

		/* `ease-in-out` is the bare CSS keyword, cubic-bezier(0.42, 0, 0.58, 1). */
		animation: loader-breathing-glow-breathe 2s ease-in-out infinite;
	}
</style>
