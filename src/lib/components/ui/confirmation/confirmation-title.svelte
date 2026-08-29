<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type ConfirmationTitleProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import * as Alert from "$lib/components/ui/alert/index.js";

	/**
	 * The question, or the record of it — "Allow Bash to run `rm -rf build/`?".
	 *
	 * Upstream's `ConfirmationTitle` is `AlertDescription` with `inline` added, and so is this.
	 * `text-current` is the divergence, and `confirmation.svelte` (§3) says why: the description's
	 * muted ink is not walked against the soft grounds the settled phases sit on, so the title
	 * inherits the variant's ink instead. Both classes are merged after the description's own, so
	 * tailwind-merge resolves the colour in this part's favour.
	 *
	 * It is not gated on the phase: the question stays on screen after it is answered, which is
	 * what makes "Approved" underneath it mean anything.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ConfirmationTitleProps = $props();
</script>

<Alert.Description
	bind:ref
	data-slot="confirmation-title"
	class={cn("inline text-sm text-current", className)}
	{...restProps}
>
	{@render children?.()}
</Alert.Description>
