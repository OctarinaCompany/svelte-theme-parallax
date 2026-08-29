<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import * as Select from "$lib/components/ui/select/index.js";

	/**
	 * The single-selection half of `Select.Root`'s props, with `type` made optional.
	 *
	 * A composer's picker chooses one model, one effort level, one backend — never several — so
	 * the multiple branch of Bits UI's discriminated union is not offered and `type` defaults to
	 * `"single"`. `value` is a `string`, `onValueChange` receives a `string`.
	 */
	export type PromptInputSelectProps = Omit<
		Extract<ComponentProps<typeof Select.Root>, { type: "single" }>,
		"type"
	> & {
		/** @default "single" */
		type?: "single";
	};
</script>

<script lang="ts">
	/**
	 * A picker in the tools row. Renders no element of its own — Bits UI's `Select.Root` is
	 * context only — so there is no `data-slot` and no `class`; the visible parts are
	 * `PromptInput.SelectTrigger`, `.SelectContent` and `.SelectItem`.
	 *
	 * THERE IS NO `SelectValue` PART: the trigger renders its children, and the caller puts the
	 * selected label there (`prompt-input.svelte` §6 says why).
	 */
	let {
		type = "single",
		open = $bindable(false),
		value = $bindable(),
		...restProps
	}: PromptInputSelectProps = $props();
</script>

<Select.Root {type} bind:open bind:value {...restProps} />
