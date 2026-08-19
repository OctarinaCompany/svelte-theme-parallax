<script lang="ts" module>
	import { cn, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import type { JsonViewerDataType } from "./json-viewer.svelte.js";

	/**
	 * No `ref`, where every other part in this folder has one — the same omission, and for the same
	 * reason, as `ui/data-table/data-table-view-options.svelte:12-15`. The element this part renders
	 * is a `<span>` or an `<a>` depending on the value, so one `ref` type would be a lie; and a `ref`
	 * left in the type but never destructured would reach `restProps` and be written onto the DOM as
	 * a stringified attribute.
	 */
	export type JsonViewerValueProps = WithoutChildren<HTMLAttributes<HTMLSpanElement>> & {
		/** The leaf value. Objects and arrays never reach this part. */
		value: unknown;
		/** The value's type, already resolved by the node that owns it. */
		type: JsonViewerDataType;
	};
</script>

<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { ColorSwatch } from "$lib/components/ui/color-swatch/index.js";
	import {
		detectJsonDate,
		formatJsonRelativeTime,
		isJsonColorLiteral,
		isJsonHttpUrl,
		JSON_VIEWER_CLAMP_CHARS,
		JSON_VIEWER_WRAP_CHARS,
		jsonViewerValueVariants,
	} from "./json-viewer.svelte.js";

	/**
	 * One leaf value. Upstream's `SmartValue` plus the date annotation
	 * `JsonNode` used to append around it (`:617-628`) — that annotation describes the value, so it
	 * belongs to the value rather than to the dispatcher.
	 *
	 * Four shapes, in the order upstream tests for them: a colour literal (swatch + text), an
	 * `http(s)` URL (a link), a string, and everything else printed with `String()`. Only the
	 * string shape wraps and clamps — to three lines behind a Show more/less toggle once it passes
	 * {@link JSON_VIEWER_CLAMP_CHARS}; the `String()` fallback stays on its row whatever its length.
	 *
	 * NO REF ON THE PART — see {@link JsonViewerValueProps}. `restProps` still lands on whichever
	 * element renders.
	 */
	let { class: className, value, type, ...restProps }: JsonViewerValueProps = $props();

	/** Only the clamped shapes read this; it is the component's whole local state. */
	let expanded = $state(false);

	const text = $derived(typeof value === "string" ? value : "");
	const quoted = $derived(`'${text}'`);

	const isColor = $derived(type === "string" && isJsonColorLiteral(text));
	const isUrl = $derived(type === "string" && isJsonHttpUrl(text));
	const isWrapped = $derived(type === "string" && text.length > JSON_VIEWER_WRAP_CHARS);
	const isClamped = $derived(type === "string" && text.length > JSON_VIEWER_CLAMP_CHARS);

	/** Upstream prints strings quoted, `null` as the bare keyword and the rest with `String()`. */
	const printed = $derived(type === "string" ? quoted : type === "null" ? "null" : String(value));

	/**
	 * `Date.now()` is read once per render rather than on a ticker: the annotation is a reading aid
	 * on a static payload, and a viewer that re-rendered every second to move "3 months ago" by
	 * nothing would cost more than it tells.
	 */
	const detectedDate = $derived(detectJsonDate(value));
	const relativeLabel = $derived(
		detectedDate ? formatJsonRelativeTime(detectedDate, Date.now()) : undefined,
	);

	const valueClass = $derived(
		cn(
			jsonViewerValueVariants({ type, wrap: isWrapped || isClamped }),
			isColor && "inline-flex items-center gap-1.5",
			isUrl && "transition-colors hover:text-primary hover:underline",
			isClamped && !expanded && "line-clamp-3",
			className,
		),
	);
</script>

{#snippet core()}
	{#if isColor}
		<span data-slot="json-viewer-value" data-type={type} {...restProps} class={valueClass}>
			<!--
				`size-3` matches upstream's `w-3 h-3` swatch; the shadow is
				dropped because a 12px chip inside a line of code reads as a smudge with one. The
				colour itself is DATA, so it stays an inline style — that is what `ColorSwatch` is for,
				and it brings the transparency checkerboard with it.
			-->
			<ColorSwatch color={text} class="size-3 rounded-[2px] shadow-none" />
			<span>{quoted}</span>
		</span>
	{:else if isUrl}
		<a
			data-slot="json-viewer-value"
			data-type={type}
			href={text}
			target="_blank"
			rel="noreferrer noopener"
			{...restProps}
			class={valueClass}>{quoted}</a
		>
	{:else}
		<span data-slot="json-viewer-value" data-type={type} {...restProps} class={valueClass}
			>{printed}</span
		>
	{/if}
{/snippet}

{#snippet clampable()}
	{#if isClamped}
		<span class="inline-flex flex-col items-start gap-1">
			{@render core()}
			<Button
				variant="link"
				size="xs"
				class="h-auto p-0 font-sans text-xs text-muted-foreground underline select-none hover:text-foreground"
				onclick={() => (expanded = !expanded)}
			>
				{expanded ? "Show less" : "Show more"}
			</Button>
		</span>
	{:else}
		{@render core()}
	{/if}
{/snippet}

{#if relativeLabel}
	<span class="inline-flex items-center gap-2">
		{@render clampable()}
		<span class="text-xs text-muted-foreground/60 italic select-none">{`// ${relativeLabel}`}</span>
	</span>
{:else}
	{@render clampable()}
{/if}
