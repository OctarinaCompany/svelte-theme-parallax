<script lang="ts" module>
	import type { ButtonProps } from "$lib/components/ui/button/index.js";

	export type KeyValueRemoveProps = ButtonProps;
</script>

<script lang="ts">
	import XIcon from "@lucide/svelte/icons/x";

	import { Button } from "$lib/components/ui/button/index.js";

	import { getKeyValueItemContext } from "./key-value.svelte.js";

	let {
		ref = $bindable(null),
		type = "button",
		variant = "outline",
		size = "icon",
		disabled,
		onclick: onclickProp,
		class: className,
		children,
		...restProps
	}: KeyValueRemoveProps = $props();

	const item = getKeyValueItemContext("<KeyValue.Remove>");
	const root = item.root;

	// OR, never a nullish fallback: `minItems`, `disabled` and `readOnly` are floors the caller
	// cannot opt out of. The `readOnly` term is divergence D-9.
	const isDisabled = $derived(disabled === true || !root.canRemove);

	// The caller's handler runs first but, unlike everywhere else in this repo, `preventDefault()`
	// does **not** suppress the removal: upstream calls it and then proceeds unconditionally
	//, and this theme keeps that.
	function onclick(event: MouseEvent) {
		// `ButtonProps` handlers are the intersection of the button and anchor DOM signatures, because
		// `Button` renders either element depending on `href`. Widening to their shared `MouseEvent`
		// supertype is what lets one implementation satisfy both call signatures (the
		// `speed-dial-action.svelte` / `banner-close.svelte` precedent).
		(onclickProp as unknown as ((event: MouseEvent) => void) | undefined)?.(event);

		root.remove(item.id);
	}
</script>

<Button
	bind:ref
	{type}
	{variant}
	{size}
	data-slot="key-value-remove"
	aria-label="Remove"
	class={className}
	{...restProps}
	disabled={isDisabled}
	{onclick}
>
	{#if children}
		{@render children()}
	{:else}
		<XIcon />
	{/if}
</Button>
