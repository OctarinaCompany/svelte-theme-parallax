<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Empty from "$lib/components/ui/empty/index.js";
	import * as Item from "$lib/components/ui/item/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { IconStack } from "$lib/components/ui/icon-stack/index.js";
	import ArchiveIcon from "@lucide/svelte/icons/archive";
	import CheckIcon from "@lucide/svelte/icons/check";
	import DatabaseIcon from "@lucide/svelte/icons/database";
	import InboxIcon from "@lucide/svelte/icons/inbox";
	import LayersIcon from "@lucide/svelte/icons/layers";
	import PackageIcon from "@lucide/svelte/icons/package";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";
	import UserPlusIcon from "@lucide/svelte/icons/user-plus";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Table from "$lib/components/ui/table/index.js";

	/**
	 * The Icon stack component page — its six examples in the order that
	 * page gives them: demo 1 through demo 6.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. The theme's decorative marks are flat: `.avatar > .avatar-title`
	 * (a tinted circle with a letter or an icon) and the illustrations shipped as SVG files. There
	 * is no isometric drawing anywhere in the reference source, so the stack is entirely the ported
	 * component's own — see `$lib/components/ui/icon-stack/icon-stack.svelte`, which records how
	 * the three sheets and the skewed content plane were translated.
	 *
	 * TWO THINGS ARE WORTH KNOWING BEFORE READING THE MARKUP:
	 *
	 * 1. THE SIZE CLASSES ON THE ICONS ARE DELIBERATE. The house rule is that a component sizes
	 *    the icons it owns, so call sites do not. `IconStack` is the exception, and structurally
	 *    so: its content plane is skewed and scaled, so the icon's size is what balances it
	 *    against a stack of an arbitrary height, and the component cannot pick one. Upstream sets
	 *    it per example for the same reason, and every size below is upstream's.
	 *
	 * 2. THE ICONS ARE LIBRARY-AGNOSTIC. The demos assume an `<IconPlaceholder>`, a
	 *    documentation shim that resolves to whichever icon pack the reader picked. This
	 *    repository is Lucide throughout, so each placeholder becomes its `lucide` prop:
	 *    `LayersIcon`, `ArchiveIcon`, `PackageIcon`, `SparklesIcon`, `CheckIcon`, `InboxIcon`,
	 *    `UserPlusIcon`, `DatabaseIcon`.
	 */

	/**
	 * The component's own surface, for the API reference at the foot of the page.
	 *
	 * A house component has no upstream page to defer to, so the props live here — read off
	 * `$lib/components/ui/icon-stack/icon-stack.svelte`, which is the only other place they are
	 * written down.
	 */
	const iconStackProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element. Stays `null` in `child` mode.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged last, so it overrides the base classes — including the two content-position variables below.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"The icon that floats on the front sheet. Sized by the caller: the content plane is skewed and scaled, so the balance depends on the stack's height and the component cannot pick one.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description:
				"Render the root onto your own element and spread the merged props onto it. Neither the layered SVG nor `children` is rendered in this mode.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes",
			default: "—",
			description:
				"Everything else is spread onto the element, so `id`, `aria-*` and event handlers pass through.",
		},
	];

	const iconStackVariables = [
		{
			name: "--icon-stack-content-x",
			default: "71%",
			description: "Horizontal position of the floating content within the stack.",
		},
		{
			name: "--icon-stack-content-y",
			default: "58%",
			description: "Vertical position of the floating content within the stack.",
		},
	];

	/** The three size steps of demo 2, each with the icon size upstream pairs it with. */
	const iconStackSizes = [
		{ label: "Small", class: "h-16 w-14", icon: ArchiveIcon, iconClass: "size-3.5" },
		{ label: "Default", class: "h-20 w-18", icon: PackageIcon, iconClass: "size-4" },
		{ label: "Large", class: "h-28 w-24", icon: LayersIcon, iconClass: "size-6" },
	];

	/**
	 * The four tones of demo 3. Upstream's list is neutral / primary / success /
	 * warning, all four already semantic tokens here, so it survives the theme unchanged — the
	 * stack's sheets inherit `currentColor` from the root and the icon is tinted separately.
	 */
	const iconStackTones = [
		{ label: "Neutral", class: "text-foreground", iconClass: "text-muted-foreground" },
		{ label: "Primary", class: "text-primary", iconClass: "text-primary" },
		{ label: "Success", class: "text-success", iconClass: "text-success" },
		{ label: "Warning", class: "text-warning", iconClass: "text-warning" },
	];
