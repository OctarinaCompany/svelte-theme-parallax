import { getContext, hasContext, setContext } from "svelte";
import { tv } from "tailwind-variants";

import type { StatusVariant } from "$lib/components/ui/status/index.js";

/**
 * Every value {@link StatusMonitorStatus} accepts.
 *
 * Upstream's vocabulary is `normal | warning | error | empty`. Two of
 * those names are renamed here to the ones this library's tokens and every other status API in it
 * already speak: upstream's `normal` is this house's `success`, and upstream's `error` is
 * `destructive`. `ui/status/status.svelte` made exactly that call for `error`, and the reason is
 * the same one — a kit that says `error` in one component and `destructive` in the next ships two
 * vocabularies, so a consumer has to learn which one each file speaks and the tokens line up with
 * neither. One vocabulary, not two.
 *
 * `empty` keeps its upstream name. It is the absence of a measurement rather than a severity, so
 * it paints `muted` and is excluded from the uptime ratio.
 */
export const STATUS_MONITOR_STATUSES = ["success", "warning", "destructive", "empty"] as const;

/** The state one period was measured in. */
export type StatusMonitorStatus = (typeof STATUS_MONITOR_STATUSES)[number];

/**
 * Normalise a possibly untyped runtime value to a known status.
 *
 * Anything outside {@link STATUS_MONITOR_STATUSES} falls back to `"empty"` rather than to a
 * severity: a period whose status nobody recognises is a period nobody measured, and painting it
 * green would be a claim the data does not support.
 */
export function resolveStatusMonitorStatus(value?: string): StatusMonitorStatus {
	return STATUS_MONITOR_STATUSES.includes(value as StatusMonitorStatus)
		? (value as StatusMonitorStatus)
		: "empty";
}

/** Every value {@link StatusMonitorUnit} accepts, in upstream declaration order. */
export const STATUS_MONITOR_UNITS = ["days", "hours"] as const;

/** The period one bar stands for. Only the legend and the timestamp format read it. */
export type StatusMonitorUnit = (typeof STATUS_MONITOR_UNITS)[number];

/** Normalise a possibly untyped runtime value to a known unit. */
export function resolveStatusMonitorUnit(value?: string): StatusMonitorUnit {
	return STATUS_MONITOR_UNITS.includes(value as StatusMonitorUnit)
		? (value as StatusMonitorUnit)
		: "days";
}

/** One measured period — upstream's `AppStatusData`. */
export type StatusMonitorPeriod = {
	/** The state the period was measured in. */
	status: StatusMonitorStatus;
	/** When the period was measured. A `Date` is formatted; a string is shown verbatim. */
	timestamp?: string | Date;
	/** Overrides the built-in sentence for {@link status} in the tooltip. */
	info?: string;
};

/** The tooltip headline per status. */
export const STATUS_MONITOR_LABELS: Record<StatusMonitorStatus, string> = {
	success: "Normal",
	warning: "Warning",
	destructive: "Error",
	empty: "No data",
};

/** The tooltip sentence used when a period carries no `info` of its own. */
export const STATUS_MONITOR_INFO: Record<StatusMonitorStatus, string> = {
	success: "Systems are operating normally.",
	warning: "Systems are operating with elevated risk or degraded service.",
	destructive: "A service-impacting incident is active.",
	empty: "No status data was recorded for this period.",
};

/**
 * The `ui/status` variant each status wears in the tooltip.
 *
 * The mapping is the identity for the three severities, which is the point of renaming them: the
 * pill the monitor shows is the same object the rest of the theme shows for the same state. `empty`
 * has no severity, so it takes Status's neutral `default`.
 */
export const STATUS_MONITOR_STATUS_VARIANTS: Record<StatusMonitorStatus, StatusVariant> = {
	success: "success",
	warning: "warning",
	destructive: "destructive",
	empty: "default",
};

