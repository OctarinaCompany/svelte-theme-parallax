<script lang="ts" module>
	import type { Snippet } from "svelte";

	export type TourDefaultFooterProps = {
		/** The root's shared `stepFooter` snippet. */
		footer: Snippet;
	};
</script>

<script lang="ts">
	import { setTourDefaultFooterContext } from "./tour.svelte.js";

	let { footer }: TourDefaultFooterProps = $props();

	/**
	 * Upstream's `<DefaultFooterContext.Provider value={true}>`, which needs a
	 * component of its own here because a Svelte context is set once per instance and `<Tour.Step>`
	 * must publish `false` to its own children and `true` around this snippet.
	 *
	 * Without it a `<Tour.Footer>` written inside the root's `stepFooter` would register itself as
	 * the step's own footer, the step would then stop rendering the fallback, the footer would
	 * unregister, and the pair would flip forever.
	 */
	setTourDefaultFooterContext();
</script>

{@render footer()}
