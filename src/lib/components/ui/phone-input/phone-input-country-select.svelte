<script lang="ts" module>
	import type { Popover as PopoverPrimitive } from "bits-ui";

	export type PhoneInputCountrySelectProps = Omit<PopoverPrimitive.RootProps, "children"> & {
		/**
		 * Whether the country dropdown is open. Defaults to the root's own state; a caller-supplied
		 * value wins over it, matching upstream's spread order.
		 *
		 * Bindable: every open change is written back here as well, so `bind:open` stays in step with
		 * the trigger, `Escape` and a country selection alike.
		 */
		open?: boolean;
		/** Called when the dropdown opens or closes. Composed with the internal handler, never replacing it. */
		onOpenChange?: (open: boolean) => void;
		/** Called once the open/close animation has finished. Passed straight to `Popover.Root`. */
		onOpenChangeComplete?: (open: boolean) => void;
		/**
		 * Whether the trigger is disabled. OR-ed with the root's own `disabled`.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Accessible name for the trigger, which renders only a flag emoji and a chevron. The
		 * selected country's name is appended when one is selected.
		 *
		 * @default "Select country"
		 */
		"aria-label"?: string;
		/** The trigger element. */
		ref?: HTMLButtonElement | null;
		/** Merged last onto the trigger. */
		class?: string;
	};
</script>

<script lang="ts">
	import * as Command from "$lib/components/ui/command/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { cn } from "$lib/utils.js";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";

	import { getPhoneInputContext } from "./phone-input.svelte.js";

	let {
		ref = $bindable(null),
		open = $bindable(),
		onOpenChange,
		onOpenChangeComplete,
		disabled = false,
		"aria-label": ariaLabel = "Select country",
		class: className,
		...restProps
	}: PhoneInputCountrySelectProps = $props();

	const root = getPhoneInputContext("<PhoneInput.CountrySelect>");

	const isDisabled = $derived(disabled || root.disabled);
	const isOpen = $derived(open ?? root.open);

	function handleOpenChange(next: boolean) {
		root.open = next;
		open = next;
		onOpenChange?.(next);
	}

	function handleCloseAutoFocus(event: Event) {
		// bits-ui restores focus to the trigger for every other close (Escape, outside click), which
		// is both the WAI-ARIA practice and upstream's observable result — upstream's
		// `requestAnimationFrame` focus only runs on the select path.
		if (!root.consumeSelectionClose()) return;

		event.preventDefault();
		root.focusField();
	}
</script>

<Popover.Root open={isOpen} onOpenChange={handleOpenChange} {onOpenChangeComplete} {...restProps}>
	<!-- Divergence from upstream, which leaves this trigger unnamed: label it, and append the
	selected country so the current value is announced. The flag/swatch and chevron are hidden
	from the accessibility tree so the emoji is not announced on top of the label. -->
	<Popover.Trigger
		bind:ref
		data-slot="phone-input-country-select"
		aria-label={root.selectedCountry ? `${ariaLabel}, ${root.selectedCountry.name}` : ariaLabel}
		disabled={isDisabled}
		class={cn(
			"flex h-full shrink-0 items-center gap-2 rounded-s-lg border-e border-input bg-transparent px-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:z-10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
			className,
		)}
	>
		{#if !root.selectedCountry}
			<div
				data-slot="phone-input-country-swatch"
				aria-hidden="true"
				class="h-4 w-6 rounded-sm bg-muted/50"
			></div>
		{:else if root.showFlag && root.selectedCountry.flag}
			<div aria-hidden="true" class="w-6 text-lg leading-none">{root.selectedCountry.flag}</div>
		{/if}
		<ChevronDownIcon aria-hidden="true" class="size-4 opacity-50" />
	</Popover.Trigger>
	<Popover.Content class="w-[300px] p-0" align="start" onCloseAutoFocus={handleCloseAutoFocus}>
		<Command.Root>
			<Command.Input placeholder="Search country..." />
			<Command.List>
				<Command.Empty>No country found.</Command.Empty>
				<Command.Group>
					{#each root.countries as country (country.code)}
						<Command.Item
							value={`${country.name} ${country.dialCode} ${country.code}`}
							data-checked={country.code === root.country ? "true" : undefined}
							onSelect={() => {
								root.selectCountry(country.code);
								// Every open change goes through the one handler, so a caller-supplied `open`
								// stays in step with the internal state on the selection path too.
								handleOpenChange(false);
							}}
						>
							{#if root.showFlag && country.flag}
								<span class="text-lg">{country.flag}</span>
							{/if}
							<span class="flex-1">{country.name}</span>
							<span class="text-muted-foreground">{country.dialCode}</span>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
