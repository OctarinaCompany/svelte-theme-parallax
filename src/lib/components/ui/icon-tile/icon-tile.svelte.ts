/** Surface treatment of the tile. Upstream `variant`. */
export const ICON_TILE_VARIANTS = ["outline", "elevated", "soft", "solid", "frame"] as const;
export type IconTileVariant = (typeof ICON_TILE_VARIANTS)[number];

/** Tile scale. Upstream `size`. */
export const ICON_TILE_SIZES = ["xs", "sm", "default", "lg", "xl"] as const;
export type IconTileSize = (typeof ICON_TILE_SIZES)[number];

/** Corner treatment. Upstream `radius`. */
export const ICON_TILE_RADII = ["default", "full"] as const;
export type IconTileRadius = (typeof ICON_TILE_RADII)[number];
