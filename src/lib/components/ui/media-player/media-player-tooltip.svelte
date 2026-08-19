<script lang="ts" module>
	import type { Snippet } from "svelte";

	export type MediaPlayerTooltipProps = {
		/** The tooltip's text. With no `tooltip` *and* no `shortcut` the trigger renders bare. */
		tooltip?: string;
		/** Keyboard shortcut(s) rendered as `<kbd>` pills beside the text. */
		shortcut?: string | string[];
		/**
		 * How long the pointer must rest on the trigger before the tooltip opens.
		 *
		 * @default the root's `tooltipDelayDuration`
		 */
		delayDuration?: number;
		/**
		 * Distance in pixels between the trigger and the tooltip.
		 *
		 * @default the root's `tooltipSideOffset`
		 */
		sideOffset?: number;
		/** The control the tooltip describes. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";

	import { getMediaPlayerContext } from "./media-player.svelte.js";

	let { tooltip, shortcut, delayDuration, sideOffset, children }: MediaPlayerTooltipProps =
		$props();

	const root = getMediaPlayerContext("<MediaPlayer.Tooltip>");

	const keys = $derived(
		shortcut === undefined ? [] : Array.isArray(shortcut) ? shortcut : [shortcut],
	);
	const suppressed = $derived(root.withoutTooltip || (!tooltip && keys.length === 0));
</script>

{#if suppressed}
	{@render children?.()}
{:else}
	<Tooltip.Root delayDuration={delayDuration ?? root.tooltipDelayDuration}>
		<!--
			Upstream uses Radix's `asChild` so the trigger *is* the control. Svelte has no
			`cloneElement`, and the control is a `<Button>` component rather than an element, so the
			trigger is an `inline-flex` wrapper instead: it lays out identically inside the controls
			bar and still receives the pointer that opens the tooltip.
		-->
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<span {...props} class="inline-flex text-foreground focus-visible:ring-ring/50">
					{@render children?.()}
				</span>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content
			sideOffset={sideOffset ?? root.tooltipSideOffset}
			portalProps={{ to: root.portalContainer ?? undefined }}
			class="flex items-center gap-2 border bg-popover px-2 py-1 font-medium text-popover-foreground data-[side=top]:mb-3.5"
			arrowClasses="hidden"
		>
			{#if tooltip}
				<p>{tooltip}</p>
			{/if}
			{#if keys.length > 0}
				<span class="flex items-center gap-1">
					{#each keys as key (key)}
						<kbd
							data-slot="kbd"
							class="rounded border bg-secondary px-1.5 py-0.5 font-mono text-[11.2px] text-secondary-foreground shadow-xs select-none"
						>
							<abbr title={key} class="no-underline">{key}</abbr>
						</kbd>
					{/each}
				</span>
			{/if}
		</Tooltip.Content>
	</Tooltip.Root>
{/if}
