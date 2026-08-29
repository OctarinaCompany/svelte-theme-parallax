import { getContext, hasContext, setContext } from "svelte";
import type { ComponentProps } from "svelte";
import type * as Command from "$lib/components/ui/command/index.js";

/**
 * Every provider slug models.dev publishes a logo for, in upstream declaration order — the
 * union `ModelSelectorLogoProps.provider` carries in `model-selector.tsx`, lifted into a tuple so
 * the kit can iterate it and so a runtime string can be checked against it. The order is
 * upstream's own and has no meaning here; nothing sorts or ranks by position.
 */
export const MODEL_PROVIDERS = [
	"moonshotai-cn",
	"lucidquery",
	"moonshotai",
	"zai-coding-plan",
	"alibaba",
	"xai",
	"vultr",
	"nvidia",
	"upstage",
	"groq",
	"github-copilot",
	"mistral",
	"vercel",
	"nebius",
	"deepseek",
	"alibaba-cn",
	"google-vertex-anthropic",
	"venice",
	"chutes",
	"cortecs",
	"github-models",
	"togetherai",
	"azure",
	"baseten",
	"huggingface",
	"opencode",
	"fastrouter",
	"google",
	"google-vertex",
	"cloudflare-workers-ai",
	"inception",
	"wandb",
	"openai",
	"zhipuai-coding-plan",
	"perplexity",
	"openrouter",
	"zenmux",
	"v0",
	"iflowcn",
	"synthetic",
	"deepinfra",
	"zhipuai",
	"submodel",
	"zai",
	"inference",
	"requesty",
	"morph",
	"lmstudio",
	"anthropic",
	"aihubmix",
	"fireworks-ai",
	"modelscope",
	"llama",
	"scaleway",
	"amazon-bedrock",
	"cerebras",
] as const;

/** A provider slug the tuple knows. */
export type KnownModelProvider = (typeof MODEL_PROVIDERS)[number];

/**
 * A provider slug: one of {@link MODEL_PROVIDERS} for autocompletion, or any other string —
 * upstream's `(string & {})` idiom, kept because models.dev adds providers faster than a tuple
 * can follow and a slug it does not know yet still resolves to a URL.
 */
export type ModelProvider = KnownModelProvider | (string & {});

/** Where {@link modelProviderLogoUrl} points. Monochrome SVGs, black on transparent. */
export const MODEL_PROVIDER_LOGO_BASE = "https://models.dev/logos/";

/**
 * The logo URL upstream hard-codes into every `<img>`: `https://models.dev/logos/<slug>.svg`.
 * Exposed so a caller can prefetch, proxy, or cache-bust it, and so the gallery can say which
 * request the `src` override suppresses.
 */
export function modelProviderLogoUrl(provider: ModelProvider): string {
	return `${MODEL_PROVIDER_LOGO_BASE}${provider}.svg`;
}

/** Whether a runtime string is one of the slugs the tuple ships. Narrows for autocompletion. */
export function isKnownModelProvider(value: string): value is KnownModelProvider {
	return MODEL_PROVIDERS.includes(value as KnownModelProvider);
}

/*
 * Prop types of the parts that are PURE PASS-THROUGHS to the command palette. Upstream
 * declares a component per part (`ModelSelectorList`, `ModelSelectorEmpty`, …) that renders the
 * command part unchanged; here the barrel re-exports the command part itself, and only the type
 * alias remains so a caller can type a wrapper without knowing where the part comes from.
 */
export type ModelSelectorListProps = ComponentProps<typeof Command.List>;
export type ModelSelectorEmptyProps = ComponentProps<typeof Command.Empty>;
export type ModelSelectorGroupProps = ComponentProps<typeof Command.Group>;
export type ModelSelectorSeparatorProps = ComponentProps<typeof Command.Separator>;
export type ModelSelectorShortcutProps = ComponentProps<typeof Command.Shortcut>;

/**
 * Reactive inputs for {@link ModelSelectorState}. Getters rather than values, so the class keeps
 * tracking the root's props instead of snapshotting them.
 */
export type ModelSelectorStateProps = {
	/** Reads the root's resolved open state. */
	getOpen: () => boolean;
	/** Writes the root's open state and invokes `onOpenChange`. */
	setOpen: (open: boolean) => void;
};

/**
 * One instance per `<ModelSelector.Root>` (and per `<ModelSelector.Dialog>`), published on
 * context. The dialog primitive owns the overlay; this owns the ONE fact the parts need to know
 * — whether the picker is open — so an item can close it after a pick.
 *
 * Upstream has no counterpart: its parts are stateless wrappers and every demo closes the dialog
 * by hand inside `onSelect`. That hand-written line is what `ModelSelector.Item`'s
 * `closeOnSelect` replaces, and this class is what lets the item reach the root.
 */
export class ModelSelectorState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: ModelSelectorStateProps;

	/** Whether the picker is open. */
	readonly open: boolean = $derived(this.#props.getOpen());

	constructor(props: ModelSelectorStateProps) {
		this.#props = props;
	}

	/**
	 * Write the open state. A write that changes nothing is dropped BEFORE it reaches the root,
	 * so `onOpenChange` fires once per real transition — an item that closes the picker after a
	 * caller's `onSelect` already did so must not report a second close.
	 */
	setOpen(next: boolean): void {
		if (next === this.open) return;
		this.#props.setOpen(next);
	}

	/** Close the picker. */
	close(): void {
		this.setOpen(false);
	}

	/** Open the picker. */
	show(): void {
		this.setOpen(true);
	}
}

const MODEL_SELECTOR_CONTEXT_KEY = Symbol("model-selector");

export function setModelSelectorContext(state: ModelSelectorState): ModelSelectorState {
	return setContext(MODEL_SELECTOR_CONTEXT_KEY, state);
}

export function hasModelSelectorContext(): boolean {
	return hasContext(MODEL_SELECTOR_CONTEXT_KEY);
}

export function getModelSelectorContext(part?: string): ModelSelectorState {
	if (!hasModelSelectorContext()) {
		throw new Error(
			`${part ?? "`<ModelSelector>` part"} must be used within \`<ModelSelector.Root>\`.`,
		);
	}
	return getContext<ModelSelectorState>(MODEL_SELECTOR_CONTEXT_KEY);
}

/** Parity name for the selector-hook shape the other ports expose. Delegates to the getter. */
export function useModelSelector(): ModelSelectorState {
	return getModelSelectorContext();
}
