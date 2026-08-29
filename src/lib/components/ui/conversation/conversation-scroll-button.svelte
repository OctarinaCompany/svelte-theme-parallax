<script lang="ts" module>
	import type { ButtonProps } from "$lib/components/ui/button/index.js";

	/**
	 * `href` is omitted: the part exists to run a command, and an anchor would render nothing
	 * sensible. Everything else Button takes is accepted; `children` replaces the arrow.
	 */
	export type ConversationScrollButtonProps = Omit<ButtonProps, "href">;
</script>

<script lang="ts">
	import { fly } from "svelte/transition";
	import type { MouseEventHandler } from "svelte/elements";
	import { Button } from "$lib/components/ui/button/index.js";
	import { useReducedMotion } from "$lib/shared/reduced-motion.svelte.js";
	import { cn } from "$lib/utils.js";
	import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
	import { getConversationContext } from "./conversation.svelte.js";

	/**
	 * The "jump to the newest message" control: rendered only while the reader has scrolled away
	 * from the bottom, floating over the transcript's bottom edge.
	 *
	 * THE TRANSITION LIVES ON A WRAPPER. A Svelte transition attaches to an element, not to a
	 * component, and Button is a component — so the wrapper carries the position and the `fly`,
	 * and the Button carries the look. The caller's `class` merges onto the WRAPPER, over the
	 * position, because that is what upstream's `className` reaches (`conversation.tsx` merges it
	 * over `absolute bottom-4 left-[50%] translate-x-[-50%]` on the button itself) and because
	 * moving the button — `class="bottom-8"`, `class="right-4 left-auto translate-x-0"` — is the
	 * one override a caller actually reaches for. The button's own look is fixed at
	 * `rounded-full`; its `variant` and `size` remain props. The wrapper is stamped
	 * `conversation-scroll-button-anchor` so a stylesheet can still tell the two apart.
	 * The transition is local (Svelte's default), so a conversation that mounts with the reader
	 * already away from the bottom shows the button without playing it in.
	 *
	 * THE DEFAULT `aria-label` ONLY APPLIES TO THE ARROW FORM. `children` replaces the arrow, and
	 * a button reading "Jump to latest" must not be named "Scroll to bottom" (WCAG 2.5.3, Label in
	 * Name); with `children` the name comes from the content or from a caller's own `aria-label`.
	 *
	 * A caller's `onclick` runs first, and `preventDefault()` on it cancels the scroll — the same
	 * order `ui/copy-button` gives a forwarded handler, and the same pair of types for the same
	 * reason it gives: Button declares `onclick` for both elements it can render, and only a
	 * handler over their common supertype satisfies the pair.
	 */
	let {
		ref = $bindable(null),
		class: className,
		variant = "outline",
		size = "icon",
		onclick: onclickProp,
		children,
		...restProps
	}: ConversationScrollButtonProps = $props();

	const state = getConversationContext("`<Conversation.ScrollButton>`");
	const reducedMotion = useReducedMotion();

	// Reduced motion collapses the entrance to nothing rather than removing it: the button still
	// appears and disappears, it just does so in one frame.
	const flyParams = $derived({ y: 8, duration: reducedMotion.current ? 0 : 150 });

	const onclick: MouseEventHandler<HTMLElement> = (event) => {
		onclickProp?.(event as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
		if (event.defaultPrevented) return;
		state.scrollToBottom("smooth");
	};
</script>

{#if !state.atBottom}
	<div
		data-slot="conversation-scroll-button-anchor"
		class={cn("absolute bottom-4 left-1/2 -translate-x-1/2", className)}
		transition:fly={flyParams}
	>
		<Button
			bind:ref
			data-slot="conversation-scroll-button"
			{variant}
			{size}
			aria-label={children ? undefined : "Scroll to bottom"}
			class="rounded-full"
			{onclick}
			{...restProps}
		>
			{#if children}
				{@render children()}
			{:else}
				<ArrowDownIcon />
			{/if}
		</Button>
	</div>
{/if}
