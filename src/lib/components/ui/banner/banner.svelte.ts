import { getContext, hasContext, setContext } from "svelte";
import type { Snippet } from "svelte";
import { SvelteMap, SvelteSet } from "svelte/reactivity";
import { tv } from "tailwind-variants";

/** Enter/exit transition length in ms. Upstream `BANNER_ANIMATION_DURATION`. */
export const BANNER_ANIMATION_DURATION = 400;

/** Easing shared by the item transform and the container height. */
export const BANNER_ANIMATION_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";

/** `priority` fallback — upstream `DEFAULT_BANNER_PRIORITY`. */
export const DEFAULT_BANNER_PRIORITY = 0;

/** `dismissible` fallback — upstream `DEFAULT_BANNER_DISMISSIBLE`. */
export const DEFAULT_BANNER_DISMISSIBLE = true;

/** `maxVisible` fallback — upstream `maxVisible = 1`. */
export const DEFAULT_MAX_VISIBLE = 1;

/** Every value `variant` accepts, in upstream declaration order. */
export const BANNER_VARIANTS = ["default", "info", "success", "warning", "destructive"] as const;
export type BannerVariant = (typeof BANNER_VARIANTS)[number];

/** Which page edge the stack anchors to. Upstream `BannerSide`. */
export const BANNER_SIDES = ["top", "bottom"] as const;
export type BannerSide = (typeof BANNER_SIDES)[number];

/** How the stack is positioned. Upstream `BannerStrategy`. */
export const BANNER_STRATEGIES = ["fixed", "static", "sticky", "absolute"] as const;
export type BannerStrategy = (typeof BANNER_STRATEGIES)[number];

/** The two strategies that portal. */
export function isPortalStrategy(strategy: BannerStrategy): boolean {
	return strategy === "fixed" || strategy === "absolute";
}

