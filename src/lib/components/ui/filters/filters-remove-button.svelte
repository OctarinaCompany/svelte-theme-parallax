<script lang="ts">
	import XIcon from "@lucide/svelte/icons/x";
	import { Button } from "$lib/components/ui/button/index.js";
	import { getFiltersContext } from "./filters.svelte.js";

	/** The last segment of a chip: drops the filter. */

	let { onclick, label }: { onclick: () => void; label: string } = $props();

	const context = getFiltersContext();
	const size = $derived(
		context.size === "sm" ? "icon-sm" : context.size === "lg" ? "icon-lg" : "icon",
	);
</script>

<Button variant="outline" {size} aria-label={label} {onclick}>
	<XIcon />
</Button>
