<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { Attachment } from "svelte/attachments";
	import type { HTMLInputAttributes } from "svelte/elements";

	import type { MentionField } from "./mention-caret.js";

	/**
	 * The merged attribute payload handed to the `child` snippet.
	 *
	 * The symbol slot carries the attachment that registers the rendered element with the root
	 * (divergence D-1), so a `child`-rendered `<textarea>` keeps every caret read and write — which is
	 * where all of this component's behaviour lives.
	 */
	export type MentionInputChildProps = {
		"data-slot": "mention-input";
		"data-state": "open" | "closed";
		"data-disabled": "" | undefined;
		"data-readonly": "" | undefined;
		role: "combobox";
		class: string;
	} & Record<string, unknown> &
		Record<symbol, Attachment<HTMLElement>>;

	export type MentionInputProps = WithElementRef<
		Omit<HTMLInputAttributes, "dir" | "value">,
		MentionField
	> & {
		/**
		 * Render the field onto your own element instead of the default `<input>` — normally a
		 * `<textarea>`, which is what all three upstream demos do. The snippet receives the merged
		 * props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. Unlike the
		 * repo's usual `child` note, `ref` *is* still set here: the element rides along inside the
		 * props as an attachment (divergence D-1).
		 */
		child?: Snippet<[{ props: MentionInputChildProps }]>;
	};
</script>

<script lang="ts">
	import { createAttachmentKey } from "svelte/attachments";

	import MentionHighlighter from "./mention-highlighter.svelte";
	import { getMentionContext } from "./mention.svelte.js";

	let {
		ref = $bindable(null),
		oninput: oninputProp,
		onbeforeinput: onbeforeinputProp,
		onclick: onclickProp,
		oncut: oncutProp,
		onfocus: onfocusProp,
		onkeydown: onkeydownProp,
		onpaste: onpasteProp,
		onpointerdown: onpointerdownProp,
		onselect: onselectProp,
		class: className,
		child,
		...restProps
	}: MentionInputProps = $props();

	const root = getMentionContext("<Mention.Input>");

	/**
	 * Registration rides in the props rather than on a `bind:this`, so it works identically whether
	 * the default `<input>` or a `child`-rendered `<textarea>` is what actually lands in the DOM.
	 */
	const attach = createAttachmentKey();

	function attachField(element: HTMLElement) {
		if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) return;

		ref = element;
		root.inputElement = element;

		return () => {
			ref = null;
			root.inputElement = null;
		};
	}

	/**
	 * Keep the DOM in step with the context even when the context declines the write. The value is
	 * never passed as an attribute: Svelte re-assigns `element.value` whenever *its own* record of it
	 * changed, which would knock the caret to the end right after a mention splice placed it.
	 */
	$effect(() => {
		const element = ref;
		const next = root.inputValue;
		if (element && element.value !== next) element.value = next;
	});

	/** The field, whichever element the caller actually rendered. */
	function fieldOf(event: Event): MentionField | null {
		const target = event.currentTarget;
		if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return target;
		return root.inputElement;
	}

	// Each handler runs the caller's first and `preventDefault()` suppresses ours, reproducing
	// upstream's `composeEventHandlers`.
	function oninput(event: Event) {
		oninputProp?.(event as Parameters<NonNullable<typeof oninputProp>>[0]);
		if (event.defaultPrevented) return;

		const field = fieldOf(event);
		if (field) root.onInputChange(field);
	}

	function onbeforeinput(event: InputEvent) {
		onbeforeinputProp?.(event as Parameters<NonNullable<typeof onbeforeinputProp>>[0]);
		if (event.defaultPrevented) return;

		const field = fieldOf(event);
		if (field) root.onInputBeforeInput(event, field);
	}

	function onclick(event: MouseEvent) {
		onclickProp?.(event as Parameters<NonNullable<typeof onclickProp>>[0]);
		if (event.defaultPrevented) return;

		const field = fieldOf(event);
		if (field) root.onInputCaretMove(field);
	}

	function oncut(event: ClipboardEvent) {
		oncutProp?.(event as Parameters<NonNullable<typeof oncutProp>>[0]);
		if (event.defaultPrevented) return;

		const field = fieldOf(event);
		if (field) void root.onInputCut(field);
	}

	function onfocus(event: FocusEvent) {
		onfocusProp?.(event as Parameters<NonNullable<typeof onfocusProp>>[0]);
		if (event.defaultPrevented) return;

		const field = fieldOf(event);
		if (field) root.onInputCaretMove(field);
	}

	function onkeydown(event: KeyboardEvent) {
		onkeydownProp?.(event as Parameters<NonNullable<typeof onkeydownProp>>[0]);
		if (event.defaultPrevented) return;

		const field = fieldOf(event);
		if (field) root.onInputKeydown(event, field);
	}

	function onpaste(event: ClipboardEvent) {
		onpasteProp?.(event as Parameters<NonNullable<typeof onpasteProp>>[0]);
		if (event.defaultPrevented) return;

		const field = fieldOf(event);
		if (field) void root.onInputPaste(event, field);
	}

	function onpointerdown(event: PointerEvent) {
		onpointerdownProp?.(event as Parameters<NonNullable<typeof onpointerdownProp>>[0]);
		if (event.defaultPrevented) return;

		const field = fieldOf(event);
		if (field) void root.onInputPointerDown(event, field);
	}

	function onselect(event: Event) {
		onselectProp?.(event as Parameters<NonNullable<typeof onselectProp>>[0]);
		if (event.defaultPrevented) return;
		if (root.disabled || root.readonly) return;

		const field = fieldOf(event);
		if (field) root.onInputCaretMove(field);
	}

	// `data-*`/`aria-*` first and the behaviour-critical props last, so a caller attribute arriving
	// through `..restProps` can neither drop the slot marker nor clobber a handler — the same
	// ordering upstream's own JSX uses.
	const inputAttrs = $derived({
		"data-slot": "mention-input",
		"data-state": root.dataState,
		"data-disabled": root.disabled ? "" : undefined,
		"data-readonly": root.readonly ? "" : undefined,
		role: "combobox",
		id: root.inputId,
		autocomplete: "off",
		"aria-expanded": root.open,
		"aria-controls": root.listId,
		"aria-labelledby": root.labelId,
		"aria-autocomplete": "list",
		"aria-activedescendant": root.highlightedItem?.id,
		"aria-disabled": root.disabled,
		"aria-readonly": root.readonly,
		...restProps,
		class: cn(
			"flex min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
			className,
		),
		dir: root.dir,
		disabled: root.disabled,
		readonly: root.readonly,
		[attach]: attachField,
		oninput,
		onbeforeinput,
		onclick,
		oncut,
		onfocus,
		onkeydown,
		onpaste,
		onpointerdown,
		onselect,
	} as MentionInputChildProps);
</script>

<div class="relative">
	<MentionHighlighter />
	{#if child}
		{@render child({ props: inputAttrs })}
	{:else}
		<input {...inputAttrs} />
	{/if}
</div>
