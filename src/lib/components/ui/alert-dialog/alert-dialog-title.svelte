<script lang="ts" module>
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";

	export type AlertDialogTitleProps = AlertDialogPrimitive.TitleProps;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	let { ref = $bindable(null), class: className, ...restProps }: AlertDialogTitleProps = $props();
</script>

<!-- Upstream `AlertDialogTitle` + the vega `cn-alert-dialog-title`
rule (style-vega.css:36-38). Upstream also tags `cn-font-heading`, which vega never defines, so
it is dropped rather than invented. The `col-start-2` selector moves the title beside a Media
sibling once the default-size header collapses to two rows at `sm:`. -->
<AlertDialogPrimitive.Title
	bind:ref
	data-slot="alert-dialog-title"
	class={cn(
		"text-lg font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2",
		className,
	)}
	{...restProps}
/>
