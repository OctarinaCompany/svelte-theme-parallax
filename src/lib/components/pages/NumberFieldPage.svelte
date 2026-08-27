<script lang="ts">
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
	import { toast } from "svelte-sonner";

	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as NumberField from "$lib/components/ui/number-field/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Number field component page — its six examples in the order that
	 * page gives them.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. The classic framework ships no spinner control at all, so every quantity in
	 * the theme is a bare `<input type="number">` with the browser's own arrows. The component in
	 * `$lib/components/ui/number-field/` is therefore this repository's own hand-port — press-and-
	 * hold repeat, the arrow/Page/Alt keyboard ramp, the drag-to-scrub label and the hidden form
	 * input all live there and document themselves file by file. This page only exercises them.
	 *
	 * TWO SECTION TITLES DIVERGE FROM UPSTREAM'S `meta.json`, which is plainly copy-pasted: it
	 * titles the first three demos "Basic number field" although the second and third differ only
	 * by `size="sm"` and `size="lg"`, and it spells the fourth "Number filed wiith buttons on
	 * right". Three identical headings would make the size ramp invisible in the page's own table
	 * of contents, so the size demos take the size for a title and the fourth takes the typo-free
	 * spelling. Nothing else about the demos moved.
	 */

	/**
	 * The form example, from demo 6.
	 *
	 * Upstream wires react-hook-form with a zod resolver in `mode: "onChange"`; a plain `<form>`
	 * with rune state stands in, the same substitution the Autocomplete page makes. The schema is
	 * upstream's verbatim — a number between 10 and 100 — and note that it is deliberately not the
	 * field's own bounds: the control clamps to `0…100`, so everything under 10 is reachable and
	 * only the message tells you it is wrong, which is the point of the demo.
	 */
	let formAmountValue = $state<number | null>(5);
	let formAmountSubmitted = $state(false);

	const formAmountError = $derived.by(() => {
		if (formAmountValue == null) return "Amount must be a number.";
		if (formAmountValue < 10) return "Amount must be at least 10.";
		if (formAmountValue > 100) return "Amount must be at most 100.";
		return null;
	});

	// Upstream validates on change but only paints the error once the field has been touched by a
	// submit attempt, which is what `formState` gives it for free.
	const formAmountVisibleError = $derived(formAmountSubmitted ? formAmountError : null);

	function onFormAmountSubmit(event: SubmitEvent) {
		event.preventDefault();
		formAmountSubmitted = true;
		if (formAmountError) return;

		toast.success("Form submitted", {
			description: `Your form has successfully submitted with amount: ${formAmountValue}`,
		});
		onFormAmountReset();
	}

	function onFormAmountReset() {
		formAmountValue = 5;
		formAmountSubmitted = false;
	}

	type PropRow = { prop: string; type: string; default: string; description: string };

	const rootProps: PropRow[] = [
		{
			prop: "value",
			type: "number | null",
			default: "undefined",
			description:
				"Bindable; the committed value, `null` for an empty field. Left `undefined` at mount it is seeded from `defaultValue`. A function binding whose setter declines a write keeps `value` put, but the input's text is still rewritten to the declined number — its resync keys on the committed value, which did not move — and `onValueChange` still fires with it.",
		},
		{
			prop: "defaultValue",
			type: "number | null",
			default: "null",
			description:
				"What `value` is seeded with when it is `undefined` at mount. Read once; later changes are ignored, and an explicit `null` value is not overwritten by it.",
		},
		{
			prop: "onValueChange",
			type: "(value: number | null) => void",
			default: "—",
			description:
				"Called after every write that differs from the current value (`Object.is` guard), in both modes — a clamped step that lands on the current value stays silent. Receives `null` when unparseable text is committed, and fires even when a function-binding setter declines the write.",
		},
		{
			prop: "min",
			type: "number",
			default: "—",
			description:
				"Lower bound: steps, scrub ticks and commits clamp to it, `Home` jumps to it, `snapOnStep` anchors on it, and the decrement button disables once the value sits on it. Unset leaves the low side open and `Home` inert.",
		},
		{
			prop: "max",
			type: "number",
			default: "—",
			description:
				"Upper bound: steps, scrub ticks and commits clamp to it, `End` jumps to it, and the increment button disables once the value sits on it. Unset leaves the high side open and `End` inert.",
		},
		{
			prop: "step",
			type: "number",
			default: "1",
			description:
				"Delta of one plain arrow key, spinner press or hold tick, wheel notch and scrub tick. The result is rounded to the finer decimal precision of the two operands — the larger count of decimal places, capped at 20 — so `0.1` steps land on `0.3`, not `0.30000000000000004`.",
		},
		{
			prop: "smallStep",
			type: "number",
			default: "0.1",
			description:
				"Delta of an arrow key while `Alt` is held. Nothing else uses it — the buttons, wheel and scrub area always take `step`.",
		},
		{
			prop: "largeStep",
			type: "number",
			default: "10",
			description:
				"Delta of `PageUp`/`PageDown`, and of an arrow key while `Shift` is held. `Shift` wins over `Alt` when both are down.",
		},
		{
			prop: "snapOnStep",
			type: "boolean",
			default: "false",
			description:
				"After a step, rounds the result to the nearest multiple of the delta used, anchored at `min` (0 when `min` is unset): stepping a typed `7` by `5` lands on `10`, not `12`. Clamping still applies afterwards.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description:
				"Makes stepping, scrubbing and spinning no-ops, sets `disabled` on the input, both buttons and the hidden form input, and `data-disabled` on the root and group (which fades to 50%).",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "false",
			description:
				"The input stays focusable and its text selectable, but stepping, scrubbing and both buttons are inert. Mirrored as `readonly` on the input and the form input and as `data-readonly` on the root.",
		},
		{
			prop: "required",
			type: "boolean",
			default: "false",
			description:
				'Sets `required` on the input and on the hidden form input — a clipped `type="text"`, not `type="hidden"`, precisely so an empty required field fails constraint validation. `data-required` on the root.',
		},
		{
			prop: "invalid",
			type: "boolean",
			default: "false",
			description:
				"Sets `aria-invalid` on the input and on the group, whose frame turns destructive, and `data-invalid` on the root. Purely presentational; the value is untouched.",
		},
		{
			prop: "name",
			type: "string",
			default: "—",
			description:
				'Name of the visually hidden form input the root renders while it sits inside a `<form>`. That input carries the raw number (`"1234.5"`), never the formatted text, and dispatches a bubbling `input` event on every value change.',
		},
		{
			prop: "locale",
			type: "Intl.LocalesArgument",
			default: "—",
			description:
				"Locale of the display format and of the parser, which reads its group, decimal and minus glyphs from it — so `1,5` commits `1.5` under `fr-FR`. Unset is the runtime's default locale.",
		},
		{
			prop: "format",
			type: "Intl.NumberFormatOptions",
			default: "—",
			description:
				"Passed to `Intl.NumberFormat` for the displayed text; the parser strips whatever symbols it adds. `style: 'percent'` divides typed text by 100, so `45%` commits `0.45`.",
		},
		{
			prop: "allowWheelScrub",
			type: "boolean",
			default: "false",
			description:
				"Lets a wheel gesture over the input step the value by `step` — only while the input is focused — and then prevents the page from scrolling.",
		},
		{
			prop: "size",
			type: "'sm' | 'default' | 'lg'",
			default: "'default'",
			description:
				"Height and padding rung of every part, published through context; a part's own `size` overrides it locally. Exposed as `data-size` on the root and the group.",
		},
		{
			prop: "id",
			type: "string",
			default: "—",
			description:
				"Lands on the `<input>`, not on the root `<div>`, so a `<label for>` reaches a focusable control. Read once at mount; a generated id stands in when omitted.",
		},
		{
			prop: "class",
			type: "ClassValue | undefined | null",
			default: "—",
			description:
				"Merged last through `cn()`, after the root's own `flex w-full flex-col items-start gap-2`, so a caller utility wins over that layout.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description:
				"Bindable reference to the rendered `<div>`. Stays `null` in `child` mode, where the form probe keeps its pre-mount answer and the hidden form input is rendered whether or not a form encloses it.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: NumberFieldRootChildProps }]>",
			default: "—",
			description:
				"Renders the root onto your own element: the snippet receives the merged attributes to spread, and `children` is not rendered, so you place the parts yourself. The context is set either way.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The composed parts, rendered inside the default `<div>`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread onto the `<div>` after the `data-*` attributes, so a caller `data-size` or `data-disabled` wins; `class` is merged last.",
		},
	];

	const groupProps: PropRow[] = [
		{
			prop: "size",
			type: "'sm' | 'default' | 'lg'",
			default: "the root’s size",
			description:
				"Height of the frame — `--control-h-sm` / `-default` / `-lg` (32 / 40 / 48 px) — and its text size, `text-xs` for `sm`.",
		},
		{
			prop: "class",
			type: "ClassValue | undefined | null",
			default: "—",
			description:
				"Merged after the size and frame variant classes, so a caller utility wins over the height, border and text size.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element. Not populated in `child` mode.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: NumberFieldGroupChildProps }]>",
			default: "—",
			description:
				"Renders the group onto your own element; the snippet receives the merged attributes, and `children` is not rendered.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"The decrement, input and increment, in whatever order the layout wants — the parts are plain children.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread after the computed attributes, so a caller `aria-invalid` overrides the one mirrored from the root's `invalid`; `class` is merged last.",
		},
	];

	const inputProps: PropRow[] = [
		{
			prop: "size",
			type: "'sm' | 'default' | 'lg'",
			default: "the root’s size",
			description:
				"Padding rung of the input only (`px-2 py-0.5`, `px-2.5 py-1`, `px-2.5 py-1.5`); the height belongs to the group.",
		},
		{
			prop: "oninput",
			type: "FormEventHandler<HTMLInputElement>",
			default: "—",
			description:
				"Runs first, then the typed text is stored as the field's uncommitted text. Cannot be vetoed: the value itself does not move until a commit — blur, `Enter`, or any step, which parses the typed text first.",
		},
		{
			prop: "onkeydown",
			type: "KeyboardEventHandler<HTMLInputElement>",
			default: "—",
			description:
				"Runs first; `preventDefault()` skips the whole keyboard map (arrows, `Page*`, `Home`/`End`, `Enter`) for that key.",
		},
		{
			prop: "onblur",
			type: "FocusEventHandler<HTMLInputElement>",
			default: "—",
			description:
				"Runs first, then the text is committed: parsed, clamped and reformatted, or emptied to `null` when it does not parse. Cannot be vetoed.",
		},
		{
			prop: "class",
			type: "ClassValue | undefined | null",
			default: "—",
			description:
				"Merged after the size variant's padding classes. Pulled out of the spread and merged, not overwritten — the `...restProps` type still lists it, but it never reaches the spread.",
		},
		{
			prop: "ref",
			type: "HTMLInputElement | null",
			default: "null",
			description:
				"Bindable reference to the rendered `<input>`. The root learns the element through an attachment in the spread props, not through `ref`, so the buttons re-focus it and the wheel listener attaches even in `child` mode.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: NumberFieldInputChildProps }]>",
			default: "—",
			description:
				"Renders onto your own `<input>`. The props include `value` (the field's text), the three composed handlers and the attachment that registers the element with the root — spread all of them.",
		},
		{
			prop: "...restProps",
			type: "Omit<HTMLInputAttributes, 'type' | 'value' | 'size' | 'id'>",
			default: "—",
			description:
				"Spread before `value`, the handlers and the attachment, which therefore cannot be overridden. `type`, `value`, `size` and `id` are excluded from the type because the part owns them; `id` comes from the root.",
		},
	];

	const incrementProps: PropRow[] = [
		{
			prop: "size",
			type: "'sm' | 'default' | 'lg'",
			default: "the root’s size",
			description:
				"Padding and icon rung of this button: `px-1.5` with `size-3.5` icons for `sm`, `px-2` / `px-2.5` with `size-4` icons above it. An icon carrying its own `size-*` class is left alone.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "—",
			description:
				"Overrides the automatic state: unset, the button disables itself at `max` and while the field is disabled or read-only. An explicit `false` keeps it enabled at the bound, where a press then changes nothing.",
		},
		{
			prop: "onpointerdown",
			type: "PointerEventHandler<HTMLButtonElement>",
			default: "—",
			description:
				"Runs first; `preventDefault()` skips the spin. Otherwise a primary-button press focuses the input instead of the button, steps once and, after 500 ms, repeats every 60 ms until `pointerup`/`pointercancel` on `window`.",
		},
		{
			prop: "onclick",
			type: "MouseEventHandler<HTMLButtonElement>",
			default: "—",
			description:
				"Runs first; `preventDefault()` vetoes the step. Only a keyboard click (`event.detail === 0`) steps by `step` here — pointer presses are consumed by `onpointerdown`.",
		},
		{
			prop: "class",
			type: "ClassValue | undefined | null",
			default: "—",
			description:
				"Merged after the button variant and `rounded-e-md`, which is why the stacked-spinner layout can square the corner with `rounded-none!`; the buttons-on-right layout leaves it rounded, since it still sits at the end of the group.",
		},
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the rendered element. Not populated in `child` mode.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: NumberFieldIncrementChildProps }]>",
			default: "—",
			description:
				"Renders the button onto your own element; the snippet receives the merged attributes, and neither `children` nor the default icon is rendered.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"Replaces the default plus icon. The variant sizes any icon it contains, so a bare `<ChevronUpIcon />` needs no size class.",
		},
		{
			prop: "...restProps",
			type: "HTMLButtonAttributes",
			default: "—",
			description:
				'Spread before `disabled` and the two handlers, which cannot be overridden; `aria-label` ("Increase value") and `type="button"` can be. `class` is merged after `rounded-e-md`.',
		},
	];

	const decrementProps: PropRow[] = [
		{
			prop: "size",
			type: "'sm' | 'default' | 'lg'",
			default: "the root’s size",
			description:
				"Padding and icon rung of this button: `px-1.5` with `size-3.5` icons for `sm`, `px-2` / `px-2.5` with `size-4` icons above it. An icon carrying its own `size-*` class is left alone.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "—",
			description:
				"Overrides the automatic state: unset, the button disables itself at `min` and while the field is disabled or read-only. An explicit `false` keeps it enabled at the bound, where a press then changes nothing.",
		},
		{
			prop: "onpointerdown",
			type: "PointerEventHandler<HTMLButtonElement>",
			default: "—",
			description:
				"Runs first; `preventDefault()` skips the spin. Otherwise a primary-button press focuses the input instead of the button, steps once and, after 500 ms, repeats every 60 ms until `pointerup`/`pointercancel` on `window`.",
		},
		{
			prop: "onclick",
			type: "MouseEventHandler<HTMLButtonElement>",
			default: "—",
			description:
				"Runs first; `preventDefault()` vetoes the step. Only a keyboard click (`event.detail === 0`) steps by `step` here — pointer presses are consumed by `onpointerdown`.",
		},
		{
			prop: "class",
			type: "ClassValue | undefined | null",
			default: "—",
			description:
				"Merged after the button variant and `rounded-s-md`, which is why the stacked-spinner and buttons-on-right layouts can square the corner with `rounded-none!`.",
		},
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the rendered element. Not populated in `child` mode.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: NumberFieldDecrementChildProps }]>",
			default: "—",
			description:
				"Renders the button onto your own element; the snippet receives the merged attributes, and neither `children` nor the default icon is rendered.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"Replaces the default minus icon. The variant sizes any icon it contains, so a bare `<ChevronDownIcon />` needs no size class.",
		},
		{
			prop: "...restProps",
			type: "HTMLButtonAttributes",
			default: "—",
			description:
				'Spread before `disabled` and the two handlers, which cannot be overridden; `aria-label` ("Decrease value") and `type="button"` can be. `class` is merged after `rounded-s-md`.',
		},
	];

	const scrubAreaProps: PropRow[] = [
		{
			prop: "label",
			type: "string",
			default: "— (required)",
			description:
				"Text of the `<label>` the area renders, wired by `for` to the input's id. That wiring only focuses the input on a touch tap or in a read-only field: a primary mouse press is claimed by the scrub, which prevents the default and captures the pointer, so the ensuing `click` lands on the area rather than the label.",
		},
		{
			prop: "direction",
			type: "'horizontal' | 'vertical'",
			default: "'horizontal'",
			description:
				"Axis the drag is measured on: rightward travel increments on `horizontal`, upward travel on `vertical`. Also picks the `ew`/`ns` resize cursor on the area and its label.",
		},
		{
			prop: "pixelSensitivity",
			type: "number",
			default: "2",
			description:
				"Pixels of travel per tick of `step`. Travel accumulates across moves, so a slow drag still steps and the remainder is carried over; a fast move that crosses several ticks applies them as one `n × step` step.",
		},
		{
			prop: "onpointerdown",
			type: "PointerEventHandler<HTMLDivElement>",
			default: "—",
			description:
				"Runs first; `preventDefault()` vetoes the scrub. Otherwise a primary-button, non-touch press on an enabled, writable field captures the pointer, hides the native cursor and starts tracking.",
		},
		{
			prop: "onpointermove",
			type: "PointerEventHandler<HTMLDivElement>",
			default: "—",
			description:
				"Runs first, then the delta is measured and stepped. Cannot be vetoed, and does nothing unless a scrub is in progress.",
		},
		{
			prop: "onpointerup",
			type: "PointerEventHandler<HTMLDivElement>",
			default: "—",
			description:
				"Runs first, then the scrub ends and the body cursor is restored. Cannot be vetoed.",
		},
		{
			prop: "onpointercancel",
			type: "PointerEventHandler<HTMLDivElement>",
			default: "—",
			description:
				"Runs first, then the scrub ends and the body cursor is restored. Cannot be vetoed.",
		},
		{
			prop: "class",
			type: "ClassValue | undefined | null",
			default: "—",
			description:
				"Merged after `flex select-none` and the `ew`/`ns` resize cursor class picked by `direction`, so a caller cursor utility wins.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread before the four pointer handlers, which therefore compose rather than override; `class` is merged after the cursor class. There is no `child` mode and `children` is not rendered.",
		},
	];

	const keyboard = [
		{
			keys: "ArrowUp / ArrowDown",
			description:
				"Steps by `step`; by `largeStep` with `Shift`, by `smallStep` with `Alt`. Uncommitted typed text is stepped from, so typing `50` then ArrowUp yields 51. An empty field is seeded with 0 (clamped), not stepped.",
		},
		{
			keys: "PageUp / PageDown",
			description: "Steps by `largeStep`, whatever the modifiers.",
		},
		{
			keys: "Home / End",
			description:
				"Jumps to `min` / `max`. Falls through to the browser's caret move when the bound is unset.",
		},
		{
			keys: "Enter",
			description:
				"Commits the typed text: parsed, clamped and reformatted, or emptied to `null` when it does not parse. Blur does the same.",
		},
	];
