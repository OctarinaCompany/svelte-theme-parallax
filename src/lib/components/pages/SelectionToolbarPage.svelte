<script lang="ts">
	import BoldIcon from "@lucide/svelte/icons/bold";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import ItalicIcon from "@lucide/svelte/icons/italic";
	import LinkIcon from "@lucide/svelte/icons/link";
	import Share2Icon from "@lucide/svelte/icons/share-2";

	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as SelectionToolbar from "$lib/components/ui/selection-toolbar/index.js";
	import * as Table from "$lib/components/ui/table/index.js";

	/**
	 * The Selection toolbar component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. A toolbar that follows a text selection is not an object
	 * the classic framework models at all.
	 *
	 * It is a floating surface, so it lands on `--popover` and the radius scale like the action
	 * bar and every menu; its buttons are the theme's ghost buttons at icon size.
	 */

	// Default
	let editorElement = $state<HTMLDivElement | null>(null);
	let lastAction = $state("");

	// With selection info
	let infoElement = $state<HTMLDivElement | null>(null);
	let selectedText = $state("");

	const wordCount = $derived(selectedText.trim().split(/\s+/).filter(Boolean).length);
	const charCount = $derived(selectedText.length);

	/** Upstream's `wrapSelection`, including the re-select that keeps the toolbar on the new node. */
	function wrapSelection(tagName: string, decorate?: (element: HTMLElement) => void) {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;

		const range = selection.getRangeAt(0);
		const text = range.toString();
		if (!text) return;

		const wrapper = document.createElement(tagName);
		decorate?.(wrapper);

		try {
			range.surroundContents(wrapper);
		} catch {
			// `surroundContents` throws when the range straddles element boundaries.
			wrapper.textContent = text;
			range.deleteContents();
			range.insertNode(wrapper);
		}

		selection.removeAllRanges();
		const next = document.createRange();
		next.selectNodeContents(wrapper);
		selection.addRange(next);
	}

	function clearSelection() {
		window.getSelection()?.removeAllRanges();
	}

	function onBold() {
		wrapSelection("strong");
		lastAction = "bold";
	}

	function onItalic() {
		wrapSelection("em");
		lastAction = "italic";
	}

	function onLink() {
		// Upstream calls `prompt()` here; many browsers block it and it cannot be exercised in a
		// preview, so the demo links to a fixed placeholder instead.
		wrapSelection("a", (element) => {
			(element as HTMLAnchorElement).href = "https://svelte.dev";
			element.className = "text-primary underline hover:text-primary/80";
		});
		lastAction = "link";
	}

	function onCopy(text: string) {
		void navigator.clipboard?.writeText(text);
		lastAction = `copy: ${text}`;
		clearSelection();
	}

	function onShare(text: string) {
		void navigator.share?.({ text });
		lastAction = `share: ${text}`;
		clearSelection();
	}

	function onInfoCopy(text: string) {
		void navigator.clipboard?.writeText(text);
	}

	const rootProps = [
		{
			prop: "open",
			type: "boolean",
			default: "false",
			description:
				"Controlled open state. Bindable; a new selection may still open the toolbar, as upstream.",
		},
		{
			prop: "onOpenChange",
			type: "(open: boolean) => void",
			default: "—",
			description: "Called on every open/close transition, in both modes.",
		},
		{
			prop: "onSelectionChange",
			type: "(text: string) => void",
			default: "—",
			description: 'Called on every tracked selection change, including `""` when it is cleared.',
		},
		{
			prop: "container",
			type: "HTMLElement | null",
			default: "undefined",
			description:
				"Restricts tracking to selections inside this element. `null` means “scoped but not resolved yet” and suspends tracking.",
		},
		{
			prop: "portalContainer",
			type: "Element | DocumentFragment | string | null",
			default: "document.body",
			description: "Where the surface is portalled to. `null` also means `document.body`.",
		},
		{
			prop: "side",
			type: "'top' | 'right' | 'bottom' | 'left'",
			default: "'top'",
			description: "Preferred side of the selection to render against.",
		},
		{
			prop: "sideOffset",
			type: "number",
			default: "8",
			description: "Distance in px between the selection and the toolbar.",
		},
		{
			prop: "align",
			type: "'start' | 'center' | 'end'",
			default: "'center'",
			description: "Preferred alignment against the selection.",
		},
		{
			prop: "alignOffset",
			type: "number",
			default: "0",
			description: "Offset in px from the `start` or `end` alignment.",
		},
		{
			prop: "avoidCollisions",
			type: "boolean",
			default: "true",
			description: "Whether the toolbar flips and shifts away from collisions.",
		},
		{
			prop: "collisionBoundary",
			type: "Element | null | (Element | null)[]",
			default: "[]",
			description: "Elements collision detection measures against. `null` entries are ignored.",
		},
		{
			prop: "collisionPadding",
			type: "number | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>",
			default: "0",
			description: "Virtual padding around the boundary edges.",
		},
		{
			prop: "sticky",
			type: "'partial' | 'always'",
			default: "'partial'",
			description: "Whether the toolbar stays fully in view or may detach.",
		},
		{
			prop: "hideWhenDetached",
			type: "boolean",
			default: "false",
			description: "Hides — without closing — when the selection scrolls out of view.",
		},
		{
			prop: "updatePositionStrategy",
			type: "'optimized' | 'always'",
			default: "'optimized'",
			description: "`always` repositions on every animation frame.",
		},
		{
			prop: "dir",
			type: "'ltr' | 'rtl'",
			default: "inherited",
			description:
				"Reading direction. Falls back to the nearest `DirectionProvider`, then the DOM `dir`, then `ltr`.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the surface. Not populated in `child` mode.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: SelectionToolbarChildProps }]>",
			default: "—",
			description: "Render the toolbar onto your own element. Replaces upstream’s `asChild`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the surface. A caller `style` is appended after the CSS variables.",
		},
	];

	const itemProps = [
		{
			prop: "onSelect",
			type: "(text: string, event: SelectionToolbarItemSelectEvent) => void",
			default: "—",
			description: "Called with the text selected at activation time, and with the DOM event.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: "'ghost'",
			description: "Forwarded to the underlying `Button`.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: "'icon'",
			description: "Forwarded to the underlying `Button`.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "undefined",
			description: "Suppresses activation, on every input path.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered button. Stays `null` in `child` mode.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: SelectionToolbarItemChildProps }]>",
			default: "—",
			description: "Render the item onto your own element.",
		},
		{
			prop: "...restProps",
			type: "ButtonProps",
			default: "—",
			description:
				"Spread onto the element. Caller `onclick`, `onpointerdown` and `onpointerup` all run first and may `preventDefault()` the activation.",
		},
	];

	const separatorProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: SelectionToolbarSeparatorChildProps }]>",
			default: "—",
			description: "Render the separator onto your own element.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Spread onto the element.",
		},
	];

	const cssVariables = [
		{
			name: "--selection-toolbar-available-width",
			description: "Width available to the toolbar, accounting for collision boundaries.",
		},
		{
			name: "--selection-toolbar-available-height",
			description: "Height available to the toolbar, accounting for collision boundaries.",
		},
		{ name: "--selection-toolbar-anchor-width", description: "Width of the selected text." },
		{ name: "--selection-toolbar-anchor-height", description: "Height of the selected text." },
	];

	const keyboard = [
		{ keys: "Escape", description: "Closes the toolbar and clears the text selection." },
		{ keys: "Tab", description: "Moves through the items — each one is its own tab stop." },
		{
			keys: "Enter / Space",
			description: "Activates the focused item through native button semantics.",
		},
	];