</script>

<DocPage title="Icon stack">
	{#snippet subtitle()}
		A layered isometric mark that frames a single icon — the illustration an empty state or a
		feature card leads with, sized and tinted from the surrounding text colour.
	{/snippet}

	<DocSection title="Isometric icon stack">
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center">
					<IconStack aria-hidden="true">
						<LayersIcon class="size-4" />
					</IconStack>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Icon stack sizes">
		{#snippet blurb()}
			The stack has no size variants: it is sized with height and width utilities, and the icon
			inside is scaled to match.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-end justify-center gap-8">
					{#each iconStackSizes as size (size.label)}
						{@const SizeIcon = size.icon}
						<div class="flex flex-col items-center gap-2">
							<IconStack aria-hidden="true" class={size.class}>
								<SizeIcon class={size.iconClass} />
							</IconStack>
							<span class="text-sm text-muted-foreground">{size.label}</span>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Icon stack colors">
		{#snippet blurb()}
			The sheets are stroked in <code>currentColor</code>, so a text colour on the root recolours
			the whole illustration.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-end justify-center gap-7">
					{#each iconStackTones as tone (tone.label)}
						<div class="flex flex-col items-center gap-2">
							<IconStack aria-hidden="true" class={tone.class}>
								<SparklesIcon class="size-4 {tone.iconClass}" />
							</IconStack>
							<span class="text-sm text-muted-foreground">{tone.label}</span>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Icon badge stack">
		{#snippet blurb()}
			The content plane accepts any node, not only an icon — here a bordered pill that reads as a
			badge resting on the front sheet.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center">
					<IconStack aria-hidden="true" class="h-24 w-22 text-primary">
						<span
							class="flex size-8 items-center justify-center rounded-full border bg-background text-primary shadow-xs"
						>
							<CheckIcon class="size-4" />
						</span>
					</IconStack>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Empty state illustration">
		{#snippet blurb()}
			The stack as <code>Empty.Media</code> — the illustration this repository's empty states otherwise
			have to ship as an SVG file.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center p-4">
					<Empty.Root class="max-w-md py-10">
						<Empty.Header>
							<Empty.Media>
								<IconStack aria-hidden="true" class="h-24 w-22 text-primary">
									<InboxIcon class="size-5 text-primary" />
								</IconStack>
							</Empty.Media>
							<Empty.Title>Workspace is ready</Empty.Title>
							<Empty.Description>
								Invite teammates or connect a data source to start filling this view.
							</Empty.Description>
						</Empty.Header>
						<Empty.Content class="flex-row justify-center gap-2">
							<Button size="sm">
								<UserPlusIcon data-icon="inline-start" />
								Invite team
							</Button>
							<Button variant="outline" size="sm">
								<DatabaseIcon data-icon="inline-start" />
								Connect source
							</Button>
						</Empty.Content>
					</Empty.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Item media stack">
		{#snippet blurb()}
			Shrunk to <code>h-12 w-11</code>, the same mark works as the media column of a compact list
			item.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="mx-auto flex w-full max-w-md items-center justify-center p-4">
					<Item.Root variant="outline" class="max-w-sm">
						<Item.Media>
							<IconStack aria-hidden="true" class="h-12 w-11 text-primary">
								<PackageIcon class="size-3 text-primary" />
							</IconStack>
						</Item.Media>
						<Item.Content>
							<Item.Title>Registry package ready</Item.Title>
							<Item.Description>
								Use IconStack as rich media inside compact list items.
							</Item.Description>
						</Item.Content>
					</Item.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">IconStack</h3>
			<p class="text-sm text-muted-foreground">
				The whole component: three isometric sheets, a soft ground shadow, and a skewed content
				plane holding whatever you pass as <code>children</code>.
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
							{#each iconStackProps as row (row.prop)}
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

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">CSS variables</h3>
			<p class="text-sm text-muted-foreground">
				Written as arbitrary-property utilities rather than an inline <code>style</code>, so a
				caller can override either of them through <code>class</code> and tailwind-merge resolves the
				conflict.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Variable</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each iconStackVariables as row (row.name)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.name}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>
