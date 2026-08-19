<script lang="ts">
	import { toast } from "svelte-sonner";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { CopyButton } from "$lib/components/ui/copy-button/index.js";

	/**
	 * The Copy button page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. Its documentation ships copy affordances as inline snippets on the
	 * pages that need them, which is how this repository carried them too until now — the Collapsible,
	 * Input group, Data grid and JSON viewer pages each inline their own `writeText` handler. This
	 * page exists because the fourth copy of a timer and a receipt is the one that says the thing is a
	 * component.
	 *
	 * EVERY DEMO COPIES SOMETHING REAL, and every demo can fail. The clipboard API is unavailable in
	 * an insecure context and rejects when permission is denied, so nothing on this page shows a check
	 * mark it has not earned.
	 */

	const INSTALL_COMMAND = "npx shadcn-svelte@latest add copy-button";
	const SHARE_URL = "https://example.com/reports/q3-overview";
	// Prefixed `demo_` rather than dressed up as a provider's live secret key: a documentation page
	// that renders something shaped like a real credential teaches the wrong reflex.
	const API_KEY = "demo_9f2b41c07ae84d5e6c1a";

	/** The lazy demo's source rows. The button serialises these on click, not on render. */
	const EXPORT_ROWS = [
		{ region: "EMEA", revenue: 412_500, growth: "+12.4%" },
		{ region: "AMER", revenue: 388_100, growth: "+8.1%" },
		{ region: "APAC", revenue: 254_900, growth: "+19.7%" },
	];

	/**
	 * The producer form: `value` is a function, so the CSV is built on click.
	 *
	 * The 600ms wait stands in for work that is genuinely slow — a request, a large serialisation.
	 * It is what makes the pending face visible here; a producer that returns a string outright never
	 * shows one, which is the whole reason the component gates it on the return type.
	 */
	async function buildExportCsv(): Promise<string> {
		await new Promise((resolve) => setTimeout(resolve, 600));
		const header = "region,revenue,growth";
		const body = EXPORT_ROWS.map((row) => `${row.region},${row.revenue},${row.growth}`);
		return [header, ...body].join("\n");
	}

	/**
	 * The failure demo.
	 *
	 * A producer that throws, rather than a real refusal: the two paths a reader will actually hit —
	 * an insecure origin and a denied permission — cannot be staged from a page served over HTTPS with
	 * the permission already granted. The rejection lands in exactly the same `catch`, so what the
	 * demo shows is true: no check mark, no success ground, `onCopyError` fired.
	 */
	function refuseToProduce(): string {
		throw new Error("Clipboard write refused");
	}

	const props = [
		{
			prop: "value",
			type: "string | (() => string | Promise<string>)",
			default: "—",
			description:
				"The text to write. The function form defers producing it until the click, for text that is expensive or not yet known; only a producer that returns a promise shows the pending face.",
		},
		{
			prop: "label",
			type: "string",
			default: "undefined",
			description:
				"Visible text beside the icon. Omitted, the button is icon-only and names itself “Copy”.",
		},
		{
			prop: "copiedLabel",
			type: "string",
			default: '"Copied"',
			description:
				"What the live region announces once the write resolves. Announced, never displayed — the visible label does not change.",
		},
		{
			prop: "errorLabel",
			type: "string",
			default: '"Copy failed"',
			description: "What the live region announces when the clipboard refuses.",
		},
		{
			prop: "timeout",
			type: "number",
			default: "2000",
			description:
				"How long the receipt stays up, in ms. The timer is re-armed from the last click, so hammering the button holds the check mark rather than blinking it.",
		},
		{
			prop: "onCopy",
			type: "(text: string) => void",
			default: "—",
			description: "Fired with the text that was written, after writeText has resolved.",
		},
		{
			prop: "onCopyError",
			type: "(error: unknown) => void",
			default: "—",
			description:
				"Fired with whatever the producer or writeText threw. The component announces the failure; anything visible is the caller's to raise, because only the caller knows where it belongs.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: '"outline"',
			description:
				"Passed to Button. The copied ground overrides it for as long as the receipt is up.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: '"icon" / "default"',
			description:
				"Passed to Button. Defaults to icon when there is no label and default when there is, so the two forms do not borrow each other's proportions.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered button.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged last, after the variant and the copied ground — so a class of your own wins, including over the receipt.",
		},
		{
			prop: "...restProps",
			type: "ButtonProps",
			default: "—",
			description:
				"Everything else is forwarded, href excepted. A supplied onclick runs first, and preventDefault on it cancels the copy.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", values: "copy-button" },
		{ attribute: "[data-copied]", values: "present while the receipt is up" },
		{
			attribute: "[data-pending]",
			values: "present while an asynchronous producer is still working",
		},
		{ attribute: "[data-motion]", values: '"reduce" when prefers-reduced-motion is requested' },
	];
