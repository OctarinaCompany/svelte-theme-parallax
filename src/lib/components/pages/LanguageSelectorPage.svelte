<script lang="ts">
	import LanguagesIcon from "@lucide/svelte/icons/languages";

	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { DirectionProvider } from "$lib/components/ui/direction-provider/index.js";
	import * as LanguageSelector from "$lib/components/ui/language-selector/index.js";
	import { LOCALES, localeByCode } from "$lib/components/ui/language-selector/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Table from "$lib/components/ui/table/index.js";

	import {
		MEASURED_LOCALES,
		MESSAGE_KEYS,
		RTL_LOCALES,
		isTranslated,
		translate,
	} from "./language-selector-messages.js";

	/**
	 * The Language selector page — a dialog-based language switch.
	 *
	 * THE DESIGN WAS READ OFF A RENDERED PREVIEW, so what is documented is the block as it
	 * RENDERS, read off that
	 * preview: an outline trigger naming the current language, a dialog headed "Select Language"
	 * over "Choose your preferred language", a two-column grid of tiles carrying a native name over
	 * an English one, the chosen tile outlined in the primary colour with a check mark, and a click
	 * that applies the language and dismisses the dialog. The eight locales are its own, in its own
	 * order. Nothing here is copied from that block's source, because nothing here could be.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. The classic framework ships no language control at all, and the classic theme's
	 * documentation has none either; the nearest thing in this repository is `ThemeSelector`, which
	 * is a dropdown because a palette is chosen at a glance.
	 *
	 * EVERY DEMO ON THIS PAGE IS SCOPED TO ITS OWN DEMO. That is the page's argument as much as its
	 * implementation: switching to Japanese below changes the panel it belongs to and nothing else —
	 * not the header, not the sidebar, not the other panels on this page, and nothing that survives
	 * a reload. See the second section for why the component makes that the only possible outcome.
	 */

	/**
	 * One `$state` per demo, and that is the whole mechanism.
	 *
	 * There is no store, no context above the page, no `document.documentElement.lang` write and no
	 * `localStorage` key — so the reach of each of these is the component that reads it. An
	 * application that wants the opposite binds the same prop to something app-wide instead; the
	 * component is indifferent, which is exactly why it can be used for either.
	 */
	let basicLocale = $state("en");
	let panelLocale = $state("fr");
	let secondPanelLocale = $state("ja");
	let measuredLocale = $state("ko");
	let rtlLocale = $state("ar");
	let layoutLocale = $state("de");
	let controlledLocale = $state("es");
	let controlledOpen = $state(false);

	const measuredEntry = $derived(localeByCode(MEASURED_LOCALES, measuredLocale));
	const rtlEntry = $derived(localeByCode(RTL_LOCALES, rtlLocale));

	const rootProps = [
		{
			prop: "value",
			type: "string",
			default: '"en"',
			description:
				"The selected locale's code. Bindable, and what it is bound TO decides how far a change reaches — a page's own $state changes that page, an app-wide store changes the app. The component writes nowhere else.",
		},
		{
			prop: "onValueChange",
			type: "(value: string) => void",
			default: "—",
			description:
				"Fired with the next code on a real change. Re-picking the current locale closes the dialog without firing it.",
		},
		{
			prop: "open",
			type: "boolean",
			default: "false",
			description: "Whether the dialog is open. Bindable, so it can be opened without the Trigger.",
		},
		{
			prop: "onOpenChange",
			type: "(open: boolean) => void",
			default: "—",
			description: "Fired whenever the dialog opens or closes, from any cause.",
		},
		{
			prop: "locales",
			type: "readonly Locale[]",
			default: "LOCALES",
			description:
				"The catalog to offer — shadcn-admin-kit's getLocales() as data. Each entry is a code, a native name, an English name, and optionally a direction and a completion percentage.",
		},
		{
			prop: "closeOnSelect",
			type: "boolean",
			default: "true",
			description:
				"Whether choosing a locale dismisses the dialog. Upstream's behaviour: a language applies immediately, so there is nothing left to confirm.",
		},
	];

	const triggerProps = [
		{
			prop: "variant",
			type: "ButtonVariant",
			default: '"outline"',
			description:
				"Passed to buttonVariants, so the trigger sits on the same ramp as every button.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: '"default"',
			description: "Passed to buttonVariants.",
		},
		{
			prop: "showCode",
			type: "boolean",
			default: "false",
			description:
				"Shows the locale's code as a badge beside the name. The text answer to the flag icons this component deliberately has none of.",
		},
		{
			prop: "placeholder",
			type: "string",
			default: '"Select language"',
			description: "What to show when the bound value names nothing in the catalog.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"Replaces the globe and the name entirely. The trigger drops its own aria-label when you pass one, because the content is then yours to name.",
		},
	];

	const contentProps = [
		{
			prop: "title",
			type: "string",
			default: '"Select language"',
			description: "The dialog's heading.",
		},
		{
			prop: "description",
			type: "string",
			default: '"Choose your preferred language."',
			description: "The line under it. An empty string drops it; the title is not optional.",
		},
		{
			prop: "columns",
			type: "1 | 2 | 3",
			default: "2",
			description:
				"Tiles per row from sm up, below which the grid is always one column. The panel widens with it.",
		},
		{
			prop: "option",
			type: "Snippet<[{ locale: Locale }]>",
			default: "—",
			description:
				"Replaces the default tile, rendered once per locale. Render a LanguageSelector.Option inside it to keep the selection wiring.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", values: "language-selector-trigger, language-selector-option" },
		{
			attribute: "[data-selected]",
			values: "on the current locale's tile, from Listbox.Item",
		},
		{
			attribute: "[data-highlighted]",
			values: "on the tile the pointer or the arrow keys are on",
		},
	];
