<script lang="ts" module>
	import type { ButtonProps } from "$lib/components/ui/button/index.js";

	export type BannerCloseProps = ButtonProps;
</script>

<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import XIcon from "@lucide/svelte/icons/x";

	import { getBannerContext } from "./banner.svelte.js";

	let {
		ref = $bindable(null),
		variant = "ghost",
		size = "icon-sm",
		disabled,
		onclick: onclickProp,
		"aria-label": ariaLabel,
		children,
		...restProps
	}: BannerCloseProps = $props();

	const banner = getBannerContext("<Banner.Close>");

	const isDisabled = $derived(disabled ?? !banner.dismissible);
	// A caller-supplied `aria-label` always wins; the "Close" default only fills in when there is no
	// visible content to derive an accessible name from.
	const resolvedAriaLabel = $derived(ariaLabel ?? (children ? undefined : "Close"));

	function onclick(event: MouseEvent) {
		// `onclick` on `ButtonProps` is the intersection of the button and anchor DOM handler types,
		// because `Button` renders either element depending on `href`. Widening to their shared
		// `MouseEvent` supertype here is what lets one implementation satisfy both call signatures.
		(onclickProp as unknown as ((event: MouseEvent) => void) | undefined)?.(event);
		if (event.defaultPrevented || isDisabled) return;
		banner.close();
	}
</script>

<Button
	bind:ref
	data-slot="banner-close"
	{variant}
	{size}
	disabled={isDisabled}
	aria-label={resolvedAriaLabel}
	{onclick}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		<XIcon />
	{/if}
</Button>
