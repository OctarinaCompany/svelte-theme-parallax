<script lang="ts" module>
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";

	export type AlertDialogRootProps = AlertDialogPrimitive.RootProps;
</script>

<script lang="ts">
	let { open = $bindable(false), ...restProps }: AlertDialogRootProps = $props();
</script>

<!-- Upstream `AlertDialog`: a bare pass-through to the Radix root.
bits-ui owns the open state; `bind:open` + bits-ui's own `onOpenChange` give the house
bindable/callback pair. -->
<AlertDialogPrimitive.Root bind:open {...restProps} />
