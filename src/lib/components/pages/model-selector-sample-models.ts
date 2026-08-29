/**
 * Demo data for the Model selector page.
 *
 * THE LOGOS ARE INLINE, NOT FETCHED. `ModelSelector.Logo` defaults to
 * `https://models.dev/logos/<slug>.svg`, which is the right default for an application and the
 * wrong one for this gallery: a documentation page must render offline, must not leak a visitor's
 * request to a third party the moment it scrolls into view, and must not change when a host it
 * does not control changes. Every demo therefore passes `src`, and the URLs below are data URLs
 * of abstract marks — a monogram and a ring — standing in for the providers, not the providers'
 * own trademarks. The `dark:invert` the component ships expects exactly this shape: black on
 * transparent.
 *
 * `SampleProvider` is deliberately NARROWER than the component's `ModelProvider`. The logo map
 * is keyed on it, and so is every group and lookup, which makes "a provider with no inline
 * logo" a compile error rather than a silent `undefined` `src` — the one shape that would let
 * `ModelSelector.Logo` fall back to its models.dev URL and break the invariant above. Adding a
 * provider to a demo means adding its mark here first.
 */
export type SampleProvider = "anthropic" | "openai";

function svgDataUrl(body: string): string {
	return `data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000">${body}</svg>`,
	)}`;
}

export const MODEL_SELECTOR_SAMPLE_LOGOS: Record<SampleProvider, string> = {
	anthropic: svgDataUrl(
		'<path d="M13.8 3h3.4l6.3 18h-3.5l-1.3-3.9h-6.5L10.9 21H7.5L13.8 3Zm-.6 11.2h4.5l-2.3-6.7-2.2 6.7ZM3.9 3h3.4l2.5 7.1-1.7 4.9L3.9 3Z"/>',
	),
	openai: svgDataUrl(
		'<path fill-rule="evenodd" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 3.2a6.8 6.8 0 1 0 0 13.6 6.8 6.8 0 0 0 0-13.6Zm0 2.6a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4Z"/>',
	),
};

/** A URL no browser can decode as an image, so the fallback demo fails deterministically. */
export const MODEL_SELECTOR_SAMPLE_BROKEN_SRC = "data:,";

export type SampleModel = {
	id: string;
	name: string;
	description: string;
	/** Why the model cannot be picked. Present only on a disabled row. */
	unavailable?: string;
};

export type SampleModelGroup = {
	heading: string;
	provider: SampleProvider;
	models: SampleModel[];
};

export const MODEL_SELECTOR_SAMPLE_GROUPS: SampleModelGroup[] = [
	{
		heading: "Anthropic",
		provider: "anthropic",
		models: [
			{
				id: "claude-sonnet-5",
				name: "Sonnet 5",
				description: "Balanced speed and reasoning for everyday work",
			},
			{
				id: "claude-opus-5",
				name: "Opus 5",
				description: "Deepest reasoning for the hard problems",
			},
			{
				id: "claude-haiku-5",
				name: "Haiku 5",
				description: "Fastest and cheapest for simple turns",
			},
		],
	},
	{
		heading: "OpenAI",
		provider: "openai",
		models: [
			{
				id: "gpt-5.5",
				name: "GPT-5.5",
				description: "General-purpose frontier model",
				unavailable: "Not wired yet",
			},
		],
	},
];

/** The row `id` names, or `undefined` for an id no group carries. */
export function findSampleModel(id: string): SampleModel | undefined {
	for (const group of MODEL_SELECTOR_SAMPLE_GROUPS) {
		const model = group.models.find((candidate) => candidate.id === id);
		if (model) return model;
	}
	return undefined;
}

/** The provider of the group the model with `id` belongs to, or `undefined`. */
export function findSampleProvider(id: string): SampleProvider | undefined {
	return MODEL_SELECTOR_SAMPLE_GROUPS.find((group) =>
		group.models.some((candidate) => candidate.id === id),
	)?.provider;
}