export const bannerVariants = tv({
	base: "pointer-events-auto relative flex w-full items-center gap-3 border-b px-4 py-3 text-sm motion-reduce:transition-none",
	variants: {
		// Upstream's status surfaces are opaque (`bg-blue-50` / `dark:bg-blue-950`), and a banner
		// pinned over the viewport must be too. The `*-subtle` tokens are opaque BY CONSTRUCTION
		// (app.css §status tokens), so one token is the whole ground, and its contrast-walked
		// `*-subtle-foreground` partner is the type — the soft pairing shared with Badge, Alert
		// and Status.
		variant: {
			default: "bg-card text-card-foreground",
			info: "bg-info-subtle text-info-subtle-foreground",
			success: "bg-success-subtle text-success-subtle-foreground",
			warning: "bg-warning-subtle text-warning-subtle-foreground",
			destructive: "bg-destructive-subtle text-destructive-subtle-foreground",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

/** The snippet payload for a queued banner's content. Upstream `BannerRenderProps`. */
export type BannerRenderProps = {
	id: string;
	variant: BannerVariant;
	dismissible: boolean;
	onClose: () => void;
	onRemove: () => void;
};

/** The argument to `BannersState.addBanner`. Upstream `Omit<BannerData, 'id'>`. */
export type BannerAddOptions = {
	content: Snippet<[BannerRenderProps]>;
	variant?: BannerVariant;
	priority?: number;
	dismissible?: boolean;
	duration?: number;
	onDismiss?: () => void;
};

/** A queue entry. Upstream `BannerData`. */
export type QueuedBanner = BannerAddOptions & { readonly id: string };

export type BannersStateProps = {
	readonly getMaxVisible: () => number;
};

/**
 * One instance per `<Banner.Queue>`, published on context.
 *
 * Replaces upstream's `Store` and `useBanners()` (307-320): `banners`
 * is a `$state` array replaced wholesale on every mutation, exactly as upstream's `notify()`
 * pattern does; `removing` and `heights` are `SvelteMap`/`SvelteSet` mutated in place, which is
 * the project's reactive-collection idiom.
 */
export class BannersState {
	#props!: BannersStateProps;

	#banners: QueuedBanner[] = $state([]);
	#removing = new SvelteSet<string>();
	#heights = new SvelteMap<string, number>();
	/** Not reactive — nothing renders from pending timers. A plain object rather
	 * than a `Map`, since `svelte/prefer-svelte-reactivity` only exempts non-collection types. */
	#timeouts: Record<string, ReturnType<typeof setTimeout>> = {};

	get banners(): readonly QueuedBanner[] {
		return this.#banners;
	}

	readonly visibleBanners: readonly QueuedBanner[] = $derived(
		this.#banners.slice(0, Math.max(this.#props.getMaxVisible(), 0)),
	);

	readonly totalHeight: number = $derived.by(() => {
		let total = 0;
		for (const banner of this.visibleBanners) {
			total += this.#heights.get(banner.id) ?? 0;
		}
		return total;
	});

	constructor(props: BannersStateProps) {
		this.#props = props;
	}

	/** Insert before the first entry whose priority is lower, else append. */
	addBanner(options: BannerAddOptions): string {
		const id = crypto.randomUUID();
		const priority = options.priority ?? DEFAULT_BANNER_PRIORITY;
		const newBanner: QueuedBanner = { ...options, id };

		const banners = [...this.#banners];
		const insertIndex = banners.findIndex(
			(banner) => (banner.priority ?? DEFAULT_BANNER_PRIORITY) < priority,
		);
		if (insertIndex === -1) banners.push(newBanner);
		else banners.splice(insertIndex, 0, newBanner);
		this.#banners = banners;

		if (options.duration && options.duration > 0) {
			const timeoutId = setTimeout(() => {
				this.setRemoving(id, true);
				delete this.#timeouts[id];
			}, options.duration);
			this.#timeouts[id] = timeoutId;
		}

		return id;
	}

	/** No-op for an unknown id. */
	removeBanner(id: string): void {
		const banner = this.#banners.find((candidate) => candidate.id === id);
		if (!banner) return;

		const timeoutId = this.#timeouts[id];
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
			delete this.#timeouts[id];
		}

		this.#removing.delete(id);
		this.#heights.delete(id);

		banner.onDismiss?.();
		this.#banners = this.#banners.filter((candidate) => candidate.id !== id);
	}

	/** Deliberately fires no `onDismiss` (spec edge case). */
	clearBanners(): void {
		for (const timeoutId of Object.values(this.#timeouts)) clearTimeout(timeoutId);
		this.#timeouts = {};
		this.#removing.clear();
		this.#heights.clear();
		this.#banners = [];
	}

	setRemoving(id: string, value: boolean): void {
		if (value) this.#removing.add(id);
		else this.#removing.delete(id);
	}

	isRemoving(id: string): boolean {
		return this.#removing.has(id);
	}

	/** Short-circuits on an unchanged value. */
	setHeight(id: string, height: number): void {
		if (this.#heights.get(id) === height) return;
		this.#heights.set(id, height);
	}

	/** Short-circuits when nothing would change. */
	removeHeight(id: string): void {
		if (!this.#heights.has(id)) return;
		this.#heights.delete(id);
	}

	/** Sum of the measured heights of the entries before `id` (upstream `BannerImpl` offset, 360-367). */
	offsetOf(id: string): number {
		let total = 0;
		for (const banner of this.#banners) {
			if (banner.id === id) break;
			total += this.#heights.get(banner.id) ?? 0;
		}
		return total;
	}

	/** Clears every pending timer. Called from the provider's `$effect` teardown. */
	destroy(): void {
		for (const timeoutId of Object.values(this.#timeouts)) clearTimeout(timeoutId);
		this.#timeouts = {};
	}
}

export type BannerStateProps = {
	readonly getId: () => string | undefined;
	readonly getVariant: () => BannerVariant;
	readonly getDismissible: () => boolean;
	readonly close: () => void;
	readonly remove: () => void;
};

/**
 * One instance per rendered banner, published on context.
 *
 * Replaces upstream's `BannerContextValue` (85-90) and `useBanner()` (102-118). Reactive inputs are
 * getter functions rather than snapshots.
 */
export class BannerState {
	#props!: BannerStateProps;

	readonly id: string | undefined = $derived(this.#props.getId());
	readonly variant: BannerVariant = $derived(this.#props.getVariant());
	readonly dismissible: boolean = $derived(this.#props.getDismissible());

	constructor(props: BannerStateProps) {
		this.#props = props;
	}

	/** Animate out (queued) / set `open` false (standalone). */
	close(): void {
		this.#props.close();
	}

	/** Queue removal; no-op when standalone. */
	remove(): void {
		this.#props.remove();
	}
}

const BANNERS_CONTEXT_KEY = Symbol("banner-queue");

export function setBannersContext(state: BannersState): BannersState {
	return setContext(BANNERS_CONTEXT_KEY, state);
}

export function hasBannersContext(): boolean {
	return hasContext(BANNERS_CONTEXT_KEY);
}

/** Read the queue's state, throwing when there is no `<Banner.Queue>` ancestor. */
export function getBannersContext(consumerName: string): BannersState {
	if (!hasBannersContext()) {
		throw new Error(`\`${consumerName}\` must be used within \`<Banner.Queue>\`.`);
	}
	return getContext<BannersState>(BANNERS_CONTEXT_KEY);
}

const BANNER_CONTEXT_KEY = Symbol("banner");

export function setBannerContext(state: BannerState): BannerState {
	return setContext(BANNER_CONTEXT_KEY, state);
}

export function hasBannerContext(): boolean {
	return hasContext(BANNER_CONTEXT_KEY);
}

/** Read the current banner's state, throwing when there is no `<Banner.Root>` ancestor. */
export function getBannerContext(consumerName: string): BannerState {
	if (!hasBannerContext()) {
		throw new Error(`\`${consumerName}\` must be used within \`<Banner.Root>\`.`);
	}
	return getContext<BannerState>(BANNER_CONTEXT_KEY);
}
