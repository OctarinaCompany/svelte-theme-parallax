<script lang="ts" module>
	import type { StreamdownProps } from "svelte-streamdown";
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import type { MessageResponseTheme } from "./message.svelte.js";

	/**
	 * The fenced-code token Streamdown hands its `code` snippet — marked's `Tokens.Code`, with
	 * `lang` (the whole info string; see `messageFenceInfo`), `text` (the body) and `raw`.
	 * Reached through the props type so this file does not import `marked`, which is
	 * svelte-streamdown's dependency and not this kit's.
	 */
	export type MessageCodeToken = Parameters<NonNullable<StreamdownProps["code"]>>[0]["token"];

	export type MessageResponseProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLDivElement>>
	> & {
		/**
		 * The Markdown to render. A STRING, not children: upstream takes the text as React
		 * children because a string is a valid child there, but a Svelte snippet is a render
		 * function and has no text to read back, so the source has to arrive as a value. Pass the
		 * part's `text` as it streams; the renderer re-lexes only the trailing blocks.
		 */
		content: string;
		/**
		 * Whether the text is still arriving. While `true` — and the reader has not asked for
		 * reduced motion — each new word blurs in; `false` renders the whole thing at rest.
		 * Stamped as `data-animating`. Pass `status === "streaming"` for the last turn.
		 * @default false
		 */
		isAnimating?: boolean;
		/**
		 * Close the constructs a stream has opened but not finished — a `**bold` with no closer, a
		 * half-written link — so the partial text renders as prose instead of literal asterisks.
		 * @default true
		 */
		parseIncompleteMarkdown?: boolean;
		/**
		 * URL prefixes a link may point at; anything else renders as `[blocked]` text. `"*"`
		 * allows every `http://` and `https://` URL; a protocol alone (`"https://"`, `"mailto:"`)
		 * allows that protocol.
		 * @default ["*"]
		 */
		allowedLinkPrefixes?: string[];
		/**
		 * The same gate for images.
		 * @default ["*"]
		 */
		allowedImagePrefixes?: string[];
		/**
		 * Which of Streamdown's own toolbars render. `code` is off because fenced code is drawn
		 * by the house `CodeBlock`, which has its own copy and download buttons; `mermaid` is
		 * off because no diagram renderer is loaded; `table` stays on for its copy-as-CSV menu.
		 * @default { code: false, table: true, mermaid: false }
		 */
		controls?: StreamdownProps["controls"];
		/**
		 * Streamdown's opt-in heavy renderers. `math` is honoured as it is. `code` REPLACES the
		 * house code block: pass Streamdown's own `Code` for Shiki highlighting and the house
		 * snippet steps aside. `mermaid` is reachable only through the same `code` key, because
		 * Streamdown routes a mermaid fence through the code slot — the house snippet renders its
		 * source as a labelled block.
		 */
		components?: StreamdownProps["components"];
		/**
		 * Class overrides per Markdown element, merged over `MESSAGE_RESPONSE_THEME` and then
		 * over Streamdown's shadcn base — tailwind-merge at both steps, so a class here wins its
		 * conflicts and keeps the rest.
		 */
		theme?: MessageResponseTheme;
	};
</script>

<script lang="ts">
	import { Streamdown } from "svelte-streamdown";
	import * as CodeBlock from "$lib/components/ui/code-block/index.js";
	import { useReducedMotion } from "$lib/shared/reduced-motion.svelte.js";
	import {
		mergeMessageResponseTheme,
		messageFenceFilename,
		messageFenceLanguage,
	} from "./message.svelte.js";

	/**
	 * The Markdown renderer: `svelte-streamdown` in its shadcn base theme, with the kit's own
	 * mapping over it and fenced code drawn by the house `CodeBlock`.
	 *
	 * WHY THE HOUSE CODE BLOCK. Streamdown's own code element is Shiki — a highlighter and a
	 * grammar bundle a dashboard that renders a transcript does not otherwise ship — and its
	 * download saves every block as `file.<ext>`. The kit already has a code block on the same
	 * token ramp as everything else, with a copy button, a download button that takes a name and
	 * a `label`; a fence that says ```` ```csv models.csv ```` downloads as `models.csv` from it.
	 * The trade is real and stated: the house highlighter knows fourteen grammars and colours one line
	 * at a time (`code-block.svelte.ts` says what that costs); a caller who wants Shiki passes
	 * Streamdown's `Code` through `components` and the house snippet steps aside.
	 *
	 * HOW THE OVERRIDE WORKS, verified against the package rather than assumed: Streamdown's
	 * `Element.svelte` wraps every fenced-code token in `<Slot render={snippets.code}>`, and
	 * `Slot` renders the snippet INSTEAD of its default child when one is given — so a `code`
	 * snippet replaces the fenced-code renderer entirely, including for `mermaid` fences, which
	 * take the same slot. The `components.code` prop is the OTHER path (a component the default
	 * renderer is swapped for) and is unreachable while the snippet is set, which is why the
	 * snippet is withheld when a caller passes one.
	 *
	 * ANIMATION obeys the reader. `isAnimating` is what the caller knows — the stream is open;
	 * `prefers-reduced-motion` is what the reader asked for, read through the kit's one shared
	 * listener. The blur plays only when both agree. The wrapper is where `data-animating` and
	 * the caller's attributes land, because Streamdown's root takes a `class` and nothing else.
	 */
	let {
		ref = $bindable(null),
		class: className,
		content,
		isAnimating = false,
		parseIncompleteMarkdown = true,
		allowedLinkPrefixes = ["*"],
		allowedImagePrefixes = ["*"],
		controls = { code: false, table: true, mermaid: false },
		components,
		theme,
		...restProps
	}: MessageResponseProps = $props();

	const reducedMotion = useReducedMotion();

	const animating = $derived(isAnimating && !reducedMotion.current);
	const resolvedTheme = $derived(mergeMessageResponseTheme(theme));
	const animation = $derived({
		enabled: animating,
		type: "blur" as const,
		tokenize: "word" as const,
	});
</script>

<!--
	The fence's info string is split rather than passed through: marked stores it whole in
	`token.lang`, so ```` ```csv models.csv ```` would otherwise label the block "csv models.csv"
	and resolve to no grammar. The first word is the language, the rest names the file.
	`showLineNumbers={false}` because a chat answer's snippet is read, not cited by line.
-->
{#snippet houseCode({ token }: { token: MessageCodeToken })}
	{@const language = messageFenceLanguage(token.lang, token.raw)}
	<CodeBlock.Root
		code={token.text}
		language={CodeBlock.resolveCodeBlockLanguage(language)}
		label={language || "text"}
		filename={messageFenceFilename(token.lang, token.raw)}
		showLineNumbers={false}
		class="my-4"
	/>
{/snippet}

<div
	bind:this={ref}
	data-slot="message-response"
	data-animating={animating ? "" : undefined}
	class={cn("w-full min-w-0", className)}
	{...restProps}
>
	<Streamdown
		{content}
		{parseIncompleteMarkdown}
		{allowedLinkPrefixes}
		{allowedImagePrefixes}
		{controls}
		{components}
		{animation}
		baseTheme="shadcn"
		theme={resolvedTheme}
		code={components?.code ? undefined : houseCode}
		class="size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
	/>
</div>
