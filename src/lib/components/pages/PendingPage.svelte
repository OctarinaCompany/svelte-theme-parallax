<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as Pending from "$lib/components/ui/pending/index.js";
	import { Spinner } from "$lib/components/ui/spinner/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Pending component page.
	 *
	 * THE CLASSIC THEME'S BUSY AFFORDANCE IS THE SPINNER, which this repository already has its own page for.
	 * `Pending` is not a second drawing of it: it is the state machine around it — the delay before
	 * anything appears, the minimum time it stays once it does, and the `aria-busy` wiring.
	 *
	 * So there is nothing here to repaint. What the theme supplies is what the pending state wraps:
	 * buttons, fields and rows that are already the classic theme's.
	 */

	const timers: ReturnType<typeof setTimeout>[] = [];
	$effect(() => {
		return () => {
			for (const timer of timers) clearTimeout(timer);
		};
	});

	// Default
	let isSubmitting = $state(false);
	const pending = Pending.usePending({ isPending: () => isSubmitting });
	function onSubmit() {
		isSubmitting = true;
		timers.push(
			setTimeout(() => {
				isSubmitting = false;
			}, 2000),
		);
	}

	// Wrapper Component
	let isWrapperSubmitting = $state(false);
	function onWrapperSubmit() {
		isWrapperSubmitting = true;
		timers.push(
			setTimeout(() => {
				isWrapperSubmitting = false;
			}, 2000),
		);
	}

	// Form with Pending State
	let isSigningIn = $state(false);
	let signedIn = $state(false);
	const signInPending = Pending.usePending({ isPending: () => isSigningIn });
	function onSignIn(event: SubmitEvent) {
		event.preventDefault();
		isSigningIn = true;
		signedIn = false;
		timers.push(
			setTimeout(() => {
				isSigningIn = false;
				signedIn = true;
				timers.push(
					setTimeout(() => {
						signedIn = false;
					}, 2000),
				);
			}, 2000),
		);
	}

	// Navigation Links
	let isNavigating = $state(false);
	function onNavigate(event: MouseEvent) {
		event.preventDefault();
		isNavigating = true;
		timers.push(
			setTimeout(() => {
				isNavigating = false;
			}, 2000),
		);
	}

	// Toggle Switches
	let isEnabled = $state(false);
	let isToggling = $state(false);
	function onToggle() {
		isToggling = true;
		timers.push(
			setTimeout(() => {
				isEnabled = !isEnabled;
				isToggling = false;
			}, 1500),
		);
	}

	const usePendingOptions = [
		{
			prop: "id",
			type: "() => string | undefined",
			default: "auto `pending-<n>`",
			description: "The ID of the element. If not provided, an ID will be automatically generated.",
		},
		{
			prop: "isPending",
			type: "() => boolean | undefined",
			default: "false",
			description:
				"Whether the element is in a pending state. Disables press and hover events while retaining focusability, and sets aria-busy and aria-disabled for screen readers.",
		},
		{
			prop: "disabled",
			type: "() => boolean | undefined",
			default: "false",
			description:
				"Whether the element is disabled. When pending, the element will be aria-disabled but remain focusable.",
		},
	];

	const usePendingReturn = [
		{
			prop: "id",
			type: "string",
			description: "The supplied id, or the generated one.",
		},
		{
			prop: "isPending",
			type: "boolean",
			description: "Whether the element is currently in a pending state.",
		},
		{
			prop: "disabled",
			type: "boolean",
			description: "Whether the element is currently disabled.",
		},
		{
			prop: "pendingProps",
			type: "PendingAttributes",
			description:
				"Props to spread on the interactive element. Spread last so event prevention works.",
		},
	];

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLSpanElement | null",
			default: "null",
			description: "Bindable reference to the fallback span. Stays `null` in `child` mode.",
		},
		{
			prop: "id",
			type: "string | undefined",
			default: "`$props.id()`",
			description: "Forwarded into `usePending`. An empty string falls back to the generated id.",
		},
		{
			prop: "isPending",
			type: "boolean",
			default: "false",
			description: "Never written by the component.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Styling flag only; never sets the native `disabled` attribute.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last onto the fallback span: `cn('contents', className)`.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Fallback mode: a single `display:contents` span hosts the pending props.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: PendingChildProps }]>",
			default: "—",
			description: "Merge mode; wins over `children`. No extra DOM node is introduced.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLSpanElement>",
			default: "—",
			description: "Spread first, so the pending attributes always win.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", part: "Pending (fallback span only)", values: "pending" },
		{ attribute: "[data-pending]", part: "Pending", values: "present while isPending is true" },
		{ attribute: "[data-disabled]", part: "Pending", values: "present while disabled is true" },
	];