</script>

<DocPage title="Number field">
	{#snippet subtitle()}
		A numeric input with spinner buttons, press-and-hold repeat, keyboard stepping and a
		drag-to-scrub label.
	{/snippet}

	<DocSection title="Basic number field">
		{#snippet blurb()}
			The default composition: a scrub area whose label drags the value, then a group holding the
			decrement button, the input and the increment button.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-48">
					<NumberField.Root defaultValue={5} min={0} max={100}>
						<NumberField.ScrubArea label="Amount" />
						<NumberField.Group>
							<NumberField.Decrement />
							<NumberField.Input />
							<NumberField.Increment />
						</NumberField.Group>
					</NumberField.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Small">
		{#snippet blurb()}
			<code>size="sm"</code> on the root, which every part inherits — the h-8 rung of the house control
			ramp.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-48">
					<NumberField.Root defaultValue={5} min={0} max={100} size="sm">
						<NumberField.ScrubArea label="Small" />
						<NumberField.Group>
							<NumberField.Decrement />
							<NumberField.Input />
							<NumberField.Increment />
						</NumberField.Group>
					</NumberField.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Large">
		{#snippet blurb()}
			<code>size="lg"</code> — the ramp's 48px <code>--control-h-lg</code> rung.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-48">
					<NumberField.Root defaultValue={5} min={0} max={100} size="lg">
						<NumberField.ScrubArea label="Large" />
						<NumberField.Group>
							<NumberField.Decrement />
							<NumberField.Input />
							<NumberField.Increment />
						</NumberField.Group>
					</NumberField.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Number field with buttons on right">
		{#snippet blurb()}
			The parts are plain children, so reordering them is the whole change: the input leads,
			left-aligned, and both buttons follow. Only the decrement loses its rounding, since it is no
			longer at an end of the group.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-48">
					<NumberField.Root defaultValue={5} min={0} max={100}>
						<NumberField.ScrubArea label="Amount" />
						<NumberField.Group>
							<NumberField.Input class="text-left" />
							<NumberField.Decrement class="rounded-none!" />
							<NumberField.Increment />
						</NumberField.Group>
					</NumberField.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Number field with spinner buttons">
		{#snippet blurb()}
			The two buttons stacked into one bordered spinner at the end of the group, the arrangement a
			spreadsheet uses. The chevrons carry no sizing class: the button variant sizes any icon it
			contains.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-48">
					<NumberField.Root defaultValue={5} min={0} max={100}>
						<NumberField.ScrubArea label="Amount" />
						<NumberField.Group>
							<NumberField.Input class="text-start" />

							<div
								class="m-px flex shrink-0 flex-col overflow-hidden rounded-md border border-input bg-muted/30"
							>
								<NumberField.Increment
									class="flex h-3.5 w-full flex-1 shrink-0 items-center rounded-none! border-b border-input px-1.5 leading-none hover:bg-accent focus-visible:bg-accent"
								>
									<ChevronUpIcon />
								</NumberField.Increment>
								<NumberField.Decrement
									class="flex h-3.5 w-full flex-1 shrink-0 items-center rounded-none! px-1.5 leading-none hover:bg-accent focus-visible:bg-accent"
								>
									<ChevronDownIcon />
								</NumberField.Decrement>
							</div>
						</NumberField.Group>
					</NumberField.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Number field in form">
		{#snippet blurb()}
			Inside the field primitives, with the root's <code>id</code> reaching the input so the label
			focuses it, and <code>aria-invalid</code> on the group painting the frame.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-68">
					<form onsubmit={onFormAmountSubmit}>
						<Field.FieldGroup>
							<Field.FieldSet>
								<Field.FieldGroup>
									<Field.Field data-invalid={formAmountVisibleError ? true : undefined}>
										<Field.FieldLabel for="number-field-amount">Amount</Field.FieldLabel>
										<NumberField.Root
											id="number-field-amount"
											bind:value={formAmountValue}
											min={0}
											max={100}
										>
											<NumberField.Group aria-invalid={formAmountVisibleError ? true : undefined}>
												<NumberField.Decrement />
												<NumberField.Input />
												<NumberField.Increment />
											</NumberField.Group>
										</NumberField.Root>
										<Field.FieldDescription>
											Enter an amount between 10 and 100.
										</Field.FieldDescription>
										{#if formAmountVisibleError}
											<Field.FieldError>{formAmountVisibleError}</Field.FieldError>
										{/if}
									</Field.Field>
								</Field.FieldGroup>
							</Field.FieldSet>
							<Field.Field orientation="horizontal">
								<Button variant="outline" type="button" class="flex-1" onclick={onFormAmountReset}>
									Cancel
								</Button>
								<Button type="submit" class="flex-1">Submit</Button>
							</Field.Field>
						</Field.FieldGroup>
					</form>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">NumberField.Root</h3>
			<p class="text-sm text-muted-foreground">
				The container that owns the value, its bounds and its parse/format contract, and publishes
				them to every part through context. It renders a vertical <code>flex</code>
				<code>&lt;div&gt;</code> for the scrub area and the group, plus — while it sits inside a
				<code>&lt;form&gt;</code> — a visually hidden text input that carries the raw number under
				<code>name</code>.
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
			<h3 class="text-base font-medium">NumberField.Group</h3>
			<p class="text-sm text-muted-foreground">
				The bordered frame: a <code>role="group"</code> <code>&lt;div&gt;</code> that carries the
				focus ring on <code>focus-within</code>, the height rung of the control ramp and
				<code>aria-invalid</code> mirrored from the root. Throws when rendered outside
				<code>NumberField.Root</code>, as every part below does.
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
							{#each groupProps as row (row.prop)}
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
			<h3 class="text-base font-medium">NumberField.Input</h3>
			<p class="text-sm text-muted-foreground">
				The visible <code>&lt;input type="text"&gt;</code> — <code>inputmode="decimal"</code> and
				<code>aria-roledescription="Number field"</code> rather than a <code>spinbutton</code>, so
				formatted text such as <code>1,234.5</code> or <code>45%</code> can be typed freely and is
				parsed, clamped and reformatted on blur or <code>Enter</code>. It carries the root’s
				<code>id</code>, <code>disabled</code>, <code>readonly</code>, <code>required</code> and
				<code>aria-invalid</code>.
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
							{#each inputProps as row (row.prop)}
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
			<h3 class="text-base font-medium">NumberField.Increment</h3>
			<p class="text-sm text-muted-foreground">
				A <code>&lt;button type="button"&gt;</code> labelled “Increase value” that steps up by
				<code>step</code>, repeats while held (500 ms, then every 60 ms) and disables itself at
				<code>max</code>. Focus stays on the input while spinning, a hold that outlives the button
				is cancelled, and the end edge is rounded (<code>rounded-e-md</code>).
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
							{#each incrementProps as row (row.prop)}
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
			<h3 class="text-base font-medium">NumberField.Decrement</h3>
			<p class="text-sm text-muted-foreground">
				The mirror of <code>Increment</code>: labelled “Decrease value”, steps down by
				<code>step</code> with the same hold cadence, disables itself at <code>min</code>, and
				rounds the start edge (<code>rounded-s-md</code>).
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
							{#each decrementProps as row (row.prop)}
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
			<h3 class="text-base font-medium">NumberField.ScrubArea</h3>
			<p class="text-sm text-muted-foreground">
				A <code>&lt;div&gt;</code> wrapping a <code>Label</code> for the input; dragging it scrubs
				the value by <code>step</code> per <code>pixelSensitivity</code> pixels while a fixed cursor
				glyph follows the hidden pointer, and <code>data-scrubbing</code> is set for the drag’s duration.
				Pointer capture stands in for the Pointer Lock API, so the pointer stops at the screen edge instead
				of wrapping. Inert for touch pointers and while the field is disabled or read-only.
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
							{#each scrubAreaProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Keyboard interactions</h3>
			<p class="text-sm text-muted-foreground">
				The keyboard map of the input, the one Base UI’s number field implements. Every step clamps
				to <code>min</code>/<code>max</code> and honours <code>snapOnStep</code>.
			</p>
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