</script>

<DocPage title="Copy button">
	{#snippet subtitle()}
		A button that writes text to the clipboard and swaps its icon for a check mark — but only once
		the write has actually resolved. The swap is the loader gallery's
		<code>IconSwap</code> component rebuilt on a Svelte transition, with no animation library.
	{/snippet}

	<DocSection title="Icon only">
		{#snippet blurb()}
			The default. With no label the button sizes itself square and names itself “Copy”, so it is
			still announced even though the only visible thing about it is a glyph. Both buttons below
			override that name anyway, and deliberately: two controls that are each just “Copy” name
			nothing, since a name is only useful when it separates a control from its neighbours.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-3">
				<div
					class="flex items-center gap-3 rounded-md border bg-muted/40 py-1.5 pr-1.5 pl-3 font-mono text-sm"
				>
					<span class="truncate">{INSTALL_COMMAND}</span>
					<CopyButton value={INSTALL_COMMAND} aria-label="Copy install command" />
				</div>
				<div
					class="flex items-center gap-3 rounded-md border bg-muted/40 py-1.5 pr-1.5 pl-3 font-mono text-sm"
				>
					<span class="truncate">{SHARE_URL}</span>
					<CopyButton value={SHARE_URL} aria-label="Copy share link" />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With a label">
		{#snippet blurb()}
			Pass label and the button grows text beside the icon. The text stays put while the receipt is
			up — swapping it for “Copied” would change the button's width mid-animation, which is the
			reflow the stacked icons exist to avoid. The check mark and the success ground carry the
			receipt; copiedLabel is what a screen reader hears.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-center gap-3">
					<CopyButton value={API_KEY} label="Copy API key" />
					<CopyButton
						value={SHARE_URL}
						label="Copy share link"
						variant="secondary"
						onCopy={(text) => toast.success("Link copied", { description: text })}
					/>
				</div>
				<p class="mt-3 text-sm text-muted-foreground">
					The second one raises a toast from <code>onCopy</code>, which fires only after the write
					has resolved — so the toast is a receipt too.
				</p>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sizes and variants">
		{#snippet blurb()}
			Both are passed straight through to Button, so this component sits on the same ramp as
			everything else — the `--control-h-*` tokens: sm 32px, default 40px, lg 48px. The copied
			ground is the house soft family — bg-success-subtle under success-subtle-foreground — and it
			overrides whichever variant is underneath for as long as the receipt lasts.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-6">
				<div class="flex flex-wrap items-center gap-3">
					<CopyButton value={SHARE_URL} size="icon-sm" aria-label="Copy share link, small" />
					<CopyButton value={SHARE_URL} size="icon" aria-label="Copy share link, medium" />
					<CopyButton value={SHARE_URL} size="icon-lg" aria-label="Copy share link, large" />
					<Badge variant="secondary">icon-sm · icon · icon-lg</Badge>
				</div>
				<div class="flex flex-wrap items-center gap-3">
					<CopyButton value={SHARE_URL} label="Small" size="sm" />
					<CopyButton value={SHARE_URL} label="Default" />
					<CopyButton value={SHARE_URL} label="Large" size="lg" />
				</div>
				<div class="flex flex-wrap items-center gap-3">
					<CopyButton value={SHARE_URL} label="Outline" />
					<CopyButton value={SHARE_URL} label="Secondary" variant="secondary" />
					<CopyButton value={SHARE_URL} label="Ghost" variant="ghost" />
					<CopyButton value={SHARE_URL} label="Filled" variant="default" />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Lazily produced text">
		{#snippet blurb()}
			Hand value a function instead of a string and nothing is produced until the click. Return a
			promise and the button shows a spinner while it waits, then the receipt; return a string and
			it never shows one, so an ordinary copy does not flash a spinner for a frame.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Region</Table.Head>
							<Table.Head>Revenue</Table.Head>
							<Table.Head>Growth</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each EXPORT_ROWS as row (row.region)}
							<Table.Row>
								<Table.Cell class="font-medium">{row.region}</Table.Cell>
								<Table.Cell class="text-muted-foreground">
									{row.revenue.toLocaleString("en-US")}
								</Table.Cell>
								<Table.Cell class="text-muted-foreground">{row.growth}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
				<div class="flex flex-wrap items-center gap-3">
					<CopyButton
						value={buildExportCsv}
						label="Copy as CSV"
						timeout={3000}
						onCopy={() => toast.success("Export copied", { description: "3 rows as CSV" })}
					/>
					<span class="text-sm text-muted-foreground">
						Serialised on click, after a 600ms wait — a click during that wait is ignored rather
						than starting a second export.
					</span>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="When the clipboard refuses">
		{#snippet blurb()}
			The receipt appears only once writeText resolves. navigator.clipboard is undefined on an
			insecure origin and rejects outright when permission is denied, and a check mark for a copy
			that did not happen is a lie the reader cannot detect until they paste. On failure the button
			stays exactly as it was, the live region says so, and onCopyError fires.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-3">
				<div class="flex flex-wrap items-center gap-3">
					<CopyButton
						value={refuseToProduce}
						label="Copy (this one fails)"
						variant="secondary"
						onCopyError={(error) =>
							toast.error("Nothing was copied", {
								description: error instanceof Error ? error.message : String(error),
							})}
					/>
					<span class="text-sm text-muted-foreground">No check mark, no success ground.</span>
				</div>
				<p class="text-sm text-muted-foreground">
					The demo forces the failure from a producer that throws, because a real refusal cannot be
					staged from a page served over HTTPS with permission already granted. It lands in the same
					<code>catch</code>, so what you see here is what a real refusal looks like. The component
					announces the failure and stops there; anything visible — this toast — is the caller's,
					because only the caller knows where it belongs.
				</p>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Motion and announcements">
		{#snippet blurb()}
			What the animation carries, and what it does not.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-3 text-sm text-muted-foreground">
				<p>
					The swap is upstream's exactly: one keyed element entering and leaving on the same
					opacity, scale and blur curve, so the outgoing icon and the incoming one cross in place
					instead of the second waiting for the first. Upstream asks for a spring with
					<code>bounce: 0</code>, which is critically damped and has no overshoot at all, so the
					honest CSS approximation is an ease-out rather than one of the springy curves that would
					read as livelier and be a different animation.
				</p>
				<p>
					Under <code>prefers-reduced-motion</code> the swap collapses to a single frame and the hover
					scale drops out, but the receipt still appears — the check mark, the success ground and the
					announcement are information, not decoration, and none of them is motion.
				</p>
				<p>
					The swap itself is <code>aria-hidden</code>: a glyph exchanging places tells a screen
					reader nothing. The state change is announced once by a visually hidden live region
					outside the button, rather than by flipping the button's <code>aria-label</code> — a changing
					accessible name renames the control, so a reader who tabs back a moment later would hear “Copied”
					as the name of a button that copies.
				</p>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">CopyButton</h3>
			<p class="text-sm text-muted-foreground">
				The only part. There is no <code>child</code> snippet: the swap is the content of the button,
				so an element you rendered yourself would get the wiring and the receipt classes but none of the
				animation.
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
							{#each props as row (row.prop)}
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