</script>

<DocPage title="Pending">
	{#snippet subtitle()}
		A utility that disables interactions, keeps keyboard focus and wires the correct ARIA state for
		buttons, forms, links, switches and any interactive element while it is pending.
	{/snippet}

	<DocSection title="Default">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col items-center gap-4">
					<Button onclick={onSubmit} {...pending.pendingProps}>
						{#if pending.isPending}
							<Spinner data-icon="inline-start" />
						{/if}
						{pending.isPending ? "Submitting..." : "Submit"}
					</Button>
					<p class="text-sm text-muted-foreground">
						{pending.isPending
							? "Button is pending - try tabbing to it and pressing Enter"
							: "Click the button to see pending state"}
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Wrapper component">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col items-center gap-4">
					<Pending.Root isPending={isWrapperSubmitting}>
						{#snippet child({ props })}
							<Button onclick={onWrapperSubmit} {...props}>
								{#if isWrapperSubmitting}
									<Spinner data-icon="inline-start" />
								{/if}
								{isWrapperSubmitting ? "Submitting..." : "Submit with Wrapper"}
							</Button>
						{/snippet}
					</Pending.Root>
					<p class="text-sm text-muted-foreground">
						Using the <code class="text-xs">&lt;Pending.Root&gt;</code> wrapper component
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Form with pending state">
		<Card.Root>
			<Card.Content>
				<form class="w-full max-w-sm" onsubmit={onSignIn}>
					<Field.FieldGroup>
						<Field.Field>
							<Field.FieldLabel for="pending-email">Email</Field.FieldLabel>
							<Input
								id="pending-email"
								type="email"
								placeholder="you@example.com"
								required
								disabled={isSigningIn}
							/>
						</Field.Field>
						<Field.Field>
							<Field.FieldLabel for="pending-password">Password</Field.FieldLabel>
							<Input
								id="pending-password"
								type="password"
								placeholder="••••••••"
								required
								disabled={isSigningIn}
							/>
						</Field.Field>
						<Button type="submit" class="w-full" {...signInPending.pendingProps}>
							{#if isSigningIn}
								<Spinner data-icon="inline-start" />
							{/if}
							{isSigningIn ? "Signing in..." : "Sign in"}
						</Button>
						{#if signedIn}
							<p class="text-center text-sm text-success">Successfully signed in!</p>
						{/if}
					</Field.FieldGroup>
				</form>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Navigation links">
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center">
					<Pending.Root isPending={isNavigating}>
						{#snippet child({ props })}
							<a
								href={href("/components/pending")}
								onclick={onNavigate}
								class="text-primary underline-offset-4 hover:underline"
								{...props}
							>
								{isNavigating ? "Loading dashboard..." : "Go to Dashboard"}
							</a>
						{/snippet}
					</Pending.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toggle switches">
		<Card.Root>
			<Card.Content>
				<div class="flex w-full max-w-sm flex-col gap-6">
					<div class="flex items-center justify-between">
						<div class="flex flex-col gap-1">
							<Label for="notifications">Email Notifications</Label>
							<p class="text-sm text-muted-foreground">
								{isToggling ? "Saving..." : "Receive email about your account activity"}
							</p>
						</div>
						<Pending.Root isPending={isToggling} id="notifications">
							{#snippet child({ props })}
								<Switch
									checked={isEnabled}
									onclick={onToggle}
									class="data-pending:cursor-wait data-pending:opacity-70"
									{...props}
								/>
							{/snippet}
						</Pending.Root>
					</div>

					<div class="flex items-center justify-between">
						<div class="flex flex-col gap-1">
							<Label for="marketing">Marketing Updates</Label>
							<p class="text-sm text-muted-foreground">Get tips, updates, and special offers</p>
						</div>
						<Switch id="marketing" />
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<p class="text-sm text-muted-foreground">
			Merge mode (<code class="text-xs">child</code>) is required when the busy state must reach
			assistive technology. Fallback mode (plain <code class="text-xs">children</code>) hosts
			<code class="text-xs">aria-busy</code>/<code class="text-xs">aria-disabled</code> on the
			<code class="text-xs">display:contents</code> wrapper rather than on the interactive descendant.
		</p>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">usePending options</h3>
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
							{#each usePendingOptions as row (row.prop)}
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
			<h3 class="text-base font-medium">usePending return</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Member</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each usePendingReturn as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">&lt;Pending.Root&gt;</h3>
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

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Data attributes</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Attribute</Table.Head>
								<Table.Head>Part</Table.Head>
								<Table.Head>Values</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each dataAttributes as row (`${row.attribute}-${row.part}`)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.attribute}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.part}</Table.Cell>
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
