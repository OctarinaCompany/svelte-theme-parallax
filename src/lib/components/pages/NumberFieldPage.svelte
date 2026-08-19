<script lang="ts">
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
	import { toast } from "svelte-sonner";

	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as NumberField from "$lib/components/ui/number-field/index.js";
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
</DocPage>
