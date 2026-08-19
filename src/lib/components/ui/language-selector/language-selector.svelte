<script lang="ts" module>
	import type { Snippet } from "svelte";

	import type { Locale } from "./language-selector.svelte.js";

	export type LanguageSelectorRootProps = {
		/**
		 * The selected locale's {@link Locale.code}.
		 *
		 * Bindable, and binding it is the whole contract: this component owns no locale of its own
		 * and writes to nothing else, so whatever the value is bound TO decides how far a change
		 * reaches. A `$state` declared in one page changes that page and nothing above it; a store
		 * the application shares changes the application. Neither is the default, because the
		 * component never picks.
		 */
		value?: string;
		/** Called with the next code on a real change — never when the current locale is re-picked. */
		onValueChange?: (value: string) => void;
		/** Whether the dialog is open. Bindable, so a caller can open it without the Trigger. */
		open?: boolean;
		/** Called whenever the dialog opens or closes, from any cause. */
		onOpenChange?: (open: boolean) => void;
		/**
		 * The locales to offer — shadcn-admin-kit's `getLocales()`, as data.
		 * @default LOCALES
		 */
		locales?: readonly Locale[];
		/**
		 * Whether choosing a locale closes the dialog. Upstream's behaviour, and the usual one: a
		 * language picker applies immediately, so there is nothing left to confirm.
		 * @default true
		 */
		closeOnSelect?: boolean;
		/** Normally a `<LanguageSelector.Trigger>` and a `<LanguageSelector.Content>`. */
		children: Snippet;
	};
</script>

<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";

	import {
		LOCALES,
		LanguageSelectorState,
		setLanguageSelectorContext,
	} from "./language-selector.svelte.js";

	/**
	 * The Root: the dialog, and the state its parts share. Renders no DOM of its own.
	 *
	 * A DIALOG RATHER THAN A MENU, which is the one place this component parts company with
	 * `ThemeSelector` — the other picker in this repository that changes an appearance-wide setting
	 * from a trigger in a bar. That one is a `DropdownMenu` because a palette is chosen at a glance
	 * from a dozen swatches. A language is not: the list is long, its rows carry two names and
	 * sometimes a progress bar, and the reader most likely to open it cannot read the interface
	 * around it — so it gets the whole screen's attention, a focus trap, and a grid with room for
	 * the names to be legible. `composition.md`'s table puts a focused task that requires input in
	 * a Dialog, and choosing from eighty-odd characters of Japanese is one.
	 *
	 * @see language-selector.svelte.ts for the theme's provenance and the i18n vocabulary it borrows.
	 */
	let {
		value = $bindable(LOCALES[0].code),
		onValueChange,
		open = $bindable(false),
		onOpenChange,
		locales = LOCALES,
		closeOnSelect = true,
		children,
	}: LanguageSelectorRootProps = $props();

	setLanguageSelectorContext(
		new LanguageSelectorState({
			getValue: () => value,
			setValue: (next) => {
				value = next;
				onValueChange?.(next);
			},
			getLocales: () => locales,
			setOpen: (next) => {
				// The Dialog only reports changes it initiates itself (trigger, Escape, overlay), so
				// this external write — the `select()` close path — must fire the callback for
				// `onOpenChange` to really mean "from any cause". The guard keeps a redundant write
				// from repeating the last notification.
				if (open !== next) {
					open = next;
					onOpenChange?.(next);
				}
			},
			getCloseOnSelect: () => closeOnSelect,
		}),
	);
</script>

<Dialog.Root bind:open {onOpenChange}>
	{@render children()}
</Dialog.Root>
