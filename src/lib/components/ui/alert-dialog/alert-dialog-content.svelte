<script lang="ts" module>
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";
	import { tv } from "tailwind-variants";

	import type { WithoutChildrenOrChild } from "$lib/utils.js";
	import type { AlertDialogSize } from "./alert-dialog.svelte.js";

	/**
	 * Upstream splits this between inline classes and the vega
	 * `cn-alert-dialog-content` rule (style-vega.css:24-26). The `data-[size=...]` max-widths of
	 * the CSS rule become a proper `size` variant here; the `data-size` attribute is still
	 * rendered because Header, Footer, Media and Title read it through the named group.
	 */
	export const alertDialogContentVariants = tv({
		base: "group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-xl bg-popover p-6 text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
		variants: {
			size: {
				default: "sm:max-w-lg",
				sm: "sm:max-w-xs",
			},
		},
		defaultVariants: {
			size: "default",
		},
	});

	export type AlertDialogContentProps =
		WithoutChildrenOrChild<AlertDialogPrimitive.ContentProps> & {
			portalProps?: AlertDialogPrimitive.PortalProps;
			children: Snippet;
			/**
			 * Content width preset. Also steers Header/Footer/Media/Title layout via `data-size`.
			 * @default "default"
			 */
			size?: AlertDialogSize;
		};
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import AlertDialogOverlay from "./alert-dialog-overlay.svelte";
	import AlertDialogPortal from "./alert-dialog-portal.svelte";

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		size = "default",
		children,
		...restProps
	}: AlertDialogContentProps = $props();
</script>

<!-- Upstream `AlertDialogContent`: portal + overlay are baked in,
and unlike the dialog sibling there is no close button — an alert dialog must be answered,
not dismissed. `max-w-[calc(100%-2rem)]` replaces vega's unconditional `max-w-xs` mobile cap
so small screens keep the same gutter the dialog sibling uses; the `sm:` widths are vega's. -->
<AlertDialogPortal {...portalProps}>
	<AlertDialogOverlay />
	<AlertDialogPrimitive.Content
		bind:ref
		data-slot="alert-dialog-content"
		data-size={size}
		class={cn(alertDialogContentVariants({ size }), className)}
		{...restProps}
	>
		{@render children?.()}
	</AlertDialogPrimitive.Content>
</AlertDialogPortal>
