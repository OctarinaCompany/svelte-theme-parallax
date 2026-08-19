<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";
	import { Kbd } from "$lib/components/ui/kbd/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { Spinner } from "$lib/components/ui/spinner/index.js";
	import CheckIcon from "@lucide/svelte/icons/check";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import MailIcon from "@lucide/svelte/icons/mail";
	import SearchIcon from "@lucide/svelte/icons/search";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import GlobeIcon from "@lucide/svelte/icons/globe";
	import InfoIcon from "@lucide/svelte/icons/info";
	import MicIcon from "@lucide/svelte/icons/mic";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import RadioIcon from "@lucide/svelte/icons/radio";
	import AppWindowIcon from "@lucide/svelte/icons/app-window";
	import AtSignIcon from "@lucide/svelte/icons/at-sign";
	import AudioLinesIcon from "@lucide/svelte/icons/audio-lines";
	import BookOpenIcon from "@lucide/svelte/icons/book-open";
	import BrainIcon from "@lucide/svelte/icons/brain";
	import CommandIcon from "@lucide/svelte/icons/command";
	import CornerDownLeftIcon from "@lucide/svelte/icons/corner-down-left";
	import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
	import EyeIcon from "@lucide/svelte/icons/eye";
	import EyeOffIcon from "@lucide/svelte/icons/eye-off";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import ImageIcon from "@lucide/svelte/icons/image";
	import LayersIcon from "@lucide/svelte/icons/layers";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import LockIcon from "@lucide/svelte/icons/lock";
	import PaperclipIcon from "@lucide/svelte/icons/paperclip";
	import ShieldCheckIcon from "@lucide/svelte/icons/shield-check";
	import ShoppingBagIcon from "@lucide/svelte/icons/shopping-bag";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";
	import StarIcon from "@lucide/svelte/icons/star";
	import LinkIcon from "@lucide/svelte/icons/link";
	import ListFilterIcon from "@lucide/svelte/icons/list-filter";
	import XIcon from "@lucide/svelte/icons/x";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { KbdGroup } from "$lib/components/ui/kbd/index.js";
	import { toast } from "svelte-sonner";
	import { cn } from "$lib/utils.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Input Group component page, ported from shadcn-svelte's own documentation
	 * (https://shadcn-svelte.com/docs/components/input-group), reduced to the four example
	 * families that have something to say here: text addons, buttons, the textarea alignments
	 * and validation.
	 *
	 * WHAT THE CLASSIC THEME HAS. The classic `.input-group` plus the classic theme's own modifier family in
	 * the reference stylesheet — `.input-group-merge`, `-reverse`, `-rounded`, `-flush` — the
	 * set the Input page lists as "not shown" because the shadcn Input docs have no example to
	 * hang it on. This page is where it hangs. shadcn's InputGroup is, structurally, the
	 * `-merge` treatment made the default: one outline drawn by the root, addons and control
	 * sharing it with no interior seam, where a plain classic `.input-group` gives every
	 * segment its own border and fuses them. The command palette's search field already relies
	 * on this component (`app.css` flushes it inside `command-input-wrapper` to reproduce
	 * `.input-group-flush.input-group-merge`); these are the non-flush renders.
	 *
	 * HOUSE RULE, stated once for the whole page: a button that lives inside a field goes
	 * through `InputGroup.Root` + `InputGroup.Addon` — never a `Button` absolutely positioned
	 * over an `Input` (rules/forms.md). The Buttons section is that rule's demonstration.
	 */

	/**
	 * `.form-label` is `margin-bottom: .5rem` and nothing else, so a classic label keeps
	 * `font-weight-base` (400) where `Field.FieldLabel` asks for 500 — the same correction
	 * the Input and Switch pages make, restated rather than re-derived.
	 */
	const label = "font-normal";

	/** The hero search field, reachable by `⌘K` like the command palette it echoes. */
	let searchRef = $state<HTMLInputElement | null>(null);

	/**
	 * The Kbd chip in the hero would be decoration if the shortcut it advertises did nothing,
	 * so it is wired for real. `metaKey || ctrlKey` because the chip reads `⌘K` and Windows
	 * users will reach for Ctrl; `preventDefault` because Ctrl+K is the browser's own
	 * address-bar shortcut and would otherwise win the race.
	 */
	function onSearchShortcut(event: KeyboardEvent) {
		if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			searchRef?.focus();
		}
	}

	/** The Buttons section's copy demo — a share link with the clipboard state made visible. */
	const shareUrl = "https://example.com/reports/q3-overview";
	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	/**
	 * `copied` flips only after `writeText` resolves — the check mark is a receipt, not a
	 * prediction, and the clipboard API can refuse (insecure context, denied permission).
	 * The timer is cleared before being re-armed so hammering the button holds the check
	 * mark steady for two seconds from the LAST click instead of blinking on the first.
	 */
	async function copyShareUrl() {
		try {
			await navigator.clipboard.writeText(shareUrl);
		} catch {
			return;
		}
		copied = true;
		clearTimeout(copyTimer);
		copyTimer = setTimeout(() => (copied = false), 2000);
	}

	/** The textarea demo's draft, driving both the live counter and the Send gate. */
	let message = $state("");

	/**
	 * "Sending" clears the draft and nothing else — enough to prove the round trip: the
	 * counter returns to zero and the disabled gate on the button re-engages.
	 */
	function sendMessage() {
		message = "";
	}

	/** The validation demo's value and its verdict. */
	let email = $state("");

	/**
	 * Gated on non-empty on purpose: an untouched field is not an error, and flagging the
	 * placeholder red before the user has typed anything would punish them for arriving.
	 * The pattern is the cheap shape check — something, an `@`, something, a dot, something —
	 * not RFC 5322; a documentation page needs the state machine, not the grammar.
	 */
	const emailInvalid = $derived(email.length > 0 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email));

	/* ---------------------------------------------------------------------------------------
	 * The sections below are the input-group demo set. Demos whose subject the page
	 * above already renders are not repeated: invalid state (With validation), prefix icon
	 * (the hero card), text addons and the $/USD pair (Text), the search and copy buttons
	 * (Buttons), the ⌘K Kbd chip (the hero card), and the textarea character counter
	 * (Textarea). Each demo sits in a `Field` used only for its `max-w-*`; the page's
	 * existing sections put that class on the root instead, so these do too.
	 * ------------------------------------------------------------------------------------ */

	/** The dropdown selection demo's dialling code. */
	let phoneCountry = $state("+1");
	const phoneCountries = [
		{ code: "+1", label: "+1 (US)" },
		{ code: "+44", label: "+44 (UK)" },
		{ code: "+61", label: "+61 (AU)" },
	];

	/** The AI chat toolbar demo's selected model. */
	let aiChatModel = $state("GPT-4o");
	const aiChatModels = ["GPT-4o", "GPT-4", "Claude 3.5"];

	/* ---------------------------------------------------------------------------------------
	 * Sections continued from the same upstream, covering demo 19 through
	 * demo 36. Two more demos are omitted on the same "already illustrated"
	 * ground the block above states: demo 20 (a labelled group — the With
	 * validation section already pairs `Field.FieldLabel` with a prefix-icon group) and
	 * demo 31 (the same EUR amount field as demo 30, differing only
	 * in which interior seam is drawn).
	 * ------------------------------------------------------------------------------------ */

	/** The attachments prompt bar's selected model. */
	let aiAttachmentsModel = $state("GPT-4o");
	const aiAttachmentsModels = ["GPT-4o", "Claude 3.5 Sonnet"];

	/** The pill-shaped search's category filter. */
	let pillCategory = $state("Category");
	const pillCategories = ["Electronics", "Clothing", "Home"];

	/** The member row's role selection. */
	let memberRole = $state("Admin");
	const memberRoles = ["Admin", "Member", "Viewer"];

	/** The project save interface's destination. */
	let projectVisibility = $state("Personal");
	const projectVisibilities = ["Personal", "Team", "Public"];

	/** The password demo's reveal toggle. */
	let passwordVisible = $state(false);

	/**
	 * The API request demo's method ramp. Upstream paints the verbs
	 * with raw palette colours (emerald, blue, amber, violet); those become the house status
	 * tokens — GET reads success, POST informational, PUT a caution, DELETE destructive —
	 * and PATCH, which has no status semantics to borrow, takes the plain accent.
	 */
	const apiMethodColors = {
		GET: "text-success",
		POST: "text-info",
		PUT: "text-warning",
		PATCH: "text-primary",
		DELETE: "text-destructive",
	} as const;
	type ApiMethod = keyof typeof apiMethodColors;
	const apiMethods = Object.keys(apiMethodColors) as ApiMethod[];
	let apiMethod = $state<ApiMethod>("GET");

	/* ---------------------------------------------------------------------------------------
	 * Sections continued from the same upstream, covering demo 37 through
	 * demo 40 — the search-with-filter family and the share-link row.
	 * ------------------------------------------------------------------------------------ */

	/** The order search's query and multi-select status filter. */
	let orderSearchQuery = $state("");
	let orderStatuses = $state<string[]>([]);
	const orderStatusOptions = ["Pending", "Shipped", "Cancelled"];

	/** The company search's query and single-select region. */
	let companySearchQuery = $state("");
	let companyRegion = $state("Global");
	const companyRegions = ["Global", "United States", "Europe", "APAC"];

	/** The contact search's query, filter and per-status counts. */
	let contactSearchQuery = $state("");
	let contactStatuses = $state<string[]>([]);
	const contactStatusOptions = [
		{ status: "Active", count: 12 },
		{ status: "Lead", count: 7 },
		{ status: "Prospect", count: 5 },
	];

	/**
	 * One toggle for both multi-select filters — demo 37 and
	 * demo 39 inline the identical reducer, so it is written once. It returns
	 * a fresh array rather than mutating: the caller reassigns, and `includes` on the
	 * `$state` proxy re-runs from the assignment alone.
	 */
	function toggleStatusFilter(values: string[], value: string): string[] {
		return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
	}

	/** The share link row's URL and audience. */
	const shareLinkUrl = "agentflow.ai/runbooks/q2-review";
	let shareLinkVisibility = $state("Private");
	const shareLinkVisibilities = ["Private", "Team", "Public"];

	/**
	 * Same contract as the Buttons section's copy demo: the receipt fires only after
	 * `writeText` resolves — a toast for a copy the clipboard refused would be a lie.
	 */
	async function copyShareLink() {
		try {
			await navigator.clipboard.writeText(shareLinkUrl);
		} catch {
			return;
		}
		toast.success("Link copied to clipboard");
	}
