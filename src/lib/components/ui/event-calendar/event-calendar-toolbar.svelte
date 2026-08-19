<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type EventCalendarToolbarProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import { getEventCalendarViewConfig } from "./event-calendar.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: EventCalendarToolbarProps = $props();

	const viewConfig = getEventCalendarViewConfig();
</script>

<!-- Free slot for consumer toolbar buttons; pure layout shell. -->
<div
	bind:this={ref}
	data-slot="event-calendar-toolbar"
	{...restProps}
	class={cn("flex items-center gap-2", viewConfig.classNames?.toolbar, className)}
>
	{@render children?.()}
</div>
