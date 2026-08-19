<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * An outlined square that swells, rounds itself off and fades.
	 *
	 * `border-foreground`, NOT `border-border`. The `border-4` outline
	 * is an opaque four-pixel ink ring — it IS the
	 * visible object of this loader, not a hairline around something else. `border-border` is for a
	 * border written with an alpha suffix (`border-zinc-800/10` and friends); using it here would
	 * produce a nearly invisible square.
	 *
	 * NO `rounded-md` UTILITY. The animation owns `border-radius` — it runs 20% → 50% → 20% —
	 * so a static radius class would be overridden from the first frame onward and
	 * only survive as a second spelling of a number the animation already owns. The radius lives in
	 * the style block, once.
	 *
	 * Three values with no `times:` means two equal intervals — 0%, 50%, 100% — and the array starts
	 * and ends on the same value, so it is written as a `0%, 100%` / `50%` pair.
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
	data-loader="pulse-square"
	{role}
	aria-label={ariaLabel}
	class={cn("size-8", className)}
>
	<span class="square block size-full border-4 border-foreground"></span>
</div>

<style>
	@keyframes loader-pulse-square-pulse {
		0%,
		100% {
			border-radius: 20%;
			transform: scale(1);
			opacity: 1;
		}
		50% {
			border-radius: 50%;
			transform: scale(1.2);
			opacity: 0.3;
		}
	}

	.square {
		/* The rest state: the ring as drawn, at full strength. This loader is one element with no
		   stagger, so there is no phase to freeze on — and its mid-cycle pose is a 30%-opaque circle,
		   which under reduced motion would read as a component that failed to load rather than as one
		   waiting. */
		border-radius: 20%;
		transform: scale(1);
		opacity: 1;

		animation: loader-pulse-square-pulse 1.5s ease-in-out infinite;
	}
</style>
