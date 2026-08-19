<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";

	export const tabsListVariants = tv({
		base: "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col group-data-horizontal/tabs:h-9 data-[variant=line]:rounded-none",
		variants: {
			variant: {
				default: "cn-tabs-list-variant-default bg-muted",
				line: "cn-tabs-list-variant-line gap-1 bg-transparent",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type TabsListVariant = VariantProps<typeof tabsListVariants>["variant"];
</script>

<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		variant = "default",
		size = "default",
		class: className,
		...restProps
	}: TabsPrimitive.ListProps & {
		variant?: TabsListVariant;
		/**
		 * `sm` is the classic theme's `.nav-tabs-sm` on the `line` variant — `app.css` keys its type and
		 * spacing on `[data-size="sm"]`. The attribute used to be reachable only by smuggling
		 * it through `restProps`; the prop makes the existing CSS API visible. A later
		 * `restProps` `data-size` still wins, so smuggling call sites keep working.
		 */
		size?: "default" | "sm";
	} = $props();
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	data-variant={variant}
	data-size={size}
	class={cn(tabsListVariants({ variant }), className)}
	{...restProps}
/>
