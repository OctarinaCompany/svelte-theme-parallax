<script lang="ts">
	import BellIcon from "@lucide/svelte/icons/bell";
	import BluetoothIcon from "@lucide/svelte/icons/bluetooth";
	import CardSimIcon from "@lucide/svelte/icons/card-sim";
	import CheckIcon from "@lucide/svelte/icons/check";
	import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
	import FingerprintPatternIcon from "@lucide/svelte/icons/fingerprint-pattern";
	import KeySquareIcon from "@lucide/svelte/icons/key-square";
	import LockIcon from "@lucide/svelte/icons/lock";
	import ShieldAlertIcon from "@lucide/svelte/icons/shield-alert";
	import ShieldQuestionMarkIcon from "@lucide/svelte/icons/shield-question-mark";
	import Trash2Icon from "@lucide/svelte/icons/trash-2";

	import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Frame from "$lib/components/ui/frame/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Alert dialog component page — its fourteen examples in the order
	 * that page gives them.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. The classic modal is one box with a header, a body and a footer;
	 * the "answer the question before you continue" surface — no close button, a Cancel that
	 * yields to an Action — is Radix's, and the component here is the bits-ui AlertDialog wearing
	 * the house styling (`$lib/components/ui/alert-dialog/`, which records its own decisions).
	 * The always-dismissible sibling lives at `/components/dialog`.
	 *
	 * THREE STANDING HOUSE RULES apply throughout:
	 *
	 * 1. NO RAW PALETTE COLOURS. Upstream paints its icon wells in `emerald`, `amber`, `violet`
	 *    and `green`. Each becomes the `{state}-subtle` token that carries the same meaning here —
	 *    success, warning, primary, success — and the `success-light` / `warning-light` /
	 *    `destructive-light` badges become the `-subtle` family.
	 *
	 * 2. THE FOOTER HAS NO BUILT-IN BREAKOUT. Four upstream demos carry `-mx-8 -mb-8` /
	 *    `-mx-6 -mb-6` classes whose entire job is to cancel the padding the upstream footer adds
	 *    for its own bar. `AlertDialog.Footer` here is a plain button row with no padding, no bar
	 *    and no border, so those negative margins would pull the buttons out of the dialog. They
	 *    are dropped and the separation, where a demo wants one, is stated directly.
	 *
	 * 3. `variant="error"` DOES NOT EXIST. Nothing here says error or danger; the negative status
	 *    is `destructive` everywhere.
	 */

	/** Rows of the security audit dialog. */
	const securityAuditItems = [
		{
			icon: LockIcon,
			title: "Password Policy",
			description: "Verify strength and rotation",
			status: "Pending",
		},
		{
			icon: FingerprintPatternIcon,
			title: "Biometric Status",
			description: "Check hardware encryption",
			status: "Done",
		},
		{
			icon: KeySquareIcon,
			title: "Active Sessions",
			description: "Review connected devices",
			status: "Pending",
		},
	];

	/** Rows of the e-ticket receipt. */
	const eTicketDetails = [
		{ label: "Order Number", value: "GBD99763JS" },
		{ label: "Order Date", value: "7 September 2024" },
		{ label: "Event Name", value: "Groove Beats Day Fest" },
		{ label: "Event Date", value: "20/09/2024" },
		{ label: "Register Date", value: "20/09/2024 | 09 PM" },
	];
</script>

