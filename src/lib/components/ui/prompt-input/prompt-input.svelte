<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLFormAttributes } from "svelte/elements";
	import type { PromptInputMessage } from "./prompt-input.svelte.js";

	export type PromptInputRootProps = WithElementRef<
		Omit<HTMLFormAttributes, "onsubmit">,
		HTMLFormElement
	> & {
		/**
		 * The draft. Bind it to read or write the textarea from outside; a write from the parent
		 * does not fire `onValueChange`.
		 * @default ""
		 */
		value?: string;
		/** Fired when the reader edits the draft or a submission clears it, never for a parent-driven write. */
		onValueChange?: (value: string) => void;
		/**
		 * Whether a successful submission empties the draft. With a promise-returning `onSubmit`
		 * the draft is cleared only once the promise resolves; a rejection keeps it.
		 * @default true
		 */
		clearOnSubmit?: boolean;
		/**
		 * Inert the whole composer: the textarea, the submit button and every submission path,
		 * Enter included. The tool buttons and selects are the caller's to disable.
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Called with the draft on every accepted submission — the form's submit event, which Enter
		 * in the textarea requests. Never called for a whitespace-only draft, while the composer is
		 * disabled, or while a previous promise is still pending.
		 */
		onSubmit: (message: PromptInputMessage, event: SubmitEvent) => void | Promise<void>;
	};

	/** Alias of {@link PromptInputRootProps}, present for parity with the upstream type name. */
	export type PromptInputProps = PromptInputRootProps;
</script>

