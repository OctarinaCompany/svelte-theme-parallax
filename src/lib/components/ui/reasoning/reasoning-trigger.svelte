<script lang="ts" module>
	import type { Collapsible as CollapsiblePrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "$lib/utils.js";
	import type { Snippet } from "svelte";

	/** The primitive's trigger props — see `reasoning.svelte` for why not Svelte's `HTMLButtonAttributes`. */
	export type ReasoningTriggerProps = WithoutChild<CollapsiblePrimitive.TriggerProps> & {
		/**
		 * Replaces the TEXT between the brain and the chevron — upstream's `getThinkingMessage`,
		 * as a snippet rather than a render function. Receives what the default text is built
		 * from: whether the thought is still streaming, and its duration in whole seconds or
		 * `undefined` when nobody measured it.
		 */
		message?: Snippet<[{ isStreaming: boolean; duration: number | undefined }]>;
		/**
		 * Replaces the WHOLE row — brain, text and chevron. `message` is ignored when this is
		 * given, as it is upstream: `children ?? <default row>`.
		 */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import BrainIcon from "@lucide/svelte/icons/brain";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import { TextGradient } from "$lib/components/ui/text-gradient/index.js";
	import { useReducedMotion } from "$lib/shared/reduced-motion.svelte.js";
	import { getReasoningContext } from "./reasoning.svelte.js";

	/**
	 * The trigger row: brain, a line of text, chevron. Everything it prints is read off the
	 * root's `ReasoningState`, which is what lets `<Reasoning.Trigger />` be called with no props
	 * at all.
	 *
	 * THE STREAMING LABEL IS A `TextGradient` at `duration={1}` — upstream's `<Shimmer
	 * duration={1}>` under the house name. It is the one moving thing on the row while the model
	 * writes, and `TextGradient` already flattens itself under `prefers-reduced-motion`, so the
	 * row needs no second opinion on that. The chevron's 150ms turn is the other transition this
	 * part owns; it goes through the house reader (`src/lib/shared/reduced-motion.svelte.ts`) the
	 * way `ui/tool`'s header does.
	 *
	 * `TextGradient` is an `inline-block` whose sweep is measured against its own box, and this
	 * row is a flex container — so the label is wrapped in nothing and sits as a flex item at its
	 * content width, which is the case its own comment says works.
	 *
	 * THE STREAMING LABEL IS A LIVE REGION: `role="status"` with an `aria-label`, the way the
	 * kit's other shimmering "Thinking" stamps its root (`src/lib/components/ui/loader/loader-text-shimmer.svelte`).
	 * The row is a `<button>`, so a reader whose focus is elsewhere would otherwise get no signal
	 * that the model started thinking, none when the root opens the panel on its behalf, and none
	 * when the label settles into a duration and the panel folds a second later. `TextGradient`
	 * spreads its rest props onto the rendered span, so both attributes land on it unchanged; the
	 * label drops the ellipsis, as the loader's does, because it is read aloud, not painted.
	 */
	let {
		ref = $bindable(null),
		class: className,
		message,
		children,
		...restProps
	}: ReasoningTriggerProps = $props();

	const reasoning = getReasoningContext("`<Reasoning.Trigger>`");
	const reducedMotion = useReducedMotion();
</script>

<!--
	`text-left` is deliberate: a `<button>` centres its text, and a custom `message` long enough to
	wrap would otherwise centre against the chevron.
-->
<Collapsible.Trigger
	bind:ref
	data-slot="reasoning-trigger"
	class={cn(
		"flex w-full items-center gap-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground",
		className,
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		<BrainIcon class="shrink-0" />
		{#if message}
			{@render message({ isStreaming: reasoning.isStreaming, duration: reasoning.duration })}
		{:else if reasoning.isStreaming}
			<TextGradient duration={1} role="status" aria-label="Thinking">Thinking…</TextGradient>
		{:else}
			<span>{reasoning.restingLabel}</span>
		{/if}
		<ChevronDownIcon
			class={cn(
				"shrink-0 group-data-[state=open]/reasoning:rotate-180",
				!reducedMotion.current && "transition-transform",
			)}
		/>
	{/if}
</Collapsible.Trigger>