<DocPage title="Alert dialog">
	{#snippet subtitle()}
		A modal that interrupts the user with an important message and expects a response — no close
		button, and Escape or an overlay click resolves to Cancel. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/alert-dialog"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<DocSection title="Basic alert dialog with title, description, and action buttons">
		{#snippet blurb()}
			The default composition from <code class="text-[87.5%] text-primary">demo 1</code>, centred on
			every breakpoint.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<AlertDialog.Root>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Open Alert Dialog</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<!-- The header and footer of a default-size content left-align from `sm:` up; this
						demo opts back into the centred layout the small size gets for free. -->
					<AlertDialog.Content class="sm:max-w-sm">
						<AlertDialog.Header class="sm:place-items-center sm:text-center">
							<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
							<AlertDialog.Description>
								This action cannot be undone. This will permanently delete your account and remove
								your data from our servers.
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer class="sm:justify-center">
							<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
							<AlertDialog.Action>Continue</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Small size alert dialog for quick confirmations">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">size=&quot;sm&quot;</code> narrows the box and splits the
			footer into two equal columns — the compact OS-prompt look.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<AlertDialog.Root>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Small Alert</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<!-- From demo 2. -->
					<AlertDialog.Content size="sm">
						<AlertDialog.Header>
							<AlertDialog.Title>Allow accessory to connect?</AlertDialog.Title>
							<AlertDialog.Description>
								Do you want to allow the USB accessory to connect to this device?
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Don't allow</AlertDialog.Cancel>
							<AlertDialog.Action>Allow</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Alert dialog with icon">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">AlertDialog.Media</code> adds an icon well; the header
			grid detects it and moves the title beside it once a default-size box reaches
			<code class="text-[87.5%] text-primary">sm:</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<AlertDialog.Root>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Default (Media)</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<!-- From demo 3. The icon is passed bare: Media sizes an unsized child
						svg itself, so nothing here states a size. -->
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Media>
								<BluetoothIcon />
							</AlertDialog.Media>
							<AlertDialog.Title>Pair with this device?</AlertDialog.Title>
							<AlertDialog.Description>
								This will allow the device to connect and share data with your current session.
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
							<AlertDialog.Action>Connect</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Small size alert dialog with media (icon)">
		{#snippet blurb()}
			The same well in a small box, where the header stays stacked and centred at every width.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<AlertDialog.Root>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Small (Media)</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<!-- From demo 4. -->
					<AlertDialog.Content size="sm">
						<AlertDialog.Header>
							<AlertDialog.Media>
								<BluetoothIcon />
							</AlertDialog.Media>
							<AlertDialog.Title>Allow accessory to connect?</AlertDialog.Title>
							<AlertDialog.Description>
								Do you want to allow the USB accessory to connect to this device?
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Don't allow</AlertDialog.Cancel>
							<AlertDialog.Action>Allow</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Destructive alert dialog for irreversible actions like deletion">
		{#snippet blurb()}
			The destructive answer: a tinted well, a ghost Cancel, and the weight moved onto the
			<code class="text-[87.5%] text-primary">destructive</code> action.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<AlertDialog.Root>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="destructive" {...props}>Delete Chat</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<!-- From demo 5. The inline `<a>` needs no classes: Description styles
						its own links. -->
					<AlertDialog.Content size="sm">
						<AlertDialog.Header>
							<AlertDialog.Media class="bg-destructive-subtle text-destructive-subtle-foreground">
								<Trash2Icon />
							</AlertDialog.Media>
							<AlertDialog.Title>Delete chat?</AlertDialog.Title>
							<AlertDialog.Description>
								This will permanently delete this chat conversation. View
								<a href={href("/components/alert-dialog")}>Settings</a> to delete any memories saved during
								this chat.
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel variant="ghost">Cancel</AlertDialog.Cancel>
							<AlertDialog.Action variant="destructive">Delete</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Alert dialog nested within a standard Dialog component">
		{#snippet blurb()}
			A confirmation raised from inside an open dialog: the two modals stack, and answering the
			inner one leaves the outer one exactly as it was.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Dialog.Root>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Open Dialog</Button>
						{/snippet}
					</Dialog.Trigger>
					<!-- From demo 6. -->
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>Alert Dialog Example</Dialog.Title>
							<Dialog.Description>
								Click the button below to open an alert dialog.
							</Dialog.Description>
						</Dialog.Header>
						<Dialog.Footer>
							<AlertDialog.Root>
								<AlertDialog.Trigger>
									{#snippet child({ props })}
										<Button {...props}>Open Alert Dialog</Button>
									{/snippet}
								</AlertDialog.Trigger>
								<AlertDialog.Content size="sm">
									<AlertDialog.Header>
										<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
										<AlertDialog.Description>
											This action cannot be undone. This will permanently delete your account and
											remove your data from our servers.
										</AlertDialog.Description>
									</AlertDialog.Header>
									<AlertDialog.Footer>
										<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
										<AlertDialog.Action>Continue</AlertDialog.Action>
									</AlertDialog.Footer>
								</AlertDialog.Content>
							</AlertDialog.Root>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Task success confirmation">
		{#snippet blurb()}
			A notification-shaped body — icon beside the copy rather than above it — with an opt-out
			checkbox sharing the footer row.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<AlertDialog.Root>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Task Status</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<!-- From demo 7. The body is a plain row rather than `AlertDialog.Header`
						— the header grid would centre the icon above the text. -->
					<AlertDialog.Content>
						<div class="flex items-center gap-3 py-1">
							<div
								class="flex size-10 items-center justify-center rounded-full bg-success-subtle text-success-subtle-foreground"
							>
								<CheckIcon class="size-5" />
							</div>
							<div class="flex flex-col justify-center gap-1">
								<AlertDialog.Title class="text-sm font-semibold">Task successful</AlertDialog.Title>
								<AlertDialog.Description class="text-sm">
									Your task has been completed successfully.
								</AlertDialog.Description>
							</div>
						</div>
						<AlertDialog.Footer class="items-center gap-4 sm:justify-between">
							<div class="flex items-center gap-2">
								<Checkbox id="alert-dialog-task-show-again" />
								<Label for="alert-dialog-task-show-again" class="font-normal text-muted-foreground">
									Don't show again
								</Label>
							</div>
							<div class="flex items-center gap-2">
								<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
								<AlertDialog.Action>Confirm</AlertDialog.Action>
							</div>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Account deactivation confirmation">
		{#snippet blurb()}
			The same notification body in its destructive form, where the action spells out what it does
			instead of saying OK.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<AlertDialog.Root>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="destructive" {...props}>Deactivate Account</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<!-- From demo 8. -->
					<AlertDialog.Content>
						<div class="flex items-start gap-3 py-1">
							<div
								class="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive-subtle text-destructive-subtle-foreground"
							>
								<CircleAlertIcon class="size-5" />
							</div>
							<div class="flex flex-col justify-center gap-1">
								<AlertDialog.Title class="text-sm font-semibold">
									Deactivate your account?
								</AlertDialog.Title>
								<AlertDialog.Description class="text-sm">
									This will disable your account and remove your profile from all active searches.
								</AlertDialog.Description>
							</div>
						</div>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Keep My Account</AlertDialog.Cancel>
							<AlertDialog.Action variant="destructive">Deactivate Anyway</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Warning for unsaved changes when navigating away">
		{#snippet blurb()}
			The whole dialog is a <code class="text-[87.5%] text-primary">Frame</code> panel, so the warning
			sits on the inset card surface instead of directly on the popover ground.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<AlertDialog.Root>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Discard Changes</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<!-- From demo 9. The content drops its own padding and ring so the frame
						is the only visible edge; `p-px` is the hairline gutter the panel is inset by. -->
					<AlertDialog.Content class="overflow-hidden p-0! ring-0">
						<Frame.Root class="p-px">
							<Frame.Panel>
								<div class="flex items-start gap-3">
									<div
										class="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning-subtle text-warning-subtle-foreground"
									>
										<CardSimIcon class="size-5" />
									</div>
									<div class="flex flex-col justify-center gap-1">
										<AlertDialog.Title class="text-sm font-semibold">
											Unsaved changes
										</AlertDialog.Title>
										<AlertDialog.Description class="text-sm">
											You have unsaved changes in this form. If you leave now, your progress will be
											lost.
										</AlertDialog.Description>
									</div>
								</div>
								<AlertDialog.Footer class="mt-6 items-center gap-4 sm:justify-between">
									<div class="flex items-center gap-2">
										<Checkbox id="alert-dialog-unsaved-dont-ask" />
										<Label
											for="alert-dialog-unsaved-dont-ask"
											class="font-normal text-muted-foreground"
										>
											Don't ask again
										</Label>
									</div>
									<div class="flex items-center gap-2">
										<AlertDialog.Cancel>Stay</AlertDialog.Cancel>
										<AlertDialog.Action>Discard Changes</AlertDialog.Action>
									</div>
								</AlertDialog.Footer>
							</Frame.Panel>
						</Frame.Root>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Confirmation for successful e-ticket registration">
		{#snippet blurb()}
			A receipt rather than a question: one full-width action, and the detail rows carried on a
			muted panel.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<AlertDialog.Root>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>View Confirmation</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<!-- From demo 10. Upstream's footer carries `-mx-8 -mb-8 px-8` to cancel
						the padding its own footer bar adds; this footer has neither bar nor padding, so
						the breakout is dropped and the button simply fills the row. -->
					<AlertDialog.Content class="gap-8 p-8 sm:max-w-sm">
						<div class="mx-auto flex flex-col items-center justify-center gap-2">
							<AlertDialog.Media
								class="size-16 rounded-full bg-info-subtle text-info-subtle-foreground"
							>
								<CheckIcon class="size-5" />
							</AlertDialog.Media>
							<AlertDialog.Title class="text-center">
								Success! Your e-ticket is registered.
							</AlertDialog.Title>
							<AlertDialog.Description class="max-w-xs text-center">
								Please check your email for confirmation and further instructions about the event.
							</AlertDialog.Description>
						</div>

						<div class="grid gap-4 rounded-xl bg-muted/60 p-4">
							{#each eTicketDetails as detail (detail.label)}
								<div class="flex items-center justify-between text-sm">
									<span class="font-medium text-muted-foreground">{detail.label}</span>
									<span class="font-semibold text-foreground">{detail.value}</span>
								</div>
							{/each}
						</div>

						<AlertDialog.Footer>
							<AlertDialog.Cancel size="lg" variant="default" class="w-full sm:w-full">
								Back to Home
							</AlertDialog.Cancel>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="System update notification requiring application restart">
		{#snippet blurb()}
			A two-band layout: the headline on the popover ground, the explanation and the buttons on a
			muted foot that runs to the bottom corners.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<AlertDialog.Root>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>System Update</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<!-- From demo 11. Upstream's `success-light` badge is the `-subtle`
						family here, and the footer's `-mx-6 -mb-6 p-6` breakout is dropped: it existed
						to cancel the upstream footer's own bar padding, which this footer does not add. -->
					<AlertDialog.Content class="gap-0 p-0 sm:max-w-sm">
						<div class="mx-auto flex flex-col items-center justify-center gap-2 p-8">
							<AlertDialog.Media
								class="size-12 rounded-full bg-info-subtle text-info-subtle-foreground"
							>
								<ShieldAlertIcon class="size-6" />
							</AlertDialog.Media>
							<AlertDialog.Title class="text-center">System Update Available!</AlertDialog.Title>
							<Badge variant="success-subtle">Release v28.1.0 (2026-01-12)</Badge>
						</div>

						<div
							class="flex flex-col items-center justify-center gap-5 rounded-b-xl bg-muted/60 p-6"
						>
							<AlertDialog.Description class="text-center">
								A new version of the application is ready. Restarting now will apply the latest
								security patches and features.
							</AlertDialog.Description>
							<AlertDialog.Footer class="gap-4 self-stretch">
								<AlertDialog.Cancel>Remind Me Later</AlertDialog.Cancel>
								<AlertDialog.Action>Update Now</AlertDialog.Action>
							</AlertDialog.Footer>
						</div>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Billing warning for expired subscriptions or failed payments">
		{#snippet blurb()}
			The same two-band layout carrying a deadline: the badge states how long is left, and the
			action is the fix rather than an acknowledgement.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<AlertDialog.Root>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Subscription Expiring</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<!-- From demo 12. -->
					<AlertDialog.Content class="gap-0 p-0 sm:max-w-sm">
						<div class="mx-auto flex flex-col items-center justify-center gap-2 p-8">
							<AlertDialog.Media
								class="size-12 rounded-full bg-destructive-subtle text-destructive-subtle-foreground"
							>
								<BellIcon class="size-6" />
							</AlertDialog.Media>
							<AlertDialog.Title class="text-center">Subscription Expiring Soon</AlertDialog.Title>
							<Badge variant="destructive-subtle" class="font-normal">Expires in 2 days</Badge>
						</div>

						<div
							class="flex flex-col items-center justify-center gap-5 rounded-b-xl bg-muted/60 p-6"
						>
							<AlertDialog.Description class="text-center">
								Your current plan will expire in 2 days. Update your payment method now to ensure
								uninterrupted access to your Pro features.
							</AlertDialog.Description>
							<AlertDialog.Footer class="gap-4 self-stretch">
								<AlertDialog.Cancel>Remind Me Later</AlertDialog.Cancel>
								<AlertDialog.Action>Update Payment</AlertDialog.Action>
							</AlertDialog.Footer>
						</div>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Logout confirmation dialog">
		{#snippet blurb()}
			The mobile-app answer bar: two ghost buttons divided by a rule, flush with the bottom edge of
			the box.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<AlertDialog.Root>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Logout</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<!-- From demo 13. Upstream's violet well is the primary token here — the
						icon is neither a warning nor a success, it is the product asking. -->
					<AlertDialog.Content size="sm" class="gap-0 overflow-hidden p-0 sm:max-w-sm">
						<div class="flex flex-col items-center justify-center gap-2 p-8">
							<AlertDialog.Media
								class="size-12 rounded-full bg-primary-subtle text-primary-subtle-foreground"
							>
								<ShieldQuestionMarkIcon class="size-6" />
							</AlertDialog.Media>
							<AlertDialog.Title class="text-center text-base font-semibold">
								Are you sure?
							</AlertDialog.Title>
							<AlertDialog.Description class="text-center text-sm font-medium">
								You can always log in later to your account.
							</AlertDialog.Description>
						</div>
						<AlertDialog.Footer class="grid flex-none grid-cols-2 gap-0 border-t">
							<AlertDialog.Cancel
								variant="ghost"
								class="h-12 flex-1 rounded-none border-0 border-r border-border p-0"
							>
								No
							</AlertDialog.Cancel>
							<AlertDialog.Action variant="ghost" class="h-12 flex-1 rounded-none border-0 p-0">
								Yes, Logout
							</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Advanced security audit confirmation">
		{#snippet blurb()}
			The longest of the set: a summary list between the headline and a stacked pair of actions,
			with the confirming one on top.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<AlertDialog.Root>
					<AlertDialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Advanced Security Check</Button>
						{/snippet}
					</AlertDialog.Trigger>
					<!-- From demo 14. Upstream's green well becomes the success token and its
						`warning-light` / `success-light` badges the `-subtle` family. -->
					<AlertDialog.Content class="gap-0 overflow-hidden p-0 sm:max-w-sm">
						<div
							class="flex flex-col items-center justify-center gap-1.5 px-4 pt-6 pb-5 text-center"
						>
							<AlertDialog.Media
								class="size-12 rounded-full bg-success-subtle text-success-subtle-foreground"
							>
								<ShieldAlertIcon class="size-6" />
							</AlertDialog.Media>
							<AlertDialog.Title class="text-base font-semibold">
								Advanced Security Audit
							</AlertDialog.Title>
							<AlertDialog.Description class="text-sm">
								Summary of your account status and security settings.
							</AlertDialog.Description>
						</div>

						<div class="flex flex-col gap-3 p-4">
							{#each securityAuditItems as item (item.title)}
								{@const ItemIcon = item.icon}
								<div
									class="flex items-center justify-between rounded-md border border-dashed border-border px-3 py-2.5"
								>
									<div class="flex items-center gap-2.5">
										<div
											class="flex size-8 items-center justify-center rounded-md border border-border/80 bg-background shadow-xs"
										>
											<ItemIcon class="size-4 text-muted-foreground" />
										</div>
										<div class="flex flex-col gap-0.25">
											<span class="text-sm font-medium">{item.title}</span>
											<span class="text-xs text-muted-foreground">{item.description}</span>
										</div>
									</div>
									<Badge variant={item.status === "Pending" ? "warning-subtle" : "success-subtle"}>
										{item.status}
									</Badge>
								</div>
							{/each}
						</div>

						<AlertDialog.Footer class="grid grid-cols-1 gap-2 p-4">
							<AlertDialog.Action variant="default" class="flex-1">
								Start Deep Audit
							</AlertDialog.Action>
							<AlertDialog.Cancel variant="ghost" class="flex-1">Skip for now</AlertDialog.Cancel>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
