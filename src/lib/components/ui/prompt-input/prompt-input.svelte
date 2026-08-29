<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLFormAttributes } from "svelte/elements";
	import type { PromptInputError, PromptInputMessage } from "./prompt-input.svelte.js";

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
		 * Whether a successful submission empties the draft AND the attachment list. With a
		 * promise-returning `onSubmit` both are cleared only once the promise resolves; a rejection
		 * keeps them. Clearing the attachments revokes their object URLs — `prompt-input.svelte.ts`
		 * states what that means for a handler that was just given them.
		 * @default true
		 */
		clearOnSubmit?: boolean;
		/**
		 * Inert the whole composer: the textarea, the submit button, every submission path (Enter
		 * included) and every path that attaches a file. The tool buttons and selects are the
		 * caller's to disable.
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Which files may be attached, in the `accept` attribute's own grammar — media types
		 * (`image/png`), groups (`image/*`) and extensions (`.pdf`), comma-separated. Set on the
		 * hidden file input AND enforced in code, because the attribute governs the file dialog
		 * alone: a drop and a paste walk straight past it.
		 */
		accept?: string;
		/**
		 * Whether more than one file may be attached. Unlike upstream this is a real ceiling rather
		 * than only an attribute on the input: a drop of five files onto a single-file composer
		 * attaches the first and reports `max_files`.
		 * @default false
		 */
		multiple?: boolean;
		/**
		 * How many files may be held at once. Only consulted while `multiple` is true — a
		 * single-file composer is capped at one whatever this says. Undefined is no ceiling.
		 */
		maxFiles?: number;
		/** The per-file ceiling in bytes. Undefined or `0` is no ceiling. */
		maxFileSize?: number;
		/**
		 * Called once per rejection reason whenever an add is refused in part or in full —
		 * `accept`, then `max_file_size`, then `max_files`. Files that passed are still attached.
		 */
		onError?: (error: PromptInputError) => void;
		/**
		 * Called with the draft and the attachments on every accepted submission — the form's
		 * submit event, which Enter in the textarea requests. Never called while the composer is
		 * disabled, while a previous promise is still pending, or for a whitespace-only draft with
		 * nothing attached (a file alone IS a message).
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
	 * ATTACHMENTS AND THE ACTION MENU ARE HERE. They were the documented follow-up of the first,
	 * lean port and they landed on the parts it named: `PromptInput.Attachments` and
	 * `PromptInput.Attachment` draw the chips, this root owns the hidden file input and the drop
	 * target, `PromptInput.Textarea` owns paste-to-attach and the Backspace that deletes the last
	 * chip, `PromptInput.ActionMenu*` is the menu over the house `DropdownMenu`, and
	 * {@link PromptInputMessage} now carries `files`.
	 *
	 * WHAT IS STILL DELIBERATELY ABSENT from upstream's 1,463 lines:
	 *
	 * - `PromptInputProvider`, its controller context and `usePromptInputController`. That provider
	 *   exists to lift ONE attachment list and ONE draft above several composers, and to let a menu
	 *   outside the form open the file dialog. The kit's context is per-form and the draft is
	 *   already a bindable prop on this root, which covers the second half of what the provider was
	 *   for; the first half — two composers sharing a list — has no caller here. `add`/`remove` are
	 *   reachable through `usePromptInputAttachments()` inside the form.
	 * - Referenced sources (`PromptInputReferencedSources`, the hover card, the command palette
	 *   that browses them) and `PromptInputActionAddScreenshot`. The screenshot action is
	 *   `navigator.mediaDevices.getDisplayMedia`, a permission prompt and a `<canvas>` — a feature
	 *   in its own right rather than a part of the composer.
	 * - `globalDrop` (drops anywhere on the document) and `syncHiddenInput`, which upstream's own
	 *   comment records as non-functional: a file input's value cannot be set from script.
	 * - `PromptInputSelectValue`, for the reason §6 below gives.
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
		accept,
		multiple = false,
		maxFiles,
		maxFileSize,
		onError,
		ondragenter,
		ondragover,
		ondragleave,
		ondrop,
		onSubmit,
		children,
		...restProps
	}: PromptInputRootProps = $props();

	/**
	 * The hidden `<input type="file">` below. The state class reads it through a getter rather than
	 * being handed the element, because it is constructed before the element exists.
	 */
	let fileInput = $state<HTMLInputElement | null>(null);

	/** Whether a file drag is currently over the form. Stamped as `data-dragging`. */
	let dragging = $state(false);

	const composer = new PromptInputState({
		getValue: () => value,
		setValue: (next) => {
			if (next === value) return;
			value = next;
			onValueChange?.(next);
		},
		getDisabled: () => disabled,
		getClearOnSubmit: () => clearOnSubmit,
		getOnSubmit: () => onSubmit,
		getAccept: () => accept,
		getMultiple: () => multiple,
		getMaxFiles: () => maxFiles,
		getMaxFileSize: () => maxFileSize,
		getOnError: () => onError,
		getFileInput: () => fileInput,
	});

	setPromptInputContext(composer);

	/**
	 * Whether a drag is carrying files.
	 *
	 * `DataTransfer.types` holds `"Files"` for a drag of files from the desktop (MDN,
	 * `DataTransfer.types`), and reading it is the only thing a `dragover` is allowed to know about
	 * the payload — `dataTransfer.files` is empty until the drop. Dragging selected TEXT over the
	 * composer must not light the form up, which is what this test buys.
	 */
	function draggingFiles(event: DragEvent): boolean {
		return event.dataTransfer?.types.includes("Files") ?? false;
	}
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
	data-pending={composer.pending || undefined}
	data-dragging={dragging || undefined}
	class={cn("w-full", className)}
	onsubmit={(event) => composer.submit(event)}
	{...restProps}
	ondragenter={(event) => {
		ondragenter?.(event);
		if (!draggingFiles(event)) return;
		dragging = !disabled;
	}}
	ondragover={(event) => {
		ondragover?.(event);
		if (!draggingFiles(event)) return;
		/*
			`preventDefault()` on `dragover` is what MAKES an element a drop target — without it the
			browser refuses the drop and `ondrop` never fires (MDN, "HTML Drag and Drop API"). It is
			therefore not a veto a caller's own handler can withhold, and it runs even while the
			composer is disabled: an inert composer that let the drop through would have the browser
			navigate away to the dropped file, which is worse than swallowing it.
		*/
		event.preventDefault();
	}}
	ondragleave={(event) => {
		ondragleave?.(event);
		if (!dragging) return;
		// Leaving a CHILD is not leaving the form: `dragleave` fires on every crossing into a
		// descendant, so without this the frame flickers as the pointer passes over the textarea.
		// `src/lib/hooks/file-upload.svelte.ts` takes the same guard for its dropzone.
		if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
		dragging = false;
	}}
	ondrop={(event) => {
		ondrop?.(event);
		if (!draggingFiles(event)) return;
		event.preventDefault();
		dragging = false;
		// `event.defaultPrevented` cannot be the veto here — the `dragover` above had to prevent
		// the default for this event to exist at all. A caller that wants the drop to itself
		// stops the event instead (`event.stopPropagation()` on a child, or its own drop target).
		// `add` refuses while the composer is disabled, so nothing lands then.
		composer.attachments.add(event.dataTransfer?.files ?? []);
	}}
