<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Three dots that swell and fade in sequence.
	 *
	 * The archetype of this folder, `loader-classic-spinner.svelte`, with three elements instead of
	 * twelve: the index rides into CSS as `--index` and does both jobs there — the stagger and the
	 * rest ramp — so the markup carries no magic numbers.
	 *
	 * THE DELAY IS SHIFTED BACK ONE WHOLE CYCLE. `delay: i * 0.15`
	 * written straight into `animation-delay` would park dots two and
	 * three at their base value for up to 300ms on mount, so the row would visibly wind up.
	 * Subtracting one full duration makes every delay negative, and a negative delay seeks backwards:
	 * the first painted frame is already the steady state. Subtracted rather than negated, because
	 * negating would put dot *i* ahead instead of behind and reverse the direction the
	 * pulse travels along the row.
	 *
	 * The row is `flex gap-2` per this repo's layout rules, and the dots are the one semantic
	 * token `bg-foreground`, which carries both themes on its own.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const dots = [0, 1, 2];
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="apple-pulse-dots"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-fit gap-2", className)}
>
	{#each dots as index (index)}
		<span class="dot size-2.5 rounded-full bg-foreground" style:--index={index}></span>
	{/each}
</div>

<style>
	/* `scale` runs 0.5 → 1 → 0.5 as `opacity` runs 0.3 → 1 → 0.3 — three values, equal
	   intervals, so the peak is at 50%. Both ramps start and end on the same value, so there is no
	   snap at the loop point. */
	@keyframes loader-apple-pulse-dots-pulse {
		0%,
		100% {
			opacity: 0.3;
			transform: scale(0.5);
		}
		50% {
			opacity: 1;
			transform: scale(1);
		}
	}

	.dot {
		--duration: 1.2s;
		/* The stagger `delay: i * 0.15`, derived from `--duration` rather than written as `150ms` so
		   the two cannot drift apart: 1.2s / 8 = 0.15s. */
		--stagger: calc(var(--duration) / 8);

		/* The rest state, and the only thing visible under reduced motion. With the delay shifted back
		   one whole cycle, dot i sits at phase (1.2 - 0.15i) / 1.2 on the first painted frame — 0,
		   0.875, 0.75 — and the triangle above evaluated there gives 0, 0.25, 0.5 of the way up its
		   ramp, which happens to be exactly `i / 4`. So the frozen row is a clean ascending ramp
		   written as one `calc()` each: scale 0.5 → 0.625 → 0.75, opacity 0.3 → 0.475 → 0.65. The four
		   endpoints restate the keyframes above; change one, change both. */
		opacity: calc(0.3 + var(--index) * 0.175);
		transform: scale(calc(0.5 + var(--index) * 0.125));

		animation: loader-apple-pulse-dots-pulse var(--duration) ease-in-out infinite;
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