/** One bar's width in pixels — upstream `BAR_WIDTH_PX`. */
export const STATUS_MONITOR_BAR_WIDTH = 5;
/** The gap between two bars in pixels — upstream `BAR_GAP_PX`. */
export const STATUS_MONITOR_BAR_GAP = 2;
/** The narrowest strip, and the seed before the first measurement — upstream `MIN_VISIBLE_SLOTS`. */
export const STATUS_MONITOR_MIN_SLOTS = 30;
/** The longest history kept; anything older is dropped — upstream's `slice(-90)`. */
export const STATUS_MONITOR_MAX_SLOTS = 90;
/** The slot counts tried in order, widest first — upstream `SLOT_COUNTS`. */
export const STATUS_MONITOR_SLOT_COUNTS = [
	STATUS_MONITOR_MAX_SLOTS,
	60,
	STATUS_MONITOR_MIN_SLOTS,
] as const;

/**
 * The exact pixel width `slots` bars occupy — upstream `getTimelineWidth`.
 *
 * The header and the legend are laid out at this width too, so their two ends sit over the first
 * and last bar rather than over the container's padding.
 */
export function getStatusMonitorTrackWidth(slots: number): number {
	return slots * STATUS_MONITOR_BAR_WIDTH + (slots - 1) * STATUS_MONITOR_BAR_GAP;
}

/**
 * How many bars fit in `width` — upstream `calculateNumDisplayableBars`.
 *
 * A width of `0` (nothing measured yet) matches no entry and yields the minimum, which is the value
 * upstream seeds its state with, so the first paint agrees with upstream's first paint.
 */
export function resolveStatusMonitorSlots(width: number): number {
	return (
		STATUS_MONITOR_SLOT_COUNTS.find((slots) => width >= getStatusMonitorTrackWidth(slots)) ??
		STATUS_MONITOR_MIN_SLOTS
	);
}

/**
 * The period a slot with no measurement shows. Frozen and shared: padding is read-only, and one
 * object for ninety slots is what upstream's `Array(n).fill({ status: 'empty' })` produces too.
 */
export const STATUS_MONITOR_EMPTY_PERIOD: StatusMonitorPeriod = Object.freeze({ status: "empty" });

/**
 * Replace every unusable entry with an empty period, keeping the array's length.
 *
 * This is what makes a gap render as a gap. `Array.from` visits holes and yields `undefined` for
 * them, where `Array.prototype.map` would skip them and hand back a shorter-looking sparse array —
 * so a literal `[a, , c]`, an explicit `undefined`, and an entry carrying a status this version does
 * not know all become one empty bar in place, and the strip keeps its length instead of closing up
 * around the hole.
 *
 * An entry that already has a valid status is returned unchanged, so a caller's own object identity
 * survives and `{#each}` keying stays stable.
 */
export function normaliseStatusMonitorPeriods(
	periods: readonly (StatusMonitorPeriod | null | undefined)[] | null | undefined,
): StatusMonitorPeriod[] {
	if (!periods) return [];

	return Array.from(periods, (period) => {
		if (!period) return STATUS_MONITOR_EMPTY_PERIOD;
		const status = resolveStatusMonitorStatus(period.status);
		return status === period.status ? period : { ...period, status };
	});
}

/**
 * Left-pad to {@link STATUS_MONITOR_MAX_SLOTS} and keep the newest slots — upstream's
 * `paddedStatuses` memo.
 *
 * Padding on the left rather than the right is what puts a short history at the RIGHT-hand,
 * "Current" end of the strip, where the legend says it is.
 */
export function padStatusMonitorPeriods(
	periods: readonly StatusMonitorPeriod[],
): StatusMonitorPeriod[] {
	const padCount = Math.max(0, STATUS_MONITOR_MAX_SLOTS - periods.length);
	const padding = Array.from({ length: padCount }, () => STATUS_MONITOR_EMPTY_PERIOD);

	return [...padding, ...periods].slice(-STATUS_MONITOR_MAX_SLOTS);
}

/**
 * The share of measured periods that were normal, as a percentage — upstream's `uptimePercentage`
 * memo, including its two decisions worth restating:
 *
 * - empty periods are excluded from BOTH sides of the ratio, so a monitor that has been running for
 *   six days does not report 6/90 uptime;
 * - with nothing measured at all the answer is `100`, not `0` — a service with no failures recorded
 *   has not failed.
 */
export function computeStatusMonitorUptime(periods: readonly StatusMonitorPeriod[]): number {
	const measured = periods.filter((period) => period.status !== "empty");
	if (measured.length === 0) return 100;

	const healthy = measured.filter((period) => period.status === "success").length;

	return Number.parseFloat(((healthy / measured.length) * 100).toFixed(2));
}