>
	<!--
		THE FILE INPUT IS THE FORM'S, AND IT CANNOT BREAK THE FORM. It carries no `name`, so it
		contributes nothing to `new FormData(form)` and cannot change the encoding a native post
		would need; and the root prevents the default on every submit anyway, so there is no native
		post to affect. Upstream renders it as a SIBLING of the form, beside it in a fragment; here it
		lives inside, with the drop target and the menu that opens it.

		It sits OUTSIDE `InputGroup.Root` on purpose: `InputGroup.Addon`'s click-to-focus handler
		looks for the first `<input>` inside the group, and a hidden file input in there would be
		the one it found.

		`hidden` rather than `sr-only`: it must not take a tab stop of its own — the affordance is
		`PromptInput.ActionAddAttachments` — and `element.click()` opens the dialog whatever the
		element's display. The `aria-label` is for the caller who unhides it.
	-->
	<input
		bind:this={fileInput}
		type="file"
		class="hidden"
		aria-label="Add attachments"
		{accept}
		{multiple}
		onchange={(event) => {
			composer.attachments.add(event.currentTarget.files ?? []);
			// Emptying the value is not tidying up: an input that keeps its last selection fires no
			// `change` at all when the same file is picked again, so removing a chip and re-picking
			// that file would do nothing. `src/lib/hooks/file-upload.svelte.ts` names the same trap.
			event.currentTarget.value = "";
		}}
	/>
	<Tooltip.Provider>
		<!--
			`in-data-dragging:` reaches the group from the form's `data-dragging` and draws the same
			ring the group already draws for focus, so a drag says "drop here" in the composer's own
			language rather than a second, invented affordance.
		-->
		<InputGroup.Root
			class="h-auto! overflow-hidden in-data-dragging:border-ring in-data-dragging:ring-3 in-data-dragging:ring-ring/50"
			data-disabled={disabled || undefined}
		>
			{@render children?.()}
		</InputGroup.Root>
	</Tooltip.Provider>
</form>
