<script lang="ts">
	import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";

	import * as Card from "$lib/components/ui/card/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as InputOTP from "$lib/components/ui/input-otp/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Input OTP component page — its six examples in the order that
	 * page gives them.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. The classic theme types a verification code into one plain
	 * `.form-control`; the segmented one-slot-per-character control does not exist anywhere in
	 * the theme. So the look is the component's own, which is why
	 * `$lib/components/ui/input-otp/` anchors its skin to this repo's `Input`:
	 * slots are `size-9` (the house default control height), the radius is `rounded-md`, and the
	 * active slot takes Input's focus ring rather than the upstream skin's own.
	 *
	 * TWO THINGS TRANSLATE RATHER THAN COPY:
	 *
	 * 1. THE PATTERNS ARE STRINGS. Upstream imports `REGEXP_ONLY_DIGITS` and friends from the
	 *    React `input-otp` package, where they are `RegExp` literals. The primitive here is
	 *    bits-ui's PinInput, which takes a string `pattern`, so the same three constants are
	 *    re-exported from the component's barrel as strings and used by the same names.
	 *
	 * 2. `id` REACHES THE HIDDEN INPUT. Every demo labels its control with `<FieldLabel for>`,
	 *    which only works if the id lands on the focusable element. `InputOTP.Root` forwards
	 *    `id` to the hidden input for exactly that reason (see its own header), so the upstream
	 *    `htmlFor`/`id` pairing survives verbatim.
	 */

	/** The Multi-Separator section's controlled value — upstream seeds it with "123456". */
	let multiSeparatorValue = $state("123456");
</script>

