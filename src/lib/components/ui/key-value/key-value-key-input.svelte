<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLInputAttributes } from "svelte/elements";

	export type KeyValueKeyInputProps = WithElementRef<
		Omit<HTMLInputAttributes, "value" | "dir">,
		HTMLInputElement
	> & {
		/** OR-ed with the root's `disabled`, as upstream does. @default false */
		disabled?: boolean;
		/** OR-ed with the root's `readOnly`. @default false */
		readOnly?: boolean;
		/** OR-ed with the root's `required`. @default false */
		required?: boolean;
		/** Overrides the root's `keyPlaceholder` for this field. */
		placeholder?: string;
	};
</script>

<script lang="ts">
	import * as Editable from "$lib/components/ui/editable/index.js";
	import { untrack } from "svelte";

	import { getKeyValueItemContext } from "./key-value.svelte.js";

	let {
		ref = $bindable(null),
		disabled,
		readOnly,
		required,
		placeholder,
		onpaste: onpasteProp,
		class: className,
		...restProps
	}: KeyValueKeyInputProps = $props();

	const item = getKeyValueItemContext("<KeyValue.KeyInput>");
	const root = item.root;

	// OR, never a nullish fallback: the list's state is a floor
	// the field cannot opt out of.
	const isDisabled = $derived(disabled === true || root.disabled);
	const isReadOnly = $derived(readOnly === true || root.readOnly);
	const isRequired = $derived(required === true || root.required);
	const isInvalid = $derived(item.keyError !== undefined);

	/** This field's edit mode, owned here so a focus request can open it. */
	let editing = $state(false);

	// The one-shot focus request `add()`, `remove()` and `pasteInto()` leave behind. Clearing it
	// inside `untrack` means this effect re-runs exactly once more and then short-circuits.
	$effect(() => {
		if (root.focusRequestId !== item.id || isDisabled || isReadOnly) return;

		untrack(() => {
			if (!root.consumeFocusRequest(item.id)) return;
			// `editable` mounts its input on this flip and focuses + selects it on the next frame.
			editing = true;
		});
	});

	function setKey(next: string) {
		root.setField(item.id, "key", next);

		// The state can refuse part of a write — with `trim` on, a keystroke that only adds trailing
		// whitespace stores the same key it already held — and Svelte will not re-render an attribute
		// that did not change, so the stored key is pushed back onto the control explicitly. React got
		// this from its re-render; `editable-input.svelte:112-128` documents the same
		// hazard for its own read-only case.
		if (ref && ref.value !== item.key) ref.value = item.key;
	}

	function onpaste(event: ClipboardEvent & { currentTarget: EventTarget & HTMLInputElement }) {
		// `enablePaste` gates the whole handler, the caller's included — upstream returns before it
		// reaches `propsRef.current.onPaste?.(event)`. The `disabled` and
		// `readOnly` suppression stays inside `pasteInto`, where divergence D-4 records it.
		if (!root.enablePaste) return;

		onpasteProp?.(event);
		if (event.defaultPrevented) return;

		const text = event.clipboardData?.getData("text") ?? "";
		// Only an intercepted, row-splitting paste suppresses the browser's own insertion.
		if (root.pasteInto(item.id, text, event)) event.preventDefault();
	}
</script>

<!--
	`class="contents"` keeps `<Editable.Root>`'s wrapper out of the layout, so the caller's `class`
	on the field wrapper below — `flex-1` in upstream's form demo — sizes the field against the row
	rather than against an intermediate box.

	`triggerMode="focus"` ties edit mode to focus, which is what makes `Tab` land in a caret
	— and what makes `Escape` restore the text the edit started with and leave the field open, since
	`editable` hands focus straight back to a field that is open exactly while it is focused.
-->
<Editable.Root
	bind:value={() => item.key, setKey}
	bind:editing
	triggerMode="focus"
	disabled={isDisabled}
	readOnly={isReadOnly}
	required={isRequired}
	invalid={isInvalid}
	placeholder={placeholder ?? root.keyPlaceholder}
	dir={root.dir}
	class="contents"
>
	<Editable.Area data-slot="key-value-key-input" class={cn("min-w-0 flex-1", className)}>
		<Editable.Preview
			data-slot="key-value-key-input-preview"
			aria-invalid={isInvalid}
			aria-describedby={isInvalid ? root.errorId(item.id, "key") : undefined}
			class="w-full"
		/>
		<Editable.Input
			bind:ref
			data-slot="key-value-key-input-control"
			aria-describedby={isInvalid ? root.errorId(item.id, "key") : undefined}
			autocapitalize="off"
			autocomplete="off"
			autocorrect="off"
			spellcheck="false"
			{...restProps}
			{onpaste}
		/>
	</Editable.Area>
</Editable.Root>
