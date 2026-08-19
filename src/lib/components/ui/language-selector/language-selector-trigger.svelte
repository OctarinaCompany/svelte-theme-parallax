<script lang="ts" module>
	import type { ComponentProps, Snippet } from "svelte";

	import type { ButtonSize, ButtonVariant } from "$lib/components/ui/button/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";

	/**
	 * Extended from the Trigger's OWN props, not from `HTMLButtonAttributes`.
	 *
	 * The two are nearly the same set and differ on `id`, which Svelte's DOM types widen to
	 * `string | null` and bits-ui narrows to `string`. Spreading the wider one into the primitive is
	 * an error — and, because the attribute union is 400-odd members, an error TypeScript reports as
	 * "union type that is too complex to represent" rather than as the one incompatible property.
	 */
	export type LanguageSelectorTriggerProps = Omit<
		ComponentProps<typeof Dialog.Trigger>,
		"child"
	> & {
		/**
		 * Passed to `buttonVariants`.
		 * @default "outline"
		 */
		variant?: ButtonVariant;
		/**
		 * Passed to `buttonVariants`.
		 * @default "default"
		 */
		size?: ButtonSize;
		/**
		 * Whether to show the locale's code beside its name, as a badge.
		 * @default false
		 */
		showCode?: boolean;
		/**
		 * What to show when the bound value names nothing in the catalog.
		 * @default "Select language"
		 */
		placeholder?: string;
		/** Replaces the icon and the name entirely, for a trigger of your own. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import GlobeIcon from "@lucide/svelte/icons/globe";

	import { Badge } from "$lib/components/ui/badge/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	import { getLanguageSelectorContext } from "./language-selector.svelte.js";

	/**
	 * The control that opens the dialog: a globe, and the name of the language you are reading.
	 *
	 * THE NAME IS NATIVE, not English, and upstream renders it that way too. A trigger reading
	 * "Japanese" is written for someone who is not using the interface in Japanese; `日本語` is
	 * legible to the reader who has already switched, which is every reader this control has after
	 * the first click. The English name is still one click away, on the row inside.
	 *
	 * `buttonVariants` on the trigger rather than `Button` with a `child` snippet: this is a plain
	 * `<button>` with no `href` branch to serve, and the class list is the only thing it wants from
	 * Button — the `ThemeSelector` trigger is the precedent.
	 */
	let {
		ref = $bindable(null),
		variant = "outline",
		size = "default",
		showCode = false,
		placeholder = "Select language",
		class: className,
		children,
		...restProps
	}: LanguageSelectorTriggerProps = $props();

	const root = getLanguageSelectorContext("<LanguageSelector.Trigger>");

	/**
	 * The name for a screen reader, which has to state the CURRENT value as well as the action.
	 *
	 * The visible text is a language name on its own — `Français` — which reads as a label rather
	 * than as a control, and says nothing about what pressing it does. This is the same trade
	 * `ThemeSelector` makes on its own trigger, and the same reason: an `aria-label` replaces the
	 * whole of a control's contents, so it has to carry back everything it displaces.
	 */
	const accessibleName = $derived(
		root.current
			? `Language: ${root.current.englishName}. Change language`
			: `${placeholder}. Change language`,
	);
</script>

<Dialog.Trigger
	bind:ref
	data-slot="language-selector-trigger"
	class={cn(buttonVariants({ variant, size }), "gap-2", className)}
	aria-label={children ? undefined : accessibleName}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		<GlobeIcon data-icon="inline-start" />
		<!--
			`lang` and `dir` on the name, not on the button. The button's own text is the interface's
			language; only this span is in the language it names — which is what lets a screen reader
			switch voice for it, and a right-to-left name sit correctly inside a left-to-right bar.
		-->
		<span lang={root.current?.code} dir={root.current?.dir}>
			{root.current?.nativeName ?? placeholder}
		</span>
		{#if showCode && root.current}
			<Badge variant="secondary">{root.current.code.toUpperCase()}</Badge>
		{/if}
	{/if}
</Dialog.Trigger>