<script lang="ts">
	import * as InputGroup from "$lib/components/ui/input-group/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { PromptInputState, setPromptInputContext } from "./prompt-input.svelte.js";

	/**
	 * The chat composer: a form around an `InputGroup`, with a textarea in the middle and rows of
	 * tools above and below it.
	 *
	 * A LEAN PORT. Upstream's `prompt-input.tsx` is 1,500 lines, most of them attachments —
	 * a hidden file input, paste and drop handlers, blob-to-data-URL conversion, a provider so
	 * several composers can share one list — plus an action menu, a hover card, tabs and a command
	 * palette to browse referenced sources. None of that is here. What is here is the part every
	 * chat surface needs on day one; attachments arrive as a follow-up on the same parts
	 * (`PromptInput.Attachments`, `PromptInput.Attachment`, `PromptInput.ActionMenu*`), and
	 * {@link PromptInputMessage} grows a `files` field then.
	 *
	 * WHAT DIVERGES FROM UPSTREAM, and why:
	 *
	 * 1. THE DRAFT IS A BINDABLE PROP, NOT FORM DATA. Upstream reads `FormData.get("message")` and
	 *    calls `form.reset()` before the handler runs; a controlled draft needs its separate
	 *    `PromptInputProvider`. Here `value` is `$bindable` on the root and every part reads it
	 *    through `PromptInputState`, so there is one draft, a parent can seed it (a "retry" button,
	 *    a starter chip) and clearing is decided AFTER `onSubmit` succeeds — `clearOnSubmit`
	 *    exists for the caller that wants to keep the text on screen while a reply streams.
	 *
	 * 2. A REJECTED `onSubmit` IS NOT SWALLOWED. Upstream wraps the call in an empty `catch`. The
	 *    draft is kept here too, but the rejection propagates so it lands in the console and in
	 *    whatever error boundary the app has. `prompt-input.svelte.ts` states the rule.
	 *
	 * 3. `disabled` EXISTS, AND ENTER FOLLOWS THE SUBMIT BUTTON. Upstream has no way to inert the
	 *    composer; `chat.tsx` works around it by vetoing Enter in `onKeyDown` while a turn streams.
	 *    The prop stamps `data-disabled` on the form and on the `InputGroup` (which dims its addons
	 *    through `group-data-[disabled=true]`), disables the textarea and the submit button, and
	 *    makes `submit()` refuse. Separately, `PromptInput.Textarea` refuses Enter while
	 *    `PromptInput.Submit` is a stop button (`prompt-input-textarea.svelte` says how), so the
	 *    streaming case needs no veto at all. The veto pattern still works and the page shows it.
	 *
	 * 4. THE ROOT MOUNTS A `Tooltip.Provider`. Bits UI's `Tooltip.Root` throws without one, and
	 *    `PromptInput.Button`'s `tooltip` prop would otherwise oblige every caller to remember it.
	 *    Providers nest, so a page-level one above is harmless.
	 *
	 * 5. `PromptInput.Button` DEFAULTS TO `size="sm"`. Upstream picks `icon-sm` when
	 *    `Children.count(children) === 1`; a snippet cannot be counted. An icon-only button says
	 *    `size="icon-sm"` and carries an `aria-label`.
	 *
	 * 6. THERE IS NO `PromptInput.SelectValue`. Bits UI's `Select.Trigger` renders its children,
	 *    and the house `ui/select` barrel — a verbatim registry port — exports no `Value` part
	 *    (Bits UI ships one; shadcn-svelte does not wrap it). The caller renders the selected label
	 *    inside `PromptInput.SelectTrigger`, as `ui/code-block`'s language picker does.
	 *
	 * 7. `PromptInput.Header` IS `align="block-start"`. Upstream uses `block-end` and then
	 *    `order-first` to undo it; the addon has the right alignment already.
	 *
	 * 8. THE BUTTONS ARE THE HOUSE `Button`, NOT `InputGroup.Button`. The latter carries its own
	 *    `h-6`/`h-8` ladder; `Button`'s `sm` and `icon-sm` are the control ramp's 32px rung
	 *    (`docs/CONVENTIONS.md` §3), so a tool button and a select trigger beside it share a line.
	 *
	 * 9. WRAPPED REGISTRY PARTS KEEP THEIR REGISTRY `data-slot`. The textarea stays
	 *    `input-group-control` because the group's focus ring keys on it; the select trigger,
	 *    content and item keep `select-*` because `src/app.css` sizes and de-shadows them by that
	 *    name. Renaming the slot to fit the naming rule would silently undo the theme. The parts
	 *    that render their own element — root, body, header, footer, tools, button, submit — stamp
	 *    `prompt-input-*`.
	 */
	let {
		ref = $bindable(null),
		class: className,
		value = $bindable(""),
		onValueChange,
		clearOnSubmit = true,
		disabled = false,
		onSubmit,
		children,
		...restProps
	}: PromptInputRootProps = $props();

	const state = new PromptInputState({
		getValue: () => value,
		setValue: (next) => {
			if (next === value) return;
			value = next;
			onValueChange?.(next);
		},
		getDisabled: () => disabled,
		getClearOnSubmit: () => clearOnSubmit,
		getOnSubmit: () => onSubmit,
	});

	setPromptInputContext(state);
</script>

<!--
	`overflow-hidden` on the group is upstream's: the textarea's own scrollbar and a header full of
	chips must not poke past the rounded frame. `data-disabled` on the group is what dims the
	addons (`input-group-addon.svelte` reads it as `group-data-[disabled=true]/input-group`).

	`h-auto!` is this port's. The group's height is content-driven only when it sees a textarea or
	a block addon as a DIRECT child; the textarea sits inside `PromptInput.Body`'s
	`display: contents` div, which the `has-[>textarea]` escape cannot see through, so a composer
	with no header and no footer would be pinned to one control height by the unlayered
	`[data-slot="input-group"]` rule in `src/app.css` and clip its own textarea. An important
	utility is what that rule's own comment says a departure must use.
-->
<form
	bind:this={ref}
	data-slot="prompt-input"
	data-disabled={disabled || undefined}
	data-pending={state.pending || undefined}
	class={cn("w-full", className)}
	onsubmit={(event) => state.submit(event)}
	{...restProps}
>
	<Tooltip.Provider>
		<InputGroup.Root class="h-auto! overflow-hidden" data-disabled={disabled || undefined}>
			{@render children?.()}
		</InputGroup.Root>
	</Tooltip.Provider>
</form>
