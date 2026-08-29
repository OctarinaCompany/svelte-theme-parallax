<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";

	/**
	 * `value` is owned by `PromptInput.Root` and is not a prop here — bind the root instead.
	 * `ref` is typed as `Textarea` types it (`HTMLElement`), because that is the element the
	 * registry component populates.
	 */
	export type PromptInputTextareaProps = Omit<ComponentProps<typeof InputGroup.Textarea>, "value">;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { getPromptInputContext } from "./prompt-input.svelte.js";

	/**
	 * The draft field. An `InputGroup.Textarea` bound to the root's `value`, sized by its content
	 * between one line and `max-h-48`, and the place Enter turns into a submission.
	 *
	 * ENTER SUBMITS, SHIFT+ENTER BREAKS THE LINE, AND COMPOSITION IS LEFT ALONE. An IME commits a
	 * candidate with Enter, and that keystroke reaches the textarea as a keydown with
	 * `isComposing` set (MDN, `KeyboardEvent.isComposing`); submitting on it would send half a
	 * word. Safari additionally delivers one Enter AFTER `compositionend` with `isComposing`
	 * already false, which is why upstream also tracks the composition through its own events —
	 * kept here for the same reason, and both are checked.
	 *
	 * THE CALLER'S `onkeydown` RUNS FIRST and `event.preventDefault()` in it vetoes the submit.
	 * That is the hook `chat.tsx` uses to hold Enter while a turn streams; the page shows it.
	 *
	 * Submission goes through `form.requestSubmit()` rather than calling the state directly, so it
	 * is the same submit event a click on `PromptInput.Submit` produces, `onSubmit` receives a real
	 * `SubmitEvent` either way, and a disabled submit button (upstream's check, kept) blocks both
	 * paths alike.
	 *
	 * THE GUARD LOOKS FOR `PromptInput.Submit` FIRST, not for any `button[type="submit"]`. While
	 * the part is a stop button (`status` generating and `onStop` given) it renders as
	 * `type="button"`, so a query for a submit button finds nothing and `requestSubmit()` would
	 * still fire `submit` with no submitter — Enter would send a fresh message into a running
	 * turn. Resolving the part by its `data-slot` and refusing when it is disabled OR not a submit
	 * button makes Enter follow the button: while the button says Stop, Enter does nothing. A form
	 * without the part falls back to the first submit button, as upstream checks.
	 *
	 * BACKSPACE IN AN EMPTY DRAFT DELETES THE LAST ATTACHMENT — upstream's behaviour, kept. It is
	 * checked before Enter, and only while the draft is empty, so it can never eat a character;
	 * with nothing attached the keystroke is left to the browser.
	 *
	 * PASTING A FILE ATTACHES IT. The clipboard's file items are collected and handed to the same
	 * validating `add` the dialog and the drop use; the paste's default is prevented only when
	 * there was at least one file, so pasting text is untouched and a paste of BOTH text and a
	 * file attaches the file and drops the text, as upstream does.
	 */
	let {
		ref = $bindable(null),
		class: className,
		placeholder = "What would you like to know?",
		disabled,
		onkeydown,
		onpaste,
		oncompositionstart,
		oncompositionend,
		...restProps
	}: PromptInputTextareaProps = $props();

	const input = getPromptInputContext("`<PromptInput.Textarea>`");

	let composing = $state(false);

	function handleKeydown(
		event: KeyboardEvent & { currentTarget: EventTarget & HTMLTextAreaElement },
	) {
		onkeydown?.(event);
		if (event.defaultPrevented) return;

		if (event.key === "Backspace" && input.value === "") {
			const last = input.attachments.files.at(-1);
			if (!last) return;
			event.preventDefault();
			input.attachments.remove(last.id);
			return;
		}

		if (event.key !== "Enter" || event.shiftKey) return;
		if (composing || event.isComposing) return;

		event.preventDefault();
		const form = event.currentTarget.form;
		if (!form) return;
		const submit = form.querySelector<HTMLButtonElement>('[data-slot="prompt-input-submit"]');
		const guard = submit ?? form.querySelector<HTMLButtonElement>('button[type="submit"]');
		if (guard?.disabled || guard?.type === "button") return;
		form.requestSubmit();
	}

	function handlePaste(
		event: ClipboardEvent & { currentTarget: EventTarget & HTMLTextAreaElement },
	) {
		onpaste?.(event);
		if (event.defaultPrevented) return;

		const items = event.clipboardData?.items;
		if (!items) return;

		// `DataTransferItemList` is array-like rather than an array, so `Array.from` is what gives it
		// `filter` and `map`. `kind === "file"` is what a screenshot or a copied file arrives as
		// (MDN, `DataTransferItem.kind`).
		const files = Array.from(items)
			.filter((item) => item.kind === "file")
			.map((item) => item.getAsFile())
			.filter((file): file is File => file !== null);
		if (files.length === 0) return;

		event.preventDefault();
		input.attachments.add(files);
	}
</script>

<!--
	`bind:value` through a function pair rather than `bind:value={input.value}`: the state's
	`setValue` is what fires the root's `onValueChange`, and a direct bind onto the derived field
	would bypass it. `name="message"` stays for a plain `<form>` post; nothing here reads it.
-->
<InputGroup.Textarea
	bind:ref
	bind:value={() => input.value, (next) => input.setValue(next)}
	name="message"
	{placeholder}
	disabled={input.disabled || disabled}
	class={cn("field-sizing-content max-h-48 min-h-16 resize-none", className)}
	onkeydown={handleKeydown}
	onpaste={handlePaste}
	oncompositionstart={(event) => {
		composing = true;
		oncompositionstart?.(event);
	}}
	oncompositionend={(event) => {
		composing = false;
		oncompositionend?.(event);
	}}
	{...restProps}
/>
