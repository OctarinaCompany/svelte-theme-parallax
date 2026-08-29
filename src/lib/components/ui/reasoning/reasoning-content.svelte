<script lang="ts" module>
	import type { Collapsible as CollapsiblePrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	/**
	 * The primitive's content props — see `reasoning.svelte` for why not Svelte's
	 * `HTMLAttributes`. The primitive's `children` snippet is dropped: the body is a string, not a
	 * render function, for the reason `reasoning.svelte` gives under divergence 2.
	 */
	export type ReasoningContentProps = WithoutChildrenOrChild<CollapsiblePrimitive.ContentProps> & {
		/**
		 * The thought, as Markdown. Pass the part's `text` as it streams; `Message.Response`
		 * re-lexes only the trailing blocks and closes any construct the stream has opened but
		 * not finished.
		 */
		content: string;
	};
</script>

<script lang="ts">
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import * as Message from "$lib/components/ui/message/index.js";
	import { getReasoningContext } from "./reasoning.svelte.js";

	/**
	 * The collapsible body — upstream's `ReasoningContent`, a `Streamdown` under `mt-4 text-sm
	 * text-muted-foreground`. The Markdown goes through `Message.Response`, the house wrapper over
	 * the same renderer, so a fenced block inside a thought is the same `CodeBlock` it is inside
	 * an answer; nothing is rendered twice.
	 *
	 * `isAnimating` FOLLOWS THE ROOT'S `isStreaming`. Upstream's body renders the thought at rest
	 * even while it arrives; here each new word blurs in the way it does in the answer below it,
	 * and stops the moment the stream does. The reader who asked for reduced motion is honoured
	 * inside `Message.Response`.
	 *
	 * The context read is a real dependency here, not only a guard: it is where `isStreaming`
	 * comes from. It also makes `<Reasoning.Content>` outside a root fail with the same message as
	 * every other part rather than with Bits UI's own.
	 */
	let {
		ref = $bindable(null),
		class: className,
		content,
		...restProps
	}: ReasoningContentProps = $props();

	const reasoning = getReasoningContext("`<Reasoning.Content>`");
</script>

<Collapsible.Content
	bind:ref
	data-slot="reasoning-content"
	class={cn("mt-4 text-sm text-muted-foreground outline-none", className)}
	{...restProps}
>
	<Message.Response {content} isAnimating={reasoning.isStreaming} />
</Collapsible.Content>
