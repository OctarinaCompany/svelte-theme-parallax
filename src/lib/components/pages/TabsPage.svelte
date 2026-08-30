<script lang="ts">
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import CalendarClockIcon from "@lucide/svelte/icons/calendar-clock";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import LockIcon from "@lucide/svelte/icons/lock";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import SquareCheckIcon from "@lucide/svelte/icons/square-check";
	import UserIcon from "@lucide/svelte/icons/user";
	import UsersIcon from "@lucide/svelte/icons/users";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Tabs component page, ported from
	 * https://shadcn-svelte.com/docs/components/tabs — that page carries exactly one demo (an
	 * account/password pair of forms) plus its Usage snippet, so the sections after the first
	 * come from the classic theme's own `Navs and tabs` documentation.
	 *
	 * WHAT THE CLASSIC THEME DOES DIFFERENTLY — the shape, not just the colour. shadcn's default
	 * `Tabs.List` is a filled pill riding in a `bg-muted` bar. The classic theme's `.nav-tabs` is the
	 * opposite object; the reference stylesheet opens with the comment "Changing nav tabs to be bottom
	 * highlight style" and then strips the classic framework's own tab folder away:
	 *
	 *   .nav-tabs .nav-link { padding: var(--bs-nav-tabs-link-padding-y) 0;
	 *                         border-bottom: 1px solid transparent;
	 *                         border-left-width: 0; border-right-width: 0; border-top-width: 0 }
	 *
	 * so what is left is a row of bare labels over the `<ul>`'s own 1px rule
	 * (`nav-tabs-border-color: var(--bs-border-color)`), with the active label marked by a 1px
	 * `primary` underline (`nav-tabs-link-active-border-color: transparent transparent
	 * var(--bs-primary)`, `nav-tabs-link-active-border-width: 1px`) — no bar, no fill, no radius.
	 *
	 * shadcn already ships that silhouette as `Tabs.List variant="line"`, so every list here
	 * asks for it, and the classic theme's measurements are applied to that variant in `app.css`. The
	 * default pill variant is deliberately left alone: its classic counterpart is `.nav-pills`
	 * (`nav-pills-link-active-bg: component-active-bg`, a solid `primary` pill), which is a
	 * different component from `.nav-tabs`.
	 *
	 * The measurements live in `app.css` rather than at the call site for the reason the Switch
	 * block there already states: the indicator is a `::after` on the trigger, which no `class`
	 * prop reaches, and every geometry class the list would need (`h-auto`, `w-auto`, `p-0`,
	 * `gap-6`) TIES on specificity with a base utility the component already sets — leaving
	 * Tailwind's sort order, not the cascade, to pick the winner. Unlayered rules remove the
	 * question, and spare fifteen triggers a repeated class string.
	 *
	 * WHAT THE CLASSIC THEME HAS NO COUNTERPART FOR, kept as shadcn ships it:
	 *
	 *   vertical tabs   the classic framework stacks a nav with `.flex-column`, but `.nav-tabs`' whole
	 *                   identity is a BOTTOM edge and the classic theme documents no vertical variant.
	 *                   The page shows horizontal only, and the `app.css` indicator rule is
	 *                   scoped to `[data-orientation='horizontal']` so shadcn's vertical
	 *                   right-edge marker survives untouched.
	 *   list -> panel   the classic `.tab-content` has no spacing of its own; the 16px under the
	 *                   nav in the classic theme's own example is an `mb-4` utility on the `<ul>`, i.e. a
	 *                   choice made by that document rather than by the component. `Tabs.Root`
	 *                   keeps its `gap-2`.
	 *   focus ring      the classic theme removes it — `nav-link-focus-box-shadow: 0 0`, compiled to
	 *                   `.nav-link:focus-visible { box-shadow: 0 0; outline: 0 }`. NOT ported:
	 *                   the tablist is a roving-tabindex widget, and dropping the ring would
	 *                   leave a keyboard user with no indication of where they are at all.
	 *
	 * `.card-header-tabs` is the one classic piece this page does not demonstrate. It is
	 * `margin: -.75rem 0` (`card-spacer-y * .5`) plus a padding recomputed from
	 * `card-header-height` — `calc((60px - 1em * 1.5) * .5)` — so the tabs fill the header's
	 * fixed 60px row. Both numbers assume the classic flex `.card-header`; this app's
	 * `CardHeader` is a grid with its own padding, and the Cards page already carries the one
	 * demo of tabs inside a card header.
	 */

	/**
	 * The classic theme's first navs card: an active link, two plain ones and a disabled one.
	 * `.nav-link.disabled` is `color: var(--bs-nav-link-disabled-color)` — `secondary-color`,
	 * which `--muted-foreground` holds exactly in both modes, and which is also the resting
	 * colour of every other tab, so a disabled tab differs only by its dead pointer.
	 */
	const states = [
		{ value: "active", label: "Active", body: "The tab that is open when the group mounts." },
		{ value: "link-1", label: "Link", body: "An ordinary tab." },
		{ value: "link-2", label: "Link", body: "Another ordinary tab." },
		{ value: "disabled", label: "Disabled", body: "Unreachable — this panel never shows." },
	];

	/** Enough labels that the row cannot fit a reading column, which is the point of the demo. */
	const overflow = [
		"Overview",
		"Files",
		"Activity",
		"Members",
		"Settings",
		"Billing",
		"Integrations",
		"Reports",
	];

	/*
	 * The sections below the first ones are the tabs demo set. Two are not here:
	 * demo 2 (line-variant tabs over account/password card forms) is the composition the
	 * page already opens on, and demo 6 differs from demo 5 only in the list being
	 * full width — same feature, icons on default-variant triggers, shown once.
	 *
	 * Two systematic adaptations, applied throughout rather than re-noted per section: a
	 * `Badge size="sm"` has no counterpart — the house badge is one size — and the `-light` badge
	 * variants map to the `-subtle` family (docs/CONVENTIONS.md §3). Trigger icons also lose their
	 * `size-*` classes: the trigger already sizes unclassed svgs.
	 */

	/** demo 9's `useState("monthly")` — the one controlled group on the page. */
	let segmentedPeriod = $state("monthly");