/**
 * Format a period's timestamp for the tooltip — upstream `formatTimestamp`, with one divergence.
 *
 * A string is returned verbatim: a caller who formatted it already has said how they want it read.
 *
 * A `Date` is formatted against the UNIT, where upstream always formats `month/day/year`. Upstream's
 * own hours demo is what argues for the change — ninety consecutive hours all render as the same
 * `Jul 10, 2026` there, so every bar in the strip claims the same instant and the tooltip stops
 * distinguishing anything. Adding the hour is the smallest fix that keeps the days format identical.
 *
 * The locale is pinned to `en-US`, as upstream pins it: this repository is English-only, and a
 * format that changed with the reader's machine would make the documentation pages non-reproducible.
 */
export function formatStatusMonitorTimestamp(
	timestamp: StatusMonitorPeriod["timestamp"],
	unit: StatusMonitorUnit = "days",
): string | undefined {
	if (!timestamp) return undefined;
	if (!(timestamp instanceof Date)) return timestamp;

	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "2-digit",
		...(unit === "hours"
			? { hour: "2-digit" as const, minute: "2-digit" as const }
			: { year: "numeric" as const }),
	}).format(timestamp);
}

/**
 * THE SINGLE SOURCE OF TRUTH for what one bar paints.
 *
 * The raw status token is the right one HERE and only here: a bar is a fill, not ink on a tint, so
 * `bg-success` / `bg-warning` / `bg-destructive` are used as designed. Upstream's `bg-green-600`,
 * `bg-amber-600` and `bg-red-600` map onto them one for one; its `bg-muted` was already semantic.
 *
 * The rounded ends come from `first:`/`last:` rather than from an index comparison, so the strip
 * cannot disagree with itself when a caller renders bars some other way.
 *
 * The focus ring is `ring-2` with an offset instead of the house control ring
 * (`ring-[3px] ring-ring/50`): that ring is tuned to sit against a control's own border, and a bar
 * is five pixels wide with no border, so at 50% alpha over a saturated fill it does not read.
 */
export const statusMonitorBarVariants = tv({
	base: "size-full cursor-default rounded-none transition-opacity outline-none first:rounded-l-sm last:rounded-r-sm hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
	variants: {
		status: {
			success: "bg-success",
			warning: "bg-warning",
			destructive: "bg-destructive",
			empty: "bg-muted",
		},
	},
	defaultVariants: {
		status: "empty",
	},
});

export type StatusMonitorStateProps = {
	readonly getPeriods: () => readonly (StatusMonitorPeriod | null | undefined)[] | undefined;
	readonly getUnit: () => StatusMonitorUnit;
	readonly getTitle: () => string;
	readonly getShowUptime: () => boolean;
};

/**
 * One instance per `<StatusMonitor.Root>`, published on context and read by every other part.
 *
 * {@link containerWidth} is the only mutable field, and {@link setContainerWidth} is its only
 * writer — the root's resize `$effect` reads the element and writes this, two disjoint sets, so the
 * effect cannot wake on its own write. (`ui/cropper/cropper-image.svelte` is the worked example of
 * what happens when they overlap.)
 */
