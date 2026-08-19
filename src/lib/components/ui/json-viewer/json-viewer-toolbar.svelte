<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type JsonViewerToolbarProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLDivElement>>
	> & {
		/** The caption shown on the left. Upstream's `title` prop. */
		label?: string;
	};

	/** How long the copy button shows its receipt before returning to the copy glyph. */
	export const JSON_VIEWER_COPY_RECEIPT_MS = 1500;
</script>

<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
	import { getJsonViewerContext } from "./json-viewer.svelte.js";

	/**
	 * The header row: the caption, and the expand / collapse / copy cluster.
	 *
	 * Upstream builds the cluster by hand — a bordered `div` with two ghost buttons and two vertical
	 * `Separator`s between them. That is `ButtonGroup`, which this kit
	 * has, so the joined borders come from the component rather than from three `rounded-none`
	 * overrides.
	 *
	 * `font-sans` because the root is `font-mono` and the controls are chrome, not code.
	 */
	let {
		ref = $bindable(null),
		class: className,
		label,
		...restProps
	}: JsonViewerToolbarProps = $props();

	const viewer = getJsonViewerContext("`<JsonViewer.Toolbar>`");

	/** The receipt on the copy button. Flipped only after `writeText` RESOLVES — see below. */
	let copied = $state(false);
	let receiptTimer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		try {
			await navigator.clipboard.writeText(viewer.toJsonText());
			copied = true;
			clearTimeout(receiptTimer);
			receiptTimer = setTimeout(() => (copied = false), JSON_VIEWER_COPY_RECEIPT_MS);
		} catch {
			// The clipboard API refuses in an insecure context and when permission is denied. A check
			// mark for a copy that did not happen would be a lie, so the button simply does nothing.
			copied = false;
		}
	}

	$effect(() => () => clearTimeout(receiptTimer));
</script>

<div
	bind:this={ref}
	data-slot="json-viewer-toolbar"
	class={cn("flex items-center justify-between gap-2 p-2 font-sans", className)}
	{...restProps}
>
	<div class="px-2 text-xs font-medium text-muted-foreground">{label ?? ""}</div>
	<ButtonGroup.Root>
		<Button
			variant="outline"
			size="sm"
			class="text-xs font-normal"
			onclick={() => viewer.expandAll()}
		>
			Expand all
		</Button>
		<Button
			variant="outline"
			size="sm"
			class="text-xs font-normal"
			onclick={() => viewer.collapseAll()}
		>
			Collapse all
		</Button>
		<Button
			variant="outline"
			size="icon-sm"
			aria-label={copied ? "JSON copied" : "Copy JSON"}
			onclick={copy}
		>
			{#if copied}
				<CheckIcon />
			{:else}
				<CopyIcon />
			{/if}
		</Button>
	</ButtonGroup.Root>
</div>
