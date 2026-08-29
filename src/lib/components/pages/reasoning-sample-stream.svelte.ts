/**
 * A fake reasoning stream for the Reasoning page: hands out a source text one word at a time on a
 * timer, and flips `streaming` at the edges the way an AI SDK part's `state` does.
 *
 * `run` is a KEY, not a counter for its own sake. `Reasoning.Root` auto-closes at most once per
 * instance — a transcript keys each thought by its message id, so a new thought is a new
 * instance — and a demo that restarts the same instance would show a second stream that never
 * folds. The page wraps its root in `{#key sim.run}` and `reset()` bumps it, which is exactly
 * what a keyed transcript does for a new part.
 *
 * MUST BE CONSTRUCTED DURING COMPONENT INITIALISATION: the constructor registers an `$effect`
 * whose only job is to clear the timer when the page unmounts, and `$effect` needs a component
 * context to attach to. A page-level `const` is that context.
 */
export class ReasoningStreamSimulation {
	/** The words emitted so far, joined — what `Reasoning.Content` renders. */
	text = $state("");
	/** `true` between `start()` and the last word — what `Reasoning.Root` is told. */
	streaming = $state(false);
	/** Bumped by `reset()`; key the root on it to get a fresh instance. */
	run = $state(0);

	readonly #words: string[];
	readonly #intervalMs: number;
	#index = 0;
	#timer: ReturnType<typeof setInterval> | undefined;

	constructor(source: string, intervalMs = 90) {
		this.#words = source.split(/\s+/).filter((word) => word.length > 0);
		this.#intervalMs = intervalMs;
		$effect(() => () => this.#clear());
	}

	/** Whether every word has been emitted. */
	get done(): boolean {
		return !this.streaming && this.#index >= this.#words.length;
	}

	/** Begin emitting from the first word. A no-op while a stream is already running. */
	start(): void {
		if (this.streaming) return;
		this.#index = 0;
		this.text = "";
		this.streaming = true;
		this.#timer = setInterval(() => this.#tick(), this.#intervalMs);
	}

	/** End the stream where it is; the text emitted so far stays. */
	stop(): void {
		this.#clear();
		this.streaming = false;
	}

	/** Stop, empty the text and bump `run`, so a keyed root mounts a fresh instance. */
	reset(): void {
		this.stop();
		this.text = "";
		this.#index = 0;
		this.run += 1;
	}

	#tick(): void {
		if (this.#index >= this.#words.length) {
			this.stop();
			return;
		}
		const word = this.#words[this.#index];
		this.text = this.text.length === 0 ? word : `${this.text} ${word}`;
		this.#index += 1;
	}

	#clear(): void {
		if (this.#timer === undefined) return;
		clearInterval(this.#timer);
		this.#timer = undefined;
	}
}
