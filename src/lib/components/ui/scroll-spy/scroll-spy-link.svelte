<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAnchorAttributes, MouseEventHandler } from "svelte/elements";

	import type { ScrollSpyOrientation } from "./scroll-spy.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. `href` is omitted by design. */
	export type ScrollSpyLinkChildProps = {
		"data-slot": "scroll-spy-link";
		"data-orientation": ScrollSpyOrientation;
		"data-state": "active" | "inactive";
		"aria-current": "location" | undefined;
		class: string;
		onclick: MouseEventHandler<HTMLAnchorElement>;
	} & Record<string, unknown>;

	export type ScrollSpyLinkProps = WithElementRef<HTMLAnchorAttributes, HTMLAnchorElement> & {
		/** The id of the section this link targets. Required. */
		value: string;
		/**
		 * Render the link onto your own element instead of the default `<a>`. The snippet receives the
		 * merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered, `ref` stays `null`, and `href` is omitted so the caller's
		 * element (typically a `<button>`) keeps its own semantics — upstream line 387.
		 */
		child?: Snippet<[{ props: ScrollSpyLinkChildProps }]>;
	};
</script>

<script lang="ts">
	import { getScrollSpyContext } from "./scroll-spy.svelte.js";

	let {
		ref = $bindable(null),
		value,
		onclick,
		class: className,
		children,
		child,
		...restProps
	}: ScrollSpyLinkProps = $props();

	const state = getScrollSpyContext("Link");

	const isActive = $derived(state.isActive(value));

	// Upstream's order (lines 370-377): suppress the browser's own hash navigation, run the
	// integrator's handler, then scroll — so a handler that inspects the event sees it already
	// cancelled, and one that stops the scroll cannot (upstream offers no such escape hatch either).
	const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
		event.preventDefault();
		onclick?.(event);
		state.scrollToSection(value);
	};

	const linkAttrs = $derived({
		"data-slot": "scroll-spy-link",
		"data-orientation": state.orientation,
		"data-state": isActive ? "active" : "inactive",
		// Marks the active link as the current location for assistive technology.
		"aria-current": isActive ? "location" : undefined,
		...restProps,
		href: child ? undefined : `#${value}`,
		class: cn(
			"rounded px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-accent data-[state=active]:text-accent-foreground",
			className,
		),
		onclick: handleClick,
	} as ScrollSpyLinkChildProps);
</script>

{#if child}
	{@render child({ props: linkAttrs })}
{:else}
	<a bind:this={ref} {...linkAttrs}>
		{@render children?.()}
	</a>
{/if}
