<script lang="ts" module>
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";

	export type AlertDialogDescriptionProps = AlertDialogPrimitive.DescriptionProps;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: AlertDialogDescriptionProps = $props();
</script>

<!-- Upstream `AlertDialogDescription` + the vega
`cn-alert-dialog-description` rule (style-vega.css:40-42): muted body copy with balanced
wrapping, and inline links styled here so demo prose can drop a bare `<a>`. -->
<AlertDialogPrimitive.Description
	bind:ref
	data-slot="alert-dialog-description"
	class={cn(
		"text-sm text-balance text-muted-foreground md:text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
		className,
	)}
	{...restProps}
/>
