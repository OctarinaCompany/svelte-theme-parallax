<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A ring that swells as its stroke thins, and shrinks as it thickens — a slow breath.
	 *
	 * `border-width` IS ANIMATED RATHER THAN FAKED, and it is the one property here that is not a
	 * transform. The layout-property rule in `src/app.css` sanctions exactly three reasons, and this
	 * is the second — "a box whose border or shadow would visibly stretch under a scale". There is no
	 * transform that thins a stroke: `scale()` multiplies the border along with everything else,
	 * which is the opposite of the picture — the whole point is that the ring gets THINNER
	 * as it gets BIGGER. So `border-width` itself animates, 6px → 2px → 6px,
	 * on a `box-sizing: border-box` 40px element whose border is repainted rather than
	 * relaid: the outer box never changes size, so nothing around it relayouts.
	 *
	 * Decisions worth naming:
	 * - `border-zinc-800 dark:border-zinc-700` is an opaque ink ring at full opacity — the visible
	 *   object of the loader — so it takes `border-foreground`, not a hairline token.
	 * - The animated element is an inner `<span>` rather than the root, so this file's `transform`
	 *   cannot silently outrank a caller's `class` on the root (a Svelte scoped rule is unlayered).
	 *   `loader-gradient-arc.svelte` keeps its painted layer off the root for the same reason.
	 *
	 * The swell reaches 1.1, so the ring overflows its 40px root by 2px on each side. That is fine
	 * and deliberate: the visibility gate in `src/app.css` sits on the gallery tile, never on
	 * `[data-slot="loader"]`, precisely so a loader may paint outside its own box.
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
	data-loader="breathe-ring"
	{role}
	aria-label={ariaLabel}
	class={cn("flex size-10 items-center justify-center", className)}
>
	<!--
		`border-4` is this loader's rest stroke: 4px is exactly halfway
		between the 6px and 2px the keyframes travel between, so the frozen ring is a real
		mid-breath frame. It stays a utility rather than moving into the block, which is
		what keeps a colour-free `border-width` out of the scoped rule.
	-->
	<span class="breather size-full rounded-full border-4 border-foreground"></span>
</div>

<style>
	/* `scale` runs 0.8 → 1.1 → 0.8 as `border-width` runs 6px → 2px → 6px, over two equal
	   intervals. Both ramps start and end on the same value, so this is a `0%, 100%` / `50%` pair rather than a
	   `from` / `to` with a snap. */
	@keyframes loader-breathe-ring-breathe {
		0%,
		100% {
			border-width: 6px;
			transform: scale(0.8);
		}
		50% {
			border-width: 2px;
			transform: scale(1.1);
		}
	}

	.breather {
		/* The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		   animation but does not choose what it stops on). The midpoint of the 0.8 → 1.1 swell,
		   pairing with the 4px stroke the markup already declares: a ring caught mid-breath rather
		   than at either extreme, where 0.8 reads as a small ring nobody meant and 1.1 as a fat one.
		   Never seen while the animation runs, because the keyframes declare both properties at each
		   end. */
		transform: scale(0.95);

		/* `ease-in-out` is exactly CSS's keyword and not Tailwind's
		   `--ease-in-out`. A breath eases at both ends, so this is not one of the physical swings
		   that take the `--ease-loader-swing-*` pair. */
		animation: loader-breathe-ring-breathe 3s ease-in-out infinite;
	}
</style>
