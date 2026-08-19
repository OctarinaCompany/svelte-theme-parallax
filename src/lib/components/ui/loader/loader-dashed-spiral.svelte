<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A dashed circle turning slowly, swelling once per revolution.
	 *
	 * ONE KEYFRAME SET, NOT TWO, unlike `loader-morphing-ring.svelte` next door — and the difference
	 * is the easing. The spin (`rotate: 360`, one interval) and the swell (`scale: 1 → 1.1 → 1`,
	 * two intervals) both run linear. Linear is the one curve
	 * that is unchanged by being cut in half, so folding both channels into three stops — 0°, 180°,
	 * 360° against 1, 1.1, 1 — costs nothing. It also has to be one set: CSS has
	 * a single `transform` property, and two animations writing it would fight rather than compose.
	 *
	 * The dashes are what make the rotation visible. A plain ring turning is a still image; the
	 * motion comes for free from `border-dashed`, which is why the dash style is geometry here and
	 * not decoration.
	 *
	 * Decisions worth naming:
	 * - `border-zinc-800 dark:border-zinc-700` is an opaque ink ring at full opacity — the visible
	 *   object of the loader — so it takes `border-foreground`, not a hairline token.
	 * - The animated element is an inner `<span>` rather than the root, so this file's `transform`
	 *   cannot silently outrank a caller's `class` on the root (a Svelte scoped rule is unlayered).
	 *   `loader-gradient-arc.svelte` keeps its painted layer off the root for the same reason.
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
	data-loader="dashed-spiral"
	{role}
	aria-label={ariaLabel}
	class={cn("flex size-10 items-center justify-center", className)}
>
	<span class="spiral size-full rounded-full border-[3px] border-dashed border-foreground"></span>
</div>

<style>
	@keyframes loader-dashed-spiral-turn {
		0% {
			transform: rotate(0deg) scale(1);
		}
		50% {
			transform: rotate(180deg) scale(1.1);
		}
		100% {
			transform: rotate(360deg) scale(1);
		}
	}

	.spiral {
		/* The rest state, for `prefers-reduced-motion` (the shared rule in `src/app.css` stops the
		   animation but does not choose what it stops on): the ring as drawn. A dashed circle is a
		   waiting picture at any angle — the dashes read as a spinner whether or not it is moving —
		   so there is nothing to be gained by freezing it part-way round. Never seen while the
		   animation runs, because the keyframes declare `transform` at both ends. */
		transform: rotate(0deg) scale(1);

		animation: loader-dashed-spiral-turn 4s linear infinite;
	}
</style>
