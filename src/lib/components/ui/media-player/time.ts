/**
 * Duration formatting, reproducing `media-chrome`'s `timeUtils.formatTime` (upstream imports it from
 * `media-chrome/react/media-store`, which this theme does not depend on).
 *
 * `M:SS` normally, `H:MM:SS` once either `seconds` or `guide` reaches an hour, `0:00` for values
 * that carry no duration (`NaN`, `Infinity`), and a leading `-` for negative durations so a
 * remaining-time readout can count past the end.
 *
 * This is the only duration formatter in the repository and is re-exported from the component's
 * barrel so later ports reuse it rather than re-deriving the rules.
 *
 * @param seconds The time to render.
 * @param guide A second time whose magnitude decides the field width — pass the media's duration so
 * `0:05` of a two-hour video renders as `0:00:05` and lines up with the duration beside it.
 */
export function formatTime(seconds: number, guide: number = seconds): string {
	let value = seconds;
	let negative = false;

	if (value < 0) {
		negative = true;
		value = -value;
	}

	let hours = Math.floor(value / 3600);
	let minutes = Math.floor((value / 60) % 60);
	let secs = Math.floor(value % 60);

	// A value that carries no duration renders as a zeroed clock rather than `NaN:NaN`.
	if (!Number.isFinite(value)) {
		hours = 0;
		minutes = 0;
		secs = 0;
	}

	// An unusable guide must not widen the clock either, or `formatTime(NaN)` would grow an hour
	// field it can never fill.
	const safeGuide = Number.isFinite(guide) ? guide : 0;
	const guideMinutes = Math.floor((safeGuide / 60) % 60);
	const guideHours = Math.floor(safeGuide / 3600);

	const hourField = hours > 0 || guideHours > 0 ? `${hours}:` : "";
	const minuteField =
		(hourField !== "" || guideMinutes >= 10) && minutes < 10 ? `0${minutes}` : `${minutes}`;
	const secondField = secs < 10 ? `0${secs}` : `${secs}`;

	return `${negative ? "-" : ""}${hourField}${minuteField}:${secondField}`;
}
