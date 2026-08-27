<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as NativeSelect from "$lib/components/ui/native-select/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Native select component page, ported from
	 * https://shadcn-svelte.com/docs/components/native-select — the hero demo, then the page's
	 * three example sections (groups, disabled, invalid) and its accessibility example, plus one
	 * section for the size the classic theme documents and shadcn's page does not.
	 *
	 * THE CLASSIC THEME HAS A REAL COUNTERPART, and it is one of the closest matches in this theme:
	 * the classic `.form-select`, re-skinned by `the reference source/the reference stylesheet` and the
	 * `form-select-*` / `input-*` block of the reference stylesheet (dark half in
	 * the reference stylesheet). Resolved out of the reference bundle, the class is
	 *
	 *   appearance: none;
	 *   background-color: #fff;                      input-bg = white
	 *   background-image: <caret>;                   form-select-indicator
	 *   background-position: right .75rem center;
	 *   background-size: .75em .75em;                form-select-bg-size
	 *   border: 1px solid var(--bs-gray-400);        input-border-color = gray-400
	 *   border-radius: var(--bs-border-radius);      0.375rem
	 *   color: var(--bs-body-color);
	 *   display: block; width: 100%;
	 *   font-size: .9375rem; font-weight: 400; line-height: 1.5;
	 *   padding: .5rem 1.75rem .5rem .75rem;         input-padding-y/x + form-select-indicator-padding
	 *
	 * Four of those are ALREADY what shadcn ships and are left untouched: `appearance-none`, the
	 * `border-input` colour (#D2DDEC in light and #1E3A5C in dark are `--input` exactly, in both
	 * modes), `rounded-md` (= `border-radius`), and `text-sm` — which this repo remaps to
	 * 0.9375rem, i.e. `font-size-base`. The font weight is inherited 400 on both sides.
	 *
	 * THE CARET IS THE SURPRISE. shadcn draws a Lucide `chevron-down` element where the classic framework
	 * paints a `background-image`, so they look unrelated in the source and land within a tenth
	 * of a pixel of each other on screen:
	 *
	 *   The classic theme  an 11.25px box (.75em of 15px) whose `viewBox='0 0 9 5'` path runs x=1→7.5,
	 *            so the drawn chevron is 6.5/9 x 11.25 = 8.13px wide with a
	 *            1.083/9 x 11.25 = 1.35px stroke, its right edge 1.88px inside a box that sits
	 *            12px from the control's right edge -> 13.88px
	 *   shadcn   a 16px box (`size-4`) whose `viewBox='0 0 24 24'` path runs x=6→18, so the
	 *            chevron is 12/24 x 16 = 8px wide with a 2/24 x 16 = 1.33px stroke, its right
	 *            edge 4px inside a box placed at `right-2.5` (10px) -> 14px
	 *
	 * Same glyph, same weight, 0.12px apart. Nothing is applied for it. Its colour is exact in
	 * light — `form-select-indicator-color` is `gray-600` (#95AAC9), which is `--muted-foreground`
	 * to the digit — and one step off in dark, where the classic theme keeps `gray-600` while
	 * `--muted-foreground` becomes `gray-700` (#6E84A3). No token holds #95AAC9 in dark mode, so
	 * it keeps the token rather than a hardcoded hex, the same trade the Progress track and the
	 * Switch record for their greys.
	 *
	 * WHAT THE CLASSIC THEME DOES NOT HAVE. `<option>` and `<optgroup>` are unstyled: the only rule naming
	 * them in the whole bundle is the reboot's font inheritance, because the popup list is drawn
	 * by the OS and not by the page. shadcn's `bg-[Canvas] text-[CanvasText]` on `Option` is
	 * therefore kept as-is. `.form-select` also declares `--bs-form-select-placeholder-color`
	 * (gray-500) and a `::placeholder` rule, which a `<select>` can never match — the empty
	 * first option in these demos renders in the ordinary body colour, in the classic theme as here.
	 *
	 * WHERE THE REST LIVES. `NativeSelect.Root` puts `class` on the WRAPPER `<div>`; the inner
	 * `<select>`'s classes are hardcoded and unreachable from a call site. Height, horizontal
	 * padding, the two backgrounds, the removed shadows and the small size are consequently
	 * `app.css` rules keyed on `[data-slot='native-select']`, written the way the Switch's are.
	 * Only the two wrapper-level differences are call-site classes, below.
	 *
	 * THE CLASSIC THEME'S OWN DOCS document the select exclusively through its boxed widget
	 * (the reference docs, the combobox section, badged "theme-specific" + "Plugin"): a
	 * JS widget that replaces the native control and keeps `.form-select` on its shell. The skin
	 * underneath is what this page ports; the plugin is a dependency and out of scope. Its card
	 * is still the source for the two classic-theme facts used below — the `.form-select-sm` example,
	 * and `.mb-3` as the gap between stacked controls.
	 */

	/**
	 * The wrapper, at every call site. Both classes cancel a shadcn default the classic theme does not have:
	 *
	 *   w-full                             `.form-select` is `display: block; width: 100%`, so a
	 *                                      classic-framework select fills its column. shadcn's wrapper is
	 *                                      `w-fit`, which shrinks the control to its longest
	 *                                      option and makes each demo a different width
	 *   has-[select:disabled]:opacity-100  the classic theme resolves `--bs-form-select-disabled-bg` to
	 *                                      `input-bg` — the same white (light) / `gray-700-dark`
	 *                                      (dark) as the enabled control — and leaves the border
	 *                                      and text colour unset, on top of the reboot's explicit
	 *                                      `select:disabled { opacity: 1 }`. A disabled the classic theme
	 *                                      select is deliberately IDENTICAL to an enabled one;
	 *                                      only the cursor and the interaction change. shadcn
	 *                                      fades the whole wrapper to 50%
	 */
	/*
	 * NO WIDTH. `NativeSelect.Root` is `w-fit`, so the control sizes to its widest option, which
	 * is what the docs page renders and what a `<select>` does natively. An earlier version of
	 * this page put `w-full` here, which stretched every demo across the card and read as a
	 * different component from the one being documented.
	 *
	 * The classic framework agrees with `w-fit` rather than with `w-full`: `.form-select` sets no width of
	 * its own and the classic theme adds none, so a bare the classic framework select is also content-width. It is the
	 * grid column around it — `.col-md-6`, `.form-group` — that stretches one in the classic theme's forms,
	 * which is layout, not the control.
	 *
	 * `has-[select:disabled]:opacity-100` cancels the wrapper's own `opacity-50`, for the reason
	 * the `app.css` block gives: a disabled the classic theme control is pixel-identical to an enabled one.
	 */
	const control = "has-[select:disabled]:opacity-100";

	/** The docs' grouped example, kept verbatim; three groups is enough to show the nesting. */
	const departments = [
		{
			label: "Engineering",
			options: [
				{ value: "frontend", label: "Frontend" },
				{ value: "backend", label: "Backend" },
				{ value: "devops", label: "DevOps" },
			],
		},
		{
			label: "Sales",
			options: [
				{ value: "sales-rep", label: "Sales Rep" },
				{ value: "account-manager", label: "Account Manager" },
				{ value: "sales-director", label: "Sales Director" },
			],
		},
		{
			label: "Operations",
			options: [
				{ value: "support", label: "Customer Support" },
				{ value: "product-manager", label: "Product Manager" },
				{ value: "ops-manager", label: "Operations Manager" },
			],
		},
	];
</script>

<DocPage title="Native select">
	{#snippet subtitle()}
		A styled native HTML select element, for when the browser's own dropdown is wanted rather than a
		scripted one. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/native-select"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<NativeSelect.Root class={control} aria-label="Status">
				<NativeSelect.Option value="">Select status</NativeSelect.Option>
				<NativeSelect.Option value="todo">Todo</NativeSelect.Option>
				<NativeSelect.Option value="in-progress">In Progress</NativeSelect.Option>
				<NativeSelect.Option value="done">Done</NativeSelect.Option>
				<NativeSelect.Option value="cancelled">Cancelled</NativeSelect.Option>
			</NativeSelect.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="With groups">
		{#snippet blurb()}
			Organize options using <code class="text-[87.5%] text-primary">NativeSelect.OptGroup</code>
			for better categorization.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`<optgroup>` labels are drawn by the operating system, not by the page — see the
					header note. Both the classic theme and shadcn leave them alone, so this example looks the
					same in either theme and differs between platforms.
				-->
				<NativeSelect.Root class={control} aria-label="Department">
					<NativeSelect.Option value="">Select department</NativeSelect.Option>
					{#each departments as department (department.label)}
						<NativeSelect.OptGroup label={department.label}>
							{#each department.options as option (option.value)}
								<NativeSelect.Option value={option.value}>{option.label}</NativeSelect.Option>
							{/each}
						</NativeSelect.OptGroup>
					{/each}
				</NativeSelect.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Disabled state">
		{#snippet blurb()}
			Disable individual options or the entire select component.
		{/snippet}
		<Card.Root>
			<!--
				`gap-4` is `.mb-3` (1rem), the spacing the classic theme's own card puts between stacked form
				controls. Two selects rather than one: the docs page's usage example disables a
				single option, its "Disabled State" example disables the control.
			-->
			<Card.Content class="flex flex-col gap-4">
				<NativeSelect.Root class={control} aria-label="Fruit">
					<NativeSelect.Option value="">Select a fruit</NativeSelect.Option>
					<NativeSelect.Option value="apple">Apple</NativeSelect.Option>
					<NativeSelect.Option value="banana">Banana</NativeSelect.Option>
					<NativeSelect.Option value="blueberry">Blueberry</NativeSelect.Option>
					<NativeSelect.Option value="grapes" disabled>Grapes</NativeSelect.Option>
					<NativeSelect.Option value="pineapple">Pineapple</NativeSelect.Option>
				</NativeSelect.Root>

				<!--
					Disabled, and — by design — indistinguishable from the control above it, which is
					exactly what the classic theme renders. The reasoning is on `control`; nothing is added here
					to make the state more visible, because doing so would be an invention rather than
					a port.
				-->
				<NativeSelect.Root class={control} aria-label="Priority" disabled>
					<NativeSelect.Option value="">Select priority</NativeSelect.Option>
					<NativeSelect.Option value="low">Low</NativeSelect.Option>
					<NativeSelect.Option value="medium">Medium</NativeSelect.Option>
					<NativeSelect.Option value="high">High</NativeSelect.Option>
					<NativeSelect.Option value="critical">Critical</NativeSelect.Option>
				</NativeSelect.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Invalid state">
		{#snippet blurb()}
			Show validation errors with the
			<code class="text-[87.5%] text-primary">aria-invalid</code> attribute and error styling.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The classic theme's equivalent is `.form-select.is-invalid`, and it is a single declaration:
					`border-color: var(--bs-form-invalid-border-color)`, which resolves to #E63757
					(danger) in BOTH modes. shadcn's `aria-invalid:border-destructive` is that colour
					exactly in light; the accompanying `ring-3 ring-destructive/20` and the dark
					theme's half-strength border are the two parts that are not the classic theme, and both are
					corrected in `app.css` — the ring because `form-select-focus-box-shadow` is
					`input-focus-box-shadow`, i.e. `none`, so a classic select has no glow in any
					state; the border because the classic theme's dark override keeps the full colour.

					the classic validation ICON is absent as well: `.form-select.is-invalid` leaves
					`--bs-form-select-bg-icon` at `none`, so the caret is the only image on the
					control. shadcn draws no icon either, so that half needs nothing.
				-->
				<NativeSelect.Root class={control} aria-label="Role" aria-invalid="true">
					<NativeSelect.Option value="">Select role</NativeSelect.Option>
					<NativeSelect.Option value="admin">Admin</NativeSelect.Option>
					<NativeSelect.Option value="editor">Editor</NativeSelect.Option>
					<NativeSelect.Option value="viewer">Viewer</NativeSelect.Option>
					<NativeSelect.Option value="guest">Guest</NativeSelect.Option>
				</NativeSelect.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Accessibility">
		{#snippet blurb()}
			The control keeps every native select behaviour. Use
			<code class="text-[87.5%] text-primary">aria-label</code> or
			<code class="text-[87.5%] text-primary">aria-labelledby</code> where the first option does not already
			name the field.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`aria-label` reaches the `<select>` through `restProps`, not the wrapper — the
					component spreads everything except `class` and `size` onto the element itself.
					The chevron is already `aria-hidden`, so it is never announced twice.
				-->
				<NativeSelect.Root class={control} aria-label="Choose your preferred language">
					<NativeSelect.Option value="en">English</NativeSelect.Option>
					<NativeSelect.Option value="es">Spanish</NativeSelect.Option>
					<NativeSelect.Option value="fr">French</NativeSelect.Option>
				</NativeSelect.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Small">
		{#snippet blurb()}
			The smaller of the two sizes, reached through the component's
			<code class="text-[87.5%] text-primary">size</code> prop rather than through a class of its own.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`size="sm"` is shadcn's own prop; what it renders is retuned in `app.css` to
					`.form-select-sm`, which is four declarations — 13px type, `border-radius-sm`
					corners, and `.125rem` / `.5rem` padding with the caret's 1.75rem right side
					left alone.
				-->
				<NativeSelect.Root class={control} aria-label="Food" size="sm">
					<NativeSelect.Option value="">Select a food</NativeSelect.Option>
					<NativeSelect.OptGroup label="Fruits">
						<NativeSelect.Option value="apple">Apple</NativeSelect.Option>
						<NativeSelect.Option value="banana">Banana</NativeSelect.Option>
						<NativeSelect.Option value="blueberry">Blueberry</NativeSelect.Option>
					</NativeSelect.OptGroup>
					<NativeSelect.OptGroup label="Vegetables">
						<NativeSelect.Option value="carrot">Carrot</NativeSelect.Option>
						<NativeSelect.Option value="broccoli">Broccoli</NativeSelect.Option>
						<NativeSelect.Option value="spinach">Spinach</NativeSelect.Option>
					</NativeSelect.OptGroup>
				</NativeSelect.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Native select embedded within a field">
		{#snippet blurb()}
			The select wired into a <code class="text-[87.5%] text-primary">Field</code> with a label and a
			description.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The `id` reaches the inner `<select>` through `restProps` — the same path the
					Accessibility section's `aria-label` takes — so `FieldLabel`'s `for` resolves to the
					real control, not the wrapper `<div>`. The field caps at `max-w-xs`,
					because it is the FIELD's column width — the layout around the control, which the
					header's "NO WIDTH" note leaves to the page — while the select itself keeps its
					content width inside it.
				-->
				<Field.Field class="max-w-xs">
					<Field.FieldLabel for="native-select-country">Country</Field.FieldLabel>
					<NativeSelect.Root class={control} id="native-select-country">
						<NativeSelect.Option value="">Select a country</NativeSelect.Option>
						<NativeSelect.Option value="us">United States</NativeSelect.Option>
						<NativeSelect.Option value="uk">United Kingdom</NativeSelect.Option>
						<NativeSelect.Option value="ca">Canada</NativeSelect.Option>
					</NativeSelect.Root>
					<Field.FieldDescription>Select your country of residence.</Field.FieldDescription>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
