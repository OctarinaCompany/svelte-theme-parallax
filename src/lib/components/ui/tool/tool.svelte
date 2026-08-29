<script lang="ts" module>
	import type { Collapsible as CollapsiblePrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "$lib/utils.js";
	import type { ToolPartState } from "$lib/shared/chat-parts.js";

	/**
	 * Built on the Collapsible primitive's own props rather than on Svelte's `HTMLAttributes`,
	 * the way `ui/calendar` and `ui/checkbox` wrap theirs: the two disagree on whether `id` may be
	 * `null`, and a spread typed the Svelte way does not assign to the primitive. `open`,
	 * `onOpenChange`, `disabled`, `ref` and `children` are the primitive's; the four below are the
	 * call's identity.
	 */
	export type ToolRootProps = WithoutChild<CollapsiblePrimitive.RootProps> & {
		/**
		 * The part `type` the AI SDK stamps: the literal `"dynamic-tool"` for a tool the model
		 * discovered at run time, or `` `tool-${name}` `` for one declared up front. Declared as
		 * `string` rather than as a template-literal union so a value read off a transcript needs no
		 * cast; the name is derived by `toolNameOf` in `src/lib/shared/chat-parts.ts`, and a value in
		 * neither shape is printed as it is.
		 */
		type: string;
		/** Where the call is in its life. Drives the badge and `data-tool-state`. */
		state: ToolPartState;
		/**
		 * The name a dynamic part carries beside its `type`. Required when `type` is
		 * `"dynamic-tool"` — in development the root throws at mount if it is missing, because the
		 * header would otherwise print the fallback `"Tool"` for every call and the mistake would look
		 * like a design choice. Ignored for a typed part, whose name is in its `type`.
		 */
		toolName?: string;
		/**
		 * A caption that replaces the derived name in the header — upstream's
		 * `title ?? derivedName`. `data-tool-name` is NOT replaced: it keeps the name derived from
		 * `type` and `toolName`, so a selector keyed on the tool keeps matching under a caption. It
		 * also claims the HTML `title` attribute — the root renders no browser tooltip of its own.
		 */
		title?: string;
	};

	/** Alias of {@link ToolRootProps}, present for parity with the upstream type name. */
	export type ToolProps = ToolRootProps;
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import { setToolContext, ToolState } from "./tool.svelte.js";

	/**
	 * One tool call in a chat transcript: a header naming the tool and its state, and a collapsible
	 * body carrying what went in and what came out.
	 *
	 * FOUR THINGS DIVERGE FROM UPSTREAM (`tool.tsx` in AI Elements):
	 *
	 * 1. THE IDENTITY LIVES ON THE ROOT. Upstream's `Tool` is a bare `Collapsible` and its
	 *    `ToolHeader` takes `type`, `state` and `toolName` (`tool.tsx:35-45`), so the root knows
	 *    nothing about the call it wraps. Here the root takes them, publishes a `ToolState` on
	 *    context, and stamps `data-tool-state` and `data-tool-name` — which is what lets a
	 *    transcript style or select every running call with one attribute selector, and lets a
	 *    custom header read the resolved name instead of being handed the same props twice. Both
	 *    attributes carry machine data (the raw `state`, the name derived from the part); the
	 *    caller's `title` is display copy and reaches the header only.
	 *
	 * 2. THE BADGE IS A `Status`. Upstream draws a `Badge` around one of four Lucide glyphs, five
	 *    of the seven states in a raw palette colour (`text-yellow-600`, `text-green-600`, …
	 *    `tool.tsx:57-65`), which would survive exactly one of this kit's twelve palettes. The kit already has the object
	 *    that says "a state, coloured" — `ui/status`, whose soft pill is the same one every table
	 *    row uses — and `src/lib/shared/chat-parts.ts` maps the seven states onto its five
	 *    families. Running states pulse, the way the pending row in a monitor list does.
	 *
	 * 3. THE INPUT AND OUTPUT ARE RENDERED, NOT SERIALISED. Upstream `JSON.stringify`s both into a
	 *    code block (`tool.tsx:125`, `:149`). A live value goes through `ui/json-viewer` here, so a
	 *    reader can fold a large result and copy it as JSON; only a string — which is text, not
	 *    data — takes the code block.
	 *
	 * 4. THE CONTENT DOES NOT ANIMATE. Upstream slides and fades the body with `tailwindcss-animate`
	 *    classes (`tool.tsx:108`). The house Collapsible is the verbatim shadcn-svelte port and
	 *    ships no animation; a body that opens instantly is the same object under
	 *    `prefers-reduced-motion`, which the alternative would have had to special-case.
	 *
	 * SMALLER ONES: the group class is NAMED (`group/tool`) so a chevron inside a transcript does
	 * not rotate when some ancestor `group` opens — a message bubble is a group too; and the
	 * primitive's `disabled` passes through because a transcript replaying a finished conversation
	 * has a use for it.
	 *
	 * THE OPEN STATE: `open` is bound straight through to the primitive, and `onOpenChange` is
	 * forwarded. Bits UI calls it only from the setter its trigger drives — never when the parent
	 * writes `open` through the binding — which is the house rule for `onXChange` (fired only on a
	 * real change). `setOpen` below, the path a part takes, guards the same way by hand.
	 */
	let {
		ref = $bindable(null),
		class: className,
		type,
		state,
		toolName,
		title,
		open = $bindable(false),
		onOpenChange,
		children,
		...restProps
	}: ToolRootProps = $props();

	// Checked once, at mount, and only in development: the production build strips the branch. A
	// dynamic part without its name is a caller bug, not a state the component should render
	// around — the header would print `"Tool"` for every such call. `untrack` documents that this
	// is a deliberate one-time read of reactive props, not a reactivity bug — the same shape as the
	// dev-only assertions in `circular-progress.svelte`.
	untrack(() => {
		if (!import.meta.env.DEV) return;
		if (type === "dynamic-tool" && toolName === undefined) {
			throw new Error(
				'`<Tool.Root type="dynamic-tool">` requires a `toolName`: a dynamic part carries its name beside its type, not in it.',
			);
		}
	});

	/** The one place a PART writes the bindable; the trigger writes it through the primitive. */
	function setOpen(next: boolean): void {
		if (next === open) return;
		open = next;
		onOpenChange?.(next);
	}

	const tool = new ToolState({
		getType: () => type,
		getState: () => state,
		getToolName: () => toolName,
		getTitle: () => title,
		getOpen: () => open,
		setOpen,
	});

	setToolContext(tool);
</script>

<!--
	`not-prose` is upstream's and load-bearing: a tool call sits inside a Markdown-rendered
	assistant message, and the typography plugin would otherwise restyle the header's `<h4>` and
	the code block's `<pre>`.
-->
<Collapsible.Root
	bind:ref
	bind:open
	onOpenChange={(next) => onOpenChange?.(next)}
	data-slot="tool"
	data-tool-state={state}
	data-tool-name={tool.identity}
	class={cn("group/tool not-prose mb-4 w-full rounded-md border", className)}
	{...restProps}
>
	{@render children?.()}
</Collapsible.Root>
