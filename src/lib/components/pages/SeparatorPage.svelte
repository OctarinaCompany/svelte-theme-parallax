<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Separator component page, ported from shadcn-svelte's documentation
	 * (`https://shadcn-svelte.com/docs/components/separator.md`).
	 *
	 * That page ships a single demo — a heading and a paragraph, one horizontal rule, then a
	 * row of three links parted by vertical rules — so this page has no `DocSection`s, the
	 * same shape as the Tooltips page.
	 *
	 * WHAT THE CLASSIC THEME HAS. No `Separator` component: the counterpart is the classic `<hr>`, whose
	 * three variables the classic theme does override (the reference stylesheet 248-250):
	 *
	 *   hr-margin-y: 1rem
	 *   hr-color: var(--bs-border-color)
	 *   hr-opacity: 1
	 *
	 * compiling to `hr { border: 0; border-top: var(--bs-border-width) solid;
	 * color: var(--bs-border-color); margin: 1rem 0; opacity: 1 }`. Two of those land on
	 * shadcn's defaults unchanged: `border-width` is 1px, which is `h-px`, and raising
	 * `hr-opacity` from the classic stock `.25` to `1` asks for the border colour at full
	 * strength — exactly what an opaque `bg-border` already paints. The third is the colour,
	 * discussed on the rule itself below.
	 *
	 * `<hr>` is the divider the classic theme actually uses: 73 of them in the reference docs,
	 * most as the `<hr class="my-5">` between documentation sections (which is `spacers.5`,
	 * 36px, since the classic theme's `spacer` is 1.5rem — not Tailwind's 1.25rem).
	 *
	 * WHAT THE CLASSIC THEME DOES NOT HAVE. A vertical rule. The classic `.vr` compiles into the bundle
	 * but the classic theme neither restyles it nor renders it on a single page of the reference demo pages; see the
	 * comment on the vertical separators for what following it literally would cost.
	 *
	 * The other two dividers in the theme are component-internal and stay with their
	 * components rather than with this one: `.dropdown-divider` is the same 1px line at
	 * `margin: .75rem 0` (`dropdown-divider-margin-y`, i.e. the classic `dropdown-padding-y`
	 * = `spacer * .5`) in `rgba(var(--bs-black-rgb), .1)` light / `var(--bs-black)` dark, and
	 * `.navbar-divider` takes `navbar-light-divider-color`, which is `--bs-border-color`
	 * again.
	 */
</script>

