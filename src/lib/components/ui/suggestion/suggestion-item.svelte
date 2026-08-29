<script lang="ts" module>
	import type { ButtonProps } from "$lib/components/ui/button/index.js";
	import type { MouseEventHandler } from "svelte/elements";

	/**
	 * `href` is withheld on purpose: a suggestion is a command, not a destination. Given one, the
	 * Button would render an `<a>`, `type="button"` would become a stray attribute and the press
	 * would navigate before `onSelect` had a say.
	 */
	export type SuggestionItemProps = Omit<ButtonProps, "href" | "onclick"> & {
		/**
		 * The suggestion this chip offers — the value handed to `onSelect`, and the visible label
		 * when `children` is omitted.
		 */
		suggestion: string;
		/**
		 * Called with `suggestion` when the chip is pressed, unless the caller's own `onclick`
		 * called `preventDefault()` on the event first. A disabled chip never fires either.
		 */
		onSelect?: (suggestion: string) => void;
		/**
		 * The DOM click handler. Runs BEFORE `onSelect` with the native event;
		 * `event.preventDefault()` vetoes the selection.
		 */
		onclick?: MouseEventHandler<HTMLButtonElement> | null;
	};

	/** Upstream-parity alias of {@link SuggestionItemProps} — upstream's `SuggestionProps`. */
	export type SuggestionProps = SuggestionItemProps;
</script>

<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	/**
	 * One chip: an outline `sm` Button rounded into a pill, whose label is the suggestion itself
	 * unless `children` says otherwise (`suggestion.tsx` L34-55).
	 *
	 * DIVERGENCE from upstream's `onClick`. Upstream replaces the DOM handler with a callback that
	 * receives the suggestion string (`suggestion.tsx` L28-30). In Svelte `onclick` IS the DOM
	 * attribute, so shadowing it would hand a string to every caller expecting a `MouseEvent` and
	 * take the event away from the ones who need it. The two coexist instead: `onclick` keeps its
	 * native meaning and runs first, `onSelect` carries the suggestion, and `preventDefault()` on
	 * the event is the veto — the same contract `action-bar-item.svelte` gives its `onSelect`.
	 * `{...restProps}` is spread BEFORE `class` and `onclick` for the same reason that file does
	 * it: the type omits `onclick`, but a spread object is not excess-property-checked, so a
	 * caller's stray `onclick` would otherwise replace `handleClick` and silence `onSelect`.
	 */
	let {
		ref = $bindable(null),
		suggestion,
		onSelect,
		onclick,
		variant = "outline",
		size = "sm",
		class: className,
		children,
		...restProps
	}: SuggestionItemProps = $props();

	/**
	 * Typed on the plain `MouseEvent` rather than Svelte's `currentTarget`-narrowed handler: the
	 * Button's `onclick` is the intersection of the button and anchor handler types, and a handler
	 * that demands an `HTMLButtonElement` target is assignable to neither.
	 */
	function handleClick(event: MouseEvent) {
		onclick?.(event as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
		if (event.defaultPrevented) return;
		onSelect?.(suggestion);
	}
</script>

<Button
	bind:ref
	data-slot="suggestion-item"
	{variant}
	{size}
	type="button"
	{...restProps}
	class={cn("rounded-full px-4", className)}
	onclick={handleClick}
>
	{#if children}
		{@render children()}
	{:else}
		{suggestion}
	{/if}
</Button>
