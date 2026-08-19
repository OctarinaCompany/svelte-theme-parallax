<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";
	import { toast } from "svelte-sonner";

	import * as Card from "$lib/components/ui/card/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Kbd, KbdGroup } from "$lib/components/ui/kbd/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Dialog component page, ported from the shadcn-svelte documentation
	 * (https://shadcn-svelte.com/docs/components/dialog) — five compositions: a basic dialog,
	 * a form, scrollable content, a custom close affordance, and a visually hidden title.
	 *
	 * Unlike most gallery pages there is nothing to derive here: the modal surface — popover
	 * ground, `ring-foreground/10` frame, centred fixed placement, the ghost close button —
	 * ships on `Dialog.Content` itself, so every demo composes the parts as they come.
	 *
	 * The adaptive sibling that swaps to a bottom drawer under 768px is a separate component
	 * with a page of its own (`#/components/responsive-dialog`); this page documents the
	 * always-modal primitive it builds on.
	 */

	// --- Form ----------------------------------------------------------------
	// Controlled rather than left to the trigger: submitting has to close the dialog itself,
	// and `bind:open` is the only handle the page has on that.
	let inviteOpen = $state(false);
	let inviteEmail = $state("");
	let inviteNote = $state("");

	function sendInvite(event: SubmitEvent) {
		event.preventDefault();
		inviteOpen = false;
		toast.success(`Invitation sent to ${inviteEmail}`);
		// Reset AFTER the toast reads the value, so reopening starts a fresh invite instead
		// of resurfacing the one just sent.
		inviteEmail = "";
		inviteNote = "";
	}

	// --- Scrollable content --------------------------------------------------
	// Long enough to overflow the 80vh cap on any laptop screen; short enough to read as a
	// document rather than filler.
	const terms = [
		{
			heading: "1. Acceptance of terms",
			body: "By creating an account you agree to these terms and to our privacy policy. If you are accepting on behalf of an organization, you confirm you have the authority to bind it.",
		},
		{
			heading: "2. Your account",
			body: "You are responsible for activity that happens under your credentials. Keep your password safe, enable two-factor authentication, and tell us immediately if you suspect unauthorized access.",
		},
		{
			heading: "3. Acceptable use",
			body: "Do not use the service to store or distribute unlawful content, probe or disrupt our infrastructure, or resell access without a written agreement. We may suspend accounts that put other customers at risk.",
		},
		{
			heading: "4. Billing",
			body: "Paid plans are billed in advance, monthly or annually, and renew automatically until cancelled. Downgrades take effect at the end of the current billing period; unused time is not refunded.",
		},
		{
			heading: "5. Data and privacy",
			body: "Your data stays yours. We process it only to operate the service, as described in the privacy policy, and we delete it within 30 days of account closure except where the law requires longer retention.",
		},
		{
			heading: "6. Termination",
			body: "You may close your account at any time from the settings page. We may terminate or suspend access for material breach of these terms, with notice where practicable.",
		},
		{
			heading: "7. Changes to these terms",
			body: "We may revise these terms from time to time. If a change is material we will notify you at least 14 days before it takes effect, and continued use after that date counts as acceptance.",
		},
	];

	// --- Custom close button -------------------------------------------------
	const shareLink = "https://app.example.com/reports/q3-revenue";

	let copied = $state(false);
	let copiedTimer: ReturnType<typeof setTimeout> | undefined;

	function copyShareLink() {
		// Optional chaining because the Clipboard API only exists in secure contexts; the
		// confirmation still flips so the demo behaves the same over plain http.
		navigator.clipboard?.writeText(shareLink);
		copied = true;
		// Restart the timer on every click — otherwise a rapid second copy would have its
		// confirmation cut short by the first click's timeout.
		clearTimeout(copiedTimer);
		copiedTimer = setTimeout(() => (copied = false), 1500);
	}

	// --- Screen-reader title -------------------------------------------------
	const shortcuts = [
		{ action: "Open the command menu", keys: ["Ctrl", "K"] },
		{ action: "Toggle the sidebar", keys: ["Ctrl", "B"] },
		{ action: "Create a new invoice", keys: ["C"] },
		{ action: "Focus the search field", keys: ["/"] },
		{ action: "Close any open dialog", keys: ["Esc"] },
	];

	// --- Full-screen fluid dialog ----------------------
	// Upstream repeats one lorem paragraph twenty times; the copy is kept as-is because the
	// section is about the sticky chrome, not the prose.
	const fluidParagraph =
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

	// --- Cookie consent --------------------------------
	const cookieCategories = [
		{
			id: undefined,
			label: "Essential Cookies",
			description: "Required for the website to function properly. Cannot be disabled.",
			checked: true,
			disabled: true,
		},
		{
			id: "dialog-cookie-analytics",
			label: "Analytics Cookies",
			description: "Help us understand how visitors interact with our website.",
			checked: false,
			disabled: false,
		},
		{
			id: "dialog-cookie-marketing",
			label: "Marketing Cookies",
			description: "Used to deliver personalized advertisements and track ad campaign performance.",
			checked: false,
			disabled: false,
		},
	];
</script>

<DocPage title="Dialog">
	{#snippet subtitle()}
		A window overlaid on either the primary window or another dialog window, rendering the content
		underneath inert. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/dialog"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<Dialog.Root>
				<!--
					The `child` snippet renders the trigger AS the `Button` — one element wearing
					both the button chrome and the trigger's aria wiring, rather than a button
					nested inside a second focusable element.
				-->
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button variant="outline" {...props}>Open Dialog</Button>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>Scheduled maintenance</Dialog.Title>
						<Dialog.Description>
							The dashboard will be read-only on August 15 from 02:00 to 04:00 UTC while the primary
							database moves regions. Exports already running will finish first.
						</Dialog.Description>
					</Dialog.Header>
					<!--
						`showCloseButton` on the footer renders its built-in outline Close, so an
						acknowledge-only dialog needs no wired-up button of its own.
					-->
					<Dialog.Footer showCloseButton />
				</Dialog.Content>
			</Dialog.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="Form">
		{#snippet blurb()}
			A dialog is the right container for a focused task that needs input; on submit the page closes
			it through <code class="text-[87.5%] text-primary">bind:open</code>. For a form that should
			become a bottom drawer on mobile, use the
			<a class="text-primary underline underline-offset-3" href="#/components/responsive-dialog"
				>Responsive dialog</a
			> instead.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Dialog.Root bind:open={inviteOpen}>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Invite teammate</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>Invite a teammate</Dialog.Title>
							<Dialog.Description>
								They will get an email with a link to join your workspace. Invitations expire after
								seven days.
							</Dialog.Description>
						</Dialog.Header>
						<!--
							`Dialog.Content` is a grid with `gap-6`, but its grid cannot reach through
							the `<form>` element — so the form restates the same layout to keep the
							fields and the footer on the content's own rhythm.
						-->
						<form class="grid gap-6" onsubmit={sendInvite}>
							<Field.FieldGroup>
								<Field.Field>
									<Field.FieldLabel for="dialog-invite-email">Email</Field.FieldLabel>
									<Input
										id="dialog-invite-email"
										type="email"
										placeholder="ana.silva@example.com"
										required
										bind:value={inviteEmail}
									/>
								</Field.Field>
								<Field.Field>
									<Field.FieldLabel for="dialog-invite-note">Note</Field.FieldLabel>
									<Textarea
										id="dialog-invite-note"
										placeholder="Joining the billing squad for Q3."
										bind:value={inviteNote}
									/>
									<Field.FieldDescription>
										Optional — shown at the top of the invitation email.
									</Field.FieldDescription>
								</Field.Field>
							</Field.FieldGroup>
							<Dialog.Footer>
								<!--
									Cancel closes without submitting: `Dialog.Close` defaults its
									`type` to "button", so it never triggers the form.
								-->
								<Dialog.Close>
									{#snippet child({ props })}
										<Button variant="outline" {...props}>Cancel</Button>
									{/snippet}
								</Dialog.Close>
								<Button type="submit">Send invite</Button>
							</Dialog.Footer>
						</form>
					</Dialog.Content>
				</Dialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Scrollable content">
		{#snippet blurb()}
			Cap the content's height and let the body scroll while the header and footer stay pinned.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Dialog.Root>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Terms of Service</Button>
						{/snippet}
					</Dialog.Trigger>
					<!--
						The explicit row template is what makes the middle row scroll: implicit grid
						rows are `auto` with `min-height: auto`, so without `minmax(0, 1fr)` the body
						row refuses to shrink below its content and the cap simply overflows.
						`80vh` rather than a fixed pixel height so short laptop screens still get a
						margin around the dialog.
					-->
					<Dialog.Content class="max-h-[80vh] grid-rows-[auto_minmax(0,1fr)_auto]">
						<Dialog.Header>
							<Dialog.Title>Terms of Service</Dialog.Title>
							<Dialog.Description>Last updated August 1, 2026.</Dialog.Description>
						</Dialog.Header>
						<div class="flex flex-col gap-4 overflow-y-auto">
							{#each terms as clause (clause.heading)}
								<div class="flex flex-col gap-1">
									<h3 class="font-medium">{clause.heading}</h3>
									<p class="text-muted-foreground">{clause.body}</p>
								</div>
							{/each}
						</div>
						<Dialog.Footer>
							<Dialog.Close>
								{#snippet child({ props })}
									<Button {...props}>I agree</Button>
								{/snippet}
							</Dialog.Close>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom close button">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">showCloseButton=&#123;false&#125;</code> removes the corner
			X, so the footer button below is the dialog's only dismiss affordance — hide the X only when something
			else clearly takes over its job.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Dialog.Root>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Share report</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content showCloseButton={false}>
						<Dialog.Header>
							<Dialog.Title>Share link</Dialog.Title>
							<Dialog.Description>
								Anyone with this link can view the Q3 revenue report.
							</Dialog.Description>
						</Dialog.Header>
						<Field.Field>
							<!--
								The description above already says what the field holds, so the label
								is for screen readers only.
							-->
							<Field.FieldLabel class="sr-only" for="dialog-share-link">Link</Field.FieldLabel>
							<InputGroup.Root>
								<InputGroup.Input id="dialog-share-link" readonly value={shareLink} />
								<InputGroup.Addon align="inline-end">
									<InputGroup.Button size="icon-xs" aria-label="Copy link" onclick={copyShareLink}>
										{#if copied}
											<CheckIcon />
										{:else}
											<CopyIcon />
										{/if}
									</InputGroup.Button>
								</InputGroup.Addon>
							</InputGroup.Root>
						</Field.Field>
						<Dialog.Footer>
							<Dialog.Close>
								{#snippet child({ props })}
									<Button variant="outline" {...props}>Close</Button>
								{/snippet}
							</Dialog.Close>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Screen-reader title">
		{#snippet blurb()}
			Every dialog needs a <code class="text-[87.5%] text-primary">Dialog.Title</code> — it is what
			assistive technology announces on open. When the design has no room for a visible heading,
			hide it with <code class="text-[87.5%] text-primary">sr-only</code> instead of leaving it out.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Dialog.Root>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Keyboard shortcuts</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content>
						<!--
							No `Dialog.Header`: with both lines hidden it would only leave an empty
							flex box contributing a blank grid row above the list.
						-->
						<Dialog.Title class="sr-only">Keyboard shortcuts</Dialog.Title>
						<Dialog.Description class="sr-only">
							Shortcuts available across the dashboard.
						</Dialog.Description>
						<div class="flex flex-col gap-3">
							{#each shortcuts as shortcut (shortcut.action)}
								<div class="flex items-center justify-between gap-4">
									<span>{shortcut.action}</span>
									<KbdGroup>
										{#each shortcut.keys as key (key)}
											<Kbd>{key}</Kbd>
										{/each}
									</KbdGroup>
								</div>
							{/each}
						</div>
					</Dialog.Content>
				</Dialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- The sections below are the dialog demo set. -->

	<DocSection title="Dialog with custom close button">
		{#snippet blurb()}
			Restyle the built-in corner X instead of replacing it: the content renders it with
			<code class="text-[87.5%] text-primary">data-slot="dialog-close"</code>, so selector classes
			on <code class="text-[87.5%] text-primary">Dialog.Content</code> can float it outside the corner
			without touching the component.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Dialog.Root>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Custom Close Button</Button>
						{/snippet}
					</Dialog.Trigger>
					<!--
						From demo 5. The `[&>[data-slot=dialog-close]]` variants outrank the
						Button's own single-class utilities (`.a > [data-slot]` beats `.top-4`), which
						is what lets a page restyle a registry component it must not edit.
					-->
					<Dialog.Content
						class="[&>[data-slot=dialog-close]]:-end-6 [&>[data-slot=dialog-close]]:-top-6 [&>[data-slot=dialog-close]]:size-8 [&>[data-slot=dialog-close]]:rounded-full [&>[data-slot=dialog-close]]:border [&>[data-slot=dialog-close]]:bg-background [&>[data-slot=dialog-close]]:shadow-sm"
					>
						<Dialog.Header>
							<Dialog.Title>Edit profile</Dialog.Title>
							<Dialog.Description>
								Make changes to your profile here. Click save when you're done. Your profile will be
								updated immediately.
							</Dialog.Description>
						</Dialog.Header>
						<Field.FieldGroup>
							<Field.Field>
								<Field.FieldLabel for="dialog-custom-close-name">Name</Field.FieldLabel>
								<Input id="dialog-custom-close-name" name="name" value="Albert Einstein" />
							</Field.Field>
							<Field.Field>
								<Field.FieldLabel for="dialog-custom-close-username">Username</Field.FieldLabel>
								<Input id="dialog-custom-close-username" name="username" value="@albert" />
							</Field.Field>
						</Field.FieldGroup>
						<Dialog.Footer>
							<Dialog.Close>
								{#snippet child({ props })}
									<Button variant="outline" {...props}>Cancel</Button>
								{/snippet}
							</Dialog.Close>
							<Button type="submit">Save changes</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Full-screen fluid dialog with sticky header and footer">
		{#snippet blurb()}
			Near full-screen at any viewport: the content stretches to the window minus a fixed margin,
			the body scrolls, and the bordered header and footer stay put.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Dialog.Root>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Full Screen Fluid</Button>
						{/snippet}
					</Dialog.Trigger>
					<!--
						From demo 6. `flex` replaces the content's grid and `gap-0 p-0` hands
						the spacing to the three regions, so the header/footer borders run edge to
						edge. Upstream also injects a raw-rgba thin-scrollbar style; that would be
						this repo's only raw colour, so the body keeps the default scrollbar.
					-->
					<Dialog.Content
						class="flex max-h-[calc(100vh-3rem)] w-full max-w-[calc(100vw-3rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[calc(100vw-3rem)]"
					>
						<Dialog.Header class="sticky top-0 z-10 border-b bg-background px-6 py-4">
							<Dialog.Title>Full Screen Dialog</Dialog.Title>
							<Dialog.Description>
								A fluid full-screen dialog with sticky header and footer.
							</Dialog.Description>
						</Dialog.Header>
						<div class="me-0.5 flex-1 overflow-auto px-6 py-4">
							<div class="flex flex-col gap-4 text-sm">
								{#each Array.from({ length: 20 }), index (index)}
									<p class="leading-normal text-muted-foreground">{fluidParagraph}</p>
								{/each}
							</div>
						</div>
						<Dialog.Footer class="border-t bg-background px-6 py-4">
							<Dialog.Close>
								{#snippet child({ props })}
									<Button variant="outline" {...props}>Close</Button>
								{/snippet}
							</Dialog.Close>
							<Button>Save changes</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Confirmation dialog with destructive action">
		{#snippet blurb()}
			The warning icon sits beside the header text rather than above it, and the destructive button
			takes the confirming position — Cancel stays the safe outline default.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Dialog.Root>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Delete Item</Button>
						{/snippet}
					</Dialog.Trigger>
					<!--
						From demo 7, whose icon placeholder resolves to lucide's
						AlertTriangle — `triangle-alert` under this package's naming.
					-->
					<Dialog.Content>
						<Dialog.Header>
							<div class="flex items-start gap-3">
								<div
									class="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
								>
									<TriangleAlertIcon class="size-5" />
								</div>
								<div class="flex flex-col gap-1">
									<Dialog.Title>Are you sure?</Dialog.Title>
									<Dialog.Description>
										This action cannot be undone. This will permanently delete the item and remove
										all associated data from our servers.
									</Dialog.Description>
								</div>
							</div>
						</Dialog.Header>
						<Dialog.Footer>
							<Dialog.Close>
								{#snippet child({ props })}
									<Button variant="outline" {...props}>Cancel</Button>
								{/snippet}
							</Dialog.Close>
							<Button variant="destructive">Delete</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Cookie consent dialog">
		{#snippet blurb()}
			A settings-style dialog: each category pairs a label-and-description block with a switch, and
			the always-on essential row ships checked and disabled.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Dialog.Root>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Cookie Preferences</Button>
						{/snippet}
					</Dialog.Trigger>
					<!-- From demo 8; the three hand-written rows collapse into one loop. -->
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>Cookie Preferences</Dialog.Title>
							<Dialog.Description>
								You can enable or disable different categories of cookies.
							</Dialog.Description>
						</Dialog.Header>
						<div class="flex flex-col gap-4">
							{#each cookieCategories as category (category.label)}
								<div class="flex items-center justify-between gap-4">
									<div class="flex flex-col gap-0.75">
										<Label for={category.id} class="text-sm font-medium">{category.label}</Label>
										<p class="text-xs text-muted-foreground">{category.description}</p>
									</div>
									<Switch
										id={category.id}
										checked={category.checked}
										disabled={category.disabled}
									/>
								</div>
							{/each}
						</div>
						<Dialog.Footer>
							<Button variant="outline">Save Preferences</Button>
							<Button>Accept All</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Dialog with full width button">
		{#snippet blurb()}
			A forced-choice pattern: with <code class="text-[87.5%] text-primary"
				>showCloseButton=&#123;false&#125;</code
			> and a single full-width action, signing in again is the only way forward.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Dialog.Root>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Session Expired</Button>
						{/snippet}
					</Dialog.Trigger>
					<!-- From demo 10. Escape and overlay clicks still dismiss it — the demo
						removes the affordance, not the mechanism. -->
					<Dialog.Content showCloseButton={false}>
						<Dialog.Header>
							<Dialog.Title>Session Expired</Dialog.Title>
							<Dialog.Description>
								Your session has timed out due to inactivity. Please sign in again to continue where
								you left off.
							</Dialog.Description>
						</Dialog.Header>
						<Dialog.Footer>
							<Button class="w-full">Sign In Again</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