</script>

<!--
	The shared demo panel: a handful of strings, translated by whichever locale it is handed.

	Deliberately mundane — a greeting, two labels, two buttons and an empty state. The point of this
	page is the SCOPE of a change, and a panel with anything interesting in it would compete with
	watching the same six strings move together.
-->
{#snippet panel(code: string)}
	{@const entry = localeByCode(RTL_LOCALES, code)}
	<!--
		`lang` on the panel, never on `<html>`.

		This is the whole "only this page" rule, written as one attribute in one place: the strings
		below are in `code`, so the element that holds them says so, and the document keeps whatever
		language the rest of the interface is in. It is what lets a screen reader switch voice on the
		way in and back out on the way out, and hyphenation and quotation rules follow it too.
	-->
	<div lang={code} dir={entry?.dir} class="flex flex-col gap-4 rounded-lg border p-4">
		<div class="flex flex-col gap-1">
			<p class="text-base font-medium">{translate(code, "app.welcome")}</p>
			<p class="text-sm text-muted-foreground">{translate(code, "ra.page.empty")}</p>
		</div>
		<Separator />
		<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
			<span class="font-medium">{translate(code, "app.dashboard")}</span>
			<span class="text-muted-foreground">{translate(code, "app.settings")}</span>
			<span class="text-muted-foreground">{translate(code, "app.language")}</span>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button size="sm">{translate(code, "ra.action.save")}</Button>
			<Button size="sm" variant="outline">{translate(code, "ra.action.cancel")}</Button>
			<Button size="sm" variant="ghost">{translate(code, "ra.action.delete")}</Button>
		</div>
	</div>
{/snippet}

<DocPage title="Language selector">
	{#snippet subtitle()}
		A dialog that switches the language. The vocabulary is the admin-kit convention: a locale is a
		code, the catalog is data the caller supplies, and this component moves the code and translates
		nothing.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			The block as it stands: a globe naming the current language, and a two-column grid of the
			eight locales it ships with. Picking one applies it and dismisses the dialog — there is no
			Apply button, because a language picker has nothing to confirm.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-wrap items-center gap-4">
				<LanguageSelector.Root bind:value={basicLocale}>
					<LanguageSelector.Trigger />
					<LanguageSelector.Content />
				</LanguageSelector.Root>
				<p class="text-sm text-muted-foreground">
					Bound value: <code>{basicLocale}</code>
				</p>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="The change stays in the demo that made it">
		{#snippet blurb()}
			Switch either panel below to Japanese and read the rest of this window: the header still says
			Language selector, the sidebar is still in English, and the other panel has not moved. That is
			not a demo trick. The component owns no locale — it writes to the <code>value</code> you bound and
			to nothing else — so a change reaches exactly as far as that variable does, and each of these panels
			bound its own.
		{/snippet}
		<div class="grid gap-4 lg:grid-cols-2">
			<Card.Root>
				<Card.Header>
					<Card.Title>Panel A</Card.Title>
					<Card.Description>
						Bound to its own <code>$state</code>, seeded to French.
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-col gap-4">
					<LanguageSelector.Root bind:value={panelLocale}>
						<LanguageSelector.Trigger showCode class="w-full justify-start" />
						<LanguageSelector.Content />
					</LanguageSelector.Root>
					{@render panel(panelLocale)}
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Header>
					<Card.Title>Panel B</Card.Title>
					<Card.Description>
						A second, independent <code>$state</code>, seeded to Japanese.
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-col gap-4">
					<LanguageSelector.Root bind:value={secondPanelLocale}>
						<LanguageSelector.Trigger showCode class="w-full justify-start" />
						<LanguageSelector.Content />
					</LanguageSelector.Root>
					{@render panel(secondPanelLocale)}
				</Card.Content>
			</Card.Root>
		</div>
		<Alert.Root class="mt-4">
			<LanguagesIcon />
			<Alert.Title>Scope is the caller's decision, not the component's</Alert.Title>
			<Alert.Description>
				Nothing here writes <code>document.documentElement.lang</code>, a store, or
				<code>localStorage</code>. An application that wants the whole interface to follow binds the
				same prop to something app-wide — the component cannot tell the difference, which is why it
				can serve both. The panels do set <code>lang</code> on themselves, which is the honest scope:
				the strings inside them really are in that language, and the document is not.
			</Alert.Description>
		</Alert.Root>
	</DocSection>

	<DocSection title="Completeness, and what a gap looks like">
		{#snippet blurb()}
			An entry may carry a <code>completion</code> percentage, and the tile grows a bar for it — the “translation
			progress” the block advertises. These numbers are counted from the demo dictionary rather than declared,
			so Korean reads low because it genuinely is: it carries six of the nine strings, and the other three
			fall back to English rather than rendering their key.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<div class="flex flex-wrap items-center gap-4">
					<LanguageSelector.Root bind:value={measuredLocale} locales={MEASURED_LOCALES}>
						<LanguageSelector.Trigger />
						<LanguageSelector.Content title="Select language" />
					</LanguageSelector.Root>
					{#if measuredEntry}
						<p class="text-sm text-muted-foreground">
							{measuredEntry.englishName} — {measuredEntry.completion}% of this page's dictionary
						</p>
					{/if}
				</div>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Key</Table.Head>
							<Table.Head>Value</Table.Head>
							<Table.Head>Source</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each MESSAGE_KEYS as key (key)}
							<Table.Row>
								<Table.Cell class="font-mono text-xs">{key}</Table.Cell>
								<Table.Cell lang={isTranslated(measuredLocale, key) ? measuredLocale : "en"}>
									{translate(measuredLocale, key)}
								</Table.Cell>
								<Table.Cell>
									{#if isTranslated(measuredLocale, key)}
										<Badge variant="success-subtle">{measuredLocale}</Badge>
									{:else}
										<Badge variant="warning-subtle">fallback: en</Badge>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Right to left">
		{#snippet blurb()}
			An entry can declare its <code>dir</code>, and Arabic is the row that makes the field worth
			having. The tile renders its own name right-to-left inside a left-to-right dialog, and the
			panel below flips wholesale — through <code>DirectionProvider</code>, scoped to the panel, so
			the page around it keeps reading the way it did.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<LanguageSelector.Root bind:value={rtlLocale} locales={RTL_LOCALES}>
					<LanguageSelector.Trigger showCode />
					<LanguageSelector.Content />
				</LanguageSelector.Root>
				<DirectionProvider dir={rtlEntry?.dir ?? "ltr"}>
					{@render panel(rtlLocale)}
				</DirectionProvider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Layout, and opening it from somewhere else">
		{#snippet blurb()}
			<code>columns</code> takes 1, 2 or 3 and the panel widens with it; below <code>sm</code> the grid
			is always a single column, because two tiles across a phone truncate both names. The dialog's open
			state is bindable too, so a control that is not the trigger can raise it — a menu item, a keyboard
			shortcut, an empty state that noticed you cannot read it.
		{/snippet}
		<div class="grid gap-4 lg:grid-cols-2">
			<Card.Root>
				<Card.Header>
					<Card.Title>One column, staying open</Card.Title>
					<!--
						The braces are escaped, and they have to be: a brace pair in a Svelte template is an
						expression, so writing this prop out unescaped renders it as `columns=1` — a
						spelling that does not exist, in a line explaining how to spell it.
					-->
					<Card.Description>
						<code>columns=&#123;1&#125;</code> with <code>closeOnSelect=&#123;false&#125;</code> — for
						a settings surface where the dialog is the page.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<LanguageSelector.Root bind:value={layoutLocale} closeOnSelect={false}>
						<LanguageSelector.Trigger variant="secondary" />
						<LanguageSelector.Content
							columns={1}
							title="Interface language"
							description="Applies to this panel only."
						/>
					</LanguageSelector.Root>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Header>
					<Card.Title>Opened from outside</Card.Title>
					<Card.Description>
						No trigger inside the root at all — the button below writes <code>open</code>.
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-wrap items-center gap-4">
					<Button variant="outline" onclick={() => (controlledOpen = true)}>
						<LanguagesIcon data-icon="inline-start" />
						{localeByCode(LOCALES, controlledLocale)?.nativeName ?? controlledLocale}
					</Button>
					<LanguageSelector.Root bind:value={controlledLocale} bind:open={controlledOpen}>
						<LanguageSelector.Content columns={3} />
					</LanguageSelector.Root>
					<p class="text-sm text-muted-foreground">
						Dialog is <code>{controlledOpen ? "open" : "closed"}</code>
					</p>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">LanguageSelector.Root</h3>
			<p class="text-sm text-muted-foreground">
				Owns the value, the open state and the catalog, and renders no DOM of its own. Everything
				else reads it from context.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each rootProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="mt-8 flex flex-col gap-3">
			<h3 class="text-base font-medium">LanguageSelector.Trigger</h3>
			<p class="text-sm text-muted-foreground">
				The button that opens the dialog, naming the current language in that language. Optional: a
				root whose <code>open</code> is bound needs no trigger at all.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each triggerProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="mt-8 flex flex-col gap-3">
			<h3 class="text-base font-medium">LanguageSelector.Content</h3>
			<p class="text-sm text-muted-foreground">
				The dialog and the grid. The grid is a <code>Listbox</code> with
				<code>orientation="mixed"</code>, so the catalog is one tab stop, the arrow keys walk it on
				both axes, and a locale is applied on Enter or Space rather than on focus — which is what
				makes dismissing on select safe for a keyboard reader.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each contentProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="mt-8 flex flex-col gap-3">
			<h3 class="text-base font-medium">LanguageSelector.Option and Locale</h3>
			<p class="text-sm text-muted-foreground">
				One tile, taking a single <code>locale</code> prop. It is exported so a custom
				<code>option</code> snippet can still render the real thing rather than restating its
				selection wiring. A <code>Locale</code> is <code>code</code>,
				<code>nativeName</code> and <code>englishName</code>, plus optional <code>dir</code> and
				<code>completion</code>. There is no flag field: a flag is a country and a locale is a
				language, and flag emoji do not render on Windows at all.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Attribute</Table.Head>
								<Table.Head>Values</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each dataAttributes as row (row.attribute)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.attribute}</Table.Cell>
									<Table.Cell>{row.values}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>
