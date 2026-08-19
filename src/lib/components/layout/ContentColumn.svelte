<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils.js";

	/**
	 * The centred reading column.
	 *
	 * Full width on small screens, 83.33% from `lg`, 66.67% from `xl`, centred. There is
	 * deliberately no `max-width`: the column is a percentage of its container, so it keeps
	 * growing on very wide screens rather than capping.
	 *
	 * WHY A COMPONENT — this is the template for form and reading pages (account settings,
	 * invoices, wizards, feeds), while dashboards stay full width. Every page under Components
	 * wants it, so it is shared rather than copied — the same reasoning that produced
	 * `PageHeader`.
	 *
	 * The steps sit on Tailwind's stock `lg` (1024px) and `xl` (1280px) breakpoints. Moving
	 * them a few dozen pixels would take `min-[…]` arbitrary variants, which buys a difference
	 * nobody can see at the cost of a class nobody can read.
	 *
	 * The horizontal gutter is deliberately NOT included: that belongs to the page, and the
	 * dashboard pages need it without this column.
	 */
	let { children, class: className }: { children?: Snippet; class?: string } = $props();
</script>

<div class={cn("mx-auto w-full lg:w-10/12 xl:w-8/12", className)}>
	{@render children?.()}
</div>
