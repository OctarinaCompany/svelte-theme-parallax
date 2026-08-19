<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Three dots hopping in a quick relay.
	 *
	 * THE HOP IS A `transform` — `translateY()` — so the motion is composited and costs nothing per
	 * frame. None of the three exemptions in `src/app.css`'s layout-property rule applies — the dot is
	 * a circle that neither distorts nor pushes a sibling — so there is no reason to touch `top` or
	 * `margin`.
	 *
	 * `ease-in-out` — cubic-bezier(0.42, 0, 0.58, 1) — is
	 * arguably the wrong physics for a bounce — a real hop is
	 * fast at the bottom and slow at the top — but the per-keyframe swing curves are reserved for
	 * genuinely physical motion such as `loader-newtons-cradle.svelte`'s pendulum, and this is a 0.6s
	 * decorative bob. Kept faithful.
	 *
	 * The dots are the single token `bg-foreground`, and the delay is shifted back one whole
	 * cycle.
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

<!-- `w-fit` so the row is sized by its dots rather than by whatever container it lands in. The dots
     rise 8px above the root's box and are allowed to: the performance gate in `src/app.css` sits on
     the gallery tile, not on the loader, precisely so nothing here gets clipped. -->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="bounce-dots"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-fit gap-1.5", className)}
>
	{#each dots as index (index)}
		<span class="dot size-2.5 rounded-full bg-foreground" style:--index={index}></span>
	{/each}
</div>

<style>
	/* The hop runs 0 → -8px → 0 over two equal intervals, so the peak is at 50%. The ends agree,
	   so the loop back to the first value is invisible. */
	@keyframes loader-bounce-dots-hop {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-8px);
		}
	}

	.dot {
		--duration: 0.6s;
		/* The stagger: `delay: i * 0.1`. */
		--stagger: 0.1s;

		/* The rest state: a staircase at 0 / −2.67px / −5.33px, which is the frame this relay is
		   really caught on. With `animation-delay: i·0.1s − 0.6s` each dot's phase on the first
		   painted frame is (0.6 − 0.1i)/0.6, all on the falling leg, so the triangle above evaluates
		   to `−8px × (2 × 0.1i / 0.6)` = `−8px × i / 3`. The 8px is the keyframe's peak, spelled
		   again here; the two have to agree. Freezing all three at 0 would read as a row of dots
		   rather than as something mid-hop. */
		transform: translateY(calc(var(--index) * -8px / 3));

		animation: loader-bounce-dots-hop var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: the phase order — and so the direction the
		   hop travels along the row — is kept, and nothing winds up on mount. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