<DocPage title="Separator">
	{#snippet subtitle()}
		Visually or semantically separates content. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/separator"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<div>
				<!-- `gap-1` in a flex column, not `space-y-1`, per this repo's Tailwind rules. -->
				<div class="flex flex-col gap-1">
					<!--
						Both type utilities already are the classic theme's, through the type scale in `app.css`:
						`text-sm` is remapped to `font-size-base` (0.9375rem), which is also
						`h4-font-size`, and `font-medium` is `headings-font-weight: 500`. Only the
						line height moves — shadcn's `leading-none` becomes `headings-line-height: 1.1`.
					-->
					<h4 class="text-sm leading-[1.1] font-medium">Bits UI Primitives</h4>
					<!-- `--muted-foreground` is `body-secondary-color` (gray-600), the classic
						`.text-body-secondary`; nothing to change. -->
					<p class="text-sm text-muted-foreground">An open-source UI component library.</p>
				</div>

				<!--
					`my-4` is 1rem, which is `hr-margin-y` exactly. (the classic theme's own markup writes
					`<hr class="my-4">` and gets 24px, because `spacers.4` is `spacer` — the class
					name coincides, the value does not; the 1rem here is the bare `hr` margin.)

					The colour is the one place the theme cannot land the value exactly. `hr-color` is
					`--bs-border-color`, i.e. `border-color: gray-300` (#E3EBF6) in light and
					`border-color-dark: gray-700-dark` (#1E3A5C) in dark. `--border` holds
					`card-border-color = gray-200` (#EDF2F9) in light — one step lighter — and
					#1E3A5C in dark, where it is exact. This is the same gap the Accordion page
					recorded: no token in `app.css` carries gray-300 except `--sidebar-border`, and
					reaching for that name outside the sidebar would not survive review.
				-->
				<Separator class="my-4" />

				<!-- `h-5` gives the vertical rules something to stretch against; `gap-4` replaces the
					docs' `space-x-4`. -->
				<div class="flex h-5 items-center gap-4 text-sm">
					<div>Blog</div>
					<!--
						KEPT AT SHADCN'S `bg-border`, deliberately. The classic theme has no vertical divider of
						its own, so the only counterpart is the classic untouched `.vr`, which compiles
						to `width: var(--bs-border-width); min-height: 1em; align-self: stretch;
						background-color: currentcolor; opacity: 1`. The width matches `w-px` and the
						stretch matches `h-full`, but `currentcolor` at full opacity would paint these
						rules in `body-color` (#12263F) — darker than the `hr` immediately above them
						in the same demo. That full strength is not a decision the classic theme made about
						vertical rules either: `.vr` reads `hr-opacity`, which the classic theme raised to 1 for
						`<hr>`, whose own colour is `--bs-border-color` rather than the inherited text
						colour. Matching that colour keeps the two orientations consistent.
					-->
					<Separator orientation="vertical" />
					<div>Docs</div>
					<Separator orientation="vertical" />
					<div>Source</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!--
		The sections below came later — separator patterns the shadcn-svelte demo above does not
		show. The first two demos (demo 1, demo 2) are skipped: the card
		above already renders both compositions — a horizontal rule between a title block and
		its content, and the Blog / Docs / Source row on vertical rules — verbatim.
	-->

	<DocSection title="Vertical separator groups related menu items">
		<Card.Root>
			<Card.Content>
				<!--
					From demo 3. Upstream writes `h-8 [&]:self-auto!` because its
					separator ships `self-stretch`; this repository's separator already dropped
					`self-stretch` for `h-full` (see the comment inside `separator.svelte`), so
					only the explicit `h-8` is needed — `h-full` collapses against the row's
					auto height.
				-->
				<div class="flex items-center justify-center">
					<div class="flex items-center gap-4 text-sm">
						<div class="flex flex-col gap-1">
							<span class="font-medium">Settings</span>
							<span class="text-xs text-muted-foreground">Manage preferences</span>
						</div>
						<Separator orientation="vertical" class="h-8" />
						<div class="flex flex-col gap-1">
							<span class="font-medium">Account</span>
							<span class="text-xs text-muted-foreground">Profile &amp; security</span>
						</div>
						<Separator orientation="vertical" class="h-8" />
						<div class="flex flex-col gap-1">
							<span class="font-medium">Help</span>
							<span class="text-xs text-muted-foreground">Support &amp; docs</span>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Horizontal separator between items in a list">
		<Card.Root>
			<Card.Content>
				<!-- From demo 4, kept as `<dl>` rows — the values really are
					descriptions of their terms. -->
				<div class="mx-auto flex w-full max-w-xs flex-col gap-2 text-sm">
					<dl class="flex items-center justify-between">
						<dt class="font-medium">Item 1</dt>
						<dd class="text-muted-foreground">Value 1</dd>
					</dl>
					<Separator />
					<dl class="flex items-center justify-between">
						<dt class="font-medium">Item 2</dt>
						<dd class="text-muted-foreground">Value 2</dd>
					</dl>
					<Separator />
					<dl class="flex items-center justify-between">
						<dt class="font-medium">Item 3</dt>
						<dd class="text-muted-foreground">Value 3</dd>
					</dl>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Separator with centered text label">
		<Card.Root>
			<Card.Content>
				<!--
					From demo 5. The label sits on the rule and masks it with its own
					background; upstream uses `bg-background` on a bare page, but here the demo
					lives on a card, so the mask has to be `bg-card` to disappear into it.
				-->
				<div class="mx-auto flex w-full max-w-xs flex-col gap-6">
					<div class="relative">
						<Separator />
						<span
							class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground"
						>
							or continue with
						</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Order summary with separators">
		<Card.Root>
			<Card.Content>
				<!-- From demo 6. `text-success` on the discount is upstream's own
					class and a token this theme carries (`--success`, green). -->
				<div class="mx-auto flex w-full max-w-xs flex-col gap-2 text-sm">
					<p class="font-medium">Order Summary</p>
					<Separator />
					<dl class="flex items-center justify-between">
						<dt class="text-muted-foreground">Subtotal</dt>
						<dd>$49.00</dd>
					</dl>
					<dl class="flex items-center justify-between">
						<dt class="text-muted-foreground">Discount</dt>
						<dd class="text-success">-$5.00</dd>
					</dl>
					<dl class="flex items-center justify-between">
						<dt class="text-muted-foreground">Tax</dt>
						<dd>$3.52</dd>
					</dl>
					<Separator />
					<dl class="flex items-center justify-between font-medium">
						<dt>Total</dt>
						<dd>$47.52</dd>
					</dl>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
