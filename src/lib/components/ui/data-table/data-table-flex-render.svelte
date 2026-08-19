<script lang="ts" module>
	import type { Snippet } from "svelte";

	/**
	 * A column template as `@tanstack/table-core` stores it, widened so both shapes work: the
	 * `Snippet` a `DataTableColumnDef` declares, and the `ColumnDefTemplate` the table hands back.
	 */
	export type DataTableTemplate<TContext extends object> =
		string | number | Snippet<[TContext]> | ((context: TContext) => unknown);

	export type DataTableFlexRenderProps<TContext extends object> = {
		/** The column's `header` / `cell` template. */
		template?: DataTableTemplate<TContext>;
		/** The `HeaderContext` / `CellContext` the template is rendered with. */
		context: TContext;
		/**
		 * Rendered when `template` is absent — the column id for headers, the stringified value
		 * for cells.
		 * @default ''
		 */
		fallback?: string;
	};
</script>

<script lang="ts" generics="TContext extends object">
	// React's `flexRender()` is a *function* that renders a component or a string; Svelte has no
	// function-call rendering, so the equivalent is a component that switches on the template's
	// type and `{@render}`s a snippet. It renders nothing of its own: no wrapper element, no
	// `data-slot`.
	let { template, context, fallback = "" }: DataTableFlexRenderProps<TContext> = $props();

	/**
	 * A Svelte snippet compiles to a plain function, so a snippet and a React-style render
	 * function are indistinguishable at runtime — `DataTableColumnDef` is the type that carries
	 * the distinction, and this declared guard re-applies it. Nothing calls the
	 * template: a snippet must be `{@render}`ed, never invoked.
	 */
	function isSnippet(
		value: Snippet<[TContext]> | ((context: TContext) => unknown),
	): value is Snippet<[TContext]> {
		return typeof value === "function";
	}
</script>

{#if template === undefined || template === null}
	{fallback}
{:else if typeof template === "string" || typeof template === "number"}
	{template}
{:else if isSnippet(template)}
	{@render template(context)}
{/if}
