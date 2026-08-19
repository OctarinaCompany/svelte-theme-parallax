<script lang="ts">
	import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";
	import * as Kbd from "$lib/components/ui/kbd/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
	import CircleDashedIcon from "@lucide/svelte/icons/circle-dashed";
	import SearchIcon from "@lucide/svelte/icons/search";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Kbd component page, ported from shadcn-svelte's documentation
	 * (https://shadcn-svelte.com/docs/components/kbd) — the demo, then Group, Button, Tooltip
	 * and Input group, in that order.
	 *
	 * WHAT THE CLASSIC THEME HAS. Nothing of its own: `kbd` appears nowhere in the reference source, no
	 * `kbd-*` variable is overridden in the reference stylesheet or the reference stylesheet, and
	 * the reference docs never documents the element. What the theme renders is
	 * therefore stock the classic framework (the classic framework source, imported by the reference stylesheet)
	 * resolved against the classic theme's tokens.
	 *
	 * That makes this the one page that keeps shadcn's component as shipped, on purpose. The
	 * classic-framework chip is real and quite different, and the comment above {@link tooltipKey}
	 * measures it property by property — but it is inherited default rather than a classic
	 * decision, so there is nothing here to be faithful to. Only the tooltip case is corrected,
	 * and only because the classic theme's tooltip ground would make shadcn's default unreadable.
	 *
	 * WHAT IS DELIBERATELY NOT PORTED. The classic framework also ships
	 *
	 *   kbd kbd { padding: 0; font-size: 1em }
	 *
	 * because in its markup a nested `<kbd>` is a key INSIDE one combination chip — the outer
	 * element is painted and the inner ones are bare text. `Kbd.Group` is literally a `<kbd>`
	 * wrapping `<kbd>` children, so that rule would apply to it. It is not reproduced: shadcn
	 * uses `Kbd.Group` as a transparent flex wrapper for both readings, and the docs' own Group
	 * example puts two SEPARATE shortcuts ("Ctrl + B", "Ctrl + K") inside one group. Painting
	 * the group would merge them into a single chip and lose the example's meaning. The group
	 * therefore keeps shadcn's layout-only treatment, and its `gap-1` has no classic
	 * counterpart at all.
	 *
	 * The input group in the last section is otherwise left at shadcn's defaults — porting
	 * the classic theme's `.input-group` belongs to that component's own page, not to this one.
	 */

	/**
	 * THE CHIP KEEPS SHADCN'S OWN TREATMENT — `h-5 min-w-5 px-1`, `rounded-sm bg-muted`,
	 * `font-sans text-xs font-medium text-muted-foreground` — and this page overrides none of
	 * it. That is a decision, and it is the one place in these pages where the theme knowingly
	 * declines to follow the compiled CSS.
	 *
	 * the classic rule does reach this theme. Read out of the classic theme's own bundle:
	 *
	 *   kbd, pre, samp { font-family: var(--bs-font-monospace); font-size: 1em }
	 *   kbd { background-color: var(--bs-body-color); color: var(--bs-body-bg);
	 *         font-size: 87.5%; padding: .1875rem .375rem; border-radius: .25rem }
	 *
	 * — an INVERTED chip (dark on the light theme, white on the dark one) set in the monospace
	 * stack at 87.5% of whatever it sits in, so it shrinks with its context.
	 *
	 * But the classic theme never opted into any of that: no `kbd-*` override in the reference stylesheet or
	 * the reference stylesheet, no mention of the element anywhere in the reference source, and
	 * the reference docs never renders one. It is the classic framework default passing through
	 * untouched, so unlike `.form-control` or `.nav-tabs` there is no classic intent here to be
	 * faithful TO — and the inverted chip reads as a heavy black block against the classic theme's very
	 * light surfaces. `EmptyPage` reached the same conclusion independently.
	 *
	 * The radius agrees either way: `border-radius-sm` is 0.25rem, which is what `rounded-sm`
	 * already resolves to in this theme.
	 */

	/**
	 * The single exception, and it is a correction rather than a restyle: it puts the chip back
	 * to what it is everywhere else, having been moved off it by the component.
	 *
	 * shadcn dims the chip inside a tooltip (`bg-background/20 text-background`) because ITS
	 * tooltip is a dark chip. This theme's is not — the `app.css` rule aligns the tooltip on the
	 * popover surface, which is `--popover`: #FFFFFF in light and #152E4D in dark, i.e. exactly
	 * `--card` in both. So a chip inside a tooltip sits on the same ground as a chip on a card,
	 * and wants the same treatment; shadcn's near-white type would simply be unreadable on it.
	 *
	 * Each class restates the variant it replaces, which is what lets tailwind-merge evict the
	 * default — an unprefixed utility does not conflict with a prefixed one, so both would
	 * survive and stylesheet order would pick the winner.
	 */
	const tooltipKey =
		"in-data-[slot=tooltip-content]:bg-muted in-data-[slot=tooltip-content]:text-muted-foreground dark:in-data-[slot=tooltip-content]:bg-muted";

	/**
	 * `.btn-white` at `.btn-sm`, both exactly as derived on the Buttons page: 13px x 1.75
	 * line-height + 2 x `btn-padding-y-sm` (.125rem) + 2px border = 28.75px in the reference
	 * (rendered at the ramp's `--control-h-sm`, 32px), and
	 * `border-radius-sm` for the corner.
	 *
	 * `.btn-white` rather than shadcn's `outline` variant because that is the classic theme's own answer
	 * to a bordered button over a light ground — the card surface with a visible outline.
	 *
	 * The docs write `class="pe-2"` on these buttons to tighten the side the chip sits on.
	 * That is not carried over: `btn-padding-x-sm` is `.5rem`, so a classic small button is
	 * already at the 8px `pe-2` asks for, on both sides.
	 */
	const buttonSm = "h-(--control-h-sm) rounded-sm px-2 text-xs font-normal";
	const buttonWhite =
		"border-border bg-card text-card-foreground hover:bg-accent dark:hover:bg-background";

	/** As on the Buttons page: `cn()` so tailwind-merge evicts `buttonVariants()`' defaults. */
	const btn = (...classes: string[]) => cn(buttonVariants(), ...classes);

	/**
	 * The classic framework joins grouped buttons by keeping every border and pulling each one 1px left
	 * (`margin-left: calc(var(--bs-border-width) * -1)`), where shadcn drops the left border of
	 * every button after the first. Derived and measured on the Button group page; it matters
	 * here because `.btn-white` has a visible outline, which is precisely the case where the two
	 * constructions stop looking alike.
	 *
	 * `rounded-r-sm!` overrides `buttonGroupVariants`' hardcoded `rounded-r-md!` on the last
	 * child: `.btn-group-sm > .btn` sets the group's outer corners to `border-radius-sm`.
	 */
	const seam =
		"[&>[data-slot]~[data-slot]]:-ml-px [&>[data-slot]~[data-slot]]:border-l [&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-sm! inline-flex align-middle";

	/** The docs' demo keys: the four macOS modifiers, then a spelled-out combination. */
	const modifiers = ["⌘", "⇧", "⌥", "⌃"];

	/** The reference list from Demo 6, data unchanged. */
	const referenceShortcuts = [
		{ label: "Search", keys: ["⌘", "K"] },
		{ label: "New File", keys: ["⌘", "N"] },
		{ label: "Save", keys: ["⌘", "S"] },
		{ label: "Undo", keys: ["⌘", "Z"] },
		{ label: "Redo", keys: ["⌘", "⇧", "Z"] },
	];
</script>

<DocPage title="Kbd">
	{#snippet subtitle()}
		Used to display textual user input from keyboard. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/kbd"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content class="flex flex-col items-center gap-4">
			<Kbd.Group>
				{#each modifiers as modifier (modifier)}
					<Kbd.Root>{modifier}</Kbd.Root>
				{/each}
			</Kbd.Group>
			<Kbd.Group>
				<Kbd.Root>Ctrl</Kbd.Root>
				<span>+</span>
				<Kbd.Root>B</Kbd.Root>
			</Kbd.Group>
		</Card.Content>
	</Card.Root>

	<DocSection title="Group">
		{#snippet blurb()}
			Use the <code class="text-[87.5%] text-primary">Kbd.Group</code> component to group keyboard keys
			together.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col items-center gap-4">
				<p class="text-sm text-muted-foreground">
					Use
					<Kbd.Group>
						<Kbd.Root>Ctrl + B</Kbd.Root>
						<Kbd.Root>Ctrl + K</Kbd.Root>
					</Kbd.Group>
					to open the command palette
				</p>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button">
		{#snippet blurb()}
			Use the <code class="text-[87.5%] text-primary">Kbd.Root</code> component inside a
			<code class="text-[87.5%] text-primary">Button</code> component to display a keyboard key inside
			a button.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-wrap items-center gap-4">
				<!--
					The chip is a fixed `h-5 text-xs` inside a 28.75px `.btn-sm`, which is shadcn's own
					proportion and the one the docs show. The classic framework would have sized it as 87.5% of the
					button's 13px — 11.4px, shrinking with its host — but that ratio goes with the
					treatment this page declined; see {@link tooltipKey}'s neighbouring comment.
				-->
				<button type="button" class={btn(buttonSm, buttonWhite)}>
					Accept <Kbd.Root>⏎</Kbd.Root>
				</button>
				<button type="button" class={btn(buttonSm, buttonWhite)}>
					Cancel <Kbd.Root>Esc</Kbd.Root>
				</button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tooltip">
		{#snippet blurb()}
			You can use the <code class="text-[87.5%] text-primary">Kbd.Root</code> component inside a
			<code class="text-[87.5%] text-primary">Tooltip</code> component to display a tooltip with a keyboard
			key.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-wrap gap-4">
				<!-- `delayDuration={0}`: the classic tooltips have no delay. As on the Tooltips page. -->
				<Tooltip.Provider delayDuration={0}>
					<ButtonGroup.Root class={seam}>
						<Tooltip.Root>
							<Tooltip.Trigger class={btn(buttonSm, buttonWhite)}>Save</Tooltip.Trigger>
							<!--
								The three tooltip classes are the recipe derived on the Tooltips page:
								`tooltip-max-width: 200px`, `.tooltip-inner`'s centring, and the classic theme's
								inversion of the classic dark tooltip (`tooltip-bg: gray-300` with
								`tooltip-color: black` and `tooltip-opacity: 1`), whose light-mode value
								has no exact token — `--secondary` is #EDF2F9 against `gray-300`'s #E3EBF6,
								one step lighter. That light ground is what {@link tooltipKey} exists for.
							-->
							<Tooltip.Content class="max-w-[200px] text-center">
								<div class="flex items-center gap-2">
									Save Changes <Kbd.Root class={tooltipKey}>S</Kbd.Root>
								</div>
							</Tooltip.Content>
						</Tooltip.Root>
						<Tooltip.Root>
							<Tooltip.Trigger class={btn(buttonSm, buttonWhite)}>Print</Tooltip.Trigger>
							<Tooltip.Content class="max-w-[200px] text-center">
								<div class="flex items-center gap-2">
									Print Document
									<Kbd.Group>
										<Kbd.Root class={tooltipKey}>Ctrl</Kbd.Root>
										<Kbd.Root class={tooltipKey}>P</Kbd.Root>
									</Kbd.Group>
								</div>
							</Tooltip.Content>
						</Tooltip.Root>
					</ButtonGroup.Root>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input group">
		{#snippet blurb()}
			You can use the <code class="text-[87.5%] text-primary">Kbd.Root</code> component inside an
			<code class="text-[87.5%] text-primary">InputGroup.Addon</code> component to display a keyboard
			key inside an input group.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full max-w-xs flex-col gap-6">
					<!--
						`h-10` is `input-height` resolved the same way the Buttons page resolves the
						button heights: 15px x 1.5 line-height + 2 x `input-btn-padding-y` (.5rem) +
						2 x 1px border = 40.5px. shadcn's `h-9` is 36px. Nothing else about the input
						group is touched here — its classic port belongs to its own page.
					-->
					<InputGroup.Root class="h-10">
						<InputGroup.Input placeholder="Search..." />
						<InputGroup.Addon>
							<SearchIcon />
						</InputGroup.Addon>
						<InputGroup.Addon align="inline-end">
							<!--
								`inputGroupAddonVariants` tightens the corner of a nested chip to
								`[&>kbd]:rounded-[calc(var(--radius)-5px)]`, which collapses to 1px against
								this theme's `--radius` — the formula assumes shadcn's 0.625rem. The
								`app.css` rule for the input group's corners puts all four of its uses back
								on `border-radius-sm`, so nothing is needed here.
							-->
							<Kbd.Root>⌘</Kbd.Root>
							<Kbd.Root>K</Kbd.Root>
						</InputGroup.Addon>
					</InputGroup.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Keyboard keys combined with icons">
		{#snippet blurb()}
			A key can carry an icon next to its label — the chip already lays its content out as a flex
			row.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<!--
					Demo 3. The chip sizes any inline svg itself
					(`[&_svg:not([class*='size-'])]:size-3` in kbd.svelte), so the icons take no
					sizing classes here.
				-->
				<Kbd.Group>
					<Kbd.Root>
						<ArrowLeftIcon />
						Left
					</Kbd.Root>
					<Kbd.Root>
						<CircleDashedIcon />
						Voice Enabled
					</Kbd.Root>
				</Kbd.Group>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Keyboard shortcuts reference list">
		{#snippet blurb()}
			Rows of label + <code class="text-[87.5%] text-primary">Kbd.Group</code> make a compact shortcuts
			reference, the kind a help dialog would show.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 6, data unchanged. Upstream draws a <Separator> under the
					heading and then per-row `border-b ... last:border-b-0` dividers, so only the
					heading rule is the component — kept as such rather than flattened into a
					uniform divide-y, to stay faithful to the source's construction.
				-->
				<div class="mx-auto flex w-full max-w-xs flex-col">
					<p class="mb-3 text-sm font-medium">Keyboard Shortcuts</p>
					<Separator />
					<div class="flex flex-col">
						{#each referenceShortcuts as shortcut (shortcut.label)}
							<div class="flex items-center justify-between border-b py-2.5 last:border-b-0">
								<span class="text-sm text-muted-foreground">{shortcut.label}</span>
								<Kbd.Group>
									{#each shortcut.keys as key, i (i)}
										<Kbd.Root>{key}</Kbd.Root>
									{/each}
								</Kbd.Group>
							</div>
						{/each}
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
