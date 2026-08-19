<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as Shake from "$lib/components/ui/shake/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import type { ShakeHandle } from "$lib/components/ui/shake/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";

	/**
	 * The Shake component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART, and Shake owns no surface of its own: it wraps whatever it is
	 * given and animates the wrapper, so the only thing on this page that can be themed is the
	 * demo content.
	 *
	 * Both demos below pair the wobble with a written message, and that is the point rather than
	 * decoration. A shake carries no information — it is not read out, it does not survive
	 * `prefers-reduced-motion`, and it leaves nothing behind once it has run — so anything it
	 * signals has to be said somewhere too.
	 */

	/** The one code the verification demo accepts. */
	const DEMO_CODE = "1234";

	let code = $state("");
	let failures = $state(0);
	let verified = $state(false);

	function verify(event: SubmitEvent) {
		event.preventDefault();
		if (code === DEMO_CODE) {
			verified = true;
			return;
		}
		verified = false;
		// The counter is the signal: it only ever moves on a failure, and it starts falsy, so the
		// first render never shakes.
		failures += 1;
		code = "";
	}

	let manual: ShakeHandle | undefined = $state();

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "signal",
			type: "unknown",
			default: "undefined",
			description:
				"Replays the shake when it changes to a new truthy value — a failure counter, or the error message itself. Read-only: the component never writes it back.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Applied to the wrapper. The component contributes no classes of its own; the animation hangs off `data-shaking`.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The content that shakes.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Every other attribute and DOM handler is forwarded. A supplied `onanimationend` runs before the component's own.",
		},
	];

	const instanceApi = [
		{
			member: "shake()",
			type: "() => void",
			description:
				"Replays the shake now, restarting one already in flight. Reach it with `bind:this`. No-op when the reader has asked for reduced motion.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", values: "shake" },
		{ attribute: "[data-shaking]", values: "present while the animation is running" },
		{ attribute: "[data-motion]", values: '"reduce" when prefers-reduced-motion is requested' },
	];
</script>

<DocPage title="Shake">
	{#snippet subtitle()}
		A wrapper that replays a perspective wobble whenever a signal changes — the wrong-password
		nudge.
	{/snippet}

	<DocSection title="Verification code">
		{#snippet blurb()}
			signal is a failure counter, so every rejected attempt replays the shake — including two in a
			row with the same code.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<form onsubmit={verify}>
					<Shake.Root signal={failures} class="flex flex-col items-center gap-3">
						<Input
							bind:value={code}
							inputmode="numeric"
							autocomplete="off"
							aria-invalid={failures > 0 && !verified}
							aria-label="Verification code"
							placeholder="Enter {DEMO_CODE}"
							class="w-40 text-center tracking-[0.3em]"
						/>
						<Button type="submit">Verify</Button>
						{#if verified}
							<Badge variant="success-subtle">Code accepted</Badge>
						{:else if failures > 0}
							<p role="alert" class="text-sm text-destructive">
								That code is wrong. Attempts: {failures}.
							</p>
						{/if}
					</Shake.Root>
				</form>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Imperative trigger">
		{#snippet blurb()}
			Where the wobble answers an event rather than a value, bind:this and call shake(). This is the
			Svelte form of upstream's useShake hook.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col items-center gap-3">
					<Shake.Root bind:this={manual}>
						<div class="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3">
							<span class="text-sm">Nothing to see here</span>
						</div>
					</Shake.Root>
					<Button variant="outline" onclick={() => manual?.shake()}>Shake it</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Shake</h3>
			<p class="text-sm text-muted-foreground">
				The only part. There is no <code>child</code> snippet: the keyframes are scoped to the component,
				so the animation cannot be lent to an element the component does not itself render.
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
			<h3 class="text-base font-medium">Instance API</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Member</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each instanceApi as row (row.member)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.member}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
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
