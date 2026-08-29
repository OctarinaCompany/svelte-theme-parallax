<script lang="ts" module>
	import type { ButtonProps } from "$lib/components/ui/button/index.js";

	/**
	 * `href` is omitted because an action is a command, never a link — which is also what lets
	 * `ref` be a `<button>` and nothing else.
	 */
	export type MessageActionProps = Omit<ButtonProps, "href"> & {
		/**
		 * The button's accessible name — its `aria-label` and a visually hidden text. Required:
		 * an action carries an icon and nothing else, and an icon button without a name is a
		 * button a screen reader announces as "button".
		 */
		label: string;
		/**
		 * A tooltip shown on hover and focus. Decoration over the label, not a substitute for
		 * it — the tooltip is not the accessible name. Omitted, the button renders bare.
		 */
		tooltip?: string;
	};
</script>

<script lang="ts">
	import { mergeProps } from "bits-ui";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";

	/**
	 * One icon button under a turn: copy, retry, thumbs up.
	 *
	 * A ghost `icon-sm` Button by default — upstream's own choice, and the rung the kit's control
	 * ramp gives a secondary control (`docs/CONVENTIONS.md` §3). `variant` and `size` stay
	 * overridable for the one action that should stand out.
	 *
	 * WITH A TOOLTIP, THE BUTTON IS THE TRIGGER. Bits UI's `Tooltip.Trigger` renders a `<button>`
	 * of its own by default; nesting the Button inside it would put a button in a button. The
	 * trigger's `child` snippet hands over the attributes it needs on the element — the hover and
	 * focus handlers, `aria-describedby`, `data-state` — and they land on the Button instead.
	 *
	 * MERGED WITH THE CALLER'S PROPS, NOT SPREAD BESIDE THEM. The trigger's props are not only
	 * hover listeners: they carry an `onclick` (a click closes the tooltip), `onfocus`, `onblur`,
	 * the pointer handlers, and a `disabled` that is the TRIGGER's own — always `false` here,
	 * because the trigger is never told about the button's. Two spreads let the later one erase
	 * the earlier: caller first, and `onclick={regenerate}` never runs and `disabled` renders an
	 * enabled button; trigger first, and the tooltip never opens. `mergeProps` (Bits UI's own,
	 * from svelte-toolbelt) chains handlers of the same name in order and lets the later side win
	 * a plain attribute, so the trigger goes first and the caller second: Bits' handler runs, then
	 * the caller's, and the caller's `disabled` stands. `context-usage-trigger.svelte` does the
	 * same for its hover-card trigger. `data-slot` is restated after the merge because the
	 * trigger's own `data-slot="tooltip-trigger"` travels in those props and this element is an
	 * action first.
	 *
	 * The tooltip carries its own `Tooltip.Provider`, as upstream's does: an action may sit in a
	 * page that mounted none, and a provider per button costs nothing that matters at the
	 * numbers a toolbar reaches.
	 */
	let {
		ref = $bindable(null),
		label,
		tooltip,
		variant = "ghost",
		size = "icon-sm",
		class: className,
		children,
		...restProps
	}: MessageActionProps = $props();
</script>

{#snippet action(triggerProps: Record<string, unknown> = {})}
	<Button
		bind:ref
		{variant}
		{size}
		aria-label={label}
		class={className}
		{...mergeProps(triggerProps, restProps)}
		data-slot="message-action"
	>
		{@render children?.()}
		<span class="sr-only">{label}</span>
	</Button>
{/snippet}

{#if tooltip}
	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					{@render action(props)}
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>{tooltip}</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{:else}
	{@render action()}
{/if}
