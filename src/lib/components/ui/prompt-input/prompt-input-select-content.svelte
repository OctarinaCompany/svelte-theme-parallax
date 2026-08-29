<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import * as Select from "$lib/components/ui/select/index.js";

	export type PromptInputSelectContentProps = ComponentProps<typeof Select.Content>;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	/**
	 * The picker's list — `Select.Content` untouched, named so a composer reads as one family of
	 * parts. The `data-slot` stays `select-content`: `src/app.css` removes the popover shadow by
	 * that name.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: PromptInputSelectContentProps = $props();
</script>

<Select.Content bind:ref class={cn(className)} {...restProps}>
	{@render children?.()}
</Select.Content>
