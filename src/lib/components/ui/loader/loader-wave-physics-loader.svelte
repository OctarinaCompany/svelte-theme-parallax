<script lang="ts" module>
	/**
	 * The wave model. A keyframe-table approach would evaluate it a few hundred times up front and
	 * interpolate; here it is a pure function of one phase and is evaluated once per frame.
	 *
	 * In `<script module>` rather than in `loader.svelte.ts`: this is one loader's maths, and a
	 * folder module shared by ~128 unrelated components is not the place for it. See the note at
	 * the top of `loader.svelte.ts`.
	 */

	/** Bars in the row. */
	const BAR_COUNT = 15;
	/** Bar width plus gap, in px — the ball's stride from one bar to the next. */
	const BAR_STRIDE = 20;
	/** Bounces the ball makes on each traverse. */
	const BOUNCES = 4;
	/** Peak of a bounce, in px above the bar tops. */
	const MAX_BOUNCE = 60;
	/** Height of an undisturbed bar, in px. */
	const BASE_BAR_HEIGHT = 16;
	/** How much taller a bar gets directly under the ball, in px. */
	const WAVE_PEAK_HEIGHT = 48;
	/** How far the ball's weight presses a bar down at touchdown, in px. */
	const INDENT_DEPTH = 20;

	/** One frame of the simulation. */
	export type WavePhysicsFrame = {
		bars: { height: number; lit: number }[];
		ball: { x: number; y: number; scaleX: number; scaleY: number };
	};

	/**
	 * Evaluate the model at `phase` ∈ [0, 1).
	 *
	 * The ball crosses the row over the first half of the cycle and comes back over the second, so
	 * `xFraction` is a triangle wave — `t < 0.5 ? t / 0.5 : (1 - t) / 0.5`. Everything
	 * else falls out of where the ball is: `bounceHeight` is a parabola per bounce, `contact` is 1
	 * only while the ball is on the floor, and each bar rises by a cosine bump that dies out three
	 * bars away and is pressed back down within one and a half.
	 */
	export function waveFrame(phase: number): WavePhysicsFrame {
		const xFraction = phase < 0.5 ? phase / 0.5 : (1 - phase) / 0.5;
		const ballIndex = xFraction * (BAR_COUNT - 1);

		// 0 at the ends of the traverse so the turn-around lands on a touchdown rather than mid-air.
		const bouncePhase = xFraction === 0 || xFraction === 1 ? 0 : (xFraction * BOUNCES) % 1;
		const bounceHeight = 4 * bouncePhase * (1 - bouncePhase);
		const contact = Math.max(0, 1 - bounceHeight * 2);

		const bars = Array.from({ length: BAR_COUNT }, (_, index) => {
			const distance = Math.abs(index - ballIndex);
			const wave = distance < 3 ? Math.cos((distance / 3) * (Math.PI / 2)) : 0;
			const indent =
				distance < 1.5 ? Math.cos((distance / 1.5) * (Math.PI / 2)) * contact * INDENT_DEPTH : 0;

			return {
				height: Math.max(4, BASE_BAR_HEIGHT + wave * WAVE_PEAK_HEIGHT - indent),
				lit: wave,
			};
		});

		return {
			bars,
			ball: {
				x: ballIndex * BAR_STRIDE,
				y: BASE_BAR_HEIGHT + WAVE_PEAK_HEIGHT - contact * INDENT_DEPTH + bounceHeight * MAX_BOUNCE,
				// Squash on impact, stretch back in flight — the classic squash-and-stretch pair.
				scaleX: 1 + contact * 0.25,
				scaleY: 1 - contact * 0.3,
			},
		};
	}

	/** One full crossing and return, in ms. */
	const CYCLE_MS = 4000;

	/**
	 * The phase reduced motion freezes on: the ball at the top of a bounce with the crest of the
	 * wave still under it. A still frame that reads as something caught mid-flight, which is the
	 * point — `display: none` or a flat row would say nothing is happening.
	 */
	const REST_PHASE = 0.18;
</script>

