<script lang="ts" module>
	import type { ButtonProps } from "$lib/components/ui/button/index.js";
	import type { ChatStatus } from "$lib/shared/chat-parts.js";

	/**
	 * `href` is dropped (a submit is never a link) and so is `type`: the part decides between
	 * `submit` and `button` from `status` and `onStop`.
	 */
	export type PromptInputSubmitProps = Omit<ButtonProps, "href" | "type"> & {
		/**
		 * What the chat is doing, which picks the icon: `ready` an enter arrow, `submitted` a
		 * spinner, `streaming` a stop square, `error` a cross.
		 * @default "ready"
		 */
		status?: ChatStatus;
		/**
		 * Makes the button a stop button while `status` is `submitted` or `streaming`: it becomes
		 * `type="button"`, is labelled "Stop", and a click calls this instead of submitting. Without
		 * it the button stays a submit button whatever the status.
		 */
		onStop?: () => void;
	};
</script>

<script lang="ts">
	import CornerDownLeftIcon from "@lucide/svelte/icons/corner-down-left";
	import SquareIcon from "@lucide/svelte/icons/square";
	import XIcon from "@lucide/svelte/icons/x";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Spinner } from "$lib/components/ui/spinner/index.js";
	import { isChatGenerating } from "$lib/shared/chat-parts.js";
	import { cn } from "$lib/utils.js";
	import { getPromptInputContext } from "./prompt-input.svelte.js";

	/**
	 * The send button, which is also the stop button. `size="icon-sm"` — the same 32px rung as
	 * the tools beside it — in the primary fill, so it is the one solid object in the frame.
	 *
	 * THE SPINNER IS `aria-hidden`. `Spinner` announces itself as `role="status"` "Loading" on its
	 * own, which is right for a bare spinner and wrong inside a button that already says "Stop":
	 * a reader would hear both. The button's label carries the state; the glyph is decoration.
	 *
	 * `disabled` folds in the root's: a disabled composer has a disabled submit button, which is
	 * also what `PromptInput.Textarea` checks before it requests a submit on Enter — as is the
	 * `type` this part picks: while it is a stop button, Enter in the textarea does nothing. A
	 * caller's own `disabled` — the usual one is "nothing typed yet" — is OR-ed in, never
	 * overridden.
	 */
	let {
		ref = $bindable(null),
		class: className,
		variant = "default",
		size = "icon-sm",
		status = "ready",
		onStop,
		onclick,
		disabled,
		children,
		...restProps
	}: PromptInputSubmitProps = $props();

	const input = getPromptInputContext("`<PromptInput.Submit>`");

	const stopping = $derived(isChatGenerating(status) && onStop !== undefined);

	function handleClick(event: MouseEvent) {
		if (stopping) {
			event.preventDefault();
			onStop?.();
			return;
		}
		// `onclick` on `ButtonProps` is the intersection of the button and anchor handler types
		// (Button renders either element depending on `href`); widening to their shared MouseEvent
		// supertype lets one implementation satisfy both call signatures.
		(onclick as unknown as ((event: MouseEvent) => void) | undefined)?.(event);
	}
</script>

<Button
	bind:ref
	data-slot="prompt-input-submit"
	data-status={status}
	type={stopping ? "button" : "submit"}
	aria-label={stopping ? "Stop" : "Submit"}
	{variant}
	{size}
	disabled={input.disabled || disabled}
	class={cn(className)}
	onclick={handleClick}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else if status === "submitted"}
		<Spinner aria-hidden="true" role="presentation" />
	{:else if status === "streaming"}
		<SquareIcon aria-hidden="true" />
	{:else if status === "error"}
		<XIcon aria-hidden="true" />
	{:else}
		<CornerDownLeftIcon aria-hidden="true" />
	{/if}
</Button>
