<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	export type MentionHighlighterProps = HTMLAttributes<HTMLDivElement>;

	/** One run of field text: either plain, or the text of an inserted mention. */
	type HighlighterSegment = {
		readonly key: string;
		readonly text: string;
		readonly isTag: boolean;
	};

	/** The typography the overlay has to copy so its text lines up with the field's, glyph for glyph. */
	type FieldStyle = {
		fontStyle: string;
		fontVariant: string;
		fontWeight: string;
		fontSize: string;
		lineHeight: string;
		fontFamily: string;
		letterSpacing: string;
		textTransform: string;
		textIndent: string;
		padding: string;
		borderWidth: string;
		borderStyle: string;
		borderRadius: string;
		boxSizing: string;
		wordBreak: string;
		overflowWrap: string;
	};

	function readFieldStyle(element: HTMLElement): FieldStyle {
		const style = window.getComputedStyle(element);
		return {
			fontStyle: style.fontStyle,
			fontVariant: style.fontVariant,
			fontWeight: style.fontWeight,
			fontSize: style.fontSize,
			lineHeight: style.lineHeight,
			fontFamily: style.fontFamily,
			letterSpacing: style.letterSpacing,
			textTransform: style.textTransform,
			textIndent: style.textIndent,
			padding: style.padding,
			borderWidth: style.borderWidth,
			borderStyle: style.borderStyle,
			borderRadius: style.borderRadius,
			boxSizing: style.boxSizing,
			wordBreak: style.wordBreak,
			overflowWrap: style.overflowWrap,
		};
	}
</script>

<script lang="ts">
	import { tick } from "svelte";

	import { getMentionContext } from "./mention.svelte.js";

	let { class: className, style, ...restProps }: MentionHighlighterProps = $props();

	const root = getMentionContext("<Mention.Highlighter>");

	let ref = $state<HTMLDivElement | null>(null);
	let fieldStyle = $state<FieldStyle | null>(null);

	/**
	 * Upstream's `ResizeObserver` + `MutationObserver` + `scroll` + `resize` hookups
	 * as one effect whose teardown stops all four.
	 */
	$effect(() => {
		const field = root.inputElement;
		if (!field) return;

		async function syncScrollAndSize() {
			const overlay = ref;
			if (!field || !overlay) return;

			await tick();
			overlay.scrollTop = field.scrollTop;
			overlay.scrollLeft = field.scrollLeft;
			overlay.style.height = `${field.offsetHeight}px`;
		}

		function onResize() {
			if (!field) return;
			fieldStyle = readFieldStyle(field);
			void syncScrollAndSize();
		}

		onResize();

		const resizeObserver = new ResizeObserver(onResize);
		const mutationObserver = new MutationObserver((mutations) => {
			if (mutations.some((m) => m.type === "attributes" && m.attributeName === "class")) onResize();
		});
		const onScroll = () => void syncScrollAndSize();

		field.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll, { passive: true });
		resizeObserver.observe(field);
		mutationObserver.observe(field, { attributes: true, attributeFilter: ["class"] });

		return () => {
			field.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			resizeObserver.disconnect();
			mutationObserver.disconnect();
		};
	});

	/**
	 * Upstream `onSegmentsRender`. The spans are walked in text
	 * order rather than registration order, so a mention inserted *before* an existing one still
	 * produces a correctly ordered overlay.
	 */
	const segments = $derived.by<HighlighterSegment[]>(() => {
		const text = root.inputValue;
		const result: HighlighterSegment[] = [];
		let lastIndex = 0;

		for (const span of [...root.mentions].sort((a, b) => a.start - b.start)) {
			if (span.start > lastIndex) {
				result.push({
					key: `text-${lastIndex}`,
					text: text.slice(lastIndex, span.start),
					isTag: false,
				});
			}
			result.push({
				key: `mention-${span.start}`,
				text: text.slice(span.start, span.end),
				isTag: true,
			});
			lastIndex = span.end;
		}

		if (lastIndex < text.length) {
			result.push({ key: `text-end-${text.length}`, text: text.slice(lastIndex), isTag: false });
		}

		return result;
	});

	const composedStyle = $derived.by(() => {
		const base = [
			"position: absolute",
			"top: 0",
			"left: 0",
			"right: 0",
			"bottom: 0",
			"color: transparent",
			"white-space: pre-wrap",
			"word-wrap: break-word",
			"pointer-events: none",
			"user-select: none",
			"overflow: hidden",
			"width: 100%",
		];

		if (fieldStyle) {
			base.push(
				`font-style: ${fieldStyle.fontStyle}`,
				`font-variant: ${fieldStyle.fontVariant}`,
				`font-weight: ${fieldStyle.fontWeight}`,
				`font-size: ${fieldStyle.fontSize}`,
				`line-height: ${fieldStyle.lineHeight}`,
				`font-family: ${fieldStyle.fontFamily}`,
				`letter-spacing: ${fieldStyle.letterSpacing}`,
				`text-transform: ${fieldStyle.textTransform}`,
				`text-indent: ${fieldStyle.textIndent}`,
				`padding: ${fieldStyle.padding}`,
				`border-width: ${fieldStyle.borderWidth}`,
				`border-style: ${fieldStyle.borderStyle}`,
				"border-color: currentColor",
				`border-radius: ${fieldStyle.borderRadius}`,
				`box-sizing: ${fieldStyle.boxSizing}`,
				`word-break: ${fieldStyle.wordBreak}`,
				`overflow-wrap: ${fieldStyle.overflowWrap}`,
			);
		}

		if (typeof style === "string" && style.length > 0) base.push(style);

		return base.join("; ");
	});
</script>

{#if fieldStyle}
	<div
		bind:this={ref}
		aria-hidden="true"
		data-slot="mention-highlighter"
		dir={root.dir}
		{...restProps}
		class={className}
		style={composedStyle}
	>
		{#each segments as segment (segment.key)}
			{#if segment.isTag}
				<span data-tag="">{segment.text}</span>
			{:else}
				<span>{segment.text}</span>
			{/if}
		{/each}
		<span>&nbsp;</span>
	</div>
{/if}
