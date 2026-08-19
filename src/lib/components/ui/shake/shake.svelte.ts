import { tick } from "svelte";

export type ShakeStateProps = {
	/** The animated element. Null until the root's `bind:this` has run. */
	readonly getElement: () => HTMLElement | null;
	readonly getReducedMotion: () => boolean;
};

/**
 * One instance per `<Shake>` root. Replaces upstream's `useShake` hook, which
 * exists in React only because a wrapper cannot hand the caller an imperative trigger without
 * `forwardRef` plus `useImperativeHandle`. Here `<Shake>` exports its own `shake()`, so the state
 * lives with the component and no separate hook is needed.
 *
 * There is no context and no second part: everything below drives the one `data-shaking` attribute
 * that the scoped keyframes in `shake.svelte` select on.
 */
export class ShakeState {
	#props: ShakeStateProps;

	/** The last `signal` seen by {@link syncSignal}. Deliberately not reactive — see that method. */
	#previousSignal: unknown;

	/** Drives `data-shaking` on the root. */
	playing: boolean = $state(false);

	constructor(props: ShakeStateProps, initialSignal: unknown) {
		this.#props = props;
		this.#previousSignal = initialSignal;
	}

	/**
	 * Upstream's `prev.current !== signal && signal` effect: replay only when
	 * `signal` changes to a new truthy value, so the initial render never shakes and clearing an
	 * error does not shake either.
	 *
	 * The previous value is a plain field rather than `$state`, because the only reader is the same
	 * call that writes it. As `$state` it would make the caller's `$effect` wake on its own write.
	 */
	syncSignal(signal: unknown): void {
		const changed = !Object.is(this.#previousSignal, signal);
		this.#previousSignal = signal;
		if (changed && signal) this.trigger();
	}

	/**
	 * Play the shake, restarting it if one is already running.
	 *
	 * The removal / re-add is unconditional, and the two halves are separated by `await tick()` plus
	 * a forced reflow — upstream's `void el.offsetWidth` for the same reason. A
	 * browser that never recomputes style between dropping the animation and re-declaring it treats
	 * the pair as no change at all and the second shake simply never plays. `tick()` is what puts the
	 * removal in the DOM in the first place: Svelte applies state writes in a microtask, so without
	 * it the reflow would measure an element that still carries `data-shaking`.
	 *
	 * No-op under `prefers-reduced-motion`. That gate is here rather than in the stylesheet — where
	 * upstream puts it — because `animation: none` fires no `animationend`, so
	 * `playing` would never be cleared and the attribute would sit on the element for good.
	 */
	trigger(): void {
		if (this.#props.getReducedMotion()) return;

		this.playing = false;
		void tick().then(() => {
			void this.#props.getElement()?.offsetWidth;
			this.playing = true;
		});
	}

	/** Called from the root's `animationend`, so the attribute does not outlive the animation. */
	settle(): void {
		this.playing = false;
	}
}
