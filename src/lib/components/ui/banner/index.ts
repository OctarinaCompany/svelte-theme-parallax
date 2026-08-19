import Root from "./banner.svelte";
import Queue from "./banner-queue.svelte";
import Icon from "./banner-icon.svelte";
import Content from "./banner-content.svelte";
import Title from "./banner-title.svelte";
import Description from "./banner-description.svelte";
import Actions from "./banner-actions.svelte";
import Close from "./banner-close.svelte";

export type { BannerChildProps, BannerProps, BannerRootProps } from "./banner.svelte";
export type { BannerQueueProps, BannersProps } from "./banner-queue.svelte";
export type { BannerIconChildProps, BannerIconProps } from "./banner-icon.svelte";
export type { BannerContentChildProps, BannerContentProps } from "./banner-content.svelte";
export type { BannerTitleProps } from "./banner-title.svelte";
export type { BannerDescriptionProps } from "./banner-description.svelte";
export type { BannerActionsChildProps, BannerActionsProps } from "./banner-actions.svelte";
export type { BannerCloseProps } from "./banner-close.svelte";

export {
	BANNER_ANIMATION_DURATION,
	BANNER_ANIMATION_EASING,
	BANNER_SIDES,
	BANNER_STRATEGIES,
	BANNER_VARIANTS,
	BannerState,
	BannersState,
	DEFAULT_BANNER_DISMISSIBLE,
	DEFAULT_BANNER_PRIORITY,
	DEFAULT_MAX_VISIBLE,
	bannerVariants,
	getBannerContext,
	getBannersContext,
	hasBannerContext,
	hasBannersContext,
	isPortalStrategy,
	setBannerContext,
	setBannersContext,
	type BannerAddOptions,
	type BannerRenderProps,
	type BannerSide,
	type BannerStateProps,
	type BannerStrategy,
	type BannerVariant,
	type BannersStateProps,
	type QueuedBanner,
} from "./banner.svelte.js";

export {
	Root,
	Queue,
	Icon,
	Content,
	Title,
	Description,
	Actions,
	Close,
	//
	Root as Banner,
	Queue as Banners,
	Icon as BannerIcon,
	Content as BannerContent,
	Title as BannerTitle,
	Description as BannerDescription,
	Actions as BannerActions,
	Close as BannerClose,
};
