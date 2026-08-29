<script lang="ts" module>
	import type { ButtonProps } from "$lib/components/ui/button/index.js";

	/**
	 * `href` is omitted: the part is a submit button, and `Button` renders an anchor — which cannot
	 * submit anything — the moment `href` is set.
	 */
	export type QuestionSubmitProps = Omit<ButtonProps, "href" | "type">;
</script>

<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { getQuestionContext } from "./question.svelte.js";

	/**
	 * The form's submit button. Upstream's `QuestionSubmit`: disabled until the reader has
	 * answered — an option chosen or non-blank text — so a click can never hit the root's submit
	 * guard. Children default to "Submit".
	 */
	let { ref = $bindable(null), disabled, children, ...restProps }: QuestionSubmitProps = $props();

	const question = getQuestionContext("`<Question.Submit>`");
</script>

<Button
	bind:ref
	data-slot="question-submit"
	type="submit"
	disabled={question.disabled || disabled || !question.hasResponse}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		Submit
	{/if}
</Button>
