<script lang="ts" module>
	import { type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLTextareaAttributes } from "svelte/elements";

	/**
	 * `value` is omitted: the text lives on the root's value, and this part is its view. Bind
	 * `<Question.Root value>` to read or drive it.
	 */
	export type QuestionInputProps = Omit<
		WithoutChildren<WithElementRef<HTMLTextareaAttributes, HTMLTextAreaElement>>,
		"value"
	>;
</script>

<script lang="ts">
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import { cn } from "$lib/utils.js";
	import { getQuestionContext } from "./question.svelte.js";

	/**
	 * The free-text answer. Upstream's `QuestionInput`: the house `Textarea` at `min-h-20`, its
	 * value the root's `text`.
	 *
	 * Wired with a function binding rather than `oninput` + `value`, so the textarea can never
	 * hold a character the root's value does not: `Textarea` binds `value` internally, and pairing
	 * that with a plain `value` prop leaves a frame where the two disagree.
	 */
	let {
		ref = $bindable(null),
		class: className,
		disabled,
		placeholder = "Type your answer…",
		...restProps
	}: QuestionInputProps = $props();

	const question = getQuestionContext("`<Question.Input>`");
</script>

<Textarea
	bind:ref
	data-slot="question-input"
	bind:value={() => question.text, (text) => question.setText(text ?? "")}
	disabled={question.disabled || disabled}
	{placeholder}
	class={cn("min-h-20", className)}
	{...restProps}
/>
