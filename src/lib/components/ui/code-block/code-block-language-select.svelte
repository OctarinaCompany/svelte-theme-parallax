<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import type { WithoutChildren } from "$lib/utils.js";
	import * as Select from "$lib/components/ui/select/index.js";

	export type CodeBlockLanguageSelectProps = WithoutChildren<
		ComponentProps<typeof Select.Trigger>
	> & {
		/**
		 * Which edge of the trigger the list aligns to.
		 * @default "end"
		 */
		align?: ComponentProps<typeof Select.Content>["align"];
	};
</script>

<script lang="ts">
	import {
		codeBlockLanguageLabel,
		getCodeBlockContext,
		resolveCodeBlockLanguage,
	} from "./code-block.svelte.js";

	/**
	 * The language picker. Rendered by the header only when there is more than one snippet.
	 *
	 * `size="sm"` is the house ramp's 32px rung. Upstream asks for the same `size` and then pins the
	 * trigger to `h-7`, which is a rung this kit does not have and which a
	 * registry component may not invent for itself (`docs/CONVENTIONS.md` §3).
	 *
	 * The trigger's value is `block.activeLanguage` — the language of the snippet ACTUALLY on
	 * screen, not the one last requested. Upstream keeps the requested one and falls back only when
	 * rendering the code, so a `snippets` prop that changes to a set without it leaves the picker
	 * naming one language above the body of another.
	 *
	 * THE LABEL CARRIES THE VALUE, which is why it is composed rather than fixed. This trigger
	 * exposes `role="button"` with `hasPopup="listbox"` and no AX value of its own (measured), and
	 * an `aria-label` REPLACES the element's text in the name computation — so a plain "Select
	 * language" would name the purpose and silently drop the one thing the control is displaying.
	 * A reader would be told there is a language picker and never told which language.
	 */
	let {
		ref = $bindable(null),
		align = "end",
		...restProps
	}: CodeBlockLanguageSelectProps = $props();

	const block = getCodeBlockContext("`<CodeBlock.LanguageSelect>`");
</script>

<Select.Root
	type="single"
	value={block.activeLanguage}
	onValueChange={(value) => block.select(resolveCodeBlockLanguage(value))}
>
	<Select.Trigger bind:ref size="sm" aria-label="Language: {block.activeLabel}" {...restProps}>
		{block.activeLabel}
	</Select.Trigger>
	<Select.Content {align}>
		<Select.Group>
			{#each block.snippets as snippet (snippet.language)}
				{@const label = snippet.label ?? codeBlockLanguageLabel(snippet.language)}
				<!-- `label` as well as children: bits-ui types ahead against it, and without it the
				     typeahead matches the raw language rather than the text on screen. -->
				<Select.Item value={snippet.language} {label}>{label}</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
