<script lang="ts" module>
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";

	export type AlertDialogOverlayProps = AlertDialogPrimitive.OverlayProps;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	let { ref = $bindable(null), class: className, ...restProps }: AlertDialogOverlayProps = $props();
</script>

<!-- Upstream `AlertDialogOverlay` + the vega
`cn-alert-dialog-overlay` rule (style-vega.css:20-22) — identical to the dialog overlay:
a light scrim that leans on backdrop blur where supported. -->
<AlertDialogPrimitive.Overlay
	bind:ref
	data-slot="alert-dialog-overlay"
	class={cn(
		"fixed inset-0 z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
		className,
	)}
	{...restProps}
/>
