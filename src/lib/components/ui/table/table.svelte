<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLTableAttributes } from "svelte/elements";

	/*
	 * `density` is this theme's extension — upstream ships none, and neither does the classic theme,
	 * whose `.table-sm` changes type, not padding. It works the way `Card`'s `size` works:
	 * the prop stamps `data-density`, `app.css` retunes the `--table-row-h` /
	 * `--table-head-h` / `--table-cell-py` tokens under it, and the same unlayered cell
	 * rules that pin the uniform row height read the result. `sm` is 40px rows with 13px
	 * body type (the `.table-sm` reading, honoured through type); `lg` is 76px rows for
	 * two-line cells; `default` is the house 56px, untouched.
	 */
	let {
		ref = $bindable(null),
		class: className,
		density = "default",
		children,
		...restProps
	}: WithElementRef<HTMLTableAttributes> & {
		density?: "sm" | "default" | "lg";
	} = $props();
</script>

<div data-slot="table-container" class="relative w-full overflow-x-auto">
	<table
		bind:this={ref}
		data-slot="table"
		data-density={density}
		class={cn("w-full caption-bottom text-sm", className)}
		{...restProps}
	>
		{@render children?.()}
	</table>
</div>
