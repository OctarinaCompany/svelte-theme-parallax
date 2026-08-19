<script lang="ts" module>
	import type { Snippet } from "svelte";

	export type MentionPortalProps = {
		/**
		 * Where the popup is portalled to — an element or a selector. Upstream's `container`,
		 * renamed to match `<Combobox.Portal>` (divergence D-2).
		 *
		 * @default document.body
		 */
		to?: Element | string;
		/**
		 * Whether to leave the content in place instead of portalling it.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/** Normally a `<Mention.Content>`. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";

	import { getMentionContext } from "./mention.svelte.js";

	let { to, disabled = false, children }: MentionPortalProps = $props();

	// Only for the guard-rail error: the portal renders nothing of its own.
	getMentionContext("<Mention.Portal>");
</script>

<PopoverPrimitive.Portal {to} {disabled}>
	{@render children?.()}
</PopoverPrimitive.Portal>
