<script lang="ts">
	import TrashIcon from "@lucide/svelte/icons/trash";

	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as ResponsiveDialog from "$lib/components/ui/responsive-dialog/index.js";
	import { Spinner } from "$lib/components/ui/spinner/index.js";
	import * as Table from "$lib/components/ui/table/index.js";

	/**
	 * The Responsive dialog component page.
	 *
	 * ONE COMPONENT, TWO THE CLASSIC THEME SURFACES. Above the breakpoint it renders a dialog — the classic
	 * `.modal`; below it, a drawer, which the classic framework calls `.offcanvas` and this repository has
	 * already ported as the Sheet.
	 *
	 * Both halves therefore arrive themed: the dialog through the card and popover tokens, and the
	 * drawer through `app.css`'s `[data-slot='sheet-overlay']` rule, which paints the scrim with
	 * `--scrim` — the classic theme's `offcanvas-backdrop-bg`, and the one token that is the same value in
	 * both modes.
	 */

	// --- Confirmation Dialog -------------------------------------------------
	// Upstream renders `<Loader2 className="animate-spin" />` inside the pending button; `Button` has
	// no `isPending` prop here, so the composition is `Spinner` + `disabled` (divergence D-06).
	let isDeleting = $state(false);

	function onDelete() {
		isDeleting = true;
		// Simulate deletion.
		setTimeout(() => {
			isDeleting = false;
		}, 1000);
	}

	// --- Controlled ----------------------------------------------------------
	let controlledOpen = $state(false);
	let transitions = $state(0);

	// --- API reference -------------------------------------------------------
	type PropRow = { prop: string; type: string; default: string; description: string };

	const rootProps: PropRow[] = [
		{
			prop: "breakpoint",
			type: "number",
			default: "768",
			description:
				"Viewport width in px at or above which a dialog is rendered instead of a drawer.",
		},
		{
			prop: "open",
			type: "boolean",
			default: "undefined",
			description:
				"Controlled open state. Bindable — bind:open lets the dialog move your state, bind:open={get, set} keeps you authoritative.",
		},
		{
			prop: "defaultOpen",
			type: "boolean",
			default: "false",
			description: "Initial open state when uncontrolled. Ignored once open is bound.",
		},
		{
			prop: "onOpenChange",
			type: "(open: boolean) => void",
			default: "—",
			description:
				"Called on a real open ↔ closed transition only — never when the breakpoint is crossed.",
		},
		{
			prop: "onOpenChangeComplete",
			type: "(open: boolean) => void",
			default: "—",
			description:
				"Forwarded to the dialog root once its transition settles. The drawer has no counterpart, so it never fires in drawer mode.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Rendered inside whichever root is active.",
		},
	];

	const contentProps: PropRow[] = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the active content element.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last, after the drawer-mode px-4 pb-4.",
		},
		{
			prop: "portalProps",
			type: "WithoutChildrenOrChild<PortalProps>",
			default: "—",
			description: "Forwarded to the active content's own portal.",
		},
		{
			prop: "showCloseButton",
			type: "boolean",
			default: "true",
			description: "Dialog mode only — Drawer.Content has no close button.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The dialog body. Required.",
		},
	];

	const footerProps: PropRow[] = [
		{
			prop: "showCloseButton",
			type: "boolean",
			default: "false",
			description: "Renders the footer's built-in close button. Dialog mode only.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The footer content, usually action buttons.",
		},
	];

	const keyboard = [
		{ keys: "Space", description: "Opens the dialog/drawer when focus is on the trigger." },
		{ keys: "Enter", description: "Opens the dialog/drawer when focus is on the trigger." },
		{ keys: "Tab", description: "Moves focus to the next focusable element." },
		{ keys: "Shift + Tab", description: "Moves focus to the previous focusable element." },
		{ keys: "Escape", description: "Closes the dialog/drawer and moves focus to the trigger." },
	];
</script>

