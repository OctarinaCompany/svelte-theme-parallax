<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { Attachment } from "svelte/attachments";
	import type { HTMLButtonAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	/**
	 * The merged attribute payload handed to the `child` snippet. The symbol index is the
	 * attachment that registers the rendered element as the popup's anchor — spreading the payload
	 * is what applies it.
	 */
	export type ComboboxTriggerChildProps = {
		"data-slot": "combobox-trigger";
		"data-state": "open" | "closed";
		"data-disabled": "" | undefined;
		type: "button";
		disabled: boolean;
		"aria-haspopup": "listbox";
		"aria-expanded": boolean;
		"aria-label": string | undefined;
		onclick: (event: MouseEvent) => void;
		onkeydown: (event: KeyboardEvent) => void;
		class: string;
	} & Record<string, unknown> & { [key: symbol]: Attachment<HTMLElement> };

	export type ComboboxTriggerProps = WithElementRef<HTMLButtonAttributes, HTMLButtonElement> & {
		/**
		 * Render the trigger onto your own element — the select-shaped demos put a
		 * `<Button variant="outline">` here. The snippet receives the merged props to spread onto
		 * that element; `children` is not rendered in this mode, the caller places its own content.
		 *
		 * Replaces upstream's `render` prop (the original, via Base UI), which has no
		 * Svelte equivalent. The payload carries an attachment under a symbol key, so spreading it —
		 * onto a plain element or onto `<Button>` — still registers the element as the popup's
		 * anchor.
		 */
		child?: Snippet<[{ props: ComboboxTriggerChildProps }]>;
		children?: Snippet;
	};
</script>

<script lang="ts">
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import { createAttachmentKey } from "svelte/attachments";

	import { getComboboxContext } from "./combobox.svelte.js";

	/**
	 * The button that opens the popup.
	 *
	 * Two lives, like upstream's: inside `<Combobox.Input>` it is the chevron affordance at the
	 * field's end; standalone with `child` it is the whole select-shaped control, and then it is
	 * also the keyboard surface — the date and label demos render no input at all, so the arrows,
	 * `Enter` and `Escape` must work from here (Base UI does the same through its popup focus
	 * management).
	 *
	 * The caret is `ChevronDownIcon`, so the
	 * port imports that icon directly.
	 */

	let {
		ref = $bindable(null),
		class: className,
		"aria-label": ariaLabel,
		onclick: onclickProp,
		onkeydown: onkeydownProp,
		child,
		children,
		...restProps
	}: ComboboxTriggerProps = $props();

	const root = getComboboxContext("<Combobox.Trigger>");

	// Beside an input the trigger is the chevron alone, so nothing in it can name the button and
	// the AX tree reports an empty name (WCAG 4.1.2). The default fills in only there: a caller's
	// `aria-label` always wins, and the select-shaped `child` case is named by the content the
	// caller renders — the `<Banner.Close>` rule.
	const resolvedAriaLabel = $derived(ariaLabel ?? (child || children ? undefined : "Show options"));

	// An attachment rather than `bind:this`, so the `child` path — where the caller owns the
	// element — still registers the anchor the select-shaped popup positions against.
	const attach = createAttachmentKey();
	function attachTrigger(node: HTMLElement): () => void {
		root.triggerElement = node;
		ref = node as HTMLButtonElement;
		return () => {
			if (root.triggerElement === node) root.triggerElement = null;
			if (ref === node) ref = null;
		};
	}

	// Each handler runs the caller's first and `preventDefault()` suppresses ours, the same
	// composition every other part in this repository uses.
	function onclick(event: MouseEvent) {
		onclickProp?.(event as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
		if (event.defaultPrevented) return;
		if (root.disabled || root.readonly) return;

		root.setOpen(!root.open);
		if (root.open) {
			void root.resetHighlight();
			// With an input beside the trigger, typing should resume immediately; with the input
			// inside the popup, it mounts in a moment and focuses itself.
			if (!root.inputInsideContent) root.inputElement?.focus({ preventScroll: true });
		}
	}

	function onkeydown(event: KeyboardEvent) {
		onkeydownProp?.(event as KeyboardEvent & { currentTarget: EventTarget & HTMLButtonElement });
		if (event.defaultPrevented) return;

		if (root.onFieldKeydown(event)) event.preventDefault();
	}

	const triggerAttrs = $derived({
		"data-slot": "combobox-trigger",
		"data-state": root.dataState,
		"data-disabled": root.disabled ? "" : undefined,
		type: "button",
		disabled: root.disabled,
		"aria-haspopup": "listbox",
		"aria-expanded": root.open,
		"aria-label": resolvedAriaLabel,
		[attach]: attachTrigger,
		...restProps,
		onclick,
		onkeydown,
		class: cn("[&_svg:not([class*='size-'])]:size-4", className),
	} as ComboboxTriggerChildProps);
</script>

{#if child}
	{@render child({ props: triggerAttrs })}
{:else}
	<button {...triggerAttrs}>
		{@render children?.()}
		<ChevronDownIcon class="pointer-events-none text-muted-foreground" />
	</button>
{/if}
