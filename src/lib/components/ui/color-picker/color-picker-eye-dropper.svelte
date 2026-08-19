<script lang="ts" module>
	import type { ButtonSize, ButtonVariant } from "$lib/components/ui/button/index.js";
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type ColorPickerEyeDropperChildProps = {
		type: "button";
		"aria-label": string | undefined;
		"data-slot": "color-picker-eye-dropper";
		"data-disabled": "" | undefined;
		"data-readonly": "" | undefined;
		disabled: boolean;
		class: string;
	} & Record<string, unknown>;

	export type ColorPickerEyeDropperProps = Omit<
		WithElementRef<HTMLButtonAttributes, HTMLButtonElement>,
		"type" | "children"
	> & {
		/**
		 * The button style.
		 *
		 * @default "outline"
		 */
		variant?: ButtonVariant;
		/**
		 * The button size.
		 *
		 * @default "icon" without `children`, otherwise "default"
		 */
		size?: ButtonSize;
		/**
		 * Whether the button is disabled. OR-ed with the picker's own `disabled`.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * The button's content.
		 *
		 * @default `<PipetteIcon />`
		 */
		children?: Snippet;
		/**
		 * Render the button onto your own element instead of the default `<button>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild`. In `child` mode `ref` stays `null`.
		 */
		child?: Snippet<[{ props: ColorPickerEyeDropperChildProps }]>;
	};
</script>

<script lang="ts">
	import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import PipetteIcon from "@lucide/svelte/icons/pipette";
	import { onMount } from "svelte";

	import { hexToRgb } from "./color.js";
	import { getColorPickerContext } from "./color-picker.svelte.js";

	let {
		ref = $bindable(null),
		variant = "outline",
		size,
		disabled = false,
		"aria-label": ariaLabel,
		class: className,
		onclick,
		children,
		child: childSnippet,
		...restProps
	}: ColorPickerEyeDropperProps = $props();

	const root = getColorPickerContext("<ColorPicker.EyeDropper>");

	const isDisabled = $derived(disabled || root.disabled);

	/**
	 * The feature detection is deferred to the first effect rather than run during initialisation:
	 * `!!window.EyeDropper` answers `false` on the server and `true` in Chromium, so reading it while
	 * the component initialises would be a hydration mismatch. Gating on a mount latch
	 * makes the first client render agree with the server and the button appear immediately after.
	 */
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});

	const supported = $derived(mounted && typeof window !== "undefined" && !!window.EyeDropper);

	const resolvedSize = $derived(size ?? (children || childSnippet ? "default" : "icon"));

	// Upstream's icon-only button has no accessible name at all — `@lucide/svelte` marks its `<svg>`
	// `aria-hidden`, so it announces as a bare "button".
	const resolvedLabel = $derived(
		ariaLabel ?? (children || childSnippet ? undefined : "Pick a color from the screen"),
	);

	async function pick() {
		if (!window.EyeDropper) return;

		try {
			const eyeDropper = new window.EyeDropper();
			const result = await eyeDropper.open();

			if (result.sRGBHex) {
				root.setFromRgb(hexToRgb(result.sRGBHex, root.alpha));
			}
		} catch (error) {
			console.warn("EyeDropper error:", error);
		}
	}

	function handleClick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclick?.(event);
		if (event.defaultPrevented) return;
		void pick();
	}

	const eyeDropperAttrs = $derived({
		type: "button",
		"aria-label": resolvedLabel,
		"data-slot": "color-picker-eye-dropper",
		"data-disabled": isDisabled ? "" : undefined,
		"data-readonly": root.readOnly ? "" : undefined,
		disabled: isDisabled,
		...restProps,
		onclick: handleClick,
		class: cn(buttonVariants({ variant, size: resolvedSize }), className),
	} as ColorPickerEyeDropperChildProps);
</script>

{#if supported}
	{#if childSnippet}
		{@render childSnippet({ props: eyeDropperAttrs })}
	{:else}
		<Button bind:ref {variant} size={resolvedSize} {...eyeDropperAttrs}>
			{#if children}{@render children()}{:else}<PipetteIcon />{/if}
		</Button>
	{/if}
{/if}
