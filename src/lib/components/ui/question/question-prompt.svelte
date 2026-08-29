<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type QuestionPromptProps = WithElementRef<
		HTMLAttributes<HTMLParagraphElement>,
		HTMLParagraphElement
	>;
</script>

<script lang="ts">
	import { getQuestionContext } from "./question.svelte.js";

	/**
	 * The question itself, in the form's lead weight. Upstream's `QuestionPrompt`: a `<p>` with
	 * `font-medium text-sm`, kept verbatim.
	 *
	 * One thing is added: the paragraph always carries an `id` — the caller's when given, else a
	 * generated one — and publishes it on the question state while mounted, so `<Question.Options>`
	 * can name its `radiogroup` / `group` through `aria-labelledby`. Upstream leaves the group
	 * unnamed, which the WAI-ARIA APG Radio Group pattern does not allow; see `question.svelte`,
	 * divergence 4.
	 */
	let {
		ref = $bindable(null),
		id: idProp,
		class: className,
		children,
		...restProps
	}: QuestionPromptProps = $props();

	const question = getQuestionContext("`<Question.Prompt>`");

	// `$props.id()` is only valid as a top-level initializer (Svelte's `props_id_invalid_placement`),
	// so the fallback is drawn here and the caller's `id` layered over it.
	const generatedId = $props.id();
	const id = $derived(idProp ?? generatedId);

	// Registered from an effect with a cleanup rather than at construction, so the state only ever
	// points at a prompt that is actually in the DOM, and a caller-driven `id` change re-registers.
	// The cleanup withdraws the id only while it is still the published one: a second prompt that
	// took over must not lose its name when the first one leaves.
	$effect(() => {
		const registered = id;
		question.setPromptId(registered);
		return () => {
			if (question.promptId === registered) question.setPromptId(null);
		};
	});
</script>

<p
	bind:this={ref}
	data-slot="question-prompt"
	{id}
	class={cn("text-sm font-medium", className)}
	{...restProps}
>
	{@render children?.()}
</p>
