<script lang="ts" module>
	import type { ButtonProps } from "$lib/components/ui/button/index.js";
	import type { PromptInputButtonTooltip } from "./prompt-input.svelte.js";

	/**
	 * `href` is dropped: a tool is a command, never a link, and `Button` would render an anchor.
	 * `ref` is typed as `Button` types it.
	 */
	export type PromptInputButtonProps = Omit<ButtonProps, "href"> & {
		/**
		 * A tooltip around the button: a string, or `{ content, shortcut?, side? }` where the
		 * shortcut renders as a `Kbd` after the text. An empty string renders no tooltip.
		 */
		tooltip?: PromptInputButtonTooltip;
	};
</script>

<script lang="ts">
	import { mergeProps } from "bits-ui";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Kbd } from "$lib/components/ui/kbd/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { cn } from "$lib/utils.js";
	import { resolvePromptInputTooltip } from "./prompt-input.svelte.js";

	/**
	 * A tool button: ghost, on the control ramp's 32px rung, `type="button"` so a click never
	 * submits the form it sits in.
	 *
	 * `size` DEFAULTS TO `sm`, NOT UPSTREAM'S CHILD COUNT. Upstream reads `Children.count` and
	 * picks `icon-sm` for a lone icon; a Svelte snippet cannot be counted. An icon-only button
	 * says `size="icon-sm"` and gives itself an `aria-label` — the tooltip is NOT its name: Bits UI
	 * wires the content as `aria-describedby`, which is a description, and a button whose only
	 * name is a description has none.
	 *
	 * The tooltip wraps the same button snippet in both branches so a `tooltip` that arrives later
	 * changes nothing about the element. `mergeProps` rather than a spread, so the trigger's own
	 * handlers chain with the caller's instead of replacing them (`event-calendar-nav-next.svelte`
	 * is the precedent).
	 */
	let {
		ref = $bindable(null),
		class: className,
		variant = "ghost",
		size = "sm",
		type = "button",
		tooltip,
		children,
		...restProps
	}: PromptInputButtonProps = $props();

	const resolvedTooltip = $derived(resolvePromptInputTooltip(tooltip));
</script>

{#snippet button({ props }: { props?: Record<string, unknown> } = {})}
	<Button
		bind:ref
		{variant}
		{size}
		{type}
		{...mergeProps(props, restProps, {
			"data-slot": "prompt-input-button",
			class: cn(className),
		})}
	>
		{@render children?.()}
	</Button>
{/snippet}

{#if resolvedTooltip}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				{@render button({ props })}
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content side={resolvedTooltip.side}>
			{resolvedTooltip.content}
			{#if resolvedTooltip.shortcut}
				<Kbd>{resolvedTooltip.shortcut}</Kbd>
			{/if}
		</Tooltip.Content>
	</Tooltip.Root>
{:else}
	{@render button()}
{/if}
