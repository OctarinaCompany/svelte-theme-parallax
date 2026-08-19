<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Textarea component page, ported from shadcn-svelte's own documentation
	 * (https://shadcn-svelte.com/docs/components/textarea) — its five examples in the order the
	 * docs give them: default, disabled, with label, with text, with button.
	 *
	 * THE CLASSIC THEME HAS NO TEXTAREA STYLING. A sweep of the reference source returns nothing: there is no
	 * `textarea` selector, no `textarea-*` variable and no textarea branch anywhere in the
	 * theme. A classic textarea is a `.form-control` and nothing else, so every `input-*` value
	 * the Input page derived applies here unchanged, and {@link control} below is that page's
	 * string with two lines added for the box a textarea has and an input does not.
	 *
	 * THE ONE TEXTAREA-SPECIFIC THING THE CLASSIC THEME SHIPS IS AUTOSIZE — a vendored copy of Jack
	 * Moore's plugin, given a section of its own in `the reference docs#autosize`, whose
	 * entire example is
	 *
	 *   <textarea class="form-control" data-autosize rows="1" placeholder="Try typing something...">
	 *
	 * i.e. a field that starts one line tall and grows with what is typed into it. shadcn's
	 * primitive already carries `field-sizing-content`, which is that behaviour as a CSS
	 * property rather than as a script, so the plugin needs no port — but its `min-h-16` floor
	 * holds the field at 64px and hides the effect, which is why {@link control} brings the
	 * floor down to `.form-control`'s own `min-height`.
	 *
	 * `rows` IS DELIBERATELY NOT SET, unlike the classic theme's markup. Where `field-sizing-content` is
	 * supported it overrides `rows` anyway; where it is not, `rows="1"` would leave a one-line
	 * box with no script to grow it, which is worse than the default two lines. Omitting the
	 * attribute gives the classic theme's autosize behaviour on browsers that can do it and a plain
	 * two-line resizable field on the ones that cannot.
	 *
	 * THE RESIZE HANDLE IS LEFT ALONE. The classic framework does not touch `resize` and neither does
	 * shadcn, so both render the user agent's handle; the only `resize: none` in the theme is
	 * inside `.form-control-flush` (the reference stylesheet), which is a modifier, not the
	 * base.
	 *
	 * WHAT THE CLASSIC THEME HAS THAT THIS PAGE DOES NOT SHOW, because the shadcn docs page has no example
	 * to hang it on: `.form-control-flush` — the borderless, backgroundless, `resize: none`
	 * shape every comment box in the classic theme's own pages uses, always paired with `data-autosize
	 * rows="1"` — plus `.form-control-auto`, `.form-control-sm` / `-lg`, `.form-control-rounded`
	 * and `.form-group`.
	 *
	 * The `.form-control:not(.form-select) { padding-right: 0 }` rule in
	 * the reference stylesheet is not reproduced here either, for the reason written out at
	 * length on the Input page: sitting directly under the `.form-control-flush` block, it is
	 * near-certainly a missing `-flush` in the selector, and reproducing a typo is not fidelity.
	 */

	/**
	 * `.form-control` IS NOT STATED HERE. It is one rule in `app.css`, on
	 * `[data-slot='input']` and `[data-slot='textarea']` together, with the derivation of
	 * every value beside it — a textarea in the classic theme is a `.form-control` and nothing else, so
	 * the two controls share one recipe rather than two copies of it.
	 *
	 * The one value that is the textarea's own is the height floor: the classic framework puts
	 * `min-height: calc(1.5em + 1rem + var(--bs-border-width) * 2)` on `.form-control` itself,
	 * textareas included, so the floor is the same 40.5px an input resolves to, against
	 * shadcn's `min-h-16` (64px). Lowering it is also what lets `field-sizing-content` start
	 * the field at one line, which is the autosize demo below.
	 */

	/**
	 * `.form-label` is `margin-bottom: .5rem` and nothing else — the classic theme overrides none of
	 * the classic label variables — so the label keeps the body's 15px and `font-weight-base`
	 * (400) where shadcn's `Label` asks for `font-medium`.
	 *
	 * The 8px is expressed as `gap-2` on the flex column rather than as a margin on the label,
	 * which is why the shadcn docs' `gap-1.5` becomes `gap-2` in the labelled examples below.
	 */
	const label = "font-normal";

	/**
	 * "Send message" is the docs' default `<Button>`, i.e. The classic theme's `.btn-primary`. The
	 * geometry and the fill are the base-size derivations from the Buttons page: `h-10` is the
	 * `input-btn-*` box resolved (40.5px), `font-normal` is `btn-font-weight:
	 * font-weight-normal`, and the hover is the classic `shade-color(primary, 15%)` written as
	 * the `color-mix()` that reproduces #2569C3 exactly. The border is stated with the fill
	 * because `button-variant()` sets `--bs-btn-border-color` to the background colour, where
	 * shadcn leaves a transparent 1px frame the page shows through.
	 */
	/**
	 * State for the auto-resize demo, ported from Demo 6.
	 * The upstream demo caps input at 280 characters by
	 * rejecting the change instead of truncating it, then colours the counter through two
	 * thresholds; both are kept. What is NOT kept is its manual `scrollHeight` resizing —
	 * the house primitive already carries `field-sizing-content`, the CSS property that
	 * behaviour hand-rolls, so the ref-and-style dance has nothing left to do here.
	 */
	const bioMaxChars = 280;
	let bioValue = $state("");

	function onBioInput(event: Event & { currentTarget: HTMLTextAreaElement }) {
		const next = event.currentTarget.value;
		if (next.length <= bioMaxChars) {
			bioValue = next;
		} else {
			// Reject the keystroke the way the upstream demo does: the state never exceeds
			// the cap, and the DOM is snapped back to it so paste cannot overshoot either.
			event.currentTarget.value = bioValue;
		}
	}

	const button = cn(
		buttonVariants(),
		"h-10 rounded-md px-3 text-sm font-normal",
		"border-primary bg-primary text-primary-foreground hover:border-[color-mix(in_srgb,var(--primary)_85%,black)] hover:bg-[color-mix(in_srgb,var(--primary)_85%,black)]",
	);
</script>

<DocPage title="Textarea">
	{#snippet subtitle()}
		Displays a form textarea or a component that looks like a textarea. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/textarea"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<!--
				One line tall to start, growing as it is typed into — `field-sizing-content` from
				the primitive over the 40.5px `.form-control` floor, which together are the classic theme's
				`data-autosize rows="1"` example without the plugin.
			-->
			<Textarea placeholder="Type your message here." class="max-w-sm" />
		</Card.Content>
	</Card.Root>

	<DocSection title="Disabled">
		{#snippet blurb()}
			The classic theme gives a disabled field the same background, border and text colour as an
			enabled one, so the only cue left is that it cannot be focused or typed into.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Textarea disabled placeholder="Type your message here." class="max-w-sm" />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With label">
		{#snippet blurb()}
			A label above its field, the shape the classic theme's own Forms card uses for every control.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full max-w-sm flex-col gap-2">
					<Label for="message" class={label}>Your message</Label>
					<Textarea placeholder="Type your message here." id="message" />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With text">
		{#snippet blurb()}
			Helper text beside the field. The classic theme's
			<code class="text-[87.5%] text-primary">.form-text</code> is a
			<code class="text-[87.5%] text-primary">&lt;small&gt;</code>, so it is 13px rather than the
			15px the shadcn example asks for.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full max-w-sm flex-col gap-2">
					<Label for="message-2" class={label}>Your message</Label>
					<Textarea placeholder="Type your message here." id="message-2" />
					<!--
						ORDER IS SHADCN'S, TREATMENT IS THE CLASSIC THEME'S. The reference stylesheet is
						`display: block; margin-bottom: form-text-margin-bottom (.5rem)` on top of
						`form-text-margin-top: 0` — the classic margin moved from the top of the
						element to the bottom, because the classic theme puts the hint ABOVE the control:
						the reference “project-new” demo page and the reference “account-general” demo page both run
						`.form-label`, then `<small class="form-text text-body-secondary">`, then the
						field. That is a structural change to the documented example rather than a
						skin, so the sentence stays under the field and this comment is the record.

						`text-xs` is `small-font-size: .8125rem`, which is what `<small>` resolves to
						and which this theme maps onto that step; the shadcn docs' `text-sm` is
						`font-size-base` (15px) here. `text-muted-foreground` is `.text-body-secondary`
						= `--bs-secondary-color` = `gray-600` in light and `gray-700` in dark, both of
						which the token holds exactly.
					-->
					<p class="text-xs text-muted-foreground">
						Your message will be copied to the support team.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With button">
		{#snippet blurb()}
			A field and its submit button, the shape of the classic theme's own form example in
			<code class="text-[87.5%] text-primary">the reference docs#forms</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`gap-[1.375rem]` is `form-group-margin-bottom`, a classic addition rather than a
					classic-framework variable (the reference stylesheet is the two
					lines that spend it). It is the space the classic theme leaves between the last
					`.form-group` and the submit button that follows it, against the shadcn example's
					`gap-2`.

					`items-start` rather than the docs' `grid`: the classic `.btn` is
					`display: inline-block`, so a classic submit button is as wide as its label, where
					a grid column stretches it to the full width of the field above.
				-->
				<div class="flex w-full max-w-sm flex-col items-start gap-[1.375rem]">
					<Textarea placeholder="Type your message here." />
					<button type="submit" class={button}>Send message</button>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Invalid textarea">
		{#snippet blurb()}
			The field flagged invalid.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`aria-invalid="true"` is the whole demo: the primitive's own
					`aria-invalid:border-destructive` styling does the rest, so the error state is
					reached through the accessibility attribute rather than a bespoke class — which
					is why this theme is a single attribute on the section above's markup.
				-->
				<Textarea aria-invalid="true" placeholder="Type your message here…" class="max-w-sm" />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Auto-resize textarea with character count">
		{#snippet blurb()}
			A growing field capped at {bioMaxChars} characters, with a counter that turns as the limit nears.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full max-w-sm flex-col gap-2">
					<div class="flex items-center justify-between">
						<Field.FieldLabel for="bio-auto-resize" class={label}>Bio</Field.FieldLabel>
						<!--
							The counter's two thresholds are the upstream demo's: `text-warning` from
							20 characters remaining, `text-destructive font-semibold` at zero. Its
							`text-warning` maps directly — `--warning` is a first-class token here
							(`src/app.css`), not a raw palette colour.
						-->
						<span
							class={cn(
								"text-xs tabular-nums",
								bioMaxChars - bioValue.length === 0
									? "font-semibold text-destructive"
									: bioMaxChars - bioValue.length <= 20
										? "text-warning"
										: "text-muted-foreground",
							)}
						>
							{bioValue.length}/{bioMaxChars}
						</span>
					</div>
					<!--
						`resize-none overflow-hidden` is upstream's, and here it is also what makes
						the growth visible: with the user-agent handle gone, `field-sizing-content`
						is the only thing changing the height. The upstream `rows={2}` and the
						`scrollHeight` script are both dropped — see the note on `onBioInput` in the
						script block.
					-->
					<Textarea
						id="bio-auto-resize"
						value={bioValue}
						oninput={onBioInput}
						placeholder="Tell us about yourself..."
						class="resize-none overflow-hidden"
					/>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
