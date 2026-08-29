<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type MessageBranchPageProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>
	> & {
		/**
		 * The noun the spoken counter opens with — "Branch 2 of 3". Read by a screen reader only;
		 * the visible text stays the bare "2 of 3". Name what the alternatives ARE where "branch" is
		 * not the word the page uses: `label="Draft"`, `label="Answer"`.
		 * @default "Branch"
		 */
		label?: string;
	};
</script>

<script lang="ts">
	import { ButtonGroupText } from "$lib/components/ui/button-group/index.js";
	import { getMessageBranchContext } from "./message.svelte.js";

	/**
	 * Where in the alternatives the reader is: "2 of 3".
	 *
	 * IT IS ANNOUNCED, which upstream's is not. Upstream prints the two numbers as bare text inside
	 * a `ButtonGroupText`; pressing an icon button called "Next branch" then replaces the answer
	 * above with no announcement at all, and a screen-reader user has to go looking for what
	 * changed. Three things are done about it here:
	 *
	 * - `role="status"` with `aria-live="polite"` makes the counter a live region, so its new value
	 *   is spoken after the step without stealing focus or interrupting.
	 * - `aria-atomic="true"` has the whole counter read out rather than only the digit that
	 *   changed, which on its own would be announced as "2".
	 * - The announced text is not the visible text. "2 of 3" says nothing about what there are two
	 *   of, so the region holds a `sr-only` "Branch 2 of 3" — `label` names the noun — and the
	 *   visible pair is `aria-hidden`, which is what keeps it from being read twice.
	 *
	 * IT IS A `ButtonGroupText`, upstream's choice, through the part's `child` snippet: the group
	 * needs a `[data-slot]` element to size and round like the buttons beside it, and the snippet
	 * is what lets this part render its own `<span>` — upstream types the part for a span too —
	 * carrying its own `data-slot`. Without the snippet there would be no way to stamp one:
	 * `ButtonGroupText` writes its `data-slot` LAST into the props it builds, so a `data-slot`
	 * handed to it as a prop never reaches the element.
	 * The three classes strip the chip look — border, ground, shadow — that a counter between two
	 * ghost buttons should not have; upstream strips exactly the same three.
	 */
	let {
		ref = $bindable(null),
		label = "Branch",
		class: className,
		...restProps
	}: MessageBranchPageProps = $props();

	const branch = getMessageBranchContext("`<Message.BranchPage>`");
</script>

<ButtonGroupText
	class={cn("border-none bg-transparent text-muted-foreground shadow-none", className)}
>
	{#snippet child({ props })}
		<span
			bind:this={ref}
			{...props}
			{...restProps}
			data-slot="message-branch-page"
			role="status"
			aria-live="polite"
			aria-atomic="true"
		>
			<span class="sr-only">{label} {branch.position} of {branch.count}</span>
			<span aria-hidden="true">{branch.position} of {branch.count}</span>
		</span>
	{/snippet}
</ButtonGroupText>
