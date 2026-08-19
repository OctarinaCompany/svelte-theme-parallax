<script lang="ts" module>
	import type { ButtonProps } from "$lib/components/ui/button/index.js";

	export type KeyValueAddProps = ButtonProps;
</script>

<script lang="ts">
	import PlusIcon from "@lucide/svelte/icons/plus";

	import { Button } from "$lib/components/ui/button/index.js";

	import { getKeyValueContext } from "./key-value.svelte.js";

	let {
		ref = $bindable(null),
		type = "button",
		variant = "outline",
		disabled,
		onclick: onclickProp,
		class: className,
		children,
		...restProps
	}: KeyValueAddProps = $props();

	// The root, not the list: `<KeyValue.Add>` sits outside `<KeyValue.List>` in every example.
	const root = getKeyValueContext("<KeyValue.Add>");

	// OR, never a nullish fallback: `maxItems`, `disabled` and `readOnly` are floors the caller
	// cannot opt out of. The `readOnly` term is divergence D-9.
	const isDisabled = $derived(disabled === true || !root.canAdd);

	// As with `<KeyValue.Remove>`, the caller's handler runs first and never suppresses the add
	//.
	function onclick(event: MouseEvent) {
		// `ButtonProps` handlers are the intersection of the button and anchor DOM signatures, because
		// `Button` renders either element depending on `href`. Widening to their shared `MouseEvent`
		// supertype is what lets one implementation satisfy both call signatures (the
		// `speed-dial-action.svelte` / `banner-close.svelte` precedent).
		(onclickProp as unknown as ((event: MouseEvent) => void) | undefined)?.(event);

		root.add();
	}
</script>

<Button
	bind:ref
	{type}
	{variant}
	data-slot="key-value-add"
	class={className}
	{...restProps}
	disabled={isDisabled}
	{onclick}
>
	{#if children}
		{@render children()}
	{:else}
		<PlusIcon data-icon="inline-start" />
		Add
	{/if}
</Button>
