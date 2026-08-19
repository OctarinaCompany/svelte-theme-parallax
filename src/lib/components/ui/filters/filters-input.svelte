<script lang="ts" module>
	import type { FilterFieldConfig } from "./types.js";

	export interface FiltersInputProps<T = unknown> {
		field: FilterFieldConfig<T>;
		value: string;
		onChange: (value: string) => void;
		/** Focus this input shortly after it mounts — set on the chip that was just added. */
		autofocus?: boolean;
	}
</script>

<script lang="ts" generics="T">
	import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { cn } from "$lib/utils.js";
	import { getFiltersContext } from "./filters.svelte.js";

	/**
	 * The value half of a chip for a `text` field, with its validation.
	 *
	 * WHEN IT VALIDATES: on blur, and only if there is something to validate — a value, and either
	 * a `pattern` or a `validation` function. Typing clears the error again, on the first key that
	 * is not navigation. Both halves matter: validating per keystroke would flag `user@` on the way
	 * to a valid address, and leaving the error up while it is being corrected would be worse.
	 *
	 * TWO UPSTREAM DEFECTS ARE NOT REPRODUCED.
	 *
	 * `aria-describedby` upstream points at `${field.key}-error`, an id nothing ever renders — the
	 * message lives in a tooltip, which does not exist until it is hovered. A screen reader
	 * following that reference finds nothing. The message is rendered here in an `sr-only` span
	 * carrying that id, so the reference resolves and the tooltip stays a sighted-user affordance.
	 *
	 * `new RegExp(pattern)` runs uncaught upstream, so a field with a malformed `pattern` throws
	 * out of a blur handler and takes the page with it. It is caught here, and an unusable pattern
	 * fails the value rather than the render.
	 *
	 * THE SIZE LADDER IS THIS THEME'S OWN. A five-style matrix whose `sm` and
	 * `lg` step down and up from a base `InputGroup` of `h-8`; here the ladder is the
	 * `--control-h-*` ramp (`CONVENTIONS.md` §3: sm 32 / default 40 / lg 48), the same tokens
	 * `Button`'s sizes consume. Anything else and the input would sit a step off the operator
	 * button beside it inside the same group.
	 */

	let { field, value, onChange, autofocus = false }: FiltersInputProps<T> = $props();

	const context = getFiltersContext();
	const errorId = $derived(`${field.key ?? "input"}-error`);

	let input = $state<HTMLInputElement | null>(null);
	let message = $state("");

	/**
	 * Focused on a timer, not with the native attribute.
	 *
	 * The chip that gets this is the one the Add filter menu just created, and that menu is still
	 * closing. `autofocus` would win the focus and then lose it again when the menu returns focus
	 * to its trigger on unmount; 300ms lands after that.
	 */
	$effect(() => {
		if (!autofocus) return;
		const timer = setTimeout(() => input?.focus(), 300);
		return () => clearTimeout(timer);
	});

	function matchesPattern(candidate: string, pattern: string): boolean {
		try {
			return new RegExp(pattern).test(candidate);
		} catch {
			return false;
		}
	}

	function validate(candidate: string) {
		const pattern = field.pattern;
		if (!candidate || (!pattern && !field.validation)) {
			message = "";
			return;
		}

		if (field.validation) {
			const result = field.validation(candidate);
			const valid = typeof result === "boolean" ? result : result.valid;
			const reason = typeof result === "boolean" ? "" : (result.message ?? "");
			message = valid ? "" : reason || context.i18n.validation.invalid;
			return;
		}

		message = matchesPattern(candidate, pattern!) ? "" : context.i18n.validation.invalid;
	}

	/** Everything except the keys that move around inside a field the user is already correcting. */
	const KEEPS_ERROR = ["Tab", "Escape", "Enter", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

	/**
	 * Every rung states itself, on the ramp tokens, and every rung needs the `!`.
	 *
	 * `src/app.css` pins `[data-slot="input-group"]` to `input-height` (40px) from outside any
	 * layer, which is the escape that file documents: a control that must depart says so with
	 * `!` at the call site — and the pin is size-blind, so `sm` and `lg` need the `!` to state
	 * their own rung against it. Consuming the tokens rather than restating `h-8`/`h-10` keeps
	 * the chip on whatever the ramp says, beside the operator `Button` that reads the same
	 * variables.
	 */
	const heightClass = $derived(
		context.size === "sm"
			? "h-(--control-h-sm)!"
			: context.size === "lg"
				? "h-(--control-h-lg)!"
				: "h-(--control-h-default)!",
	);
</script>

<InputGroup.Root class={cn("w-36", heightClass, field.class)}>
	{#if field.prefix}
		<InputGroup.Addon>
			<InputGroup.Text>{@render field.prefix()}</InputGroup.Text>
		</InputGroup.Addon>
	{/if}

	<!-- `autocomplete="off"`: a filter value is a query, not a detail about the person typing it. -->
	<InputGroup.Input
		bind:ref={input}
		type="text"
		name={field.key}
		aria-label={field.label}
		autocomplete="off"
		{value}
		placeholder={field.placeholder}
		pattern={field.pattern}
		aria-invalid={message ? true : undefined}
		aria-describedby={message ? errorId : undefined}
		class={cn(heightClass, context.size === "sm" && "text-xs")}
		oninput={(event) => onChange(event.currentTarget.value)}
		onblur={(event) => validate(event.currentTarget.value)}
		onkeydown={(event) => {
			if (message && !KEEPS_ERROR.includes(event.key)) message = "";
		}}
	/>

	{#if message}
		<InputGroup.Addon align="inline-end">
			<span id={errorId} class="sr-only">{message}</span>
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<InputGroup.Button {...props} size="icon-xs" aria-label={message}>
								<CircleAlertIcon class="size-3.5 text-destructive" />
							</InputGroup.Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p class="text-sm">{message}</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</InputGroup.Addon>
	{/if}

	{#if field.suffix}
		<InputGroup.Addon align="inline-end">
			<InputGroup.Text>{@render field.suffix()}</InputGroup.Text>
		</InputGroup.Addon>
	{/if}
</InputGroup.Root>
