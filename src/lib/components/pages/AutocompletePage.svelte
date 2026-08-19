<script lang="ts">
	import type { Component } from "svelte";

	import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";
	import MonitorIcon from "@lucide/svelte/icons/monitor";
	import HospitalIcon from "@lucide/svelte/icons/hospital";
	import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
	import SchoolIcon from "@lucide/svelte/icons/school";
	import FilmIcon from "@lucide/svelte/icons/film";
	import FactoryIcon from "@lucide/svelte/icons/factory";
	import ZapIcon from "@lucide/svelte/icons/zap";
	import HotelIcon from "@lucide/svelte/icons/hotel";
	import ScaleIcon from "@lucide/svelte/icons/scale";
	import TractorIcon from "@lucide/svelte/icons/tractor";

	import * as Autocomplete from "$lib/components/ui/autocomplete/index.js";
	import { createFilter } from "$lib/components/ui/autocomplete/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { toast } from "svelte-sonner";
	import * as Table from "$lib/components/ui/table/index.js";
	import { getInitials } from "$lib/shared/get-initials.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Autocomplete component page. All ten of its variants are
	 * here, in its order.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART, and neither does shadcn-svelte. THE COMBOBOX PAGE NEXT DOOR IS NOT
	 * THIS ONE, and the difference is the whole reason both exist: a combobox always ends in one of
	 * the offered values, so its field is a search box over a fixed set. An autocomplete ends
	 * wherever the typing ended, and its list is a suggestion rather than a constraint — which is
	 * also why `bits-ui`'s `Combobox` could not be the substrate.
	 * `src/lib/components/ui/autocomplete/autocomplete.svelte.ts` records that argument in full.
	 *
	 * The field is skinned on this theme's `[data-slot='input']` and the popup on `--popover` and the
	 * radius scale, so both sit in the palette every page header can switch.
	 */

	/** The suggestion list the first seven variants share, as upstream spells it. */
	const components = [
		{ id: "feature", value: "Feature" },
		{ id: "fix", value: "Fix" },
		{ id: "bug", value: "Bug" },
		{ id: "docs", value: "Docs" },
		{ id: "internal", value: "Internal" },
		{ id: "mobile", value: "Mobile" },
		{ id: "accordion", value: "Accordion" },
		{ id: "alert-dialog", value: "Alert Dialog" },
		{ id: "autocomplete", value: "Autocomplete" },
		{ id: "avatar", value: "Avatar" },
		{ id: "checkbox", value: "Checkbox" },
		{ id: "checkbox-group", value: "Checkbox Group" },
		{ id: "collapsible", value: "Collapsible" },
		{ id: "combobox", value: "Combobox" },
		{ id: "context-menu", value: "Context Menu" },
		{ id: "dialog", value: "Dialog" },
		{ id: "field", value: "Field" },
		{ id: "fieldset", value: "Fieldset" },
		{ id: "filterable-menu", value: "Filterable Menu" },
		{ id: "form", value: "Form" },
		{ id: "input", value: "Input" },
		{ id: "menu", value: "Menu" },
		{ id: "menubar", value: "Menubar" },
		{ id: "meter", value: "Meter" },
		{ id: "navigation-menu", value: "Navigation Menu" },
		{ id: "number-field", value: "Number Field" },
		{ id: "popover", value: "Popover" },
		{ id: "preview-card", value: "Preview Card" },
		{ id: "progress", value: "Progress" },
		{ id: "radio", value: "Radio" },
		{ id: "scroll-area", value: "Scroll Area" },
		{ id: "select", value: "Select" },
		{ id: "separator", value: "Separator" },
		{ id: "slider", value: "Slider" },
		{ id: "switch", value: "Switch" },
		{ id: "tabs", value: "Tabs" },
		{ id: "toast", value: "Toast" },
		{ id: "toggle", value: "Toggle" },
		{ id: "toggle-group", value: "Toggle Group" },
		{ id: "toolbar", value: "Toolbar" },
		{ id: "tooltip", value: "Tooltip" },
	];

	type Member = {
		id: string;
		name: string;
		group: string;
		position: string;
		status: "Active" | "Away" | "Inactive";
	};

	/**
	 * The directory the grouped and asynchronous variants search.
	 *
	 * Upstream gives every row a remote avatar on its own CDN. Following `NavUser`, this page renders
	 * initials instead: an example that fetches fourteen images from someone else's domain to show a
	 * dropdown is not an example anyone should copy.
	 */
	const members: Member[] = [
		{
			id: "liam-carter",
			name: "Liam Carter",
			group: "Development Team",
			position: "Frontend Architect",
			status: "Active",
		},
		{
			id: "ava-bennett",
			name: "Ava Bennett",
			group: "Development Team",
			position: "Senior Full Stack Engineer",
			status: "Active",
		},
		{
			id: "noah-parker",
			name: "Noah Parker",
			group: "Development Team",
			position: "API Developer",
			status: "Active",
		},
		{
			id: "mia-collins",
			name: "Mia Collins",
			group: "Development Team",
			position: "Cloud Infrastructure Engineer",
			status: "Away",
		},
		{
			id: "elijah-turner",
			name: "Elijah Turner",
			group: "Development Team",
			position: "React Native Developer",
			status: "Active",
		},
		{
			id: "sofia-mitchell",
			name: "Sofia Mitchell",
			group: "Development Team",
			position: "Interaction Developer",
			status: "Active",
		},
		{
			id: "logan-reed",
			name: "Logan Reed",
			group: "Design Team",
			position: "Head of Product Design",
			status: "Active",
		},
		{
			id: "harper-flores",
			name: "Harper Flores",
			group: "Design Team",
			position: "Senior UI Designer",
			status: "Active",
		},
		{
			id: "ethan-price",
			name: "Ethan Price",
			group: "Design Team",
			position: "Experience Designer",
			status: "Active",
		},
		{
			id: "chloe-ward",
			name: "Chloe Ward",
			group: "Design Team",
			position: "Brand & Visual Designer",
			status: "Inactive",
		},
		{
			id: "jackson-cole",
			name: "Jackson Cole",
			group: "Marketing Team",
			position: "Growth Marketing Lead",
			status: "Active",
		},
		{
			id: "ella-rivera",
			name: "Ella Rivera",
			group: "Marketing Team",
			position: "Content Strategist",
			status: "Active",
		},
		{
			id: "aiden-morgan",
			name: "Aiden Morgan",
			group: "Marketing Team",
			position: "Performance Marketing Manager",
			status: "Active",
		},
		{
			id: "scarlett-brooks",
			name: "Scarlett Brooks",
			group: "Marketing Team",
			position: "Community & Social Lead",
			status: "Away",
		},
	];

	/** Upstream's `groupUsers`: three fixed teams, and inside each one the reachable people first. */
	function groupMembers(people: Member[]): { group: string; items: Member[] }[] {
		const statusOrder: Record<Member["status"], number> = { Active: 0, Away: 1, Inactive: 2 };
		const order = ["Development Team", "Design Team", "Marketing Team"];

		return order.map((group) => ({
			group,
			items: people
				.filter((person) => person.group === group)
				.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]),
		}));
	}

	const groupedMembers = groupMembers(members);

	const industries: { id: string; value: string; icon: Component }[] = [
		{ id: "information-technology", value: "Information Technology", icon: MonitorIcon },
		{ id: "healthcare", value: "Healthcare", icon: HospitalIcon },
		{ id: "finance", value: "Finance", icon: DollarSignIcon },
		{ id: "education", value: "Education", icon: SchoolIcon },
		{ id: "entertainment", value: "Entertainment", icon: FilmIcon },
		{ id: "manufacturing", value: "Manufacturing", icon: FactoryIcon },
		{ id: "energy", value: "Energy", icon: ZapIcon },
		{ id: "hospitality", value: "Hospitality", icon: HotelIcon },
		{ id: "legal", value: "Legal", icon: ScaleIcon },
		{ id: "agriculture", value: "Agriculture", icon: TractorIcon },
	];

	/** The same locale-aware matcher the default filter uses — upstream's `useFilter()`. */
	const { contains } = createFilter();

	// The trigger variant narrows the list itself before handing it over, which is what a real
	// search-as-you-type against a server looks like from the component's side.
	let triggerValue = $state("");
	const triggerItems = $derived(
		components.filter((component) => contains(component.value, triggerValue)),
	);

	// The grouped variant searches three fields at once, so the built-in filter — which sees one
	// string per item — cannot do it, and `filter={null}` hands the job over.
	let groupValue = $state("");
	const filteredGroups = $derived.by(() => {
		if (groupValue === "") return groupedMembers;

		return groupedMembers
			.map((group) => ({
				group: group.group,
				items: group.items.filter(
					(member) =>
						contains(member.name, groupValue) ||
						contains(member.group, groupValue) ||
						contains(member.position, groupValue),
				),
			}))
			.filter((group) => group.items.length > 0);
	});

	/** Upstream's fake endpoint: a variable delay, and a 2% failure rate so the error path is real. */
	async function searchMembers(query: string): Promise<Member[]> {
		await new Promise((resolve) => setTimeout(resolve, Math.random() * 800 + 200));

		if (Math.random() < 0.02 || query === "error") throw new Error("Network error");

		return members.filter(
			(member) => contains(member.name, query) || contains(member.position, query),
		);
	}

	let asyncValue = $state("");
	let asyncLoading = $state(false);
	let asyncError = $state<string | null>(null);
	let asyncResults = $state<Member[]>([]);

	/**
	 * The debounce, the race guard and the error path, as one effect.
	 *
	 * `ignore` is the whole reason this is not a bare `await`: a slow answer to "li" must not land
	 * after a fast answer to "liam" and put the earlier results back on screen.
	 */
	$effect(() => {
		const query = asyncValue;

		if (query === "") {
			asyncResults = [];
			asyncLoading = false;
			asyncError = null;
			return;
		}

		asyncLoading = true;
		asyncError = null;

		let ignore = false;
		const timer = setTimeout(async () => {
			try {
				const results = await searchMembers(query);
				if (!ignore) asyncResults = results;
			} catch {
				if (!ignore) {
					asyncError = "Failed to fetch members. Please try again.";
					asyncResults = [];
				}
			} finally {
				if (!ignore) asyncLoading = false;
			}
		}, 300);

		return () => {
			ignore = true;
			clearTimeout(timer);
		};
	});

	const asyncStatus = $derived.by(() => {
		if (asyncError) return asyncError;
		if (asyncResults.length === 0) return `No members found for "${asyncValue}"`;
		return `${asyncResults.length} member${asyncResults.length === 1 ? "" : "s"} found`;
	});

	// The icon variant keeps the field text and reads the chosen industry back out of it, which is
	// what makes the leading icon appear only once a real suggestion has been accepted.
	let industryValue = $state("");
	const selectedIndustry = $derived(industries.find((item) => item.value === industryValue));

	/**
	 * Form integration, from Demo 12.
	 *
	 * Upstream wires react-hook-form and a zod resolver; a plain `<form>` with rune state stands in,
	 * the same substitution the Mask input page makes. The two rules are upstream's schema verbatim:
	 * the field must not be empty, and — this being the one place an autocomplete rejects free text —
	 * the text must be one of the offered values. Validation runs only on submit, matching
	 * upstream's `mode: "onSubmit"`.
	 */
	let formFeatureValue = $state("");
	let formFeatureError = $state<string | null>(null);

	function validateFormFeature(value: string): string | null {
		if (value === "") return "Please select an item.";
		if (!components.some((item) => item.value === value)) return "Please select a valid item.";
		return null;
	}

	function onFormFeatureSubmit(event: SubmitEvent) {
		event.preventDefault();
		formFeatureError = validateFormFeature(formFeatureValue);
		if (formFeatureError) return;

		toast.success("Form submitted", {
			description: `Your form has successfully submitted with feature: ${formFeatureValue}`,
		});
		formFeatureValue = "";
	}

	function onFormFeatureReset() {
		formFeatureValue = "";
		formFeatureError = null;
	}

	const rootProps = [
		{
			prop: "items",
			type: "readonly T[]",
			default: "[]",
			description: "The data the list is built from, before filtering.",
		},
		{
			prop: "value",
			type: "string",
			default: "defaultValue",
			description:
				"The field text — not the selected item. Free text the list never offered is a valid value. Bindable.",
		},
		{
			prop: "defaultValue",
			type: "string",
			default: "''",
			description: "Seeds the field text while uncontrolled.",
		},
		{
			prop: "onValueChange",
			type: "(value: string) => void",
			default: "—",
			description: "Fires on typing, selection and clearing alike.",
		},
		{
			prop: "open",
			type: "boolean",
			default: "defaultOpen",
			description: "Whether the popup is open. Bindable.",
		},
		{
			prop: "defaultOpen",
			type: "boolean",
			default: "false",
			description: "Seeds the open state while uncontrolled.",
		},
		{
			prop: "onOpenChange",
			type: "(open: boolean) => void",
			default: "—",
			description: "Fires on every open/close transition.",
		},
		{
			prop: "filter",
			type: "((itemString, query) => boolean) | null",
			default: "a locale-aware contains",
			description:
				"Replaces the matcher, or turns filtering off entirely with null when items is already the answer.",
		},
		{
			prop: "itemToStringValue",
			type: "(item: T) => string",
			default: "value, then label",
			description: "Turns one entry of items into the string the field takes when it is selected.",
		},
		{
			prop: "autoHighlight",
			type: "boolean",
			default: "false",
			description: "Whether the first match is highlighted as you type.",
		},
		{
			prop: "loop",
			type: "boolean",
			default: "false",
			description: "Whether arrow navigation wraps around the ends of the list.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Suppresses typing, filtering and selection everywhere.",
		},
		{
			prop: "readonly",
			type: "boolean",
			default: "false",
			description: "The field can be focused and read, but nothing is typed, selected or cleared.",
		},
		{
			prop: "name",
			type: "string",
			default: "—",
			description:
				"Renders a clipped form control carrying the field text. Without it, none is rendered.",
		},
		{
			prop: "required",
			type: "boolean",
			default: "false",
			description: "Marks that form control required.",
		},
		{
			prop: "id",
			type: "string",
			default: "generated",
			description: "Every part's id derives from it.",
		},
	];

	const partProps = [
		{
			part: "Input",
			prop: "size",
			type: "'sm' | 'default' | 'lg'",
			default: "'default'",
			description: "The field height, and with it the inset of the trigger and clear buttons.",
		},
		{
			part: "Input",
			prop: "showClear",
			type: "boolean",
			default: "false",
			description: "Renders a clear button, but only once there is something to clear.",
		},
		{
			part: "Input",
			prop: "showTrigger",
			type: "boolean",
			default: "false",
			description:
				"Renders a search button, which hides itself when a clear button takes its place.",
		},
		{
			part: "Content",
			prop: "side / align",
			type: "'top' | 'right' | 'bottom' | 'left' / 'start' | 'center' | 'end'",
			default: "'bottom' / 'start'",
			description: "Where the popup is placed against the field.",
		},
		{
			part: "Content",
			prop: "sideOffset / alignOffset",
			type: "number",
			default: "4 / 0",
			description: "The gap from the field, and the shift along the alignment axis.",
		},
		{
			part: "Content",
			prop: "portalTo / portalDisabled",
			type: "Element | string / boolean",
			default: "document.body / false",
			description: "Where the popup is portalled to, and whether it is portalled at all.",
		},
		{
			part: "List",
			prop: "children",
			type: "Snippet<[item, index]>",
			default: "—",
			description: "Rendered once per item the filter kept. The list owns the iteration.",
		},
		{
			part: "Item",
			prop: "value",
			type: "T",
			default: "—",
			description:
				"The record this row stands for; selecting it writes the root's itemToStringValue(value) into the field.",
		},
		{
			part: "Item",
			prop: "label",
			type: "string",
			default: "—",
			description: "Overrides the text the field takes when this item is selected.",
		},
		{
			part: "Item",
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Skipped by navigation and inert to the pointer.",
		},
		{
			part: "Group",
			prop: "items",
			type: "readonly T[]",
			default: "[]",
			description: "The rows this group holds — what Collection iterates.",
		},
		{
			part: "Collection",
			prop: "children",
			type: "Snippet<[item, index]>",
			default: "—",
			description: "Rendered once per item of the enclosing group. Renders no element of its own.",
		},
	];

	const dataAttributes = [
		{ attribute: "data-slot", on: "every part", when: "always — the styling API" },
		{ attribute: "data-state", on: "Input, Content", when: '"open" or "closed"' },
		{ attribute: "data-size", on: "Input", when: "always — the size variant in force" },
		{ attribute: "data-disabled", on: "Input, Item, Trigger, Clear", when: "the part is disabled" },
		{ attribute: "data-highlighted", on: "Item", when: "the item is the active descendant" },
		{ attribute: "data-value", on: "Item", when: "always — the string the field would take" },
		{ attribute: "data-side", on: "Content", when: "always — the side it was placed on" },
	];

	const keyboard = [
		{ keys: "ArrowDown / ArrowUp", action: "Opens the popup, then moves the highlight." },
		{ keys: "Home / End", action: "Jumps to the first or last item while the popup is open." },
		{
			keys: "Enter",
			action:
				"Accepts the highlighted item. With nothing highlighted the key is left alone, so the form still submits.",
		},
		{ keys: "Escape", action: "Closes the popup and leaves the typed text alone." },
		{ keys: "Tab", action: "Closes the popup and moves on." },
	];
