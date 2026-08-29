<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLImgAttributes } from "svelte/elements";
	import type { ModelProvider } from "./model-selector.svelte.js";

	export type ModelSelectorLogoProps = WithElementRef<
		Omit<HTMLImgAttributes, "src">,
		HTMLImageElement
	> & {
		/** The provider slug. Names the logo, and — without `src` — the URL it loads from. */
		provider: ModelProvider;
		/**
		 * Where the image comes from. Replaces the models.dev URL entirely: a data URL, a
		 * same-origin asset, a proxied copy. `provider` still names the logo for `fallback`.
		 * @default modelProviderLogoUrl(provider)
		 */
		src?: string;
		/**
		 * Rendered INSTEAD of the image once it fails to load — a network error, a slug models.dev
		 * does not know, a blocked host. Receives the provider and the URL that failed. Without
		 * it a failed logo renders nothing, which is what an empty-`alt` broken image already
		 * does in every browser, minus the broken-image glyph some of them draw.
		 */
		fallback?: Snippet<[{ provider: ModelProvider; src: string }]>;
	};
</script>

<script lang="ts">
	import { modelProviderLogoUrl } from "./model-selector.svelte.js";

	/**
	 * A provider's mark, 12px square. models.dev serves black-on-transparent SVGs, hence
	 * `dark:invert`: the whole image, not just its fill, is inverted, which is why the logo
	 * group's ring is chosen per mode to survive the same filter.
	 *
	 * `alt=""` rather than upstream's `${provider} logo`: the mark sits beside a
	 * `ModelSelector.Name` that already says which model this is, and "anthropic logo" read
	 * before every row is noise, not information. Pass `alt` to override where the logo stands
	 * alone. `width`/`height` reserve the box before the image arrives so a list of twelve rows
	 * does not reflow twelve times.
	 */
	let {
		ref = $bindable(null),
		class: className,
		provider,
		src,
		fallback,
		alt = "",
		onerror,
		...restProps
	}: ModelSelectorLogoProps = $props();

	const resolvedSrc = $derived(src ?? modelProviderLogoUrl(provider));

	// The URL that failed, not a boolean: a `src` that changes after an error is a new image
	// that deserves a new attempt, and comparing URLs gives that for free without an effect.
	let failedSrc = $state<string | null>(null);
	const failed = $derived(failedSrc === resolvedSrc);

	// Typed as a bare `Event` because svelte-check types the `<img>`'s `onerror` against `Element`;
	// the target IS the image, so the narrowing the caller's handler was declared with holds.
	function handleError(event: Event): void {
		failedSrc = resolvedSrc;
		onerror?.(event as Event & { currentTarget: EventTarget & HTMLImageElement });
	}
</script>

{#if failed && fallback}
	{@render fallback({ provider, src: resolvedSrc })}
{:else if !failed}
	<img
		bind:this={ref}
		data-slot="model-selector-logo"
		data-provider={provider}
		class={cn("size-3 dark:invert", className)}
		src={resolvedSrc}
		{alt}
		width={12}
		height={12}
		loading="lazy"
		onerror={handleError}
		{...restProps}
	/>
{/if}