</script>

<DocPage title="Tabs">
	{#snippet subtitle()}
		A set of layered sections of content — known as tab panels — that are displayed one at a time.
		Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/tabs"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<!--
		The docs page's own demo, kept intact. It is not wrapped in a card the way the first demo
		on the Progress or Tooltips pages is, because it already contains two of them — the same
		reason the Accordion page opens on a bare element.
	-->
	<div class="w-full max-w-sm">
		<Tabs.Root value="account">
			<Tabs.List variant="line">
				<Tabs.Trigger value="account">Account</Tabs.Trigger>
				<Tabs.Trigger value="password">Password</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="account">
				<Card.Root>
					<Card.Header>
						<Card.Title>Account</Card.Title>
						<Card.Description>
							Make changes to your account here. Click save when you're done.
						</Card.Description>
					</Card.Header>
					<Card.Content class="grid gap-6">
						<div class="grid gap-3">
							<Label for="tabs-demo-name">Name</Label>
							<Input id="tabs-demo-name" value="Pedro Duarte" />
						</div>
						<div class="grid gap-3">
							<Label for="tabs-demo-username">Username</Label>
							<Input id="tabs-demo-username" value="@peduarte" />
						</div>
					</Card.Content>
					<Card.Footer>
						<Button>Save changes</Button>
					</Card.Footer>
				</Card.Root>
			</Tabs.Content>
			<Tabs.Content value="password">
				<Card.Root>
					<Card.Header>
						<Card.Title>Password</Card.Title>
						<Card.Description>
							Change your password here. After saving, you'll be logged out.
						</Card.Description>
					</Card.Header>
					<Card.Content class="grid gap-6">
						<div class="grid gap-3">
							<Label for="tabs-demo-current">Current password</Label>
							<Input id="tabs-demo-current" type="password" />
						</div>
						<div class="grid gap-3">
							<Label for="tabs-demo-new">New password</Label>
							<Input id="tabs-demo-new" type="password" />
						</div>
					</Card.Content>
					<Card.Footer>
						<Button>Save password</Button>
					</Card.Footer>
				</Card.Root>
			</Tabs.Content>
		</Tabs.Root>
	</div>

	<DocSection title="States">
		{#snippet blurb()}
			One active tab, two idle ones and a disabled one. An idle label sits at
			<code class="text-[87.5%] text-primary">--muted-foreground</code>, darkens under the pointer,
			and reaches the body colour only once it is the active tab.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Tabs.Root value="active">
					<Tabs.List variant="line">
						{#each states as state (state.value)}
							<Tabs.Trigger value={state.value} disabled={state.value === "disabled"}>
								{state.label}
							</Tabs.Trigger>
						{/each}
					</Tabs.List>
					{#each states as state (state.value)}
						<Tabs.Content value={state.value}>{state.body}</Tabs.Content>
					{/each}
				</Tabs.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Small">
		{#snippet blurb()}
			A smaller variation of the tab row, for a card header where a full-height row would crowd the
			title beside it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Tabs.Root value="active">
					<!--
						`size="sm"` is a declared prop on `Tabs.List` — it stamps `data-size` on the
						tablist element, where the `app.css` rule reads it. The classic theme
						expresses the same thing as a second class (`.nav-tabs.nav-tabs-sm`) that
						rebinds three custom properties: `nav-tabs-font-size-sm` (13px),
						`nav-tabs-link-margin-x-sm` (.5rem, so 1rem between labels rather than 1.5rem)
						and a padding scaled by `font-size-base / nav-tabs-font-size-sm` so the row
						keeps its height as the type shrinks.
					-->
					<Tabs.List variant="line" size="sm">
						<Tabs.Trigger value="active">Active</Tabs.Trigger>
						<Tabs.Trigger value="link-1">Link</Tabs.Trigger>
						<Tabs.Trigger value="link-2">Link</Tabs.Trigger>
					</Tabs.List>
					<Tabs.Content value="active">The tab that is open when the group mounts.</Tabs.Content>
					<Tabs.Content value="link-1">An ordinary tab.</Tabs.Content>
					<Tabs.Content value="link-2">Another ordinary tab.</Tabs.Content>
				</Tabs.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Horizontal overflow">
		{#snippet blurb()}
			Tabs that do not wrap when they outrun the viewport: they stay on one line and the row scrolls
			in the x axis instead.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Tabs.Root value="Overview">
					<!--
						`.nav-overflow` is `display: flex; flex-wrap: nowrap; overflow-x: auto` plus a
						`::-webkit-scrollbar { display: none }` — which `no-scrollbar`, a utility
						shadcn-svelte declares in its own `tailwind.css`, reproduces exactly (it adds
						`scrollbar-width` and `-ms-overflow-style` for the engines webkit's rule misses).
						The list is already a nowrap flex row, so only the scroll box is new.

						The box is a WRAPPER rather than the list itself. Two reasons: the `app.css` rule
						zeroes the list's padding unlayered, so `.nav-overflow`'s own `padding-bottom: 1px`
						guard could not be re-added there; and it is not needed here anyway — that 1px
						exists to keep the active underline from being clipped by the scroll box, and with
						the wrapper as the scroll box the underline sits well inside it. The list stays
						`inline-flex`, so it shrink-wraps to its labels and the bottom rule runs the whole
						scrollable width, as the classic theme's `<ul>` does.
					-->
					<div class="no-scrollbar overflow-x-auto">
						<Tabs.List variant="line" size="sm">
							{#each overflow as label (label)}
								<Tabs.Trigger value={label}>{label}</Tabs.Trigger>
							{/each}
						</Tabs.List>
					</div>
					{#each overflow as label (label)}
						<Tabs.Content value={label}>The {label.toLowerCase()} panel.</Tabs.Content>
					{/each}
				</Tabs.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Basic tabs">
		{#snippet blurb()}
			The default filled list — the one look this page had not shown yet, since every section above
			asks for <code class="text-[87.5%] text-primary">variant="line"</code> instead.
		{/snippet}
		<!-- demo 1: the account/password pair again, this time on the untouched pill list. -->
		<div class="flex w-full max-w-xs flex-col gap-6">
			<Tabs.Root value="account">
				<Tabs.List>
					<Tabs.Trigger value="account">Account</Tabs.Trigger>
					<Tabs.Trigger value="password">Password</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="account">
					<Card.Root>
						<Card.Header class="pb-3">
							<Card.Title class="text-base">Account</Card.Title>
							<Card.Description class="text-sm">Update your account information.</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col gap-4">
							<div class="grid gap-2">
								<Label for="basic-name" class="text-sm">Name</Label>
								<Input id="basic-name" value="Sarah Johnson" />
							</div>
							<div class="grid gap-2">
								<Label for="basic-username" class="text-sm">Username</Label>
								<Input id="basic-username" value="@sarahj" />
							</div>
						</Card.Content>
						<Card.Footer class="pt-3">
							<Button size="sm">Save changes</Button>
						</Card.Footer>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="password">
					<Card.Root>
						<Card.Header class="pb-3">
							<Card.Title class="text-base">Password</Card.Title>
							<Card.Description class="text-sm">Change your password here.</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col gap-4">
							<div class="grid gap-2">
								<Label for="basic-current" class="text-sm">Current password</Label>
								<Input id="basic-current" type="password" />
							</div>
							<div class="grid gap-2">
								<Label for="basic-new" class="text-sm">New password</Label>
								<Input id="basic-new" type="password" />
							</div>
						</Card.Content>
						<Card.Footer class="pt-3">
							<Button size="sm">Update password</Button>
						</Card.Footer>
					</Card.Root>
				</Tabs.Content>
			</Tabs.Root>
		</div>
	</DocSection>

	<DocSection title="Tabs with vertical orientation">
		{#snippet blurb()}
			The list stacks down the left and the panel fills the rest. This is shadcn-svelte's own
			vertical behaviour, untouched by the theme's tab measurements — those are scoped to horizontal
			lists.
		{/snippet}
		<!--
			demo 3. The vertical column, the full-width triggers and their left alignment all
			come from the component's own `[data-orientation=vertical]` rules — upstream's
			`w-40 shrink-0` on the list is the only geometry the demo adds.
		-->
		<div class="w-full max-w-lg">
			<Tabs.Root value="account" orientation="vertical" class="gap-5">
				<Tabs.List class="w-40 shrink-0">
					<Tabs.Trigger value="account">Account</Tabs.Trigger>
					<Tabs.Trigger value="password">Password</Tabs.Trigger>
					<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="account">
					<Card.Root>
						<Card.Header class="pb-3">
							<Card.Title class="text-base">Account</Card.Title>
							<Card.Description class="text-sm">Update your account information.</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col gap-4">
							<div class="grid gap-2">
								<Label for="vertical-name" class="text-sm">Name</Label>
								<Input id="vertical-name" value="Emma Wilson" />
							</div>
							<div class="grid gap-2">
								<Label for="vertical-email" class="text-sm">Email</Label>
								<Input id="vertical-email" type="email" value="emma.wilson@example.com" />
							</div>
						</Card.Content>
						<Card.Footer class="pt-3">
							<Button size="sm">Save changes</Button>
						</Card.Footer>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="password">
					<Card.Root>
						<Card.Header class="pb-3">
							<Card.Title class="text-base">Password</Card.Title>
							<Card.Description class="text-sm">Change your password here.</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col gap-4">
							<div class="grid gap-2">
								<Label for="vertical-current" class="text-sm">Current password</Label>
								<Input id="vertical-current" type="password" />
							</div>
							<div class="grid gap-2">
								<Label for="vertical-new" class="text-sm">New password</Label>
								<Input id="vertical-new" type="password" />
							</div>
						</Card.Content>
						<Card.Footer class="pt-3">
							<Button size="sm">Update password</Button>
						</Card.Footer>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="settings">
					<Card.Root>
						<Card.Header class="pb-3">
							<Card.Title class="text-base">Settings</Card.Title>
							<Card.Description class="text-sm">Manage your preferences.</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col gap-4">
							<div class="grid gap-2">
								<Label for="vertical-theme" class="text-sm">Theme</Label>
								<Input id="vertical-theme" value="Light" />
							</div>
							<div class="grid gap-2">
								<Label for="vertical-language" class="text-sm">Language</Label>
								<Input id="vertical-language" value="English" />
							</div>
						</Card.Content>
						<Card.Footer class="pt-3">
							<Button size="sm">Save settings</Button>
						</Card.Footer>
					</Card.Root>
				</Tabs.Content>
			</Tabs.Root>
		</div>
	</DocSection>

	<DocSection title="Tabs with vertical orientation and line variant">
		{#snippet blurb()}
			The same stack without the filled bar: the active trigger is marked by an 8px rule on its
			leading edge — the vertical reading of the line variant's underline, mirrored so the flag sits
			beside the label rather than in the gap before the panel, and cut to the same width as the
			sidebar's own active bar.
		{/snippet}
		<!-- demo 4: c-tabs-3 with `variant="line"` on the list, nothing else moved. -->
		<div class="flex w-full max-w-2xl flex-col gap-6">
			<Tabs.Root value="account" orientation="vertical" class="gap-5">
				<Tabs.List variant="line" class="w-40 shrink-0">
					<Tabs.Trigger value="account">Account</Tabs.Trigger>
					<Tabs.Trigger value="password">Password</Tabs.Trigger>
					<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="account">
					<Card.Root>
						<Card.Header class="pb-3">
							<Card.Title class="text-base">Account</Card.Title>
							<Card.Description class="text-sm">Update your account information.</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col gap-4">
							<div class="grid gap-2">
								<Label for="underline-vertical-name" class="text-sm">Name</Label>
								<Input id="underline-vertical-name" value="Michael Brown" />
							</div>
							<div class="grid gap-2">
								<Label for="underline-vertical-email" class="text-sm">Email</Label>
								<Input
									id="underline-vertical-email"
									type="email"
									value="michael.brown@example.com"
								/>
							</div>
						</Card.Content>
						<Card.Footer class="pt-3">
							<Button size="sm">Save changes</Button>
						</Card.Footer>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="password">
					<Card.Root>
						<Card.Header class="pb-3">
							<Card.Title class="text-base">Password</Card.Title>
							<Card.Description class="text-sm">Change your password here.</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col gap-4">
							<div class="grid gap-2">
								<Label for="underline-vertical-current" class="text-sm">Current password</Label>
								<Input id="underline-vertical-current" type="password" />
							</div>
							<div class="grid gap-2">
								<Label for="underline-vertical-new" class="text-sm">New password</Label>
								<Input id="underline-vertical-new" type="password" />
							</div>
						</Card.Content>
						<Card.Footer class="pt-3">
							<Button size="sm">Update password</Button>
						</Card.Footer>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="settings">
					<Card.Root>
						<Card.Header class="pb-3">
							<Card.Title class="text-base">Settings</Card.Title>
							<Card.Description class="text-sm">Manage your preferences.</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col gap-4">
							<div class="grid gap-2">
								<Label for="underline-vertical-theme" class="text-sm">Theme</Label>
								<Input id="underline-vertical-theme" value="Light" />
							</div>
							<div class="grid gap-2">
								<Label for="underline-vertical-language" class="text-sm">Language</Label>
								<Input id="underline-vertical-language" value="English" />
							</div>
						</Card.Content>
						<Card.Footer class="pt-3">
							<Button size="sm">Save settings</Button>
						</Card.Footer>
					</Card.Root>
				</Tabs.Content>
			</Tabs.Root>
		</div>
	</DocSection>

	<DocSection title="Tabs with icons">
		{#snippet blurb()}
			An icon ahead of each label. The trigger sizes any unclassed svg itself, so the icons carry no
			classes at all.
		{/snippet}
		<!-- demo 5, its IconPlaceholder resolved to the lucide column: user, lock, settings. -->
		<div class="flex w-full max-w-xs flex-col gap-6">
			<Tabs.Root value="account">
				<Tabs.List>
					<Tabs.Trigger value="account">
						<UserIcon />
						Account
					</Tabs.Trigger>
					<Tabs.Trigger value="password">
						<LockIcon />
						Password
					</Tabs.Trigger>
					<Tabs.Trigger value="settings">
						<SettingsIcon />
						Settings
					</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="account">
					<Card.Root>
						<Card.Header class="pb-3">
							<Card.Title class="text-base">Account</Card.Title>
							<Card.Description class="text-sm">Update your account information.</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col gap-4">
							<div class="grid gap-2">
								<Label for="icons-name" class="text-sm">Name</Label>
								<Input id="icons-name" value="Sarah Johnson" />
							</div>
							<div class="grid gap-2">
								<Label for="icons-email" class="text-sm">Email</Label>
								<Input id="icons-email" type="email" value="sarah.johnson@example.com" />
							</div>
						</Card.Content>
						<Card.Footer class="pt-3">
							<Button size="sm">Save changes</Button>
						</Card.Footer>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="password">
					<Card.Root>
						<Card.Header class="pb-3">
							<Card.Title class="text-base">Password</Card.Title>
							<Card.Description class="text-sm">Change your password here.</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col gap-4">
							<div class="grid gap-2">
								<Label for="icons-current" class="text-sm">Current password</Label>
								<Input id="icons-current" type="password" />
							</div>
							<div class="grid gap-2">
								<Label for="icons-new" class="text-sm">New password</Label>
								<Input id="icons-new" type="password" />
							</div>
						</Card.Content>
						<Card.Footer class="pt-3">
							<Button size="sm">Update password</Button>
						</Card.Footer>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="settings">
					<Card.Root>
						<Card.Header class="pb-3">
							<Card.Title class="text-base">Settings</Card.Title>
							<Card.Description class="text-sm">Manage your preferences.</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col gap-4">
							<div class="grid gap-2">
								<Label for="icons-theme" class="text-sm">Theme</Label>
								<Input id="icons-theme" value="Light" />
							</div>
							<div class="grid gap-2">
								<Label for="icons-language" class="text-sm">Language</Label>
								<Input id="icons-language" value="English" />
							</div>
						</Card.Content>
						<Card.Footer class="pt-3">
							<Button size="sm">Save settings</Button>
						</Card.Footer>
					</Card.Root>
				</Tabs.Content>
			</Tabs.Root>
		</div>
	</DocSection>

	<DocSection title="Tabs with badge counts">
		{#snippet blurb()}
			A count pill after the labels that have one — and none after Sent, which is the point: a badge
			is information, not decoration.
		{/snippet}
		<!--
			demo 7. The light badges are the
			`-subtle` family here, and `size="sm"` drops away — the house badge is one size.
		-->
		<div class="flex w-full max-w-md flex-col gap-6">
			<Tabs.Root value="inbox">
				<Tabs.List variant="line" class="mb-3.5 w-full">
					<Tabs.Trigger value="inbox" class="gap-2">
						Inbox
						<Badge variant="primary-subtle">12</Badge>
					</Tabs.Trigger>
					<Tabs.Trigger value="drafts" class="gap-2">
						Drafts
						<Badge variant="info-subtle">3</Badge>
					</Tabs.Trigger>
					<Tabs.Trigger value="sent" class="gap-2">Sent</Tabs.Trigger>
					<Tabs.Trigger value="spam" class="gap-2">
						Spam
						<Badge variant="destructive-subtle">24</Badge>
					</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="inbox">
					<Card.Root>
						<Card.Content>12 unread messages in your inbox.</Card.Content>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="drafts">
					<Card.Root>
						<Card.Content>3 drafts waiting to be sent.</Card.Content>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="sent">
					<Card.Root>
						<Card.Content>All sent messages appear here.</Card.Content>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="spam">
					<Card.Root>
						<Card.Content>24 spam messages detected.</Card.Content>
					</Card.Root>
				</Tabs.Content>
			</Tabs.Root>
		</div>
	</DocSection>

	<DocSection title="Tabs with icons and line variant">
		{#snippet blurb()}
			A sidebar-shaped composition: vertical line tabs where each trigger carries an icon, its
			label, and — when there is something to count — a badge pushed to the far edge.
		{/snippet}
		<!--
			demo 8. Upstream's `justify-start` on each trigger is already the component's own
			vertical behaviour; `ml-auto` on the badges is what keeps the counts ragged-right while
			the labels stay ragged-left.
		-->
		<div class="flex w-full max-w-lg flex-col gap-6">
			<Tabs.Root value="projects" orientation="vertical" class="gap-5">
				<Tabs.List variant="line" class="w-48 shrink-0">
					<Tabs.Trigger value="projects" class="gap-2">
						<FolderIcon />
						Projects
						<Badge variant="secondary" class="ml-auto">8</Badge>
					</Tabs.Trigger>
					<Tabs.Trigger value="tasks" class="gap-2">
						<SquareCheckIcon />
						Tasks
						<Badge variant="primary-subtle" class="ml-auto">24</Badge>
					</Tabs.Trigger>
					<Tabs.Trigger value="team" class="gap-2">
						<UsersIcon />
						Team
					</Tabs.Trigger>
					<Tabs.Trigger value="reports" class="gap-2">
						<FileTextIcon />
						Reports
					</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="projects">
					<Card.Root>
						<Card.Content>
							<h3 class="mb-2 font-semibold text-foreground">Active Projects</h3>
							<p>8 projects are currently in progress across your workspace.</p>
						</Card.Content>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="tasks">
					<Card.Root>
						<Card.Content>
							<h3 class="mb-2 font-semibold text-foreground">Pending Tasks</h3>
							<p>24 tasks need your attention this week.</p>
						</Card.Content>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="team">
					<Card.Root>
						<Card.Content>
							<h3 class="mb-2 font-semibold text-foreground">Team Members</h3>
							<p>Manage your team and their access permissions.</p>
						</Card.Content>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="reports">
					<Card.Root>
						<Card.Content>
							<h3 class="mb-2 font-semibold text-foreground">Reports</h3>
							<p>View generated reports and export data.</p>
						</Card.Content>
					</Card.Root>
				</Tabs.Content>
			</Tabs.Root>
		</div>
	</DocSection>

	<DocSection title="Segmented control tabs">
		{#snippet blurb()}
			The filled list read as a segmented control for a stat card's period — the one controlled
			group on this page, so the selection could drive a query rather than just a panel.
		{/snippet}
		<!-- demo 9, its `useState` as the `segmentedPeriod` rune above via `bind:value`. -->
		<div class="mx-auto flex w-full max-w-xs flex-col items-center gap-6">
			<Tabs.Root bind:value={segmentedPeriod}>
				<Tabs.List class="w-full">
					<Tabs.Trigger value="daily" class="gap-1.5">
						<CalendarIcon />
						Daily
					</Tabs.Trigger>
					<Tabs.Trigger value="weekly" class="gap-1.5">
						<SquareCheckIcon />
						Weekly
					</Tabs.Trigger>
					<Tabs.Trigger value="monthly" class="gap-1.5">
						<UsersIcon />
						Monthly
					</Tabs.Trigger>
					<Tabs.Trigger value="yearly" class="gap-1.5">
						<CalendarClockIcon />
						Yearly
					</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="daily">
					<Card.Root>
						<Card.Content class="text-center">
							<p class="text-3xl font-bold">1,284</p>
							<p class="mt-1 text-sm text-muted-foreground">Visitors today</p>
						</Card.Content>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="weekly">
					<Card.Root>
						<Card.Content class="text-center">
							<p class="text-3xl font-bold">8,942</p>
							<p class="mt-1 text-sm text-muted-foreground">Visitors this week</p>
						</Card.Content>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="monthly">
					<Card.Root>
						<Card.Content class="text-center">
							<p class="text-3xl font-bold">32,156</p>
							<p class="mt-1 text-sm text-muted-foreground">Visitors this month</p>
						</Card.Content>
					</Card.Root>
				</Tabs.Content>
				<Tabs.Content value="yearly">
					<Card.Root>
						<Card.Content class="text-center">
							<p class="text-3xl font-bold">384,721</p>
							<p class="mt-1 text-sm text-muted-foreground">Visitors this year</p>
						</Card.Content>
					</Card.Root>
				</Tabs.Content>
			</Tabs.Root>
		</div>
	</DocSection>
</DocPage>
