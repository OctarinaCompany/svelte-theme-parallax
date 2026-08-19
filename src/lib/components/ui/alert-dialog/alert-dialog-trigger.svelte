<script lang="ts" module>
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";

	export type AlertDialogTriggerProps = AlertDialogPrimitive.TriggerProps;
</script>

<script lang="ts">
	let { ref = $bindable(null), type = "button", ...restProps }: AlertDialogTriggerProps = $props();
</script>

<!-- Upstream `AlertDialogTrigger`. Radix `asChild` becomes
bits-ui's `child` snippet, which the primitive already supports through `restProps`. -->
<AlertDialogPrimitive.Trigger bind:ref data-slot="alert-dialog-trigger" {type} {...restProps} />
