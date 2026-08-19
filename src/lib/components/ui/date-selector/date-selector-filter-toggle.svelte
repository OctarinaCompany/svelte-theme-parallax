<script lang="ts" module>
	import type { DateSelectorFilterType } from "./date-selector.svelte.js";

	export type DateSelectorFilterToggleProps = {
		/** The active operator. Controlled by `<DateSelector.Root>`. */
		value: DateSelectorFilterType;
		/** Called with the next operator on every accepted tab change. */
		onValueChange: (value: DateSelectorFilterType) => void;
		/**
		 * Whether the `between` tab renders. The root passes `allowRange` here — a selector that
		 * cannot hold ranges must not offer the range operator.
		 * @default true
		 */
		showBetween?: boolean;
		/**
		 * Whether the `is` tab renders.
		 * @default true
		 */
		showIs?: boolean;
		/**
		 * A pinned operator. When set the whole toggle dims and stops reacting — the operator is
		 * the host's decision, not the user's.
		 */
		presetMode?: DateSelectorFilterType;
		class?: string;
	};
</script>

<script lang="ts">
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import { cn } from "$lib/utils.js";

	import { getDateSelectorContext } from "./date-selector.svelte.js";

	let {
		value,
		onValueChange,
		showBetween = true,
		showIs = true,
		presetMode,
		class: className,
	}: DateSelectorFilterToggleProps = $props();

	const selector = getDateSelectorContext("<DateSelector.FilterToggle>");

	const isDisabled = $derived(presetMode !== undefined);
</script>

<!--
	Port of upstream `DateSelectorFilterToggle`. Upstream spreads
	`className` onto both the Tabs root and its list; that duplication is kept for parity.
-->
<Tabs.Root
	{value}
	onValueChange={(next) => {
		if (!isDisabled && next) {
			onValueChange(next as DateSelectorFilterType);
		}
	}}
	class={className}
	data-slot="date-selector-filter-toggle"
>
	<Tabs.List class={cn("bg-muted/80", isDisabled && "pointer-events-none opacity-50", className)}>
		{#if showIs}
			<Tabs.Trigger value="is" aria-label={selector.i18n.filterTypes.is} class="py-1 font-normal">
				{selector.i18n.filterTypes.is}
			</Tabs.Trigger>
		{/if}
		<Tabs.Trigger
			value="before"
			aria-label={selector.i18n.filterTypes.before}
			class="py-1 font-normal"
		>
			{selector.i18n.filterTypes.before}
		</Tabs.Trigger>
		<Tabs.Trigger
			value="after"
			aria-label={selector.i18n.filterTypes.after}
			class="py-1 font-normal"
		>
			{selector.i18n.filterTypes.after}
		</Tabs.Trigger>
		{#if showBetween}
			<Tabs.Trigger
				value="between"
				aria-label={selector.i18n.filterTypes.between}
				class="py-1 font-normal"
			>
				{selector.i18n.filterTypes.between}
			</Tabs.Trigger>
		{/if}
	</Tabs.List>
</Tabs.Root>
