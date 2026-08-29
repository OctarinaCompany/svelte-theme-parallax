<script lang="ts" module>
	import type { ButtonProps } from "$lib/components/ui/button/index.js";

	export type ConfirmationActionProps = ButtonProps;
</script>

<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";

	/**
	 * One answer. A `Button` on the `sm` rung of the control ramp, `type="button"` so it can never
	 * submit a form it happens to sit in — the same two defaults upstream sets, minus the hand-set
	 * height (`confirmation.svelte` §5). `variant` is forwarded untouched: the affirmative button
	 * is the primary one and the refusal an `outline`, by upstream's convention, and both are the
	 * caller's call. Every other `Button` prop — `disabled`, `href`, `class`, handlers — passes
	 * through.
	 *
	 * Not gated on the phase itself: the `Actions` row it lives in is, and a button gated twice is
	 * a button that disappears from a caller's custom row for no visible reason.
	 */
	let {
		ref = $bindable(null),
		size = "sm",
		type = "button",
		variant = "default",
		children,
		...restProps
	}: ConfirmationActionProps = $props();
</script>

<Button bind:ref data-slot="confirmation-action" {size} {type} {variant} {...restProps}>
	{@render children?.()}
</Button>
