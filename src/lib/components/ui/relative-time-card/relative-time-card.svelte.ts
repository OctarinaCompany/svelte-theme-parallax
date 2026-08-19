import { tv } from "tailwind-variants";

import {
	formatAbsoluteDateTime,
	formatRelativeTimeAt,
	isValidDate,
	toIsoString,
} from "./relative-time-format.js";

/** `timezones` fallback — upstream `timezones = ["UTC"]`. */
export const DEFAULT_TIMEZONES: readonly string[] = Object.freeze(["UTC"]);

/** `updateInterval` fallback in ms — upstream `updateInterval = 1000` (line 160). */
export const DEFAULT_UPDATE_INTERVAL = 1000;

/** `openDelay` fallback in ms — upstream `openDelay = 500` (line 152). */
export const DEFAULT_OPEN_DELAY = 500;

/** `closeDelay` fallback in ms — upstream `closeDelay = 300` (line 153). */
export const DEFAULT_CLOSE_DELAY = 300;

/**
 * Every value `variant` accepts, in upstream declaration order (lines 111-119). Upstream's third
 * variant is named `ghost`; its only styling is `hover:underline`, which is this kit's *link*
 * behaviour (`Button`'s `link` variant), so it is renamed `link` here — `ghost` would promise the
 * accent-wash treatment the house ghost buttons have and deliver an underline instead.
 */
export const RELATIVE_TIME_CARD_VARIANTS = ["default", "muted", "link"] as const;

/** The visual style of the trigger. */
export type RelativeTimeCardVariant = (typeof RELATIVE_TIME_CARD_VARIANTS)[number];

/**
 * Normalise a possibly untyped runtime value to a known variant.
 * Anything outside {@link RELATIVE_TIME_CARD_VARIANTS} falls back to `"default"`.
 */
export function resolveRelativeTimeCardVariant(value?: string): RelativeTimeCardVariant {
	return (RELATIVE_TIME_CARD_VARIANTS as readonly string[]).includes(value ?? "")
		? (value as RelativeTimeCardVariant)
		: "default";
}

/**
 * Upstream `triggerVariants` (lines 107-121), with upstream's focus treatment
 * (`focus-visible:outline-none` plus a hard `ring-2 ring-ring ring-offset-2`) re-mapped to this
 * repo's focus family — `outline-none` paired with `focus-visible:ring-3
 * focus-visible:ring-ring/50`, as `button.svelte` and every conforming port use — so the trigger
 * always shows the kit's soft ring instead of the UA outline.
 */
export const relativeTimeCardTriggerVariants = tv({
	base: "inline-flex w-fit items-center justify-center text-sm text-foreground/70 transition-colors outline-none hover:text-foreground/90 focus-visible:ring-3 focus-visible:ring-ring/50",
	variants: {
		variant: {
			default: "",
			muted: "text-foreground/50 hover:text-foreground/70",
			link: "hover:underline",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

/**
 * A runes reader over `(hover: hover)` — whether the primary pointer can hover — SSR-safe and
 * reactive to a mouse/trackpad being attached or detached at runtime. Seeded `true` so a
 * server-rendered trigger behaves like a hover device until the client corrects it, mirroring
 * `IsMobile`'s SSR seed (`$lib/hooks/is-mobile.svelte.ts`).
 *
 * bits-ui's `LinkPreviewTriggerState` ignores every touch-originated pointer event outright
 * (Radix parity: `onpointerenter`/`onpointerleave` both bail on `isTouch(e)`), so a device whose
 * only input is touch — an iPad with nothing else attached — can never open the card through
 * hover at all. The root reads `current` to add a deliberate tap-to-open fallback (a divergence:
 * upstream has none), gated so it stays inert on any device hover already works on.
 */
class SupportsHover {
	current: boolean = $state(true);

	constructor() {
		$effect(() => {
			if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

			const query = window.matchMedia("(hover: hover)");
			const onChange = () => {
				this.current = query.matches;
			};

			this.current = query.matches;
			query.addEventListener("change", onChange);

			return () => query.removeEventListener("change", onChange);
		});
	}
}

/** Must be called during component initialisation — it creates `$state` and an `$effect`. */
export function useSupportsHover(): SupportsHover {
	return new SupportsHover();
}

/**
 * Reactive inputs for {@link RelativeTimeCardState}. They arrive as getter functions so the class
 * keeps tracking the root's props instead of snapshotting them.
 */
export type RelativeTimeCardStateProps = {
	/** The normalised instant the card describes. */
	getDate: () => Date;
	/** The locale every label is formatted in. */
	getLocale: () => string;
	/** How often, in ms, the relative label is recomputed. */
	getUpdateInterval: () => number;
};

/**
 * The only reactive state the component owns: *now*.
 *
 * Upstream keeps the formatted string in `useState` and rewrites it on every tick and on every
 * `date`/`updateInterval` change. Here the string is `$derived`,
 * so a `date` change needs no effect at all and the ticker exists purely to move the clock.
 */
export class RelativeTimeCardState {
	// Assigned in the constructor. `$derived` field initialisers below are lazy, so none of them
	// reads this before it is set — the same shape `BannersState` uses.
	#props!: RelativeTimeCardStateProps;

	/** Epoch milliseconds the relative label is computed against. Written only by the ticker. */
	now = $state(Date.now());

	readonly date: Date = $derived(this.#props.getDate());
	readonly isValid: boolean = $derived(isValidDate(this.date));
	readonly isoString: string | undefined = $derived(toIsoString(this.date));
	readonly absoluteLabel: string = $derived(
		formatAbsoluteDateTime(this.date, this.#props.getLocale()),
	);
	readonly relativeLabel: string = $derived(
		formatRelativeTimeAt(this.date, this.now, this.#props.getLocale()),
	);

	constructor(props: RelativeTimeCardStateProps) {
		this.#props = props;
	}

	/**
	 * Start moving the clock. Reads **only** `getUpdateInterval()`, so the root's `$effect`
	 * re-subscribes when the cadence changes and not when `date` changes. The returned teardown is
	 * what the effect must return, and is the sole owner of the interval.
	 */
	startTicker(): () => void {
		const interval = setInterval(() => {
			this.now = Date.now();
		}, this.#props.getUpdateInterval());

		return () => clearInterval(interval);
	}
}
