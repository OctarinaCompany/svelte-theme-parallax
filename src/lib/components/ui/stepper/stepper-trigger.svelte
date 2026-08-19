<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	import type { StepperDataState } from "./stepper.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type StepperTriggerChildProps = {
		id: string;
		role: "tab";
		type: "button";
		"data-slot": "stepper-trigger";
		"data-state": StepperDataState;
		"aria-controls": string;
		"aria-describedby": string;
		"aria-posinset": number;
		"aria-setsize": number;
		"aria-selected": boolean;
		/** `0` only while this trigger owns the list's tab stop. */
		tabindex: number;
		class: string;
	} & Record<string, unknown>;

	export type StepperTriggerProps = WithElementRef<HTMLButtonAttributes, HTMLButtonElement> & {
		/**
		 * Render the trigger onto your own element instead of the default `<button>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element, so
		 * the trigger cannot register itself with the list's roving focus.
		 */
		child?: Snippet<[{ props: StepperTriggerChildProps }]>;
	};
</script>

<script lang="ts">
	import { focusFirst } from "$lib/shared/roving-focus.svelte.js";
	import { untrack } from "svelte";

	import {
		getStepperContext,
		getStepperFocusContext,
		getStepperItemContext,
		getStepperFocusIntent,
	} from "./stepper.svelte.js";

	let {
		ref = $bindable(null),
		disabled,
		onclick: onclickProp,
		onfocus: onfocusProp,
		onkeydown: onkeydownProp,
		onmousedown: onmousedownProp,
		class: className,
		child,
		children,
		...restProps
	}: StepperTriggerProps = $props();

	const root = getStepperContext("<Stepper.Trigger>");
	const item = getStepperItemContext("<Stepper.Trigger>");
	const focus = getStepperFocusContext("<Stepper.Trigger>");

	const isDisabled = $derived(disabled === true || item.disabled || root.disabled);
	const isActive = $derived(root.value === item.value);
	const isTabStop = $derived(focus.isTabStop(item.triggerId));

	/** Upstream `isMouseClickRef` (727): a focus that follows a pointer press must not activate. */
	let isMouseClick = false;

	// Registered with **getters**, so navigation reads `disabled` at keydown time and a trigger that
	// becomes disabled after mounting is skipped without re-registering (upstream 746-765). The
	// registration itself is untracked: the collection's `SvelteMap` reads its version counter to
	// increment it, which would otherwise re-register every sibling whenever one trigger mounts.
	$effect(() => {
		const element = ref;
		if (!element) return;

		const id = item.triggerId;
		untrack(() =>
			focus.register(id, element, {
				getDisabled: () => isDisabled,
				getValue: () => item.value,
			}),
		);

		return () => focus.unregister(id);
	});

	/**
	 * Activate `target`, routing forward moves through `onValidate` and letting backward moves
	 * through unvalidated — the same split upstream makes explicit for arrow-key navigation
	 * (899-907), applied to every activation path.
	 */
	async function activate(target: string): Promise<boolean> {
		if (root.directionTo(target) === "next") {
			return await root.setValueWithValidation(target, "next");
		}

		root.setValue(target);
		return true;
	}

	async function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		if (isDisabled || root.nonInteractive) return;

		await activate(item.value);
	}

	async function onfocus(event: FocusEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onfocusProp?.(event);
		if (event.defaultPrevented) return;

		focus.onItemFocus(item.triggerId);

		const isKeyboardFocus = !isMouseClick;
		isMouseClick = false;

		// Selection follows focus, but only for keyboard focus in automatic mode (upstream 800-812).
		if (
			!isActive &&
			!isDisabled &&
			root.activationMode !== "manual" &&
			!root.nonInteractive &&
			isKeyboardFocus
		) {
			await activate(item.value);
		}
	}

	async function onkeydown(
		event: KeyboardEvent & { currentTarget: EventTarget & HTMLButtonElement },
	) {
		onkeydownProp?.(event);
		if (event.defaultPrevented) return;

		if (event.key === "Enter" && root.nonInteractive) {
			event.preventDefault();
			return;
		}

		if (
			(event.key === "Enter" || event.key === " ") &&
			root.activationMode === "manual" &&
			!root.nonInteractive
		) {
			event.preventDefault();
			// `currentTarget`, not `ref`: in `child` mode `ref` stays `null`, and with the default
			// just prevented a `ref?.click()` no-op would leave Enter/Space dead on custom triggers.
			if (!isDisabled) event.currentTarget.click();
			return;
		}

		if (event.key === "Tab" && event.shiftKey) {
			focus.onItemShiftTab();
			return;
		}

		if (event.target !== event.currentTarget) return;

		const intent = getStepperFocusIntent(event.key, root.orientation, root.dir);
		if (intent === undefined) return;

		// A held modifier means the user is driving the browser, not the stepper: no navigation and,
		// crucially, no `preventDefault()` (upstream 863-864).
		if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
		event.preventDefault();

		const candidates = focus.candidatesFor(intent, event.currentTarget, root.loop);

		// With a validator installed the focus move itself is gated: the next candidate is resolved
		// back to a step value and committed *before* focus is allowed to land on it, so a rejected
		// step never receives focus (upstream 882-912).
		if (root.hasValidation() && candidates.length > 0) {
			const nextElement = candidates[0] ?? null;
			const nextEntry = focus.entryOf(nextElement);
			const nextValue = nextEntry?.meta.getValue();

			if (nextValue !== undefined && nextValue !== item.value) {
				const moved = await activate(nextValue);
				if (!moved) return;

				queueMicrotask(() => nextElement?.focus());
				return;
			}
		}

		// Deferred exactly as upstream (914), so the focus move lands after the keydown's own default
		// handling rather than inside it.
		queueMicrotask(() => focusFirst(candidates));
	}

	function onmousedown(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onmousedownProp?.(event);
		if (event.defaultPrevented) return;

		isMouseClick = true;

		if (isDisabled) {
			event.preventDefault();
		} else {
			focus.onItemFocus(item.triggerId);
		}
	}

	const triggerAttrs = $derived({
		id: item.triggerId,
		role: "tab",
		type: "button",
		"data-slot": "stepper-trigger",
		"data-state": item.dataState,
		"data-disabled": isDisabled ? "" : undefined,
		"aria-controls": item.contentId,
		"aria-current": isActive ? "step" : undefined,
		// Both ids unconditionally, exactly as upstream (958): they are stable and become live the
		// moment a Title/Description mounts, and a dangling IDREF is ignored by browsers.
		"aria-describedby": `${item.titleId} ${item.descriptionId}`,
		"aria-posinset": item.position,
		"aria-setsize": root.stepCount,
		"aria-selected": isActive,
		disabled: isDisabled,
		tabindex: isTabStop ? 0 : -1,
		...restProps,
		class: cn(
			"inline-flex items-center justify-center gap-3 rounded-md text-left transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
			// Renamed from upstream's bare `slot=title`/`slot=description`, in step with the Title and
			// Description parts, so the rendered result is identical.
			"not-has-data-[slot=stepper-description]:rounded-full not-has-data-[slot=stepper-title]:rounded-full",
			className,
		),
		onclick,
		onfocus,
		onkeydown,
		onmousedown,
	} as StepperTriggerChildProps);
</script>

{#if child}
	{@render child({ props: triggerAttrs })}
{:else}
	<button bind:this={ref} {...triggerAttrs}>
		{@render children?.()}
	</button>
{/if}
