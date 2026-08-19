<script lang="ts" module>
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";

	export type AlertDialogPortalProps = AlertDialogPrimitive.PortalProps;
</script>

<script lang="ts">
	let { ...restProps }: AlertDialogPortalProps = $props();
</script>

<!-- Upstream `AlertDialogPortal`. bits-ui's Portal renders no DOM
element of its own, so upstream's `data-slot` has nowhere to land and is dropped — the same
call the sibling `ui/dialog` port made. -->
<AlertDialogPrimitive.Portal {...restProps} />
