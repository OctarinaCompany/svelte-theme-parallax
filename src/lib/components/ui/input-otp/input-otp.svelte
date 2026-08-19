<script lang="ts" module>
	import { PinInput as PinInputPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";

	/**
	 * Upstream `InputOTP` wraps the React `input-otp` package's `OTPInput`;
	 * here the equivalent primitive is bits-ui's PinInput, so the
	 * prop surface is bits-ui's — `maxlength`/`value`/`onValueChange`/`pattern`/`onComplete`/
	 * `pasteTransformer` all pass straight through — with two deliberate departures:
	 *
	 * - `children` takes no parameters. The primitive's snippet yields the cells, but this
	 *   port relays them over context so slots address themselves by `index`, matching the
	 *   indexed composition (`<InputOTP.Slot index={0} />`).
	 * - Upstream splits `className` (the sizing-hidden `<input>`) from `containerClassName`
	 *   (the flex container). bits-ui renders that input itself, styles it entirely inline
	 *   (pin-input.svelte.js:173-198) and exposes no class hook for it, and its container
	 *   already swaps the cursor while disabled (pin-input.svelte.js:153-159) — the only job
	 *   upstream's input-side `className` had. So `class` here styles the container, and
	 *   `containerClassName` has no counterpart.
	 */
	export type InputOTPRootProps = Omit<PinInputPrimitive.RootProps, "children" | "maxlength"> & {
		/**
		 * The number of slots the value fills.
		 *
		 * @default 6
		 */
		maxlength?: number;
		children?: Snippet;
	};

	/** Upstream-parity alias of {@link InputOTPRootProps}. */
	export type InputOTPProps = InputOTPRootProps;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	import InputOTPProvider from "./input-otp-provider.svelte";

	let {
		ref = $bindable(null),
		inputRef = $bindable(null),
		value = $bindable(""),
		id,
		inputId,
		maxlength = 6,
		spellcheck = false,
		class: className,
		children: childrenProp,
		...restProps
	}: InputOTPRootProps = $props();
</script>

<!--
	`id` routes to the hidden input, not the container: upstream spreads it onto `OTPInput`,
	whose props land on the `<input>`, which is what makes
	`<Label for>` reach the focusable element. bits-ui instead reserves `id` for the container
	and names the input's one `inputId`, so the friendlier prop is forwarded — an explicit
	`inputId` still wins, and leaving both unset lets bits-ui generate one.

	`spellcheck={false}` mirrors upstream input-otp.tsx:23. `data-slot="input-otp"` travels
	through the rest props onto the input, the same element upstream tags (React spreads it
	onto the `<input>` too). The container classes fuse upstream's structural
	"flex items-center has-disabled:opacity-50" with the gap-2 rhythm of
	its stylesheet.
-->
<PinInputPrimitive.Root
	bind:ref
	bind:inputRef
	bind:value
	inputId={inputId ?? id}
	{maxlength}
	{spellcheck}
	data-slot="input-otp"
	class={cn("flex items-center gap-2 has-disabled:opacity-50", className)}
	{...restProps}
>
	{#snippet children({ cells })}
		<InputOTPProvider {cells}>
			{@render childrenProp?.()}
		</InputOTPProvider>
	{/snippet}
</PinInputPrimitive.Root>