<DocPage title="Input OTP">
	{#snippet subtitle()}
		A segmented one-time-password field: each character gets its own slot, groups can be split by
		separators, and the value is typed into a single hidden input so paste and autofill keep
		working.
	{/snippet}

	<DocSection title="Basic OTP input">
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center">
					<Field.Field>
						<Field.FieldLabel for="simple-otp">Simple OTP</Field.FieldLabel>
						<InputOTP.Root id="simple-otp" maxlength={6}>
							<InputOTP.Group>
								<InputOTP.Slot index={0} />
								<InputOTP.Slot index={1} />
								<InputOTP.Slot index={2} />
							</InputOTP.Group>
							<InputOTP.Separator />
							<InputOTP.Group>
								<InputOTP.Slot index={3} />
								<InputOTP.Slot index={4} />
								<InputOTP.Slot index={5} />
							</InputOTP.Group>
						</InputOTP.Root>
					</Field.Field>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="OTP input with numeric digits">
		{#snippet blurb()}
			The <code>REGEXP_ONLY_DIGITS</code> pattern rejects every keystroke that is not a digit, so the
			six slots can only ever hold a numeric code.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center">
					<Field.Field>
						<Field.FieldLabel for="digits-only">Digits Only</Field.FieldLabel>
						<InputOTP.Root id="digits-only" maxlength={6} pattern={InputOTP.REGEXP_ONLY_DIGITS}>
							<InputOTP.Group>
								<InputOTP.Slot index={0} />
								<InputOTP.Slot index={1} />
								<InputOTP.Slot index={2} />
								<InputOTP.Slot index={3} />
								<InputOTP.Slot index={4} />
								<InputOTP.Slot index={5} />
							</InputOTP.Group>
						</InputOTP.Root>
					</Field.Field>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="OTP input with multiple separators">
		{#snippet blurb()}
			Three groups of two, and a controlled value — upstream's <code>useState("123456")</code> is a
			bound <code>$state</code> here, so the field starts filled.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center">
					<Field.Field>
						<Field.FieldLabel for="multi-separator">Multi-Separator</Field.FieldLabel>
						<InputOTP.Root id="multi-separator" maxlength={6} bind:value={multiSeparatorValue}>
							<InputOTP.Group>
								<InputOTP.Slot index={0} />
								<InputOTP.Slot index={1} />
							</InputOTP.Group>
							<InputOTP.Separator />
							<InputOTP.Group>
								<InputOTP.Slot index={2} />
								<InputOTP.Slot index={3} />
							</InputOTP.Group>
							<InputOTP.Separator />
							<InputOTP.Group>
								<InputOTP.Slot index={4} />
								<InputOTP.Slot index={5} />
							</InputOTP.Group>
						</InputOTP.Root>
					</Field.Field>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="OTP input with letters and numbers">
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center">
					<Field.Field>
						<Field.FieldLabel for="alphanumeric">Alphanumeric OTP</Field.FieldLabel>
						<Field.FieldDescription>Accepts both letters and numbers.</Field.FieldDescription>
						<InputOTP.Root
							id="alphanumeric"
							maxlength={6}
							pattern={InputOTP.REGEXP_ONLY_DIGITS_AND_CHARS}
						>
							<InputOTP.Group>
								<InputOTP.Slot index={0} />
								<InputOTP.Slot index={1} />
								<InputOTP.Slot index={2} />
							</InputOTP.Group>
							<InputOTP.Separator />
							<InputOTP.Group>
								<InputOTP.Slot index={3} />
								<InputOTP.Slot index={4} />
								<InputOTP.Slot index={5} />
							</InputOTP.Group>
						</InputOTP.Root>
					</Field.Field>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="OTP input for PIN codes">
		<Card.Root>
			<Card.Content>
				<div class="flex items-center justify-center">
					<Field.Field>
						<Field.FieldLabel for="four-digits">4-Digit PIN</Field.FieldLabel>
						<Field.FieldDescription>Common pattern for PIN codes.</Field.FieldDescription>
						<InputOTP.Root id="four-digits" maxlength={4} pattern={InputOTP.REGEXP_ONLY_DIGITS}>
							<InputOTP.Group>
								<InputOTP.Slot index={0} />
								<InputOTP.Slot index={1} />
								<InputOTP.Slot index={2} />
								<InputOTP.Slot index={3} />
							</InputOTP.Group>
						</InputOTP.Root>
					</Field.Field>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="OTP input verification code">
		{#snippet blurb()}
			The whole control in context: a verification card with a resend affordance beside the label
			and wider, larger slots.
		{/snippet}
		<div class="flex items-center justify-center">
			<!--
				Upstream widens the slots to `w-11` and bumps the glyph to `text-xl` for this card. Its `h-9` goes with them: that is already the house slot height,
				so restating it here would only invite the two to drift apart.
			-->
			<Card.Root class="mx-auto w-full max-w-md">
				<Card.Header>
					<Card.Title>Verify your login</Card.Title>
					<Card.Description>
						Enter the verification code we sent to your email address:
						<span class="font-medium text-foreground">m@example.com</span>.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<form>
						<Field.Field>
							<div class="flex items-center justify-between">
								<Field.FieldLabel for="otp-verification">Verification code</Field.FieldLabel>
								<Button variant="outline" size="xs">
									<RefreshCwIcon data-icon="inline-start" />
									Resend Code
								</Button>
							</div>
							<InputOTP.Root id="otp-verification" maxlength={6} required>
								<InputOTP.Group
									class="*:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl"
								>
									<InputOTP.Slot index={0} />
									<InputOTP.Slot index={1} />
									<InputOTP.Slot index={2} />
								</InputOTP.Group>
								<InputOTP.Separator />
								<InputOTP.Group
									class="*:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl"
								>
									<InputOTP.Slot index={3} />
									<InputOTP.Slot index={4} />
									<InputOTP.Slot index={5} />
								</InputOTP.Group>
							</InputOTP.Root>
						</Field.Field>
					</form>
				</Card.Content>
				<Card.Footer class="flex-col gap-2">
					<Button type="submit" class="w-full">Verify</Button>
					<div class="text-sm text-muted-foreground">
						Having trouble signing in?
						<a
							href={href("/components/input-otp")}
							class="text-primary underline-offset-4 transition-colors hover:underline"
							>Contact support</a
						>
					</div>
				</Card.Footer>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>
