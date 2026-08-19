<script lang="ts">
	import type { Snippet } from "svelte";

	/**
	 * The header block every page under Components opens with: a title, a subtitle, and the
	 * rule beneath them.
	 *
	 * The rule is the block's own `border-bottom`, not a separate element, and the spacing
	 * around it is part of the same block: `mb-8` below, `py-6` inside, and `mt-1.5` on the
	 * subtitle — 6px on purpose, a step tighter than the 8px `mt-2` would give, so the
	 * subtitle reads as part of the heading rather than as a paragraph after it.
	 *
	 * The subtitle is a snippet rather than a string because several pages carry a link in it.
	 */
	let {
		title,
		subtitle,
	}: {
		title: string;
		subtitle?: Snippet;
	} = $props();
</script>

<div class="mb-8 border-b py-6">
	<h1 class="text-2xl font-medium">{title}</h1>
	{#if subtitle}
		<p class="mt-1.5 text-sm text-muted-foreground">{@render subtitle()}</p>
	{/if}
</div>