</script>

<DocPage title="Selection toolbar">
	{#snippet subtitle()}
		A floating toolbar that appears on text selection with formatting and utility actions.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			Select any text inside the editable card to raise the toolbar.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full flex-col gap-4">
					<div
						bind:this={editorElement}
						contenteditable="true"
						role="textbox"
						tabindex="0"
						aria-label="Editable article"
						class="flex flex-col gap-4 rounded-lg border bg-card p-8 text-card-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
					>
						<h2 class="text-2xl font-semibold">Medium-Style Text Selection</h2>
						<p class="leading-relaxed text-muted-foreground">
							Select any text in this area to see the floating toolbar appear. The toolbar
							automatically positions itself above the selection and includes common formatting
							options like bold, italic, and link, as well as utility actions like copy and share.
						</p>
						<p class="leading-relaxed text-muted-foreground">
							Try selecting text across multiple lines or near the edges of the viewport. The menu
							will automatically adjust its position to stay visible and accessible. This creates a
							seamless editing experience similar to popular writing platforms.
						</p>
					</div>

					<!-- Outside the tracked container on purpose: selecting here raises nothing. -->
					<p class="text-sm text-muted-foreground">
						This paragraph sits outside the tracked container, so selecting it leaves the toolbar
						closed.
					</p>

					{#if lastAction}
						<p class="text-sm text-muted-foreground">
							Last action: <span class="font-medium text-foreground">{lastAction}</span>
						</p>
					{/if}

					<SelectionToolbar.Root container={editorElement}>
						<SelectionToolbar.Item onSelect={onBold}>
							<BoldIcon />
							<span class="sr-only">Bold</span>
						</SelectionToolbar.Item>
						<SelectionToolbar.Item onSelect={onItalic}>
							<ItalicIcon />
							<span class="sr-only">Italic</span>
						</SelectionToolbar.Item>
						<SelectionToolbar.Item onSelect={onLink}>
							<LinkIcon />
							<span class="sr-only">Link</span>
						</SelectionToolbar.Item>
						<SelectionToolbar.Separator />
						<SelectionToolbar.Item onSelect={onCopy}>
							<CopyIcon />
							<span class="sr-only">Copy</span>
						</SelectionToolbar.Item>
						<SelectionToolbar.Item onSelect={onShare}>
							<Share2Icon />
							<span class="sr-only">Share</span>
						</SelectionToolbar.Item>
					</SelectionToolbar.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With selection info">
		{#snippet blurb()}
			`onSelectionChange` drives a live word and character count.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full flex-col gap-4">
					<div
						bind:this={infoElement}
						contenteditable="true"
						role="textbox"
						tabindex="0"
						aria-label="Editable article with selection info"
						class="flex flex-col gap-4 rounded-lg border bg-card p-8 text-card-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
					>
						<h2 class="text-2xl font-semibold">Selection Info Tracking</h2>
						<p class="leading-relaxed text-muted-foreground">
							Select any text to see the toolbar and track selection information below. The
							component provides callbacks to monitor selected text and implement custom behavior.
						</p>
						<p class="leading-relaxed text-muted-foreground">
							Try selecting different portions of text to see real-time updates of the word count
							and character count. This demonstrates how you can track and respond to selection
							changes.
						</p>
					</div>

					{#if selectedText}
						<div class="flex flex-col gap-2 rounded-lg border bg-muted/50 p-4">
							<div class="text-sm font-medium">Selection Info</div>
							<div class="grid grid-cols-2 gap-4 text-sm">
								<div>
									<span class="text-muted-foreground">Words: </span>
									<span class="font-medium">{wordCount}</span>
								</div>
								<div>
									<span class="text-muted-foreground">Characters: </span>
									<span class="font-medium">{charCount}</span>
								</div>
							</div>
							<div class="text-xs text-muted-foreground">
								<span class="font-medium">Selected text: </span>
								"{selectedText.length > 50 ? `${selectedText.slice(0, 50)}…` : selectedText}"
							</div>
						</div>
					{/if}

					<SelectionToolbar.Root
						container={infoElement}
						onSelectionChange={(text) => (selectedText = text)}
					>
						<SelectionToolbar.Item onSelect={onBold}>
							<BoldIcon />
							<span class="sr-only">Bold</span>
						</SelectionToolbar.Item>
						<SelectionToolbar.Item onSelect={onItalic}>
							<ItalicIcon />
							<span class="sr-only">Italic</span>
						</SelectionToolbar.Item>
						<SelectionToolbar.Separator />
						<SelectionToolbar.Item onSelect={onInfoCopy}>
							<CopyIcon />
							<span class="sr-only">Copy</span>
						</SelectionToolbar.Item>
					</SelectionToolbar.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">SelectionToolbar.Root</h3>
			<p class="text-sm text-muted-foreground">
				The floating <code>role="toolbar"</code> surface. It renders nothing while closed, is
				portalled to <code>document.body</code> while open, and carries
				<code>data-state="open"</code>, <code>data-side</code> and <code>data-align</code>.
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
			<h3 class="text-base font-medium">SelectionToolbar.Item</h3>
			<p class="text-sm text-muted-foreground">
				A button inside the toolbar. A mouse press is default-prevented so the selection survives
				and activation happens on <code>pointerup</code>; touch, pen and keyboard activate on
				<code>click</code>. Each activation dispatches a bubbling, cancelable
				<code>selectiontoolbar.select</code> event carrying the selected text.
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
			<h3 class="text-base font-medium">SelectionToolbar.Separator</h3>
			<p class="text-sm text-muted-foreground">
				A decorative divider — <code>role="separator"</code> with
				<code>aria-hidden="true"</code>, exactly as upstream.
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
							{#each separatorProps as row (row.prop)}
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
				Written onto the open surface, so the toolbar can size itself against the space it has.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Name</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each cssVariables as row (row.name)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.name}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Keyboard interactions</h3>
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
