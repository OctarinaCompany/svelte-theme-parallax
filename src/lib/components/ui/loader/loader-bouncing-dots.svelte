<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Three dots bouncing off a ruled line, squashing as they land.
	 *
	 * THE ROOT CARRIES NO FLEX CLASSES, because every one of its three children is
	 * `absolute` with an explicit `left` — there is nothing in flow for
	 * flex to lay out. What is load-bearing is `relative w-16 h-12` (the box the dots are
	 * positioned against) and `border-b-2` (the floor they bounce off), and that is what is here.
	 *
	 * `border-zinc-200 dark:border-zinc-800` IS A TRACK, NOT A MARK. It is the ground the dots hit,
	 * not the object of the loader, so it takes the unlit-ring weight `border-muted-foreground/20`
	 * rather than `border-foreground` — the same pair `ui/progress` uses for a bar and its track.
	 *
	 * The dots are the single token `bg-foreground`, and the stagger
	 * `delay: i * 0.1` is shifted back one whole cycle so nothing winds up on mount.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	/** Each dot's berth: `left: ${(i * 14) + 10}px` — 10, 24 and 38px into the 64px box. */
	const dots = Array.from({ length: 3 }, (_, index) => ({ index, left: index * 14 + 10 }));
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="bouncing-dots"
	{role}
	aria-label={ariaLabel}
	class={cn("relative h-12 w-16 border-b-2 border-muted-foreground/20", className)}
>
	{#each dots as dot (dot.index)}
		<span
			class="dot absolute bottom-2 size-3 rounded-full bg-foreground"
			style:left="{dot.left}px"
			style:--index={dot.index}
		></span>
	{/each}
</div>

<style>
	/* The hop (`y` 0 → -20px → 0) and the squash (`scaleY` 0.8 → 1.1 → 0.8) merge
	   into a single `transform` per stop — CSS has one `transform` property, and splitting them into
	   two animations would let the hop and the squash drift apart. Three evenly spaced stops put the
	   apex at 50%; both ends agree, so the loop back has no visible snap. */
	@keyframes loader-bouncing-dots-bounce {
		0%,
		100% {
			transform: translateY(0) scaleY(0.8);
		}
		50% {
			transform: translateY(-20px) scaleY(1.1);
		}
	}

	.dot {
		--duration: 0.8s;
		/* The stagger: `delay: i * 0.1`. */
		--stagger: 0.1s;

		/* The rest state: a staircase of 0 / −5px / −10px with the squash easing off along with it,
		   which is the frame this relay is genuinely caught on. With `animation-delay: i·0.1s − 0.8s`
		   a dot's phase on the first painted frame is (0.8 − 0.1i)/0.8 — all three on the falling leg
		   — so the keyframes above evaluate to `−20px × (2 × 0.1i / 0.8)` and
		   `0.8 + 0.3 × (2 × 0.1i / 0.8)`. The −20px, the 0.8 and the 1.1 are the keyframe's own
		   numbers, spelled again here; the two sites have to agree. */
		transform: translateY(calc(var(--index) * -5px)) scaleY(calc(0.8 + var(--index) * 0.075));

		animation: loader-bouncing-dots-bounce var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase order — the bounce still travels
		   left to right along the row — and no wind-up on mount. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
