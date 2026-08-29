<script lang="ts" module>
	import type { PromptInputButtonProps } from "./prompt-input-button.svelte";

	/** The trigger IS a `PromptInput.Button`, so it takes the same props — `tooltip` included. */
	export type PromptInputActionMenuTriggerProps = PromptInputButtonProps;
</script>

<script lang="ts">
	import { mergeProps } from "bits-ui";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import Button from "./prompt-input-button.svelte";

	/**
	 * The button that opens the action menu: a `PromptInput.Button` on the same 32px rung as the
	 * tools beside it, showing a plus when it is given no children.
	 *
	 * IT RENDERS THROUGH THE TRIGGER'S `child` SNIPPET, which is Bits UI's equivalent of React's
	 * `asChild`: the trigger contributes its attributes and handlers rather than an element, so the
	 * menu is anchored to the button itself and there is no extra wrapper in the frame.
	 *
	 * `mergeProps` rather than a spread, so the trigger's `onclick`, `onkeydown` and `onpointerdown`
	 * CHAIN with a caller's instead of one silently replacing the other —
	 * `prompt-input-button.svelte` uses it for the tooltip trigger for the same reason.
	 *
	 * THE `data-slot` IS RESTATED LAST so this part is selectable as itself: `PromptInput.Button`
	 * writes `prompt-input-button` before its own `restProps`, and the trigger contributes
	 * `dropdown-menu-trigger`. Nothing in `src/app.css` keys on either, so the one that survives is
	 * the one that names the part.
	 *
	 * AN ICON-ONLY TRIGGER NEEDS A NAME. It defaults to `aria-label="Add attachment"`, which a
	 * caller adding other items to the menu should replace with what the menu actually offers.
	 */
	let {
		ref = $bindable(null),
		size = "icon-sm",
		children,
		...restProps
	}: PromptInputActionMenuTriggerProps = $props();
</script>

<DropdownMenu.Trigger>
	{#snippet child({ props })}
		<Button
			bind:ref
			{size}
			aria-label="Add attachment"
			{...mergeProps(props, restProps, { "data-slot": "prompt-input-action-menu-trigger" })}
		>
			{#if children}
				{@render children()}
			{:else}
				<PlusIcon aria-hidden="true" />
			{/if}
		</Button>
	{/snippet}
</DropdownMenu.Trigger>
