import type { StatusMonitorPeriod } from "$lib/components/ui/status-monitor/index.js";

/**
 * The three histories the Status monitor page draws, transcribed from upstream's demos.
 *
 * They live in a module rather than in the page because they are ninety-entry generated arrays and
 * the page is meant to read as markup. Both timelines are built from a FIXED epoch — never
 * `Date.now()` — so the page renders the same picture on every visit and a screenshot taken today
 * still matches one taken next year.
 *
 * Upstream's `normal` is spelled `success` and its `error` is `destructive`, which is the whole
 * point of the rename; see `ui/status-monitor/status-monitor.svelte.ts`.
 */

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const HOUR_IN_MS = 60 * 60 * 1000;

/** Ninety days of an API, with two incidents and a scatter of degraded days. */
export const API_PERIODS: StatusMonitorPeriod[] = Array.from({ length: 90 }, (_, index) => {
	const day = index + 1;
	const timestamp = new Date(Date.UTC(2026, 3, 1) + index * DAY_IN_MS);

	if (day === 44 || day === 72) {
		return {
			status: "destructive",
			timestamp,
			info: "API availability dropped while failover completed.",
		};
	}

	if (day % 17 === 0 || day % 29 === 0) {
		return {
			status: "warning",
			timestamp,
			info: "Latency was elevated, but requests continued to complete.",
		};
	}

	return {
		status: "success",
		timestamp,
		info: "All checks completed within the expected threshold.",
	};
});

/** Ninety hours of a checkout flow: one three-hour outage, one longer degraded stretch. */
export const CHECKOUT_PERIODS: StatusMonitorPeriod[] = Array.from({ length: 90 }, (_, index) => {
	const hour = index + 1;
	const timestamp = new Date(Date.UTC(2026, 6, 10) + index * HOUR_IN_MS);

	if (hour >= 54 && hour <= 56) {
		return {
			status: "destructive",
			timestamp,
			info: "Checkout requests failed during a payment provider outage.",
		};
	}

	if ((hour >= 34 && hour <= 38) || hour === 76) {
		return {
			status: "warning",
			timestamp,
			info: "Queue depth increased while background jobs caught up.",
		};
	}

	return {
		status: "success",
		timestamp,
		info: "No active incidents were detected for this hour.",
	};
});

/**
 * Six days of a service that has only just been switched on, with one day nobody measured.
 *
 * The `undefined` at index 3 is deliberate and is not in upstream's demo, which spells that slot out
 * as `{ status: 'empty' }`. It is the case the component has to survive: a history assembled from a
 * query that simply returned no row for a day. It must render as an empty bar in place, keeping the
 * strip six periods long, rather than closing the gap and shifting every later day one slot toward
 * "Current" — a monitor that silently re-dates its own incidents is worse than one that admits it
 * has a hole.
 */
export const ROLLOUT_PERIODS: (StatusMonitorPeriod | undefined)[] = [
	{
		status: "success",
		timestamp: "Jul 06, 2026",
		info: "Monitoring started for the service.",
	},
	{
		status: "warning",
		timestamp: "Jul 07, 2026",
		info: "A new deployment caused slower health checks.",
	},
	{
		status: "success",
		timestamp: "Jul 08, 2026",
		info: "Health checks returned to the expected baseline.",
	},
	undefined,
	{
		status: "destructive",
		timestamp: "Jul 10, 2026",
		info: "Synthetic checks failed from two regions.",
	},
	{
		status: "success",
		timestamp: "Jul 11, 2026",
		info: "Regional checks recovered.",
	},
];
