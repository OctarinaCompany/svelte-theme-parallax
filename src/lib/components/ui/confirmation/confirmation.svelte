<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import type { AlertVariant } from "$lib/components/ui/alert/index.js";
	import type { ToolApproval, ToolPartState } from "$lib/shared/chat-parts.js";

	export type ConfirmationRootProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * The tool part's state, as the SDK stamps it. The root renders nothing while it is
		 * `input-streaming` or `input-available`; the phase is read from it together with
		 * {@link ConfirmationRootProps.approval}.
		 */
		state: ToolPartState;
		/**
		 * The decision object. `undefined` means the call needs no approval, and the root renders
		 * nothing. `approved` undefined is the open question; `true` / `false` the answer.
		 */
		approval?: ToolApproval;
		/**
		 * Override the `Alert` face. Left unset, the phase picks it: `default` for an open request,
		 * `success-subtle` once accepted, `destructive-subtle` once rejected.
		 */
		variant?: AlertVariant;
	};

	/** Alias of {@link ConfirmationRootProps}, present for parity with the upstream type name. */
	export type ConfirmationProps = ConfirmationRootProps;
</script>

<script lang="ts">
	import * as Alert from "$lib/components/ui/alert/index.js";
	import { ConfirmationState, setConfirmationContext } from "./confirmation.svelte.js";

	/**
	 * The approval card a tool call shows while it waits for a human, and the record of the
	 * answer once it has one.
	 *
	 * A port of AI Elements' `confirmation.tsx`. It keeps upstream's part structure — a root over
	 * `Alert`, a `Title` over `AlertDescription`, three phase-gated wrappers and an actions row of
	 * `Button`s — and its render gate. FIVE THINGS DIVERGE:
	 *
	 * 1. THE PHASE IS ONE VALUE, NOT THREE CONDITIONS. Upstream's `Request`, `Accepted` and
	 *    `Rejected` each test the raw `(approval, state)` pair for themselves. Here the root
	 *    resolves a single {@link ConfirmationPhase} (`confirmation.svelte.ts`,
	 *    `resolveConfirmationPhase`), every gated part compares against it, and the root stamps it
	 *    as `data-phase`. The resolution is also narrower than upstream's, and the function's
	 *    comment says where and why.
	 *
	 * 2. THE ROOT IS COLOURED BY ITS PHASE. Upstream is a plain `Alert` in every phase. The kit's
	 *    Alert carries the soft status family, so an accepted call sits on `success-subtle` and a
	 *    refused one on `destructive-subtle`, while the open question stays on the card ground.
	 *    `variant` overrides the choice — for a request that should read as a warning, say.
	 *
	 * 3. THE TITLE IS PAINTED IN THE ALERT'S OWN INK. `AlertDescription` is `text-muted-foreground`,
	 *    which upstream keeps. On the soft grounds that ink is not the contrast-walked one
	 *    (`src/app.css` §status tokens) — only `*-subtle-foreground` is — so the title takes
	 *    `text-current` and inherits whatever the variant set. On the default ground that is the
	 *    card ink rather than the muted one: the question awaiting an answer is the content of
	 *    this card, not a caption to it.
	 *
	 * 4. THE GATED PARTS RENDER AN ELEMENT. Upstream's `Request`, `Accepted` and `Rejected` return
	 *    bare children. Here each is a `<div>` with its own `data-slot`, which is what lets it take
	 *    `class`, a `ref` and the rest-spread like every other part in the kit, and gives
	 *    `Accepted` / `Rejected` a row to lay an icon and a word on. The `Actions` row keeps
	 *    upstream's `self-end`, and `Request` is a flex column so that still means something.
	 *
	 * 5. `Action` IS `size="sm"`, NOT `h-8 px-3 text-sm`. Upstream overrides the button height to
	 *    32px by hand; the house control ramp has that rung (`docs/CONVENTIONS.md` §3), so the
	 *    prop is used rather than restated.
	 *
	 * Context is published ONCE, with getters. `setContext` may only be called during component
	 * initialisation (Svelte docs, `svelte` → `setContext`), so a context that stored the pair as
	 * values could not be re-published when they change; `ConfirmationState` reads the live props
	 * through getters instead.
	 *
	 * `role="alert"` is inherited from `Alert.Root`, as upstream inherits it. An approval request
	 * is the one thing in a transcript that needs the reader now, so the assertive role is earned
	 * there; a caller rendering a long list of settled ones can pass `role="status"` through the
	 * rest-spread.
	 */
	let {
		ref = $bindable(null),
		class: className,
		state,
		approval,
		variant,
		children,
		...restProps
	}: ConfirmationRootProps = $props();

	const confirmation = new ConfirmationState({
		getState: () => state,
		getApproval: () => approval,
	});

	setConfirmationContext(confirmation);

	const resolvedVariant = $derived(variant ?? confirmation.variant);
</script>

<!--
	`data-slot` and `data-phase` sit after Alert's own stamps in its rest-spread, so the element
	reads as a confirmation rather than as an alert, and before the caller's `restProps` so a
	caller can still override either. `flex flex-col gap-2` replaces Alert's `grid` through
	tailwind-merge, exactly as upstream's `cn("flex flex-col gap-2", className)` does.
-->
{#if confirmation.visible}
	<Alert.Root
		bind:ref
		data-slot="confirmation"
		data-phase={confirmation.phase}
		data-variant={resolvedVariant}
		variant={resolvedVariant}
		class={cn("flex flex-col gap-2", className)}
		{...restProps}
	>
		{@render children?.()}
	</Alert.Root>
{/if}
