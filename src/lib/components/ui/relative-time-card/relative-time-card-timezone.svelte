<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	import type { DateInput } from "./relative-time-format.js";

	export type RelativeTimeCardTimezoneProps = WithElementRef<
		WithoutChildren<HTMLAttributes<HTMLDivElement>>
	> & {
		/** The instant to render in {@link RelativeTimeCardTimezoneProps.timezone}. */
		date: DateInput;
		/**
		 * IANA identifier of the zone to render in. Omit it for the viewer's own zone, which is
		 * labelled with its short UTC offset instead.
		 */
		timezone?: string;
	};
</script>

<script lang="ts">
	import {
		formatTimeZoneAccessibleName,
		formatTimeZoneLabel,
		formatZonedDate,
		formatZonedTime,
		resolveLocale,
		toDate,
		toIsoString,
	} from "./relative-time-format.js";

	let {
		ref = $bindable(null),
		date,
		timezone,
		class: className,
		...restProps
	}: RelativeTimeCardTimezoneProps = $props();

	const locale = resolveLocale();

	const parsedDate = $derived(toDate(date));
	const label = $derived(formatTimeZoneLabel(parsedDate, locale, timezone));
	const isoString = $derived(toIsoString(parsedDate));
</script>

<!--
	`role` and `aria-label` are written *before* the spread so a caller can supersede them — that is
	how `<RelativeTimeCard>` turns each row into a `listitem` inside its `role="list"` wrapper,
	exactly as upstream does.
-->
<div
	bind:this={ref}
	data-slot="relative-time-card-timezone"
	data-timezone={label}
	data-local={timezone === undefined ? "" : undefined}
	role="region"
	aria-label={formatTimeZoneAccessibleName(parsedDate, locale, timezone)}
	{...restProps}
	class={cn("flex items-center justify-between gap-2 text-sm text-muted-foreground", className)}
>
	<span class="w-fit rounded bg-accent px-1 text-xs font-medium">{label}</span>
	<div class="flex items-center gap-2">
		<time datetime={isoString}>{formatZonedDate(parsedDate, locale, timezone)}</time>
		<time datetime={isoString} class="tabular-nums">
			{formatZonedTime(parsedDate, locale, timezone)}
		</time>
	</div>
</div>
