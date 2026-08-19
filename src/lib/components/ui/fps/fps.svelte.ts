import { tv, type VariantProps } from "tailwind-variants";

/** `updateInterval` fallback — upstream `updateInterval = 500`. */
export const DEFAULT_FPS_UPDATE_INTERVAL = 500;

/** `warningThreshold` fallback — upstream `warningThreshold = 30`. */
export const DEFAULT_FPS_WARNING_THRESHOLD = 30;

/** `destructiveThreshold` fallback — upstream `errorThreshold = 20`. */
export const DEFAULT_FPS_DESTRUCTIVE_THRESHOLD = 20;

/** Where the counter parks itself within its positioning context. */
export const FPS_POSITIONS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;
export type FpsPosition = (typeof FPS_POSITIONS)[number];

/** `fixed` follows the viewport and is portalled; `absolute` stays inside its container. */
export const FPS_STRATEGIES = ["fixed", "absolute"] as const;
export type FpsStrategy = (typeof FPS_STRATEGIES)[number];

/** Which band the current reading falls in. Derived, never passed in. */
export type FpsStatus = "good" | "warning" | "destructive";

/**
 * The chip. Ported from `fps.tsx:8-34` (`cva`), restated with `tv` — the house variant tool.
 *
 * ONE DELIBERATE SUBSTITUTION. Upstream's warning ink is `text-orange-500`, a raw palette colour.
 * Raw colours are barred here (`CONVENTIONS.md` §8), and the token that looks like the swap —
 * `--warning`, `#f5c042` — is a fill, not an ink: yellow type on the page ground fails contrast
 * outright, which is the whole reason the `--*-subtle-foreground` family was solved. So the
 * warning band takes `--warning-subtle-foreground`, the walked ink of that family. The other two
 * bands need no substitution: `text-primary` and `text-destructive` are already what the house
 * writes for those meanings — `field-error.svelte:41` is the precedent for the second.
 *
 * ONE DELIBERATE RENAME. Upstream calls the lowest band `error`; the house status vocabulary
 * (`CONVENTIONS.md` §3) is `destructive`, so the band, its variant key and the threshold prop
 * (`destructiveThreshold`, upstream `errorThreshold`) all carry the house name.
 */
export const fpsVariants = tv({
	base: "z-50 flex shrink-0 items-center gap-2 rounded-sm border bg-background/80 px-3 py-1.5 font-mono text-sm backdrop-blur-sm",
	variants: {
		strategy: {
			fixed: "fixed",
			absolute: "absolute",
		},
		position: {
			"top-left": "top-4 left-4",
			"top-right": "top-4 right-4",
			"bottom-left": "bottom-4 left-4",
			"bottom-right": "right-4 bottom-4",
		},
		status: {
			good: "text-primary",
			warning: "text-warning-subtle-foreground",
			destructive: "text-destructive",
		},
	},
	defaultVariants: {
		strategy: "fixed",
		position: "top-right",
		status: "good",
	},
});

export type FpsVariants = VariantProps<typeof fpsVariants>;

/**
 * A frame counter over `requestAnimationFrame`.
 *
 * Upstream keeps the count, the last timestamp and the frame handle in three refs and drives them
 * from an effect. Here they are plain fields on a class and only `current` is
 * `$state`, which is the point: a counter that made its frame tally reactive would invalidate a
 * dependency sixty times a second to publish a number twice a second.
 *
 * `start()` returns its own teardown, so the caller can hand it straight back from an `$effect`.
 * Calling it twice without stopping is safe — the second call cancels the first frame request
 * rather than leaving two loops racing to write the same field.
 */
export class FpsState {
	/** Frames per second, republished every `updateInterval` milliseconds. */
	current = $state(0);

	#frames = 0;
	#last = 0;
	#handle: number | null = null;

	/**
	 * Begin measuring.
	 *
	 * `performance.now()` is read here rather than at construction: a counter built during setup
	 * and started after a slow mount would otherwise charge that whole gap to its first window and
	 * report a figure far below the real frame rate.
	 */
	start(updateInterval: number = DEFAULT_FPS_UPDATE_INTERVAL): () => void {
		this.stop();
		this.#frames = 0;
		this.#last = performance.now();

		const measure = () => {
			const now = performance.now();
			const delta = now - this.#last;
			this.#frames += 1;

			if (delta >= updateInterval) {
				this.current = Math.round((this.#frames * 1000) / delta);
				this.#frames = 0;
				this.#last = now;
			}

			this.#handle = requestAnimationFrame(measure);
		};

		this.#handle = requestAnimationFrame(measure);

		return () => this.stop();
	}

	/** Cancel the frame loop. Idempotent. */
	stop(): void {
		if (this.#handle === null) return;
		cancelAnimationFrame(this.#handle);
		this.#handle = null;
	}
}

/**
 * Which band a reading falls in.
 *
 * Upstream memoises this; a `$derived` at the call site does the same job, so
 * this stays a pure function and can be unit-tested without a component.
 */
export function resolveFpsStatus(
	fps: number,
	warningThreshold: number = DEFAULT_FPS_WARNING_THRESHOLD,
	destructiveThreshold: number = DEFAULT_FPS_DESTRUCTIVE_THRESHOLD,
): FpsStatus {
	if (fps < destructiveThreshold) return "destructive";
	if (fps < warningThreshold) return "warning";
	return "good";
}
