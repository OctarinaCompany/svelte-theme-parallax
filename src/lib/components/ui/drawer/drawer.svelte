<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";

	/**
	 * `autoFocus` defaults to `true` here, against vaul-svelte's own `false`.
	 *
	 * With it off, opening a drawer leaves focus on the trigger: the dialog is open, its focus trap
	 * is armed, and a keyboard or screen-reader user is still outside it with nothing announced —
	 * the only one of this kit's four overlays that behaves that way (Dialog, Sheet and AlertDialog
	 * all land inside). vaul's default is a mobile-keyboard compromise; the drawer ships here as a
	 * desktop overlay too, and `autoFocus={false}` still puts the compromise back.
	 */
	let {
		shouldScaleBackground = true,
		autoFocus = true,
		open = $bindable(false),
		activeSnapPoint = $bindable(null),
		...restProps
	}: DrawerPrimitive.RootProps = $props();
</script>

<DrawerPrimitive.Root
	{shouldScaleBackground}
	{autoFocus}
	bind:open
	bind:activeSnapPoint
	{...restProps}
/>