export class StatusMonitorState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: StatusMonitorStateProps;

	/** The root's measured width in pixels; `0` until the first measurement pass. */
	containerWidth: number = $state(0);

	/** The caller's data with every gap filled in, at the caller's length. */
	readonly periods: StatusMonitorPeriod[] = $derived(
		normaliseStatusMonitorPeriods(this.#props.getPeriods()),
	);
	/** {@link periods} left-padded to the full history and trimmed to it. */
	readonly paddedPeriods: StatusMonitorPeriod[] = $derived(padStatusMonitorPeriods(this.periods));

	readonly unit: StatusMonitorUnit = $derived(this.#props.getUnit());
	readonly title: string = $derived(this.#props.getTitle());
	readonly showUptime: boolean = $derived(this.#props.getShowUptime());

	/** How many bars currently fit. */
	readonly slots: number = $derived(resolveStatusMonitorSlots(this.containerWidth));
	/** The newest {@link slots} periods, oldest first. */
	readonly visiblePeriods: StatusMonitorPeriod[] = $derived(this.paddedPeriods.slice(-this.slots));
	/** The strip's exact width in pixels. */
	readonly trackWidth: number = $derived(getStatusMonitorTrackWidth(this.slots));

	/**
	 * Uptime is computed over what the caller supplied, NOT over the padded history — otherwise
	 * every monitor with a short history would report the padding as measured downtime.
	 */
	readonly uptime: number = $derived(computeStatusMonitorUptime(this.periods));

	/**
	 * The three custom properties the root publishes, as a CSS declaration string.
	 *
	 * The bar width and the gap travel as variables rather than as utility classes because
	 * {@link getStatusMonitorTrackWidth} computes the strip's width from the same two constants: a
	 * `gap-0.5` written by hand would be a second copy of the number, free to drift out of step with
	 * the width the header and legend are laid out at.
	 */
	readonly customProperties: string = $derived(
		[
			`--status-monitor-bar-width: ${STATUS_MONITOR_BAR_WIDTH}px;`,
			`--status-monitor-bar-gap: ${STATUS_MONITOR_BAR_GAP}px;`,
			`--status-monitor-track-width: ${this.trackWidth}px;`,
		].join(" "),
	);

	constructor(props: StatusMonitorStateProps) {
		this.#props = props;
	}

	/** Store one measurement pass. Idempotent, so an observer that fires on every frame settles. */
	setContainerWidth(width: number): void {
		if (this.containerWidth === width) return;
		this.containerWidth = width;
	}

	/** The tooltip headline for a period. */
	labelOf(period: StatusMonitorPeriod): string {
		return STATUS_MONITOR_LABELS[period.status];
	}

	/** The tooltip sentence for a period — its own `info`, or the built-in one for its status. */
	infoOf(period: StatusMonitorPeriod): string {
		return period.info ?? STATUS_MONITOR_INFO[period.status];
	}

	/** The period's timestamp, formatted against the current unit. */
	timestampOf(period: StatusMonitorPeriod): string | undefined {
		return formatStatusMonitorTimestamp(period.timestamp, this.unit);
	}

	/**
	 * The bar's accessible name — upstream's `${timestamp}: ${label}`, falling back to the label
	 * alone. It is the only channel that carries a bar's state without colour, so it is not optional.
	 */
	accessibleNameOf(period: StatusMonitorPeriod): string {
		const timestamp = this.timestampOf(period);
		const label = this.labelOf(period);

		return timestamp ? `${timestamp}: ${label}` : label;
	}
}

/**
 * Observe `element`'s width and report it, plus once eagerly so a monitor that is never resized
 * still measures.
 *
 * Returns a teardown that disconnects the observer. SSR-guarded: with no `window` or no
 * `ResizeObserver` it observes nothing and returns a no-op, so a caller never has to branch. It
 * reads the DOM only, never reactive state, which is what lets the root's `$effect` call it without
 * `untrack`.
 */
export function observeStatusMonitorWidth(
	element: HTMLElement,
	onWidth: (width: number) => void,
): () => void {
	if (typeof window === "undefined" || typeof ResizeObserver === "undefined") {
		return () => {};
	}

	const report = () => onWidth(element.getBoundingClientRect().width);

	const observer = new ResizeObserver(report);
	observer.observe(element);
	report();

	return () => observer.disconnect();
}

const STATUS_MONITOR_CONTEXT_KEY = Symbol("status-monitor");

export function setStatusMonitorContext(state: StatusMonitorState): StatusMonitorState {
	return setContext(STATUS_MONITOR_CONTEXT_KEY, state);
}

export function hasStatusMonitorContext(): boolean {
	return hasContext(STATUS_MONITOR_CONTEXT_KEY);
}

/**
 * Read the root's state, throwing when there is no `<StatusMonitor.Root>` ancestor.
 *
 * `consumerName` is the full part spelling (`'<StatusMonitor.Track>'`) so the message names both the
 * part and its provider.
 */
export function getStatusMonitorContext(consumerName: string): StatusMonitorState {
	if (!hasStatusMonitorContext()) {
		throw new Error(`\`${consumerName}\` must be used within \`<StatusMonitor.Root>\`.`);
	}
	return getContext<StatusMonitorState>(STATUS_MONITOR_CONTEXT_KEY);
}