</script>

<DocPage title="Autocomplete">
	{#snippet subtitle()}
		A text field that suggests as you type, and still accepts what the list never offered — ten
		variants. Reach for it when the answer may be something the list never offered; for
		<a class="text-primary underline underline-offset-3" href="#/components/combobox">Combobox</a>
		next door when it must not be — that one commits an item, and the text you type is only a search over
		the set. Its page lays out how all six type-to-pick components divide their roles.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			Type to narrow the list; pick a suggestion, or keep your own text.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-xs">
					<Autocomplete.Root items={components}>
						<Autocomplete.Input placeholder="Search items" />
						<Autocomplete.Content>
							<Autocomplete.Empty>No items found.</Autocomplete.Empty>
							<Autocomplete.List>
								{#snippet children(item)}
									<Autocomplete.Item value={item.value}>{item.value}</Autocomplete.Item>
								{/snippet}
							</Autocomplete.List>
						</Autocomplete.Content>
					</Autocomplete.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Disabled">
		{#snippet blurb()}
			<code>disabled</code> on the root reaches every part: the field takes no text and the popup has
			no way to open.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-xs">
					<Autocomplete.Root items={components} disabled>
						<Autocomplete.Input placeholder="Search items" />
						<Autocomplete.Content>
							<Autocomplete.Empty>No items found.</Autocomplete.Empty>
							<Autocomplete.List>
								{#snippet children(item)}
									<Autocomplete.Item value={item.value}>{item.value}</Autocomplete.Item>
								{/snippet}
							</Autocomplete.List>
						</Autocomplete.Content>
					</Autocomplete.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With label">
		{#snippet blurb()}
			The field is an ordinary input, so a <code>&lt;Label for&gt;</code> binds to it the ordinary way.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-xs">
					<Autocomplete.Root items={components}>
						<div class="flex flex-col items-start gap-2">
							<Label for="autocomplete-labelled">Autocomplete Label</Label>
							<Autocomplete.Input id="autocomplete-labelled" placeholder="search: Docs" />
						</div>
						<Autocomplete.Content>
							<Autocomplete.Empty>No items found.</Autocomplete.Empty>
							<Autocomplete.List>
								{#snippet children(item)}
									<Autocomplete.Item value={item.value}>{item.value}</Autocomplete.Item>
								{/snippet}
							</Autocomplete.List>
						</Autocomplete.Content>
					</Autocomplete.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sizes">
		{#snippet blurb()}
			Three field heights. The size also sets how far the trigger and clear buttons sit from the
			field's inner edge, which is why it lives on the input and not on them.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full max-w-xs flex-col gap-4">
					{#each [{ id: "autocomplete-size-sm", label: "Small", size: "sm" as const }, { id: "autocomplete-size-default", label: "Default", size: "default" as const }, { id: "autocomplete-size-lg", label: "Large", size: "lg" as const }] as field (field.id)}
						<Autocomplete.Root items={components}>
							<div class="flex flex-col items-start gap-2">
								<Label for={field.id}>{field.label}</Label>
								<Autocomplete.Input id={field.id} placeholder="search: Docs" size={field.size} />
							</div>
							<Autocomplete.Content>
								<Autocomplete.Empty>No items found.</Autocomplete.Empty>
								<Autocomplete.List>
									{#snippet children(item)}
										<Autocomplete.Item value={item.value}>{item.value}</Autocomplete.Item>
									{/snippet}
								</Autocomplete.List>
							</Autocomplete.Content>
						</Autocomplete.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With clear">
		{#snippet blurb()}
			<code>showClear</code> puts a clear button inside the field — and only once there is something to
			clear, so an empty field never shows a × that does nothing.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-xs">
					<Autocomplete.Root items={components}>
						<div class="flex flex-col items-start gap-2">
							<Label for="autocomplete-clearable">Autocomplete with clear</Label>
							<Autocomplete.Input
								id="autocomplete-clearable"
								placeholder="search: Docs"
								showClear
							/>
						</div>
						<Autocomplete.Content>
							<Autocomplete.Empty>No items found.</Autocomplete.Empty>
							<Autocomplete.List>
								{#snippet children(item)}
									<Autocomplete.Item value={item.value}>{item.value}</Autocomplete.Item>
								{/snippet}
							</Autocomplete.List>
						</Autocomplete.Content>
					</Autocomplete.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With highlight">
		{#snippet blurb()}
			<code>autoHighlight</code> arms the best match as you type, so <kbd>Enter</kbd> accepts it.
			Off — the default — nothing is highlighted until you press an arrow key, and <kbd>Enter</kbd> submits
			the form instead.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-xs">
					<Autocomplete.Root items={components} autoHighlight>
						<div class="flex flex-col items-start gap-2">
							<Label for="autocomplete-highlight">Autocomplete with Highlight</Label>
							<Autocomplete.Input
								id="autocomplete-highlight"
								placeholder="search: Docs"
								showClear
							/>
						</div>
						<Autocomplete.Content>
							<Autocomplete.Empty>No items found.</Autocomplete.Empty>
							<Autocomplete.List>
								{#snippet children(item)}
									<Autocomplete.Item value={item.value}>{item.value}</Autocomplete.Item>
								{/snippet}
							</Autocomplete.List>
						</Autocomplete.Content>
					</Autocomplete.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With trigger">
		{#snippet blurb()}
			<code>showTrigger</code> adds a search button that opens the list. Here the page narrows
			<code>items</code> itself before handing them over, which is the shape a search against a server
			takes.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-xs">
					<Autocomplete.Root
						bind:value={triggerValue}
						items={triggerItems}
						itemToStringValue={(item) => item.value}
					>
						<div class="flex flex-col items-start gap-2">
							<Label for="autocomplete-trigger">Trigger Search</Label>
							<Autocomplete.Input
								id="autocomplete-trigger"
								placeholder="Search: Docs"
								showTrigger
							/>
						</div>
						<Autocomplete.Content>
							<Autocomplete.Empty>No items found.</Autocomplete.Empty>
							<Autocomplete.List>
								{#snippet children(item)}
									<Autocomplete.Item value={item}>{item.value}</Autocomplete.Item>
								{/snippet}
							</Autocomplete.List>
						</Autocomplete.Content>
					</Autocomplete.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Grouped">
		{#snippet blurb()}
			Three teams, each a labelled group whose heading stays put as the list scrolls. The search
			reads three fields at once — name, team and position — so the built-in filter, which sees one
			string per item, hands over to <code>{"filter={null}"}</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-xs">
					<Autocomplete.Root
						bind:value={groupValue}
						items={filteredGroups}
						filter={null}
						itemToStringValue={(item) => item.group}
					>
						<div class="flex flex-col items-start gap-2">
							<Label for="autocomplete-grouped">Search Member</Label>
							<Autocomplete.Input id="autocomplete-grouped" placeholder="Liam, Developer" />
						</div>
						<Autocomplete.Content class="pt-0">
							<Autocomplete.Empty>No matching users found.</Autocomplete.Empty>
							<Autocomplete.List class="not-empty:py-0">
								{#snippet children(group)}
									<Autocomplete.Group items={group.items} class="py-0">
										<Autocomplete.GroupLabel
											class="sticky top-0 z-10 mr-1.5 bg-popover py-2.5 text-xs font-medium text-muted-foreground"
										>
											{group.group}
										</Autocomplete.GroupLabel>
										<Autocomplete.Collection>
											{#snippet children(member)}
												<Autocomplete.Item
													value={member}
													label={member.name}
													class="items-center gap-2.5 rounded-lg"
												>
													<Avatar.Root class="size-9">
														<Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
													</Avatar.Root>
													<div class="min-w-0 flex-1">
														<div class="truncate font-medium">{member.name}</div>
														<div class="truncate text-sm text-muted-foreground">
															{member.position}
														</div>
													</div>
												</Autocomplete.Item>
											{/snippet}
										</Autocomplete.Collection>
									</Autocomplete.Group>
								{/snippet}
							</Autocomplete.List>
						</Autocomplete.Content>
					</Autocomplete.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Async">
		{#snippet blurb()}
			A debounced search against a fake endpoint that is slow, and fails 2% of the time — type
			<code>error</code> to see the failure path. <code>Autocomplete.Status</code> is a live region, so
			the count, the spinner and the error all reach a screen reader.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-xs">
					<Autocomplete.Root
						bind:value={asyncValue}
						items={asyncResults}
						filter={null}
						itemToStringValue={(item) => item.name}
					>
						<div class="flex flex-col items-start gap-2">
							<Label for="autocomplete-async">Async Autocomplete</Label>
							<Autocomplete.Input
								id="autocomplete-async"
								placeholder="e.g. Liam Carter, Design Team"
								showTrigger
								showClear
							/>
						</div>
						{#if asyncValue !== ""}
							<Autocomplete.Content>
								<Autocomplete.Status>
									{#if asyncLoading}
										<span class="flex items-center gap-2">
											<LoaderCircleIcon class="size-4 animate-spin" />
											Searching members.
										</span>
									{:else}
										{asyncStatus}
									{/if}
								</Autocomplete.Status>
								<Autocomplete.List>
									{#snippet children(member)}
										<Autocomplete.Item value={member} class="gap-2.5 rounded-lg">
											<Avatar.Root class="size-9">
												<Avatar.Fallback>{getInitials(member.name)}</Avatar.Fallback>
											</Avatar.Root>
											<div class="min-w-0 flex-1">
												<div class="truncate font-medium">{member.name}</div>
												<div class="truncate text-sm text-muted-foreground">{member.position}</div>
											</div>
										</Autocomplete.Item>
									{/snippet}
								</Autocomplete.List>
							</Autocomplete.Content>
						{/if}
					</Autocomplete.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With icon">
		{#snippet blurb()}
			Each row carries its own icon, and the field grows a leading one once a suggestion has been
			accepted — read back out of the value, so typing past it takes it away again.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-xs">
					<Autocomplete.Root bind:value={industryValue} items={industries}>
						<div class="flex flex-col items-start gap-2">
							<Label for="autocomplete-icon">Autocomplete with icon</Label>
							<div class="relative w-full">
								{#if selectedIndustry}
									{@const SelectedIcon = selectedIndustry.icon}
									<span
										class="pointer-events-none absolute top-1/2 left-2.5 size-4 shrink-0 -translate-y-1/2 text-muted-foreground"
									>
										<SelectedIcon />
									</span>
								{/if}
								<Autocomplete.Input
									id="autocomplete-icon"
									placeholder="search: Healthcare"
									class={selectedIndustry ? "pl-8" : undefined}
								/>
							</div>
						</div>
						<Autocomplete.Content>
							<Autocomplete.Empty>No items found.</Autocomplete.Empty>
							<Autocomplete.List>
								{#snippet children(item)}
									{@const ItemIcon = item.icon}
									<Autocomplete.Item value={item.value}>
										<ItemIcon />
										{item.value}
									</Autocomplete.Item>
								{/snippet}
							</Autocomplete.List>
						</Autocomplete.Content>
					</Autocomplete.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Autocomplete.Root</h3>
			<p class="text-sm text-muted-foreground">
				The container for every part. Owns the data, the filter, the field text, the open state and
				the highlight. It renders no element of its own — the popup is anchored to the field, so
				there is nothing for a wrapper to do.
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
			<h3 class="text-base font-medium">Parts</h3>
			<p class="text-sm text-muted-foreground">
				Every part also accepts <code>ref</code>, <code>class</code> and any native attribute of its
				element, and every part throws when used outside <code>Autocomplete.Root</code>.
				<code>Trigger</code>, <code>Clear</code>, <code>Status</code> and <code>Separator</code> take
				no props of their own.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Part</Table.Head>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each partProps as row (`${row.part}.${row.prop}`)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.part}</Table.Cell>
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
			<h3 class="text-base font-medium">Data attributes</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Attribute</Table.Head>
								<Table.Head>On</Table.Head>
								<Table.Head>Present when</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each dataAttributes as row (row.attribute + row.on)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.attribute}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.on}</Table.Cell>
									<Table.Cell>{row.when}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
			<p class="text-sm text-muted-foreground">
				The popup also inherits <code>--bits-floating-anchor-width</code>,
				<code>--bits-floating-available-width</code> and
				<code>--bits-floating-available-height</code> from its positioner — the first is what makes it
				exactly as wide as the field.
			</p>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Keyboard</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Key</Table.Head>
								<Table.Head>Action</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each keyboard as row (row.keys)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.keys}</Table.Cell>
									<Table.Cell>{row.action}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>

	<!-- Demo 12. The one demo the gallery set above does not cover: the
	     field inside a validated form, where for once the free text an autocomplete normally accepts
	     is exactly what the schema rejects. -->
	<DocSection title="Form integration">
		{#snippet blurb()}
			Validated on submit: the field must hold one of the offered values, so the free text an
			autocomplete otherwise accepts is exactly what this form rejects. A valid submit raises a
			toast and resets the field.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-xs">
					<form onsubmit={onFormFeatureSubmit}>
						<Field.FieldGroup>
							<Field.FieldSet>
								<Field.FieldGroup>
									<Field.Field data-invalid={formFeatureError ? true : undefined}>
										<Field.FieldLabel for="autocomplete-form-feature"
											>Select Feature</Field.FieldLabel
										>
										<Autocomplete.Root items={components} bind:value={formFeatureValue}>
											<Autocomplete.Input
												id="autocomplete-form-feature"
												placeholder="e.g. Feature"
												aria-invalid={formFeatureError ? true : undefined}
											/>
											<Autocomplete.Content>
												<Autocomplete.Empty>No items found.</Autocomplete.Empty>
												<Autocomplete.List>
													{#snippet children(item)}
														<Autocomplete.Item value={item.value}>{item.value}</Autocomplete.Item>
													{/snippet}
												</Autocomplete.List>
											</Autocomplete.Content>
										</Autocomplete.Root>
										<Field.FieldDescription>
											Search and select a component feature.
										</Field.FieldDescription>
										{#if formFeatureError}
											<Field.FieldError>{formFeatureError}</Field.FieldError>
										{/if}
									</Field.Field>
								</Field.FieldGroup>
							</Field.FieldSet>
							<Field.Field orientation="horizontal">
								<Button variant="outline" type="button" class="flex-1" onclick={onFormFeatureReset}>
									Cancel
								</Button>
								<Button type="submit" class="flex-1">Submit</Button>
							</Field.Field>
						</Field.FieldGroup>
					</form>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
