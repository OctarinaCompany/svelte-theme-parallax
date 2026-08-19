<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type CheckboxGroupDescriptionProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * Whether the description should be announced by screen readers immediately upon rendering.
		 *
		 * @default false
		 */
		announce?: boolean;
		/**
		 * Hide the description while the checkbox group is in an error state.
		 *
		 * @default false
		 */
		hideOnError?: boolean;
	};
</script>

<script lang="ts">
	import { getCheckboxGroupContext } from "./checkbox-group.svelte.js";

	let {
		ref = $bindable(null),
		announce = false,
		hideOnError = false,
		class: className,
		children,
		...restProps
	}: CheckboxGroupDescriptionProps = $props();

	const state = getCheckboxGroupContext("<CheckboxGroup.Description>");

	const hidden = $derived(hideOnError && state.isInvalid);

	// Registered only while the description is really in the document, so `hideOnError` cannot leave
	// the root pointing `aria-describedby` at a removed node.
	$effect(() => {
		if (hidden) return;
		return state.registerDescription();
	});
</script>

{#if !hidden}
	<div
		bind:this={ref}
		data-slot="checkbox-group-description"
		id={state.descriptionId}
		aria-live={announce ? "polite" : "off"}
		aria-invalid={state.isInvalid}
		aria-describedby={state.hasLabel ? state.labelId : undefined}
		data-disabled={state.disabled ? "" : undefined}
		data-invalid={state.isInvalid ? "" : undefined}
		{...restProps}
		class={cn(
			"text-[0.8rem] leading-none text-muted-foreground data-invalid:text-destructive",
			className,
		)}
	>
		{@render children?.()}
	</div>
{/if}
