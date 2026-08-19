<script lang="ts" module>
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";

	import type { ButtonSize, ButtonVariant } from "$lib/components/ui/button/index.js";

	export type AlertDialogCancelProps = AlertDialogPrimitive.CancelProps & {
		/** Any Button variant; the dismissing action defaults to the quiet outline. */
		variant?: ButtonVariant;
		size?: ButtonSize;
	};
</script>

<script lang="ts">
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		variant = "outline",
		size = "default",
		...restProps
	}: AlertDialogCancelProps = $props();
</script>

<!-- Upstream `AlertDialogCancel`: same construction as the
Action part, with `outline` as the default so Cancel visually yields to the Action. -->
<AlertDialogPrimitive.Cancel
	bind:ref
	data-slot="alert-dialog-cancel"
	class={cn(buttonVariants({ variant, size }), className)}
	{...restProps}
/>
