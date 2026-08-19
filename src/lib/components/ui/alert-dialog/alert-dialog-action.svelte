<script lang="ts" module>
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";

	import type { ButtonSize, ButtonVariant } from "$lib/components/ui/button/index.js";

	export type AlertDialogActionProps = AlertDialogPrimitive.ActionProps & {
		/** Any Button variant; the confirming action defaults to the primary one. */
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
		variant = "default",
		size = "default",
		...restProps
	}: AlertDialogActionProps = $props();
</script>

<!-- Upstream `AlertDialogAction` wraps the Radix Action in
`<Button asChild>`. Inverted here: the bits-ui primitive stays the rendered element and takes
`buttonVariants` classes directly, so it keeps its close-on-click behaviour and we avoid a
button-in-button child-snippet sandwich. Same trade the ui/dialog close button already makes
in reverse. -->
<AlertDialogPrimitive.Action
	bind:ref
	data-slot="alert-dialog-action"
	class={cn(buttonVariants({ variant, size }), className)}
	{...restProps}
/>