</script>

<svelte:window onkeydown={onSearchShortcut} />

<DocPage title="Input group">
	{#snippet subtitle()}
		Display additional information or actions to an input or textarea. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/input-group"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<!--
				The addon's `[&>svg:not([class*='size-'])]:size-4` sizes the icon, so the glyph
				carries no classes of its own — the same division of labour as every icon inside
				a component (rules/icons.md).
			-->
			<InputGroup.Root class="max-w-sm">
				<InputGroup.Addon>
					<SearchIcon />
				</InputGroup.Addon>
				<InputGroup.Input bind:ref={searchRef} placeholder="Search..." aria-label="Search" />
				<InputGroup.Addon align="inline-end">
					<Kbd>⌘K</Kbd>
				</InputGroup.Addon>
			</InputGroup.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="Text">
		{#snippet blurb()}
			Static segments fused to the field — the classic
			<code class="text-[87.5%] text-primary">.input-group-text</code>, rendered the way the classic
			theme's
			<code class="text-[87.5%] text-primary">.input-group-merge</code> modifier draws it: one outline
			around addon and control, no interior seam.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex max-w-sm flex-col gap-4">
					<InputGroup.Root>
						<InputGroup.Addon>
							<InputGroup.Text>https://</InputGroup.Text>
						</InputGroup.Addon>
						<InputGroup.Input placeholder="example.com" aria-label="Website address" />
					</InputGroup.Root>
					<InputGroup.Root>
						<InputGroup.Addon>
							<InputGroup.Text>$</InputGroup.Text>
						</InputGroup.Addon>
						<!--
							`inputmode` rather than `type="number"`: the field wants the numeric
							keyboard on touch devices without the spinner chrome and the
							scroll-to-increment surprises the native number input brings.
						-->
						<InputGroup.Input placeholder="0.00" inputmode="decimal" aria-label="Amount" />
						<InputGroup.Addon align="inline-end">
							<InputGroup.Text>USD</InputGroup.Text>
						</InputGroup.Addon>
					</InputGroup.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Buttons">
		{#snippet blurb()}
			Actions inside the field's own outline. This composition is the house answer to every
			button-in-an-input: <code class="text-[87.5%] text-primary">InputGroup.Root</code> +
			<code class="text-[87.5%] text-primary">InputGroup.Addon</code>, never a
			<code class="text-[87.5%] text-primary">Button</code> absolutely positioned over an
			<code class="text-[87.5%] text-primary">Input</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex max-w-sm flex-col gap-4">
					<InputGroup.Root>
						<!--
							`readonly` rather than `disabled`: the value must stay selectable — a user
							whose clipboard permission is denied falls back to selecting it by hand —
							and a disabled input would also grey the very text being shared.
						-->
						<InputGroup.Input value={shareUrl} readonly aria-label="Share link" />
						<InputGroup.Addon align="inline-end">
							<InputGroup.Button size="icon-xs" aria-label="Copy link" onclick={copyShareUrl}>
								{#if copied}
									<CheckIcon class="text-success" />
								{:else}
									<CopyIcon />
								{/if}
							</InputGroup.Button>
						</InputGroup.Addon>
					</InputGroup.Root>
					<InputGroup.Root>
						<InputGroup.Input placeholder="Search invoices..." aria-label="Search invoices" />
						<InputGroup.Addon align="inline-end">
							<InputGroup.Button>Search</InputGroup.Button>
						</InputGroup.Addon>
					</InputGroup.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Textarea">
		{#snippet blurb()}
			The block alignments. <code class="text-[87.5%] text-primary">align="block-start"</code>
			and <code class="text-[87.5%] text-primary">block-end</code> stack the addons above and below the
			control instead of beside it, and the root cedes its fixed height to the content.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<InputGroup.Root class="max-w-lg">
					<InputGroup.Addon align="block-start">
						<InputGroup.Text>
							<MailIcon />
							New message to Dianna Smiley
						</InputGroup.Text>
					</InputGroup.Addon>
					<InputGroup.Textarea
						bind:value={message}
						placeholder="Write your message..."
						aria-label="Message"
						rows={3}
					/>
					<InputGroup.Addon align="block-end">
						<InputGroup.Text>{message.length} characters</InputGroup.Text>
						<!--
							`ml-auto` because the block addon is one `justify-start` row: the counter
							reads from the left, the action sits on the right, and the gap between
							them is whatever the field's width makes it.
						-->
						<InputGroup.Button
							class="ml-auto"
							disabled={message.trim().length === 0}
							onclick={sendMessage}
						>
							Send
						</InputGroup.Button>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With validation">
		{#snippet blurb()}
			The two-attribute contract from rules/forms.md:
			<code class="text-[87.5%] text-primary">data-invalid</code> on the Field colours the label and
			the message, <code class="text-[87.5%] text-primary">aria-invalid</code> on the control turns the
			shared outline destructive — the root watches its children for exactly that attribute.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.FieldGroup class="max-w-sm">
					<Field.Field data-invalid={emailInvalid}>
						<Field.FieldLabel class={label} for="input-group-email">Email</Field.FieldLabel>
						<InputGroup.Root>
							<InputGroup.Addon>
								<MailIcon />
							</InputGroup.Addon>
							<InputGroup.Input
								id="input-group-email"
								type="email"
								placeholder="user@example.com"
								bind:value={email}
								aria-invalid={emailInvalid}
							/>
						</InputGroup.Root>
						{#if emailInvalid}
							<Field.FieldError>Please enter a valid email address.</Field.FieldError>
						{:else}
							<Field.FieldDescription>
								We will only use this address for order updates.
							</Field.FieldDescription>
						{/if}
					</Field.Field>
				</Field.FieldGroup>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Basic input group">
		{#snippet blurb()}
			The minimal composition. The root draws the outline even with nothing but the control inside,
			so a field can start bare and gain addons later without changing shape.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 1: the group reduced to its root and one input. -->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Input placeholder="Search..." aria-label="Search" />
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group in disabled state">
		<Card.Root>
			<Card.Content>
				<!--
					demo 2 sets `data-disabled` on its Field wrapper; here the root
					carries it directly — the addon variants key their 50% opacity on
					`group-data-[disabled=true]`, and the root is the group. The input's own
					`disabled` attribute does the rest.
				-->
				<InputGroup.Root class="max-w-sm" data-disabled="true">
					<InputGroup.Input placeholder="Disabled field" disabled aria-label="Disabled field" />
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group with suffix icon">
		<Card.Root>
			<Card.Content>
				<!--
					The mirror of the hero card's prefix icon: `align="inline-end"` is the only
					change, and the addon still sizes the glyph — the icon carries no classes of
					its own. (Source: demo 5.)
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Input type="email" placeholder="you@example.com" aria-label="Email" />
					<InputGroup.Addon align="inline-end">
						<MailIcon />
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group with both prefix and suffix icons">
		<Card.Root>
			<Card.Content>
				<!--
					demo 6: a live-capture field. The pulsing broadcast icon is
					`text-destructive` — the house negative token, which is also what recording
					indicators conventionally read as — and `animate-pulse` makes it a state,
					not a decoration.
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Addon>
						<MicIcon />
					</InputGroup.Addon>
					<InputGroup.Input placeholder="Listening..." aria-label="Voice input" />
					<InputGroup.Addon align="inline-end">
						<RadioIcon class="animate-pulse text-destructive" />
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group with dropdown menu selection">
		{#snippet blurb()}
			An addon can hold a whole menu, not just a glyph — here a dialling-code selector fused to a
			phone field, the composition a phone input is made of.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 12. The trigger renders through the `child` snippet onto
					`InputGroup.Button` so the menu button keeps the addon-scale ghost styling
					instead of a full-height Button breaking the field's outline.
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Addon>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<InputGroup.Button {...props}>
										<span class="tabular-nums">{phoneCountry}</span>
										<ChevronDownIcon />
									</InputGroup.Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="start" class="min-w-24">
								{#each phoneCountries as option (option.code)}
									<DropdownMenu.Item onSelect={() => (phoneCountry = option.code)}>
										{option.label}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</InputGroup.Addon>
					<InputGroup.Input type="tel" placeholder="123 456 7890" aria-label="Phone number" />
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group with tooltip action">
		<Card.Root>
			<Card.Content>
				<!--
					demo 14: the info button explains the number beside it. The
					tooltip is the right vehicle because the explanation is optional context,
					not validation — nothing about the value is wrong.
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Input type="number" value="5000" aria-label="Monthly request limit" />
					<InputGroup.Addon align="inline-end">
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger>
									{#snippet child({ props })}
										<InputGroup.Button size="icon-xs" {...props} aria-label="About this limit">
											<InfoIcon />
										</InputGroup.Button>
									{/snippet}
								</Tooltip.Trigger>
								<Tooltip.Content>Monthly request limit</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group with loading spinner">
		{#snippet blurb()}
			The pending shape: while the value is being checked, the field is disabled and the suffix
			addon holds a spinner — the user can see both that they cannot type and why.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 15. `data-disabled` on the root greys the addon along with
					the input, so the spinner dims with the field it belongs to.
				-->
				<InputGroup.Root class="max-w-sm" data-disabled="true">
					<InputGroup.Input value="shadcn_ui" disabled aria-label="Username" />
					<InputGroup.Addon align="inline-end">
						<Spinner />
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group with block-start addon">
		{#snippet blurb()}
			The block alignments are not textarea-only:
			<code class="text-[87.5%] text-primary">block-start</code> above a plain input makes a titled field,
			the root ceding its fixed height exactly as it does in the Textarea section.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 16. Upstream adds `h-auto` on the root by hand; the house
					root already flips to auto height whenever a block-aligned addon is present,
					so no override is needed. `ml-auto` pushes the info glyph to the far edge of
					the addon's single row.
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Addon align="block-start">
						<InputGroup.Text class="font-medium">User Profile</InputGroup.Text>
						<InfoIcon class="ml-auto" />
					</InputGroup.Addon>
					<InputGroup.Input placeholder="First name" aria-label="First name" />
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="AI Chat textarea with rich toolbar actions">
		{#snippet blurb()}
			The prompt-bar composition every AI product converges on: a textarea with a
			<code class="text-[87.5%] text-primary">block-end</code> toolbar — attachments and mode toggles
			reading from the left, the submit action alone on the right.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 18. Upstream's `h-7 px-2 text-xs` overrides on the labelled
					ghost buttons are dropped in favour of the stock `xs` size — the button
					micro-ramp inside a group is the component's own, not per-demo. The submit
					button is the only `variant="default"` in the toolbar, which is what makes
					it read as the primary action.
				-->
				<InputGroup.Root class="max-w-md">
					<InputGroup.Textarea
						placeholder="Ask AI anything..."
						class="min-h-24"
						aria-label="AI prompt"
					/>
					<InputGroup.Addon align="block-end">
						<div class="flex items-center gap-1">
							<InputGroup.Button size="icon-xs" aria-label="Add attachment">
								<PlusIcon />
							</InputGroup.Button>
							<InputGroup.Button size="icon-xs" aria-label="Dictate">
								<MicIcon />
							</InputGroup.Button>
							<InputGroup.Button>
								<GlobeIcon />
								Search
							</InputGroup.Button>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									{#snippet child({ props })}
										<InputGroup.Button {...props}>
											<Kbd class="border border-border">Σ</Kbd>
											{aiChatModel}
											<ChevronDownIcon class="opacity-60" />
										</InputGroup.Button>
									{/snippet}
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="start" class="min-w-32">
									{#each aiChatModels as model (model)}
										<DropdownMenu.Item onSelect={() => (aiChatModel = model)}>
											{model}
										</DropdownMenu.Item>
									{/each}
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</div>
						<InputGroup.Button
							variant="default"
							size="icon-xs"
							class="ml-auto"
							aria-label="Send prompt"
						>
							<ArrowUpIcon />
						</InputGroup.Button>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="AI Chat interface with file and context attachments">
		{#snippet blurb()}
			The prompt bar again, with the context made visible: a
			<code class="text-[87.5%] text-primary">block-start</code> row of outline chips shows what the prompt
			will be answered against — a mention, an attachment, an open tab — before a word is typed.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 19. Upstream strips the textarea's border and focus ring by
					hand; the house control is already borderless inside the group, so those
					overrides vanish. The chips keep `variant="outline"` because they are records
					of attached context, not toolbar actions — the outline is what separates them
					from the ghost buttons every other toolbar here uses.
				-->
				<InputGroup.Root class="max-w-md">
					<InputGroup.Addon align="block-start">
						<InputGroup.Button variant="outline" size="icon-xs" aria-label="Mention someone">
							<AtSignIcon />
						</InputGroup.Button>
						<InputGroup.Button variant="outline">
							<PaperclipIcon />
							1
						</InputGroup.Button>
						<InputGroup.Button variant="outline">
							<FileTextIcon />
							1 Tab
						</InputGroup.Button>
					</InputGroup.Addon>
					<InputGroup.Textarea
						placeholder="Plan, search, build anything"
						class="min-h-24"
						aria-label="AI prompt"
					/>
					<InputGroup.Addon align="block-end">
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<InputGroup.Button variant="secondary" size="sm" {...props}>
										{aiAttachmentsModel}
										<ChevronDownIcon />
									</InputGroup.Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="start">
								{#each aiAttachmentsModels as model (model)}
									<DropdownMenu.Item onSelect={() => (aiAttachmentsModel = model)}>
										{model}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>
						<div class="ml-auto flex items-center gap-2">
							<InputGroup.Button variant="secondary" size="icon-sm" aria-label="Attach image">
								<ImageIcon />
							</InputGroup.Button>
							<InputGroup.Button variant="default" size="icon-sm" aria-label="Send prompt">
								<CornerDownLeftIcon />
							</InputGroup.Button>
						</div>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group with multiple icons/buttons at the end">
		<Card.Root>
			<Card.Content>
				<!--
					demo 21: one suffix addon holding both a passive glyph and an
					action — the addon's `gap-2` spaces them, no wrapper needed. The toast is the
					receipt the Buttons section's copy demo renders inline; both shapes are house
					answers, this one for when the field has no room for a state swap.
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Input placeholder="Component name..." aria-label="Component name" />
					<InputGroup.Addon align="inline-end">
						<StarIcon />
						<InputGroup.Button
							size="icon-xs"
							aria-label="Copy to clipboard"
							onclick={() => toast.success("Copied to clipboard")}
						>
							<CopyIcon />
						</InputGroup.Button>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group with popover trigger addon">
		{#snippet blurb()}
			Where the tooltip section's addon carries a hint, this one carries a document: a popover with
			a title and body, for context that outgrows a single line.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 22 — the browser address bar's padlock, rebuilt from parts.
					Upstream's `text-emerald-500` shield becomes `text-success` (semantic tokens
					only), and `cursor-help` stays: the button looks like a status glyph, so the
					cursor is what tells the hand it can be asked to explain itself.
				-->
				<InputGroup.Root class="max-w-sm gap-0">
					<InputGroup.Addon>
						<Popover.Root>
							<Popover.Trigger>
								{#snippet child({ props })}
									<InputGroup.Button
										size="icon-xs"
										class="cursor-help"
										{...props}
										aria-label="Connection security"
									>
										<ShieldCheckIcon class="text-success" />
									</InputGroup.Button>
								{/snippet}
							</Popover.Trigger>
							<Popover.Content align="start" class="w-72">
								<Popover.Header>
									<Popover.Title>Secure Connection</Popover.Title>
									<Popover.Description>
										Your data is encrypted end-to-end using industry-standard protocols.
									</Popover.Description>
								</Popover.Header>
							</Popover.Content>
						</Popover.Root>
					</InputGroup.Addon>
					<InputGroup.Input
						value="https://example.com"
						readonly
						class="pl-0.5!"
						aria-label="Page address"
					/>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group with Sparkles icon and complex Kbd shortcut">
		<Card.Root>
			<Card.Content>
				<!--
					demo 23. The hero card's suffix is one `Kbd`; this is the
					`KbdGroup` composition — modifier and key as separate chips, the icon inside
					the first one sized by `Kbd`'s own `size-3` rule so it carries no classes.
					The sparkles trade upstream's `text-emerald-500` for `text-success`.
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Addon>
						<SparklesIcon class="text-success" />
					</InputGroup.Addon>
					<InputGroup.Input placeholder="Ask AI to generate..." aria-label="AI prompt" />
					<InputGroup.Addon align="inline-end">
						<KbdGroup>
							<Kbd><CommandIcon /></Kbd>
							<Kbd>Enter</Kbd>
						</KbdGroup>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group with success indicator circle">
		<Card.Root>
			<Card.Content>
				<!--
					demo 24 — the "username is available" mark. Upstream's
					`bg-emerald-500` disc with a white check becomes `bg-success` +
					`text-success-foreground`, the token pair `app.css` keeps in contrast with
					each other. The check keeps an explicit `size-3`: it sits inside a plain div,
					out of reach of the addon's direct-child icon sizing.
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Input value="parallax_dev" aria-label="Username" />
					<InputGroup.Addon align="inline-end">
						<div class="flex size-4 items-center justify-center rounded-full bg-success">
							<CheckIcon class="size-3 text-success-foreground" />
						</div>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group with search results count">
		<Card.Root>
			<Card.Content>
				<!--
					demo 25: the suffix as a live annotation — a result count the
					field would update as the query narrows. `text-xs` steps the count below the
					query's own size so the two never compete.
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Addon>
						<SearchIcon />
					</InputGroup.Addon>
					<InputGroup.Input placeholder="Search logs..." aria-label="Search logs" />
					<InputGroup.Addon align="inline-end">
						<InputGroup.Text class="text-xs">12 results</InputGroup.Text>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Textarea input group with action buttons">
		<Card.Root>
			<Card.Content>
				<!--
					demo 26. The Textarea section's block-end row is counter + one
					action; this is the two-verb form — Cancel reads first as `secondary`, the
					`ml-auto` gap pushes Post Comment to the right, and `variant="default"` is
					what marks it as the primary of the pair.
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Textarea
						placeholder="Share your thoughts..."
						class="min-h-24"
						aria-label="Comment"
					/>
					<InputGroup.Addon align="block-end">
						<InputGroup.Button variant="secondary" size="sm">Cancel</InputGroup.Button>
						<InputGroup.Button variant="default" size="sm" class="ml-auto">
							Post Comment
						</InputGroup.Button>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group wrapped in a button group with text prefixes/suffixes">
		{#snippet blurb()}
			The two group components composed: <code class="text-[87.5%] text-primary">ButtonGroup</code>
			fuses static segments to the outside of the field while the input group keeps its own addon inside
			— the URL split three ways, only the middle editable.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 27. The Text section's `https://` lives inside the field's
					outline; here it sits in a `ButtonGroup.Text` segment OUTSIDE it, with its own
					background — the classic `.input-group-text` look this page's intro
					contrasts against the merge treatment.
				-->
				<ButtonGroup.Root class="max-w-sm">
					<ButtonGroup.Text>https://</ButtonGroup.Text>
					<InputGroup.Root>
						<InputGroup.Input placeholder="example" aria-label="Domain name" />
						<InputGroup.Addon align="inline-end">
							<InfoIcon />
						</InputGroup.Addon>
					</InputGroup.Root>
					<ButtonGroup.Text>.com</ButtonGroup.Text>
				</ButtonGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group with a menu button (three dots) at the end">
		<Card.Root>
			<Card.Content>
				<!--
					demo 28. Upstream paints Delete with a bare `text-destructive`
					class; the house `DropdownMenu.Item` has `variant="destructive"` for exactly
					this, which also colours its hover state — the variant, not the class, is the
					API (rules: looks as variants first).
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Input placeholder="Enter file name" aria-label="File name" />
					<InputGroup.Addon align="inline-end">
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<InputGroup.Button size="icon-xs" {...props} aria-label="File actions">
										<EllipsisIcon />
									</InputGroup.Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end">
								<DropdownMenu.Item>Rename</DropdownMenu.Item>
								<DropdownMenu.Item>Duplicate</DropdownMenu.Item>
								<DropdownMenu.Item variant="destructive">Delete</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Pill-shaped input group with a category dropdown at the end">
		<Card.Root>
			<Card.Content>
				<!--
					demo 29. `rounded-full` on the root, the input and the trigger is
					the whole pill — three corners that must agree. Upstream's `h-7 px-3 text-xs`
					overrides on the trigger are dropped for the stock `xs` size, the same call
					the AI Chat toolbar section records: the micro-ramp inside a group belongs to
					the component.
				-->
				<InputGroup.Root class="max-w-sm rounded-full">
					<InputGroup.Input
						placeholder="Search products"
						class="rounded-full px-5"
						aria-label="Search products"
					/>
					<InputGroup.Addon align="inline-end">
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<InputGroup.Button class="rounded-full" {...props}>
										{pillCategory}
										<ChevronDownIcon class="opacity-60" />
									</InputGroup.Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" class="min-w-32">
								{#each pillCategories as category (category)}
									<DropdownMenu.Item onSelect={() => (pillCategory = category)}>
										{category}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group with inline addons (no separating borders)">
		<Card.Root>
			<Card.Content>
				<!--
					demo 30 — the Text section's currency field with the interior
					seams drawn back in: `border-x` on the control splits addon from input the way
					a plain classic `.input-group` would, inside the merge treatment's single
					outline. Its sibling demo 31 draws only the leading seam and is
					otherwise this demo, so it is not repeated.
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Addon class="pr-2">
						<InputGroup.Text>€</InputGroup.Text>
					</InputGroup.Addon>
					<InputGroup.Input
						placeholder="0.00"
						inputmode="decimal"
						class="border-x border-border"
						aria-label="Amount"
					/>
					<InputGroup.Addon align="inline-end" class="pl-2">
						<InputGroup.Text>EUR</InputGroup.Text>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Member row with avatar, email and role selection">
		<Card.Root>
			<Card.Content>
				<!--
					demo 32 — a share-dialog member row as one field: identity on the
					left, permission on the right. The avatar is the stock github.com/shadcn.png
					placeholder this repo's pages already use; `pr-1` on the addon and `pl-1!` on
					the input tuck the handle against its avatar, since the default paddings
					assume a glyph, not a face.
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Addon class="pr-1">
						<Avatar.Root class="size-5">
							<Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" />
							<Avatar.Fallback>CN</Avatar.Fallback>
						</Avatar.Root>
					</InputGroup.Addon>
					<InputGroup.Input value="@shadcn" class="pl-1!" aria-label="Member handle" />
					<InputGroup.Addon align="inline-end">
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<InputGroup.Button {...props}>
										{memberRole}
										<ChevronDownIcon class="opacity-60" />
									</InputGroup.Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" class="min-w-32">
								{#each memberRoles as role (role)}
									<DropdownMenu.Item onSelect={() => (memberRole = role)}>
										{role}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Project save interface with status and action buttons">
		{#snippet blurb()}
			The group stretched to a whole form row: an icon tile, a two-line name + description column,
			and a full toolbar — destination, then Cancel/Save behind a hairline divider. One outline
			still rules it all.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 33. `h-auto items-start` releases the root's fixed row
					height so the addons top-align against the two stacked controls; the leading
					addon is restyled into a square tile (`size-8 rounded-md border bg-muted`)
					because here it is an object icon, not a field glyph. Upstream's border and
					focus-ring strips on the controls are dropped — the house controls are already
					borderless inside the group.
				-->
				<InputGroup.Root class="h-auto items-start p-3 pl-4">
					<InputGroup.Addon
						class="mt-1.5 inline-flex size-8 items-center justify-center rounded-md border border-border bg-muted p-0"
					>
						<LayersIcon />
					</InputGroup.Addon>
					<div class="flex flex-1 flex-col pt-2.5 pl-1">
						<InputGroup.Input
							placeholder="Enter project name..."
							class="h-10 text-base"
							aria-label="Project name"
						/>
						<InputGroup.Textarea
							placeholder="Description as multiple lines of text are supported..."
							class="min-h-16 text-sm"
							aria-label="Project description"
						/>
					</div>
					<InputGroup.Addon align="inline-end" class="gap-2">
						<InputGroup.Text class="whitespace-nowrap">Save to</InputGroup.Text>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<InputGroup.Button variant="outline" size="sm" class="font-normal" {...props}>
										<LockIcon />
										{projectVisibility}
									</InputGroup.Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end">
								{#each projectVisibilities as visibility (visibility)}
									<DropdownMenu.Item onSelect={() => (projectVisibility = visibility)}>
										{visibility}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Root>
						<div class="mx-1 h-4 w-px self-center bg-border"></div>
						<InputGroup.Button variant="secondary" size="sm">Cancel</InputGroup.Button>
						<InputGroup.Button variant="default" size="sm">Save</InputGroup.Button>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Pill-shaped AI prompt bar with voice and audio icons">
		{#snippet blurb()}
			The single-line sibling of the prompt-bar textareas above — the ChatGPT-style capsule, with a
			tools menu (and submenu) on the left and the voice actions on the right.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 34. The oversized `size-10`/`size-11` round buttons and
					their `size-5`/`size-6` icons keep upstream's explicit sizes — the capsule is
					an `h-14` touch target, outside the group button's own micro-ramp. Upstream's
					`bg-black text-white` submit is the one adaptation: raw colours are forbidden
					here, and `variant="default"` is the token that means "the primary action".
				-->
				<InputGroup.Root class="h-14 rounded-full p-1.5">
					<InputGroup.Addon class="pl-2">
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<InputGroup.Button
										size="icon-sm"
										class="size-10 rounded-full text-muted-foreground hover:text-foreground"
										{...props}
										aria-label="Open tools"
									>
										<PlusIcon class="size-6" />
									</InputGroup.Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content side="top" align="start" sideOffset={12} class="w-56">
								<DropdownMenu.Item>
									<PaperclipIcon />
									<span>Add photos & files</span>
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item>
									<ImageIcon />
									<span>Create image</span>
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<BrainIcon />
									<span>Thinking</span>
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<SearchIcon />
									<span>Deep research</span>
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<ShoppingBagIcon />
									<span>Shopping research</span>
								</DropdownMenu.Item>
								<DropdownMenu.Sub>
									<DropdownMenu.SubTrigger>
										<SparklesIcon />
										<span>More</span>
									</DropdownMenu.SubTrigger>
									<DropdownMenu.SubContent class="w-44">
										<DropdownMenu.Item>
											<BookOpenIcon />
											<span>Study and learn</span>
										</DropdownMenu.Item>
										<DropdownMenu.Item>
											<GlobeIcon />
											<span>Web search</span>
										</DropdownMenu.Item>
										<DropdownMenu.Item>
											<LayoutDashboardIcon />
											<span>Canvas</span>
										</DropdownMenu.Item>
										<DropdownMenu.Item>
											<AppWindowIcon />
											<span>Explore apps</span>
										</DropdownMenu.Item>
									</DropdownMenu.SubContent>
								</DropdownMenu.Sub>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</InputGroup.Addon>
					<InputGroup.Input
						placeholder="Ask anything"
						class="px-2 text-lg placeholder:text-muted-foreground/70"
						aria-label="AI prompt"
					/>
					<InputGroup.Addon align="inline-end" class="gap-2 pr-1">
						<InputGroup.Button
							class="size-11 rounded-full text-muted-foreground hover:text-foreground"
							aria-label="Dictate"
						>
							<MicIcon class="size-5" />
						</InputGroup.Button>
						<InputGroup.Button
							variant="default"
							class="size-11 rounded-full"
							aria-label="Start voice conversation"
						>
							<AudioLinesIcon class="size-5" />
						</InputGroup.Button>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Password input with visibility toggle">
		<Card.Root>
			<Card.Content>
				<!--
					demo 35 puts the toggle button directly in the group; here it
					goes through an `inline-end` addon like every other trailing action on this
					page — the intro's house rule, and what keeps the button inside the field's
					focus outline. `aria-pressed` makes the toggle's state audible where the
					eye/eye-off swap is only visible.
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Addon>
						<LockIcon />
					</InputGroup.Addon>
					<InputGroup.Input
						type={passwordVisible ? "text" : "password"}
						placeholder="Enter password"
						aria-label="Password"
					/>
					<InputGroup.Addon align="inline-end">
						<InputGroup.Button
							size="icon-xs"
							aria-label={passwordVisible ? "Hide password" : "Show password"}
							aria-pressed={passwordVisible}
							onclick={() => (passwordVisible = !passwordVisible)}
						>
							{#if passwordVisible}
								<EyeOffIcon />
							{:else}
								<EyeIcon />
							{/if}
						</InputGroup.Button>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API request input with method selector and send action">
		{#snippet blurb()}
			An HTTP client's request line as one group: the method dropdown wears its verb's status
			colour, the path is monospaced, and Send closes the row.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 36. The verb→colour map lives in the script block, where its
					translation from upstream's raw palette to the house status tokens is
					recorded; `cn` merges the colour class into the trigger so the closed control
					always announces the method it will send with.
				-->
				<InputGroup.Root class="max-w-md">
					<InputGroup.Addon>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<InputGroup.Button
										class={cn("gap-1.5 font-mono text-xs", apiMethodColors[apiMethod])}
										{...props}
										aria-label="HTTP method: {apiMethod}"
									>
										{apiMethod}
										<ChevronDownIcon class="opacity-60" />
									</InputGroup.Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="start" class="w-28">
								<DropdownMenu.Group>
									{#each apiMethods as item (item)}
										<DropdownMenu.Item
											class={cn("font-mono text-xs font-semibold", apiMethodColors[item])}
											onSelect={() => (apiMethod = item)}
										>
											{item}
										</DropdownMenu.Item>
									{/each}
								</DropdownMenu.Group>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</InputGroup.Addon>
					<InputGroup.Input
						value="/v1/agents/run"
						class="font-mono text-xs"
						aria-label="API endpoint path"
					/>
					<InputGroup.Addon align="inline-end">
						<InputGroup.Button size="xs" aria-label="Send request">Send</InputGroup.Button>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Order search input with status filter">
		{#snippet blurb()}
			The list-header search pattern: a clear button that exists only while there is something to
			clear, and a popover filter whose trigger counts its own selections.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 37. The clear button renders inside an `{#if}` rather than
					sitting disabled — an affordance for undoing input has no meaning while the
					field is empty. The count on the trigger is `tabular-nums` so "Status 2" does
					not shift when it becomes "Status 12"; the filter glyph carries no size class,
					the button's own `xs` ramp draws it at 3.5.
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Addon>
						<SearchIcon />
					</InputGroup.Addon>
					<InputGroup.Input
						placeholder="Search orders..."
						bind:value={orderSearchQuery}
						aria-label="Search orders"
					/>
					<InputGroup.Addon align="inline-end" class="gap-1">
						{#if orderSearchQuery.length > 0}
							<InputGroup.Button
								size="icon-xs"
								aria-label="Clear search"
								onclick={() => (orderSearchQuery = "")}
							>
								<XIcon />
							</InputGroup.Button>
						{/if}
						<Popover.Root>
							<Popover.Trigger>
								{#snippet child({ props })}
									<InputGroup.Button class="gap-1.5" {...props} aria-label="Filter order status">
										<ListFilterIcon />
										Status
										{#if orderStatuses.length > 0}
											<span class="text-muted-foreground tabular-nums">
												{orderStatuses.length}
											</span>
										{/if}
									</InputGroup.Button>
								{/snippet}
							</Popover.Trigger>
							<Popover.Content align="end" class="w-40 p-3">
								<div class="flex flex-col gap-2">
									{#each orderStatusOptions as status (status)}
										<div class="flex items-center gap-2.5">
											<Checkbox
												id="order-status-{status}"
												checked={orderStatuses.includes(status)}
												onCheckedChange={() =>
													(orderStatuses = toggleStatusFilter(orderStatuses, status))}
											/>
											<Label for="order-status-{status}" class={label}>{status}</Label>
										</div>
									{/each}
								</div>
							</Popover.Content>
						</Popover.Root>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Company search input with region selector">
		<Card.Root>
			<Card.Content>
				<!--
					demo 38 — the order search's sibling: same clear-on-content
					button, but the filter is single-select, so it is a dropdown menu whose
					trigger reads the current region rather than a checkbox popover counting
					selections.
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Addon>
						<SearchIcon />
					</InputGroup.Addon>
					<InputGroup.Input
						placeholder="Search companies..."
						bind:value={companySearchQuery}
						aria-label="Search companies"
					/>
					<InputGroup.Addon align="inline-end" class="gap-1">
						{#if companySearchQuery.length > 0}
							<InputGroup.Button
								size="icon-xs"
								aria-label="Clear search"
								onclick={() => (companySearchQuery = "")}
							>
								<XIcon />
							</InputGroup.Button>
						{/if}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<InputGroup.Button class="gap-1.5" {...props} aria-label="Select region">
										<GlobeIcon />
										{companyRegion}
										<ChevronDownIcon class="opacity-60" />
									</InputGroup.Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" class="min-w-32">
								<DropdownMenu.Group>
									{#each companyRegions as region (region)}
										<DropdownMenu.Item onSelect={() => (companyRegion = region)}>
											{region}
										</DropdownMenu.Item>
									{/each}
								</DropdownMenu.Group>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Contact search input with filter and actions menu">
		{#snippet blurb()}
			The order search grown a third control: the filter trigger swaps its label for the selection
			count instead of appending it, each option carries its result count, and an ellipsis menu
			holds the bulk actions.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 39. The per-status counts stay static data — the demo is
					about the composition, not a live query. The Label stretches (`grow` +
					`justify-between`) so each count sits on the popover's far edge while still
					being part of the option's click target.
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Addon>
						<SearchIcon />
					</InputGroup.Addon>
					<InputGroup.Input
						placeholder="Search contacts..."
						bind:value={contactSearchQuery}
						aria-label="Search contacts"
					/>
					<InputGroup.Addon align="inline-end" class="gap-1">
						{#if contactSearchQuery.length > 0}
							<InputGroup.Button
								size="icon-xs"
								aria-label="Clear search"
								onclick={() => (contactSearchQuery = "")}
							>
								<XIcon />
							</InputGroup.Button>
						{/if}
						<Popover.Root>
							<Popover.Trigger>
								{#snippet child({ props })}
									<InputGroup.Button class="gap-1.5" {...props} aria-label="Filter contacts">
										<ListFilterIcon />
										{#if contactStatuses.length > 0}
											<span class="tabular-nums">{contactStatuses.length}</span>
										{:else}
											Status
										{/if}
									</InputGroup.Button>
								{/snippet}
							</Popover.Trigger>
							<Popover.Content align="end" class="w-44 p-3">
								<div class="flex flex-col gap-2">
									{#each contactStatusOptions as option (option.status)}
										<div class="flex items-center gap-2.5">
											<Checkbox
												id="contact-status-{option.status}"
												checked={contactStatuses.includes(option.status)}
												onCheckedChange={() =>
													(contactStatuses = toggleStatusFilter(contactStatuses, option.status))}
											/>
											<Label
												for="contact-status-{option.status}"
												class="flex grow items-center justify-between gap-1.5 font-normal"
											>
												{option.status}
												<span class="text-xs text-muted-foreground">{option.count}</span>
											</Label>
										</div>
									{/each}
								</div>
							</Popover.Content>
						</Popover.Root>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<InputGroup.Button size="icon-xs" {...props} aria-label="More actions">
										<EllipsisIcon />
									</InputGroup.Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" class="min-w-36">
								<DropdownMenu.Group>
									<DropdownMenu.Item>Bulk email</DropdownMenu.Item>
									<DropdownMenu.Item>Export CSV</DropdownMenu.Item>
									<DropdownMenu.Item>Add contact</DropdownMenu.Item>
								</DropdownMenu.Group>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Share link input with visibility selector and copy action">
		<Card.Root>
			<Card.Content>
				<!--
					demo 40 — the Buttons section's copy row with the audience made
					part of the field: who can open the link sits beside the action that hands it
					out. The input stays `readonly` for the reason recorded there, and the copy
					button follows the script block's receipt-after-resolve contract instead of
					upstream's inert button.
				-->
				<InputGroup.Root class="max-w-sm">
					<InputGroup.Addon>
						<LinkIcon />
					</InputGroup.Addon>
					<InputGroup.Input value={shareLinkUrl} readonly aria-label="Share link" />
					<InputGroup.Addon align="inline-end" class="gap-1">
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<InputGroup.Button class="gap-1.5" {...props} aria-label="Select visibility">
										{shareLinkVisibility}
										<ChevronDownIcon class="opacity-60" />
									</InputGroup.Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" class="min-w-28">
								<DropdownMenu.Group>
									{#each shareLinkVisibilities as option (option)}
										<DropdownMenu.Item onSelect={() => (shareLinkVisibility = option)}>
											{option}
										</DropdownMenu.Item>
									{/each}
								</DropdownMenu.Group>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
						<InputGroup.Button size="icon-xs" aria-label="Copy link" onclick={copyShareLink}>
							<CopyIcon />
						</InputGroup.Button>
					</InputGroup.Addon>
				</InputGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
