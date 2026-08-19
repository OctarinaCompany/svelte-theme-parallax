<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { PendingAttributes } from "./pending.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type PendingChildProps = PendingAttributes & Record<string, unknown>;

	export type PendingRootProps = WithElementRef<
		HTMLAttributes<HTMLSpanElement>,
		HTMLSpanElement
	> & {
		/**
		 * The ID of the element. If not provided, an ID will be automatically generated.
		 */
		id?: string;
		/**
		 * Whether the element is in a pending state.
		 * This disables press and hover events while retaining focusability,
		 * and sets aria-busy and aria-disabled for screen readers.
		 * @default false
		 */
		isPending?: boolean;
		/**
		 * Whether the element is disabled.
		 * When pending, the element will be aria-disabled but remain focusable.
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Render the pending state onto your own single element instead of the fallback
		 * `display:contents` wrapper. The snippet receives the merged props (pending attributes and
		 * every forwarded attribute) to spread onto that element.
		 *
		 * Replaces upstream's Radix `Slot` composition, which has no Svelte equivalent.
		 * In `child` mode `children` is not rendered and `ref` is not populated — the caller owns the
		 * element.
		 */
		child?: Snippet<[{ props: PendingChildProps }]>;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import { usePending } from "./pending.svelte.js";

	const uid = $props.id();

	let {
		ref = $bindable(null),
		id,
		isPending = false,
		disabled = false,
		class: className,
		children,
		child,
		...restProps
	}: PendingRootProps = $props();

	if (untrack(() => !child && !children)) {
		throw new Error(
			"`<Pending>` requires exactly one child: pass it as `children`, or spread the merged props onto your own element with the `child` snippet.",
		);
	}

	const pending = usePending({
		id: () => id || uid,
		isPending: () => isPending,
		disabled: () => disabled,
	});

	function preventWhilePending(event: Event) {
		if (!pending.isPending) return;
		event.preventDefault();
		event.stopPropagation();
	}

	function preventActivationKeyWhilePending(event: KeyboardEvent) {
		if (!pending.isPending) return;
		if (event.key !== "Enter" && event.key !== " ") return;
		event.preventDefault();
		event.stopPropagation();
	}
</script>

{#if child}
	{@render child({
		props: { ...restProps, class: cn(className), ...pending.pendingProps } as PendingChildProps,
	})}
{:else}
	<span
		bind:this={ref}
		data-slot="pending"
		class={cn("contents", className)}
		{...restProps}
		{...pending.pendingProps}
		onclickcapture={preventWhilePending}
		onpointerdowncapture={preventWhilePending}
		onpointerupcapture={preventWhilePending}
		onmousedowncapture={preventWhilePending}
		onmouseupcapture={preventWhilePending}
		onkeydowncapture={preventActivationKeyWhilePending}
		onkeyupcapture={preventActivationKeyWhilePending}
	>
		{@render children?.()}
	</span>
{/if}
