import Root from "./relative-time-card.svelte";
import Timezone from "./relative-time-card-timezone.svelte";

export type {
	RelativeTimeCardProps,
	RelativeTimeCardChildProps,
	RelativeTimeCardPositioningProps,
} from "./relative-time-card.svelte";
export type { RelativeTimeCardTimezoneProps } from "./relative-time-card-timezone.svelte";

export {
	RELATIVE_TIME_CARD_VARIANTS,
	DEFAULT_TIMEZONES,
	DEFAULT_UPDATE_INTERVAL,
	DEFAULT_OPEN_DELAY,
	DEFAULT_CLOSE_DELAY,
	relativeTimeCardTriggerVariants,
	resolveRelativeTimeCardVariant,
	RelativeTimeCardState,
	type RelativeTimeCardVariant,
	type RelativeTimeCardStateProps,
} from "./relative-time-card.svelte.js";

export {
	JUST_NOW_LABEL,
	JUST_NOW_THRESHOLD_SECONDS,
	RELATIVE_CUTOFF_DAYS,
	toDate,
	isValidDate,
	toIsoString,
	resolveLocale,
	diffRelativeTime,
	formatRelativeTime,
	formatRelativeTimeAt,
	formatAbsoluteDateTime,
	formatZonedDate,
	formatZonedTime,
	formatTimeZoneLabel,
	formatTimeZoneAccessibleName,
	type DateInput,
	type RelativeTimeParts,
} from "./relative-time-format.js";

export {
	Root,
	Timezone,
	//
	Root as RelativeTimeCard,
	Timezone as RelativeTimeCardTimezone,
};
