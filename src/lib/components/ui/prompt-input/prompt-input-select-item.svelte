<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import * as Select from "$lib/components/ui/select/index.js";

	export type PromptInputSelectItemProps = ComponentProps<typeof Select.Item>;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	/**
	 * One option — `Select.Item` untouched. Pass `label` as well as children: Bits UI types ahead
	 * against `label`, and without it the typeahead matches the raw `value` rather than the text on
	 * screen. The `data-slot` stays `select-item`.
	 */
	let {
		ref = $bindable(null),
		class: className,
		value,
		label,
		children,
		...restProps
	}: PromptInputSelectItemProps = $props();
</script>

<Select.Item bind:ref {value} {label} class={cn(className)} {children} {...restProps} />
