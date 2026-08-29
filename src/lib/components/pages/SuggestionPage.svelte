<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Suggestion from "$lib/components/ui/suggestion/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import { AI_CHAT_STARTERS } from "$lib/data/ai-chat.js";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Suggestion component page.
	 *
	 * Every demo uses the same four starters the rest of the AI chat family shares, because a
	 * suggestion strip is only ever seen beside a prompt input and a transcript, and the reader
	 * moving between those pages should meet the same conversation on each.
	 */

	/** The draft the "Filling the prompt" demo writes into. */
	let draft = $state("");

	/** Whether the "Vetoing a selection" demo's composer is locked. */
	let locked = $state(false);

	/** What the vetoing demo last did with a press. */
	let outcome = $state<string | null>(null);

	function guard(event: MouseEvent) {
		if (!locked) return;
		event.preventDefault();
		outcome = "Vetoed — the composer is locked.";
	}

	function accept(suggestion: string) {
		outcome = `Selected “${suggestion}”.`;
	}

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description:
				'Bindable reference to the scroll container — the element carrying `data-slot="suggestion"` — not the inner strip.',
		},
		{
			prop: "layout",
			type: "'scroll' | 'wrap'",
			default: "'scroll'",
			description:
				"How the strip lays its chips out. `scroll` keeps them on one line inside a horizontal scroll container that fades the edge where chips hide; `wrap` lets them flow onto as many lines as they need, and the container then has nothing to scroll. An unknown runtime value normalises to `scroll`.",
		},
		{
			prop: "hideScrollbar",
			type: "boolean",
			default: "true",
			description:
				"Hides the scroll container's native scrollbar, as upstream does. Pass `false` to show it; the edge fade stays either way.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged onto the inner strip, not the scroll container — upstream parity, and the only element where a layout class such as `justify-center` means anything.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The chips. Rendered inside the strip.",
		},
		{
			prop: "...restProps",
			type: "Omit<ScrollerRootProps, 'orientation' | 'child' | 'hideScrollbar'>",
			default: "—",
			description:
				"Every other attribute and DOM handler is spread onto the Scroller, so `size`, `offset`, `withNavigation`, `scrollStep`, `scrollTriggerMode`, `dir` and `style` tune the container exactly as on Scroller itself. `orientation` is fixed to `horizontal` and `child` is not offered.",
		},
	];

	const itemProps = [
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<button>`.",
		},
		{
			prop: "suggestion",
			type: "string",
			default: "— (required)",
			description:
				"The suggestion this chip offers: the value handed to `onSelect`, and the visible label when `children` is omitted.",
		},
		{
			prop: "onSelect",
			type: "(suggestion: string) => void",
			default: "—",
			description:
				"Called with `suggestion` when the chip is pressed, unless the caller's own `onclick` called `preventDefault()` on the event first. A disabled chip never fires either.",
		},
		{
			prop: "onclick",
			type: "MouseEventHandler<HTMLButtonElement> | null",
			default: "—",
			description:
				"The DOM click handler, with the native event. Runs before `onSelect`; `event.preventDefault()` vetoes the selection.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: "'outline'",
			description:
				"The Button variant the chip wears: `default`, `outline`, `secondary`, `ghost`, `destructive` or `link`.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: "'sm'",
			description:
				"The Button size the chip wears: `xs`, `sm`, `default`, `lg` or one of the icon sizes. The height comes from the control ramp, so `h-auto` in `class` still wins.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged after `rounded-full px-4`, so it overrides the pill. `h-auto whitespace-normal py-1.5 text-left` turns a chip multi-line.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Custom chip content. When omitted, the chip shows `suggestion`.",
		},
		{
			prop: "...restProps",
			type: "Omit<ButtonProps, 'href' | 'onclick'>",
			default: "—",
			description:
				"Every other Button prop and attribute — `disabled`, `aria-label`, `type` — is spread onto the button. `href` is not offered: a suggestion is a command, not a destination.",
		},
	];

	const dataAttributes = [
		{
			attribute: "[data-slot]",
			part: "Suggestion.Root",
			values: "suggestion — on the scroll container, replacing the Scroller's own stamp",
		},
		{
			attribute: "[data-slot]",
			part: "Suggestion.Root (strip)",
			values: "suggestion-strip — the inner flex row `class` lands on",
		},
		{
			attribute: "[data-slot]",
			part: "Suggestion.Item",
			values: 'suggestion-item — replaces the Button\'s own data-slot="button"',
		},
		{ attribute: "[data-layout]", part: "Suggestion.Root", values: "scroll | wrap" },
		{ attribute: "[data-orientation]", part: "Suggestion.Root", values: "horizontal" },
		{
			attribute: "[data-hide-scrollbar]",
			part: "Suggestion.Root",
			values: "present while `hideScrollbar` is `true`",
		},
		{
			attribute: "[data-left-scroll] [data-right-scroll] [data-left-right-scroll]",
			part: "Suggestion.Root",
			values: "true — whichever edge currently hides chips, exactly as Scroller stamps them",
		},
		{
			attribute: "[data-size]",
			part: "Suggestion.Item",
			values: "the Button `size` — `sm` by default",
		},
	];

	const keyboard = [
		{
			key: "Tab / Shift+Tab",
			action:
				"Moves focus from chip to chip in DOM order. The scroll container scrolls the focused chip into view, so no chip is out of the keyboard's reach.",
		},
		{
			key: "Enter / Space",
			action: "Presses the focused chip: `onclick` runs, then `onSelect` unless it was vetoed.",
		},
	];
</script>

<DocPage title="Suggestion">
	{#snippet subtitle()}
		A strip of pressable chips that seed the next prompt — the starters under an empty chat and the
		follow-ups after an answer. Each chip is an outline Button rounded into a pill; the strip is a <a
			class="text-primary underline underline-offset-3"
			href={href("/components/scroller")}>Scroller</a
		>
		that fades the edge where chips hide. Reach for
		<a class="text-primary underline underline-offset-3" href={href("/components/badge")}>Badge</a> when
		the chips are labels rather than actions.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			The four starters in a card too narrow to hold them. The strip keeps them on one line and
			scrolls; the fade on the trailing edge is the only sign that more chips exist, because the
			scrollbar is hidden by default. Drag, swipe or a trackpad scroll the strip; a focused chip
			scrolls itself into view.
		{/snippet}

		<Card.Root class="max-w-md">
			<Card.Content>
				<Suggestion.Root>
					{#each AI_CHAT_STARTERS as starter (starter)}
						<Suggestion.Item suggestion={starter} />
					{/each}
				</Suggestion.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Wrapping">
		{#snippet blurb()}
			<code>layout="wrap"</code> lets the chips flow onto as many lines as they need, and the
			container never scrolls. Give each chip
			<code>h-auto whitespace-normal py-1.5 text-left</code> and long starters wrap inside their
			pill instead of stretching it; <code>justify-center</code> on the strip is the empty-state arrangement
			of the origin chat app.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<Suggestion.Root layout="wrap" class="mx-auto max-w-2xl justify-center">
					{#each AI_CHAT_STARTERS as starter (starter)}
						<Suggestion.Item
							suggestion={starter}
							class="h-auto py-1.5 text-left whitespace-normal"
						/>
					{/each}
				</Suggestion.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Filling the prompt">
		{#snippet blurb()}
			<code>onSelect</code> receives the suggestion text, which is all a composer needs: write it into
			the bound draft and the reader can edit before sending. This is the wiring the origin chat app uses
			for its starters.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-3">
					<Textarea bind:value={draft} placeholder="Ask anything…" aria-label="Prompt" />
					<Suggestion.Root>
						{#each AI_CHAT_STARTERS as starter (starter)}
							<Suggestion.Item
								suggestion={starter}
								onSelect={(suggestion) => (draft = suggestion)}
							/>
						{/each}
					</Suggestion.Root>
					<p class="text-sm text-muted-foreground" aria-live="polite">
						{draft ? `Draft: ${draft}` : "The draft is empty."}
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Vetoing a selection">
		{#snippet blurb()}
			The chip's own <code>onclick</code> runs first with the native event, and
			<code>preventDefault()</code> there stops <code>onSelect</code> from firing. A composer that
			must stay untouched while a turn streams can veto without disabling the chips — they stay
			readable, focusable and announced, which a <code>disabled</code> button is not.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-3">
					<div class="flex flex-wrap items-center gap-3">
						<Button
							variant="outline"
							size="sm"
							aria-pressed={locked}
							onclick={() => (locked = !locked)}
						>
							{locked ? "Unlock the composer" : "Lock the composer"}
						</Button>
						<p class="text-sm text-muted-foreground" role="status">
							{outcome ?? "Press a chip."}
						</p>
					</div>
					<Suggestion.Root>
						{#each AI_CHAT_STARTERS as starter (starter)}
							<Suggestion.Item suggestion={starter} onclick={guard} onSelect={accept} />
						{/each}
					</Suggestion.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Navigation buttons">
		{#snippet blurb()}
			Every Scroller prop passes through. <code>withNavigation</code> adds a chevron at each edge
			that still hides chips — the affordance a mouse user with a vertical wheel otherwise lacks —
			and <code>scrollTriggerMode="click"</code> steps one <code>scrollStep</code> per press.
		{/snippet}

		<Card.Root class="max-w-md">
			<Card.Content>
				<Suggestion.Root withNavigation scrollTriggerMode="click" scrollStep={160}>
					{#each AI_CHAT_STARTERS as starter (starter)}
						<Suggestion.Item suggestion={starter} />
					{/each}
				</Suggestion.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Suggestion.Root</h3>
			<p class="text-sm text-muted-foreground">
				The strip. Renders a horizontal <code>Scroller</code> with its scrollbar hidden, wrapping a
				flex row (<code>data-slot="suggestion-strip"</code>) that holds the chips. Upstream's
				<code>Suggestions</code>.
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

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Suggestion.Item</h3>
			<p class="text-sm text-muted-foreground">
				One chip. Renders an outline <code>sm</code> Button rounded into a pill, labelled with the
				suggestion unless <code>children</code> says otherwise. Upstream's
				<code>Suggestion</code>.
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
							{#each itemProps as row (row.prop)}
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

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Keyboard</h3>
			<p class="text-sm text-muted-foreground">
				Native button behaviour, deliberately: the chips are independent commands, not one composite
				widget, so there is no roving focus and no arrow-key contract to learn.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Key</Table.Head>
								<Table.Head>Action</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each keyboard as row (row.key)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.key}</Table.Cell>
									<Table.Cell>{row.action}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>
