<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { AnimationEventHandler, HTMLAttributes } from "svelte/elements";

	/** What `bind:this` on `<Shake>` yields — the Svelte answer to upstream's `useShake` return. */
	export type ShakeHandle = {
		/** Replay the shake now, restarting one already in flight. No-op under reduced motion. */
		shake: () => void;
	};

	export type ShakeRootProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Change this to a new truthy value to replay the shake — an incrementing failure counter, or
		 * the error message itself.
		 *
		 * A plain prop, not a `$bindable`: the component only ever reads it, and a bindable would
		 * promise a write back that never comes.
		 */
		signal?: unknown;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import { useReducedMotion } from "$lib/shared/reduced-motion.svelte.js";
	import { ShakeState } from "./shake.svelte.js";

	/**
	 * A wrapper that shakes its children when `signal` changes — the wrong-password nudge. Ported
	 * from the reference source.
	 *
	 * Upstream's third export, `ShakeStyles`, has no counterpart here. It exists
	 * to inject the keyframes into the document once, a problem Svelte does not have: the style block
	 * below is scoped to this component and hoisted into the bundle's stylesheet, so there is nothing
	 * to render and no way to end up with two copies.
	 *
	 * The cost of that scoping is that the animation cannot be lent to an element this component does
	 * not render, so there is no `child` snippet here — the scoping class is compiler-generated and a
	 * caller's own element would never carry it. Wrap the element instead.
	 */
	let {
		ref = $bindable(null),
		signal,
		class: className,
		children,
		onanimationend: onanimationendProp,
		...restProps
	}: ShakeRootProps = $props();

	const reducedMotion = useReducedMotion();

	const state = new ShakeState(
		{
			getElement: () => ref,
			getReducedMotion: () => reducedMotion.current,
		},
		untrack(() => signal),
	);

	// Typed through {@link ShakeHandle} so the documented `bind:this` surface and the real export
	// cannot drift apart.
	export const shake: ShakeHandle["shake"] = () => {
		state.trigger();
	};

	// `untrack` pins this effect's dependency set to `signal` alone. `syncSignal` reaches `trigger`,
	// which reads the reduced-motion reader and writes `playing` back; tracked, the effect would also
	// wake on a change of motion preference, and any later read of `playing` on that path would make
	// it wake on its own write (`effect_update_depth_exceeded`).
	$effect(() => {
		const next = signal;
		untrack(() => state.syncSignal(next));
	});

	const onanimationend: AnimationEventHandler<HTMLDivElement> = (event) => {
		onanimationendProp?.(event);
		// `animationend` bubbles, so without this an animated child would clear the flag mid-shake.
		if (event.target !== event.currentTarget) return;
		state.settle();
	};
</script>

<div
	bind:this={ref}
	data-slot="shake"
	data-shaking={state.playing ? "" : undefined}
	data-motion={reducedMotion.current ? "reduce" : undefined}
	{...restProps}
	class={cn(className)}
	{onanimationend}
>
	{@render children?.()}
</div>

<style>
	/* Upstream's keyframes verbatim: a perspective wobble that decays over
	   eight steps, so the motion reads as a physical recoil rather than a slide. */
	@keyframes shake-error {
		0% {
			transform: perspective(700px) translate3d(0, 0, 0) rotateY(0deg);
		}
		12% {
			transform: perspective(700px) translate3d(-7px, 0, 0) rotateY(-5deg);
		}
		26% {
			transform: perspective(700px) translate3d(6px, 0, 0) rotateY(4deg);
		}
		41% {
			transform: perspective(700px) translate3d(-5px, 0, 0) rotateY(-3deg);
		}
		56% {
			transform: perspective(700px) translate3d(4px, 0, 0) rotateY(2deg);
		}
		70% {
			transform: perspective(700px) translate3d(-2px, 0, 0) rotateY(-1deg);
		}
		84% {
			transform: perspective(700px) translate3d(1px, 0, 0) rotateY(0.5deg);
		}
		100% {
			transform: perspective(700px) translate3d(0, 0, 0) rotateY(0deg);
		}
	}

	/* Selected by attribute rather than by a class the script adds, so the compiler can see the rule
	   is live and keep it. The 3D hints are scoped to the run for the same reason the animation is:
	   off-state, the element should cost the compositor nothing. */
	[data-slot="shake"][data-shaking] {
		animation: shake-error 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
		transform-style: preserve-3d;
		backface-visibility: hidden;
	}
</style>
