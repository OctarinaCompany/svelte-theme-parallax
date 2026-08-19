<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A pill that breathes wider and narrower while a status dot pulses and three bars bob.
	 *
	 * THREE INDEPENDENT CYCLES, DELIBERATELY COPRIME-ISH: the pill is 2.2s, the dot 1.1s, the bars
	 * 0.8s. Nothing here tries to line them up, which is what stops the whole thing from reading as
	 * one mechanical throb.
	 *
	 * THE PILL IS AN INVERTED CHIP, and that is where the token map turns over. The picture it
	 * imitates — an iPhone's island — is near-black in BOTH themes.
	 * This repo has no permanently-dark surface token and does not want one; what
	 * it has is `bg-foreground` + `text-background`, the pairing `ui/tooltip` already uses for its
	 * own dark-on-light, light-on-dark chip. Everything inside then flips with it: the hairline that
	 * was `border-black/10 dark:border-white/10` becomes `border-background/10`, and the bars that
	 * were `bg-zinc-300 dark:bg-zinc-500` become `bg-background/70` — the same quiet-ink weight
	 * `ui/status-monitor`'s tooltip body uses on this ground. Reaching for `muted-foreground` here
	 * would be the mistake `CONVENTIONS.md` §3 exists to prevent: a token is only quiet relative to
	 * the ground it is on.
	 *
	 * THE DOT KEEPS ITS STATUS COLOUR. `bg-emerald-500` becomes `bg-success`, not a neutral: it is a
	 * six-pixel fill, and §3 objects to the raw status colour as *type on a tint*, not as a fill.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const bars = Array.from({ length: 3 }, (_, index) => index);
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="dynamic-island"
	{role}
	aria-label={ariaLabel}
	class={cn(
		"island flex h-8 items-center justify-center gap-3 rounded-full border border-background/10 bg-foreground px-4 py-2 text-background shadow-sm",
		className,
	)}
>
	<span class="dot size-1.5 rounded-full bg-success"></span>
	<span class="flex h-2 items-center gap-1">
		{#each bars as index (index)}
			<span class="bar w-0.5 rounded-full bg-background/70" style:--index={index}></span>
		{/each}
	</span>
</div>

<style>
	/* The pill animates real `width`
	   rather than faking it with `transform: scaleX()`. A scale would stretch the 1px hairline, the
	   pill's radius and its contents along with the box; the widening is supposed to look like the
	   chip making room, not like a zoom.

	   The consequence, recorded because it surprises: a `w-*` class passed by a caller cannot win.
	   A Svelte scoped rule is unlayered and Tailwind utilities live in `@layer utilities`, so the
	   rule below outranks them regardless of specificity. That is the intended contract — these
	   loaders are fixed-size — but it is the reason no colour is ever declared in one of these
	   style blocks: it would silently defeat a caller's token override the same way. */
	@keyframes loader-dynamic-island-breathe {
		0%,
		100% {
			width: 5rem; /* 80px */
		}
		50% {
			width: 6.875rem; /* 110px */
		}
	}

	@keyframes loader-dynamic-island-blink {
		0%,
		100% {
			opacity: 0.4;
		}
		50% {
			opacity: 1;
		}
	}

	@keyframes loader-dynamic-island-bob {
		0%,
		100% {
			height: 3px;
		}
		50% {
			height: 8px;
		}
	}

	.island {
		width: 5rem; /* the rest width, and the frame reduced motion freezes on */
		animation: loader-dynamic-island-breathe 2.2s ease-in-out infinite;
	}

	.dot {
		opacity: 0.4;
		animation: loader-dynamic-island-blink 1.1s ease-in-out infinite;
	}

	.bar {
		--duration: 0.8s;
		/* The stagger, `delay: i * 0.15`. The whole cycle
		   subtracted below is what puts the three bars out of phase on the first painted frame
		   instead of letting them start flush and drift apart over the first cycle — and subtracting
		   rather than negating is what keeps the wave running left to right. */
		--stagger: 0.15s;

		/* The rest state: a 3 / 5.5 / 8px staircase rather than three bars of one height, so the
		   frozen frame still reads as a waveform. */
		height: calc(3px + var(--index) * 2.5px);

		animation: loader-dynamic-island-bob var(--duration) ease-in-out infinite;
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
