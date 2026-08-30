<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { CodeBlockLanguageId } from "$lib/components/ui/code-block/index.js";
	import type { CodeHighlighterGrammar, CodeHighlighterState } from "./code-highlighter.svelte.js";

	export type CodeHighlighterRootProps = {
		/**
		 * Languages to load up front, as any spelling `resolveCodeBlockLanguage` accepts. REACTIVE:
		 * adding an id later starts that grammar too, and removing one loads nothing back out — a
		 * grammar is held for the life of the instance.
		 *
		 * Leave it out and nothing is fetched until a block asks. Set it for the languages a page is
		 * certain to show, which trades a request now for a first paint that is already coloured; the
		 * grammar is compiled inside that request too, so the block's first render reads an answer
		 * rather than paying for one. `CODE_HIGHLIGHTER_GRAMMARS` records what each row weighs, and a
		 * few of them are large enough that preloading speculatively is the wrong trade.
		 */
		languages?: readonly CodeBlockLanguageId[];
		/**
		 * Extra or replacement grammar loaders, merged over `CODE_HIGHLIGHTER_GRAMMARS`: a new key
		 * adds a language this adapter does not carry, an existing key replaces that row's loader.
		 * READ ONCE, at initialisation, because it is constructor input to the state.
		 *
		 * KEYS ARE CANONICALISED as they are merged, so `typescript`, `TypeScript` and `ts` all name
		 * the built-in `ts` row and any of the three replaces it.
		 *
		 * Every loader must carry a STRING LITERAL import specifier, for the reason
		 * {@link CodeHighlighterGrammar} states.
		 *
		 * Ignored when {@link CodeHighlighterRootProps.highlighter} is set: that instance was built
		 * with its own table.
		 */
		grammars?: Readonly<Record<string, CodeHighlighterGrammar>>;
		/**
		 * A `CodeHighlighterState` to publish instead of creating one. READ ONCE. Use it to share a
		 * single engine across providers, or to keep an instance alive across a route change — this
		 * component disposes only an instance it created itself.
		 */
		highlighter?: CodeHighlighterState;
		children?: Snippet;
	};

	/** Alias of {@link CodeHighlighterRootProps}, for parity with the other parts in this kit. */
	export type CodeHighlighterProps = CodeHighlighterRootProps;
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import { setCodeBlockHighlighterContext } from "$lib/components/ui/code-block/index.js";
	import {
		CodeHighlighterState as State,
		setCodeHighlighterContext,
	} from "./code-highlighter.svelte.js";

	/**
	 * Installs a Shiki-backed highlighter for every `<CodeBlock.Root>` below it.
	 *
	 * ONE INSTANCE, ONE ENGINE. Wrap the part of the tree that shows code — the app shell, a chat
	 * surface, a documentation page — and every block under it upgrades from the house tokenizer as
	 * each grammar arrives. Nothing else changes: a block sets no prop, and one that sets
	 * `highlighter={null}` opts out (rule 1 of the ten in `code-block.svelte`).
	 *
	 * IT PUBLISHES ITSELF TWICE, on two keys, because they answer different questions.
	 * `setCodeBlockHighlighterContext` installs the seam the blocks read, which is the whole job;
	 * `setCodeHighlighterContext` publishes the INSTANCE, so a descendant can ask what is loaded,
	 * call `prepare` early, or read `isReady` to explain a block that is still plain.
	 *
	 * IT RENDERS NO ELEMENT, and therefore carries no `data-slot`. Every other component in this kit
	 * stamps one, and `ui/direction-provider` is the near miss worth naming: it also exists only to
	 * publish context, and it still renders a `display: contents` wrapper — because it has an
	 * attribute to carry. The real `dir` has to reach the subtree for descendants to flip without
	 * opting in, so there must be an element to put it on, and once there is an element there is
	 * something for `data-slot` to name. This provider has nothing of the sort: a highlighter is
	 * reached through context and only through context, so a wrapper would be a box in the layout
	 * that pays for nothing. `data-slot` names an element, and there is no element.
	 */
	let { languages, grammars, highlighter, children }: CodeHighlighterRootProps = $props();

	// Both read ONCE, here, because `setContext` is only legal during initialisation and the state's
	// grammar table is constructor input. A later change to either leaves this provider alone, and
	// `untrack` is what says so unambiguously — the same spelling `<CodeBlock.Root>` uses to make
	// `defaultLanguage` a seed rather than a binding.
	const owned = untrack(() => highlighter === undefined);
	const state = untrack(() => highlighter ?? new State({ grammars }));

	setCodeHighlighterContext(state);
	setCodeBlockHighlighterContext(state);

	// Reading `languages` is what re-runs this when the list grows. `prepare` returns void and
	// dedupes in-flight loads, so re-running it over the whole list costs a `Map` lookup per id.
	$effect(() => {
		for (const language of languages ?? []) state.prepare(language);
	});

	// An instance passed in through `highlighter` outlives this component and is the caller's to
	// dispose; one created here is not, and holding a compiled engine after unmount is a leak.
	$effect(() => () => {
		if (owned) state.dispose();
	});
</script>

{@render children?.()}
