<!--
	Internal bridge, not exported from the barrel.

	bits-ui's PinInput.Root yields its cells only as a `children` snippet parameter, but the
	indexed surface lets `<InputOTP.Slot index={n}>` read slot `n`
	from anywhere below the root via context — and Svelte context can only be set during
	component init, never from inside a snippet body. So the root renders this component
	inside the primitive's snippet: it receives the cells as an ordinary reactive prop,
	publishes the context with a getter over that prop (no copy, no effect), and renders the
	caller's children inside its own subtree so the context reaches them.
-->
<script lang="ts">
	import type { Snippet } from "svelte";

	import { InputOTPRootState, setInputOTPContext, type InputOTPCell } from "./input-otp.svelte.js";

	let {
		cells,
		children,
	}: {
		cells: readonly InputOTPCell[];
		children?: Snippet;
	} = $props();

	setInputOTPContext(new InputOTPRootState({ getCells: () => cells }));
</script>

{@render children?.()}