<script lang="ts">
	import { useReducedMotion } from "$lib/shared/reduced-motion.svelte.js";
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A ball bouncing along a row of bars that rise as it passes.
	 *
	 * THE ONE LOADER IN THIS FOLDER THAT RUNS JAVASCRIPT, and the bar for that is deliberately high:
	 * a loader may drive itself from a frame loop only when its elements share a moving driver that
	 * CSS cannot factor out. Here every bar's height is a function of where the ball is, and the
	 * ball is one object shared by all sixteen elements — CSS keyframes are per element and per
	 * time, with no way to express "and this depends on that one over there". Flattening the model
	 * into hundreds of keyframes per element would work, but written out as CSS that is roughly
	 * three thousand lines of tabulated numbers — exactly the thing this file exists to avoid.
	 * Every other loader is pure CSS, and a reviewer who sees a second `requestAnimationFrame` in
	 * this folder should treat it as a mistake until argued otherwise.
	 *
	 * REDUCED MOTION IS READ IN SCRIPT HERE, not with the `@media` query the rest of the folder
	 * uses, for the mechanical reason that a media query cannot stop a frame loop. `useReducedMotion()`
	 * is the shared reader in `src/lib/shared/reduced-motion.svelte.js` — one `matchMedia` listener
	 * for the whole application, the same one `ui/shake` and `ui/status` use.
	 *
	 * AND SO IS VISIBILITY, for the same mechanical reason. The `content-visibility` gate in
	 * `src/app.css` stops the CSS animations of an off-screen loader, and it cannot touch this one:
	 * `requestAnimationFrame` pauses when the TAB is hidden, never when the element is merely
	 * scrolled out of view, so without the observer below this component would keep evaluating the
	 * model and writing custom properties on twenty elements at 60fps while nobody can see it —
	 * on a page carrying the whole catalog, forever. The exemption that lets a loader run
	 * JavaScript carries the obligation to gate it; a second JS loader (there should not be one)
	 * copies this block.
	 *
	 * THE COLOUR RAMP IS AN OPACITY RAMP. Each bar's colour runs between "almost the page" and
	 * "ink" by how lit it is. Mixing a token toward the page colour IS fading it, so the bars fade
	 * `bg-foreground` instead of computing an rgb() — one token, correct in both themes and in all
	 * eleven generated palettes, where a hand-lerped rgb triple would be right in exactly one.
	 *
	 * NO RESPONSIVE SCALE WRAPPER (`scale-[0.6] sm:scale-75 md:scale-100`). That is a decision about
	 * the page the loader sits on, not about the loader, and every other component in this folder
	 * ships at one fixed size for the reason `loader.svelte.ts` gives. A caller that needs it small
	 * wraps it and scales it, exactly as the Loader page's gallery does.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const reducedMotion = useReducedMotion();

	let phase = $state(REST_PHASE);

	/**
	 * Whether the row is on screen. Starts `true` so the first frames run before the observer has
	 * reported anything — a loader that flickered as stopped on mount would be worse than one that
	 * ran for two frames it did not need to.
	 */
	let onScreen = $state(true);

	const frame = $derived(waveFrame(phase));

	// One observer per instance, not one shared module-level observer: this is the only component in
	// the folder that needs it, and `CONVENTIONS.md` §2 puts shared machinery in `src/lib/shared/`
	// only once two unrelated components want it. `ref` is the bindable root, so it is `$state` and
	// this re-runs once the element exists. No threshold: the default fires on any overlap at all,
	// which is what "can the reader see it" means here.
	$effect(() => {
		const element = ref;
		if (!element || typeof IntersectionObserver === "undefined") return;

		const observer = new IntersectionObserver((entries) => {
			onScreen = entries[entries.length - 1].isIntersecting;
		});
		observer.observe(element);
		return () => observer.disconnect();
	});

	// This effect reads `reducedMotion.current` and `onScreen` and writes `phase`; it never reads
	// `phase`, so it cannot wake itself. The loop is torn down by the returned cleanup on unmount,
	// when the row leaves the viewport, and whenever the motion preference flips — each of which is
	// also what restarts it from a fresh timestamp.
	$effect(() => {
		if (reducedMotion.current || !onScreen) {
			phase = REST_PHASE;
			return;
		}

		let handle = 0;
		const started = performance.now();

		const step = (now: number) => {
			phase = ((now - started) % CYCLE_MS) / CYCLE_MS;
			handle = requestAnimationFrame(step);
		};

		handle = requestAnimationFrame(step);
		return () => cancelAnimationFrame(handle);
	});
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="wave-physics-loader"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex h-48 w-[292px] items-end justify-start gap-2", className)}
>
	{#each frame.bars as bar, index (index)}
		<span
			class="bar w-3 origin-bottom rounded-full bg-foreground"
			style:--height="{bar.height}px"
			style:--lit={bar.lit}
		></span>
	{/each}

	<span
		class="ball absolute bottom-0 left-0 size-3 rounded-full bg-foreground shadow-sm"
		style:--x="{frame.ball.x}px"
		style:--y="{frame.ball.y}px"
		style:--scale-x={frame.ball.scaleX}
		style:--scale-y={frame.ball.scaleY}
	></span>
</div>

<style>
	.bar {
		height: var(--height);
		/* The unlit end is a hair off the page, not invisible; 0.15 is that weight in token terms.
		   The lit end reaches full `--foreground`. */
		opacity: calc(0.15 + 0.85 * var(--lit));
	}

	.ball {
		/* Translate first, then scale — reversing them would scale the offset as well as the
		   ball. */
		transform: translate(var(--x), calc(-1 * var(--y))) scale(var(--scale-x), var(--scale-y));
		transform-origin: bottom center;
	}
</style>
