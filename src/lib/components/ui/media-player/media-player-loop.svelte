<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerLoopChildProps = {
		type: "button";
		"data-slot": "media-player-loop";
		"data-state": "on" | "off";
		"data-disabled": "" | undefined;
		"aria-label": string;
		"aria-pressed": boolean;
		"aria-controls": string;
		disabled: boolean;
		class: string;
	} & Record<string, unknown>;

	export type MediaPlayerLoopProps = WithElementRef<
		Omit<HTMLButtonAttributes, "type">,
		HTMLElement
	> & {
		/** Render the control onto your own element. Replaces upstream's `asChild`. */
		child?: Snippet<[{ props: MediaPlayerLoopChildProps }]>;
		/** Replaces the default repeat icon. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import RepeatIcon from "@lucide/svelte/icons/repeat";

	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	import MediaPlayerTooltip from "./media-player-tooltip.svelte";
	import { getMediaPlayerContext } from "./media-player.svelte.js";

	let {
		ref = $bindable(null),
		disabled,
		onclick: onclickProp,
		class: className,
		child,
		children,
		...restProps
	}: MediaPlayerLoopProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.Loop>");

	const isDisabled = $derived(Boolean(disabled) || root.disabled);
	// `loop` has no Svelte media binding; the state class mirrors the element property and watches
	// the attribute with a `MutationObserver`, so the label stays right when the caller flips it.
	const action = $derived(root.loop ? "Disable loop" : "Enable loop");

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		root.toggleLoop();
	}

	const loopAttrs = $derived({
		type: "button",
		"aria-controls": root.mediaId,
		"aria-label": action,
		"aria-pressed": root.loop,
		"data-disabled": isDisabled ? "" : undefined,
		"data-slot": "media-player-loop",
		"data-state": root.loop ? "on" : "off",
		...restProps,
		disabled: isDisabled,
		class: cn("size-8", className),
		onclick,
	} as MediaPlayerLoopChildProps);
</script>

<MediaPlayerTooltip tooltip={action} shortcut="R">
	{#if child}
		{@render child({ props: loopAttrs })}
	{:else}
		<Button bind:ref variant="ghost" size="icon" {...loopAttrs}>
			{#if children}
				{@render children()}
			{:else}
				<RepeatIcon class={root.loop ? undefined : "text-muted-foreground"} />
			{/if}
		</Button>
	{/if}
</MediaPlayerTooltip>
