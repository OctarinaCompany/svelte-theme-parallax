<script lang="ts">
	import TruckIcon from "@lucide/svelte/icons/truck";

	/**
	 * The body of the gallery's "Toast with icon", which hands JSX straight
	 * to `toast()`.
	 *
	 * IT IS A COMPONENT BECAUSE THE PORT HAS NO OTHER FORM. svelte-sonner types a toast's title
	 * as `string | AnyComponent` and renders the non-string case as `<Title {...componentProps} />`
	 * (`svelte-sonner/dist/Toast.svelte`). There is no snippet overload and nothing to inline at
	 * the call site, so arbitrary toast content arrives as a component or not at all.
	 *
	 * NOT ROUTED THROUGH sonner's OWN ICON SLOT. `toast(message, { icon })` exists, and
	 * `ui/sonner/sonner.svelte` already fills that slot with the five type icons at `size-4`.
	 * Using it here would have turned this into a sixth type icon rather than what upstream is
	 * demonstrating — free-form content in the toast body — and the slot carries sonner's own
	 * `--toast-icon-margin-end: 4px` rather than the 8px gap upstream draws.
	 *
	 * the classic `.toast-header` does have a leading-image slot, but the classic theme's own example at
	 * `the reference docs#toasts` drops it: the header there is `<strong>the classic framework</strong>`,
	 * a `<small>` timestamp and a `.btn-close`, and nothing else. So there is no classic value to
	 * port for the icon's size or spacing, and both stay as upstream draws them.
	 */
</script>

<div class="flex items-center gap-2">
	<TruckIcon class="size-5.5 shrink-0" />
	Your order has been successfully placed, and your parcel is on its way.
</div>
