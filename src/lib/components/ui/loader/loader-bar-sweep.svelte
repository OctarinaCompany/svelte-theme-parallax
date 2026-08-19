<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A dot sliding from one end of a pill-shaped track to the other and back.
	 *
	 * THE RING IS A MARK, NOT A HAIRLINE. The `border-2` track
	 * is opaque ink at the loader's full weight — it is the visible object, not a divider — so
	 * it takes `border-foreground`. `border-border` is reserved for a border written with an alpha
	 * suffix (`/5`, `/10`), and using it here would leave a near-invisible track with a dot floating
	 * in space.
	 *
	 * The dot is `absolute` with no `left`, so it sits at its static position: the content box's
	 * leading edge, i.e. inside the 2px border and the 4px padding. The 24px of travel then
	 * lands its right edge exactly on the inner face of the far border, which is why the number is
	 * 24 and not 32 — it is measured from that offset start.
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
	data-loader="bar-sweep"
	{role}
	aria-label={ariaLabel}
	class={cn(
		"relative flex h-6 w-12 items-center overflow-hidden rounded-full border-2 border-foreground p-1",
		className,
	)}
>
	<!-- `bg-zinc-800 dark:bg-white` is the primary mark: the light-mode shade picks the token and the
	     `dark:` half is dropped, because `--foreground` already carries both themes. -->
	<span class="dot absolute size-4 rounded-full bg-foreground"></span>
</div>

<style>
	/* The dot travels 0 → 24px → 0 over three equal intervals — evenly spaced stops whose first
	   and last values match. Inside a style block the bare `ease-in-out` keyword is CSS's own
	   curve, not Tailwind's variable. */
	@keyframes loader-bar-sweep-slide {
		0%,
		100% {
			transform: translateX(0);
		}
		50% {
			transform: translateX(24px);
		}
	}

	.dot {
		/* The rest state: parked halfway along the track, which is where an `ease-in-out` sweep
		   actually is a quarter of the way through its cycle. Freezing at 0 would leave the dot
		   jammed against the left end, reading as "not started" rather than as something in
		   progress. */
		transform: translateX(12px);

		animation: loader-bar-sweep-slide 1.5s ease-in-out infinite;
	}
</style>
