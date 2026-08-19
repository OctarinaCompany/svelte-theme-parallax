<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Three dots bobbing gently, a slower and softer cousin of `loader-bounce-dots.svelte`.
	 *
	 * The two are the same shape at different settings — 1.2s and 10px here against 0.6s and 8px
	 * there, and a 0.15s stagger against 0.1s — which is why the ports read alike. Both are kept:
	 * the catalog publishes them as separate loaders, and the difference is visible side by side.
	 *
	 * Decisions worth naming:
	 * - `bg-zinc-800 dark:bg-white` is the single token `bg-foreground`; the light-mode shade picks
	 *   the token and the `dark:` half is dropped.
	 * - `space-x-2` is `gap-2`, the house spelling for a spaced row.
	 * - The bob is an explicit `translateY()`, so the motion stays composited. None of the
	 *   three layout-property exemptions applies to a circle that neither distorts nor pushes a
	 *   sibling.
	 * - The stagger `delay: i * 0.15` is shifted back one whole cycle, so nothing winds up on mount.
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

<!-- `w-fit` so the three dots size the row rather than it stretching to its container. -->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="bobbing-dots"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-fit gap-2", className)}
>
	{#each dots as index (index)}
		<span class="dot size-3 rounded-full bg-foreground" style:--index={index}></span>
	{/each}
</div>

<style>
	/* The bob runs 0 → -10px → 0 over two equal intervals, so the apex is at 50%. The ends agree,
	   so the loop back to the first value is invisible. */
	@keyframes loader-bobbing-dots-bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.dot {
		--duration: 1.2s;
		/* The stagger: `delay: i * 0.15`. */
		--stagger: 0.15s;

		/* The rest state: 0 / −2.5px / −5px, the frame this row is really caught on. With
		   `animation-delay: i·0.15s − 1.2s` a dot's phase on the first painted frame is
		   (1.2 − 0.15i)/1.2, all three on the falling leg, so the triangle above evaluates to
		   `−10px × (2 × 0.15i / 1.2)` = `−10px × i / 4`. The 10px is the keyframe's apex, spelled
		   again here; the two have to agree. */
		transform: translateY(calc(var(--index) * -10px / 4));

		animation: loader-bobbing-dots-bob var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: the direction the bob travels along the row
		   is kept, and nothing holds still on mount. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
