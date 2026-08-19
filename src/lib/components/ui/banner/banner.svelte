<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { BannerRenderProps, BannerVariant } from "./banner.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type BannerChildProps = {
		"data-slot": "banner";
		"data-state": "open";
		"data-variant": BannerVariant;
		role: "status";
		"aria-live": "polite";
		class: string;
	} & Record<string, unknown>;

	export type BannerRootProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** Controlled open state; pairs with `onOpenChange`, as every bindable prop here does. */
		open?: boolean;
		/** @default true */
		defaultOpen?: boolean;
		/** Called whenever the banner opens or closes, in both controlled and uncontrolled modes. */
		onOpenChange?: (open: boolean) => void;
		/** Fires on dismissal, but **only** while registered inside a `<Banner.Queue>`. */
		onDismiss?: () => void;
		/** @default 'default' */
		variant?: BannerVariant;
		/** Determines queue ordering. Read only while registered inside a `<Banner.Queue>`. */
		priority?: number;
		/** Auto-dismiss delay in ms. Read only while registered inside a `<Banner.Queue>`. */
		duration?: number;
		/** @default true */
		dismissible?: boolean;
		/**
		 * Render the banner onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element. Ignored while registered inside a
		 * `<Banner.Queue>`, and when `open` is `false`.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent.
		 */
		child?: Snippet<[{ props: BannerChildProps }]>;
	};

	/** Upstream-parity alias of {@link BannerRootProps}. */
	export type BannerProps = BannerRootProps;
</script>

<script lang="ts">
	import { untrack } from "svelte";

	import {
		BannerState,
		bannerVariants,
		DEFAULT_BANNER_DISMISSIBLE,
		getBannersContext,
		hasBannersContext,
		setBannerContext,
	} from "./banner.svelte.js";

	let {
		ref = $bindable(null),
		open = $bindable(),
		defaultOpen = true,
		onOpenChange,
		onDismiss,
		variant = "default",
		priority,
		duration,
		dismissible = DEFAULT_BANNER_DISMISSIBLE,
		class: className,
		child,
		children,
		...restProps
	}: BannerRootProps = $props();

	// Uncontrolled: seed once from `defaultOpen`. Controlled: the caller's binding wins.
	// svelte-ignore state_referenced_locally
	open ??= defaultOpen;

	const queue = hasBannersContext() ? getBannersContext("<Banner.Root>") : undefined;
	const isInsideQueue = queue !== undefined;

	function close() {
		open = false;
		onOpenChange?.(false);
	}

	setBannerContext(
		new BannerState({
			getId: () => undefined,
			getVariant: () => variant,
			getDismissible: () => dismissible,
			close,
			remove: () => {},
		}),
	);

	// Registers `children` into the queue whenever this banner is inside one and `open`. Reads every
	// prop that should trigger a re-registration (upstream's dependency array), but performs the
	// mutation inside `untrack()`, because `addBanner`/`removeBanner` write `queue.banners` — state
	// this effect must not subscribe to.
	$effect(() => {
		if (!isInsideQueue || !open) return;

		const currentVariant = variant;
		const currentPriority = priority;
		const currentDismissible = dismissible;
		const currentDuration = duration;
		const currentChildren = children;

		return untrack(() => {
			const id = queue.addBanner({
				content: currentChildren as Snippet<[BannerRenderProps]>,
				variant: currentVariant,
				priority: currentPriority,
				dismissible: currentDismissible,
				duration: currentDuration,
				onDismiss: () => {
					onDismiss?.();
					// Write the bindable before notifying, so `bind:open` stays truthful and the
					// registration effect tears down instead of re-adding the dismissed banner.
					open = false;
					onOpenChange?.(false);
				},
			});

			return () => untrack(() => queue.removeBanner(id));
		});
	});

	const rootAttrs = $derived({
		"data-slot": "banner",
		"data-state": "open",
		"data-variant": variant,
		role: "status",
		"aria-live": "polite",
		...restProps,
		class: cn(bannerVariants({ variant }), className),
	} as BannerChildProps);
</script>

{#if !isInsideQueue && open}
	{#if child}
		{@render child({ props: rootAttrs })}
	{:else}
		<div bind:this={ref} {...rootAttrs}>
			{@render children?.()}
		</div>
	{/if}
{/if}