{#snippet propsTable(rows: PropRow[])}
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
			{#each rows as row (row.prop)}
				<Table.Row>
					<Table.Cell class="font-medium">{row.prop}</Table.Cell>
					<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
					<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
					<Table.Cell>{row.description}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
{/snippet}

<DocPage title="Responsive Dialog">
	{#snippet subtitle()}
		A dialog that renders as a centered modal on desktop and a bottom drawer on mobile. Resize the
		window across 768px with one open — it swaps without closing.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			One composition, two presentations.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<ResponsiveDialog.Root>
					<ResponsiveDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Edit Profile</Button>
						{/snippet}
					</ResponsiveDialog.Trigger>
					<ResponsiveDialog.Content>
						<ResponsiveDialog.Header>
							<ResponsiveDialog.Title>Edit profile</ResponsiveDialog.Title>
							<ResponsiveDialog.Description>
								Make changes to your profile here. Click save when you’re done.
							</ResponsiveDialog.Description>
						</ResponsiveDialog.Header>
						<Field.FieldGroup>
							<Field.Field>
								<Field.FieldLabel for="responsive-dialog-name">Name</Field.FieldLabel>
								<Input id="responsive-dialog-name" value="Pedro Duarte" />
							</Field.Field>
							<Field.Field>
								<Field.FieldLabel for="responsive-dialog-username">Username</Field.FieldLabel>
								<Input id="responsive-dialog-username" value="@peduarte" />
							</Field.Field>
						</Field.FieldGroup>
						<ResponsiveDialog.Footer>
							<Button type="submit">Save changes</Button>
						</ResponsiveDialog.Footer>
					</ResponsiveDialog.Content>
				</ResponsiveDialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Confirmation Dialog">
		{#snippet blurb()}
			Use the responsive dialog to confirm destructive actions like deleting items.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<ResponsiveDialog.Root>
					<ResponsiveDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="destructive" {...props}>
								<TrashIcon data-icon="inline-start" />
								Delete Project
							</Button>
						{/snippet}
					</ResponsiveDialog.Trigger>
					<ResponsiveDialog.Content>
						<ResponsiveDialog.Header>
							<ResponsiveDialog.Title>Delete project?</ResponsiveDialog.Title>
							<ResponsiveDialog.Description>
								This will permanently delete “My Awesome Project” and all of its data. This action
								cannot be undone.
							</ResponsiveDialog.Description>
						</ResponsiveDialog.Header>
						<ResponsiveDialog.Footer>
							<ResponsiveDialog.Close>
								{#snippet child({ props })}
									<Button variant="outline" {...props}>Cancel</Button>
								{/snippet}
							</ResponsiveDialog.Close>
							<Button variant="destructive" onclick={onDelete} disabled={isDeleting}>
								{#if isDeleting}
									<Spinner data-icon="inline-start" />
								{/if}
								Delete
							</Button>
						</ResponsiveDialog.Footer>
					</ResponsiveDialog.Content>
				</ResponsiveDialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Variant Styling">
		{#snippet blurb()}
			Every part exposes a data-variant attribute, so one class list can style the dialog and the
			drawer differently.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<ResponsiveDialog.Root>
					<ResponsiveDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Open styled</Button>
						{/snippet}
					</ResponsiveDialog.Trigger>
					<ResponsiveDialog.Content
						class="data-[variant=dialog]:max-w-md data-[variant=drawer]:pb-8"
					>
						<ResponsiveDialog.Header>
							<ResponsiveDialog.Title>Variant styling</ResponsiveDialog.Title>
							<ResponsiveDialog.Description>
								This content is capped at max-w-md as a dialog and gets extra bottom padding as a
								drawer.
							</ResponsiveDialog.Description>
						</ResponsiveDialog.Header>
						<ResponsiveDialog.Footer
							class="data-[variant=dialog]:flex-row data-[variant=drawer]:flex-col"
						>
							<ResponsiveDialog.Close>
								{#snippet child({ props })}
									<Button variant="outline" {...props}>Cancel</Button>
								{/snippet}
							</ResponsiveDialog.Close>
							<Button>Continue</Button>
						</ResponsiveDialog.Footer>
					</ResponsiveDialog.Content>
				</ResponsiveDialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Controlled">
		{#snippet blurb()}
			bind:open keeps the open state in the page. Crossing the breakpoint while open swaps the
			primitive without firing onOpenChange.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col items-center gap-4">
					<div class="flex items-center gap-2">
						<Button variant="outline" onclick={() => (controlledOpen = true)}
							>Open from outside</Button
						>
						<span class="text-sm text-muted-foreground">
							open: {controlledOpen} · transitions: {transitions}
						</span>
					</div>
					<ResponsiveDialog.Root bind:open={controlledOpen} onOpenChange={() => (transitions += 1)}>
						<ResponsiveDialog.Trigger>
							{#snippet child({ props })}
								<Button {...props}>Open from trigger</Button>
							{/snippet}
						</ResponsiveDialog.Trigger>
						<ResponsiveDialog.Content>
							<ResponsiveDialog.Header>
								<ResponsiveDialog.Title>Controlled</ResponsiveDialog.Title>
								<ResponsiveDialog.Description>
									Resize the window across 768px while this is open — the counter does not move.
								</ResponsiveDialog.Description>
							</ResponsiveDialog.Header>
							<ResponsiveDialog.Footer>
								<ResponsiveDialog.Close>
									{#snippet child({ props })}
										<Button variant="outline" {...props}>Close</Button>
									{/snippet}
								</ResponsiveDialog.Close>
							</ResponsiveDialog.Footer>
						</ResponsiveDialog.Content>
					</ResponsiveDialog.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">ResponsiveDialog.Root</h3>
			<p class="text-sm text-muted-foreground">
				Owns the open state and the mode switch. Any prop it does not handle is spread onto
				whichever root is active, so drawer-only knobs such as <code>direction</code> apply in drawer
				mode only.
			</p>
			{@render propsTable(rootProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">ResponsiveDialog.Content</h3>
			<p class="text-sm text-muted-foreground">
				The dialog body, portalled with its own overlay. Adds <code>px-4 pb-4</code> in drawer mode only,
				and re-establishes focus inside itself when the breakpoint is crossed while open.
			</p>
			{@render propsTable(contentProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">ResponsiveDialog.Footer</h3>
			<p class="text-sm text-muted-foreground">The footer section, usually holding the actions.</p>
			{@render propsTable(footerProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">
				Trigger, Close, Portal, Overlay, Header, Title, Description
			</h3>
			<p class="text-sm text-muted-foreground">
				Pass-throughs to their <code>Dialog</code> / <code>Drawer</code> counterparts. Each carries
				<code>data-slot="responsive-dialog-&lt;part&gt;"</code> and
				<code>data-variant="dialog" | "drawer"</code>, merges the caller’s <code>class</code> last,
				and accepts the <code>child</code> snippet where the underlying part does.
				<code>Portal</code> renders no element of its own, so it carries neither attribute.
			</p>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">IsMobile</h3>
			<p class="text-sm text-muted-foreground">
				The mode detection is a standalone rune class at
				<code>$lib/hooks/is-mobile.svelte.js</code>: <code>new IsMobile(getBreakpoint?)</code>
				(constructed during component initialisation) exposes a <code>current</code> that reads
				<code>(max-width: breakpoint - 1px)</code>. It is SSR-safe (seeded <code>false</code>) and
				reusable without importing a dialog.
			</p>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Keyboard Interactions</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Key</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each keyboard as row (row.keys)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.keys}</Table.Cell>
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
