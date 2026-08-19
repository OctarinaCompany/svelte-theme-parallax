<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { ScrollSpyOrientation } from "./scroll-spy.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type ScrollSpySectionChildProps = {
		"data-slot": "scroll-spy-section";
		"data-orientation": ScrollSpyOrientation;
		id: string;
	} & Record<string, unknown>;

	export type ScrollSpySectionProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/** Becomes the element's `id` and registers it for tracking. Required. */
		value: string;
		/**
		 * Render the section onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`, so the caller's element is not
		 * registered for visibility tracking — bind it yourself if it must be tracked.
		 */
		child?: Snippet<[{ props: ScrollSpySectionChildProps }]>;
	};
</script>

<script lang="ts">
	import { getScrollSpyContext } from "./scroll-spy.svelte.js";

	let {
		ref = $bindable(null),
		value,
		class: className,
		children,
		child,
		...restProps
	}: ScrollSpySectionProps = $props();

	const state = getScrollSpyContext("Section");

	// Upstream's registration layout effect (lines 432-441): a falsy `value` is never registered, and
	// the teardown unregisters on unmount and before a `value` change re-registers.
	$effect(() => {
		const element = ref;
		const id = value;
		if (!element || !id) return;

		state.sections.register(id, element);

		return () => {
			state.sections.unregister(id);
		};
	});

	// Upstream never calls `cn()` here, so the section carries no default classes and renders no
	// `class` attribute at all unless the caller supplies one.
	const sectionAttrs = $derived({
		"data-slot": "scroll-spy-section",
		"data-orientation": state.orientation,
		...restProps,
		id: value,
		class: className ? cn(className) : undefined,
	} as ScrollSpySectionChildProps);
</script>

{#if child}
	{@render child({ props: sectionAttrs })}
{:else}
	<div bind:this={ref} {...sectionAttrs}>
		{@render children?.()}
	</div>
{/if}
