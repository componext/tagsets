/** Shared by every SDK (the build copies this file into each package's src/generated/). */

/** One SVG child element: tag and geometry attributes. */
export type GlyphElement = readonly [tag: string, attrs: Readonly<Record<string, string>>];
export type GlyphNode = readonly GlyphElement[];

/**
 * How wide a glyph is, as in Figma's auto-layout sizing:
 * - `fixed`: the 24x24 square, with a short form or symbol when the full
 *   text does not fit.
 * - `hug`: 24 tall and as wide as the content: the full text on one line.
 */
export type Fit = 'fixed' | 'hug';

/** One drawing of a glyph: viewBox `${x} 0 ${width} 24`. */
export interface GlyphVariant {
  readonly x: number;
  readonly width: number;
  readonly node: GlyphNode;
}

export interface GlyphMeta {
  /** Unique across tagsets; also the sprite symbol id and CSS class suffix: `license-mit`. */
  readonly id: string;
  /** File stem within the tagset: `mit`. */
  readonly name: string;
  /** Tagset id: `licenses`. */
  readonly tagset: string;
  /** Canonical code in the tagset's standard: `MIT`. */
  readonly code: string;
  /** Human name: `MIT License`. */
  readonly label: string;
  /** Export name: `LicenseMit`. */
  readonly component: string;
}

export interface GlyphVariants {
  /** The square variant; null when the content has no form that fits it. */
  readonly fixed: GlyphVariant | null;
  readonly hug: GlyphVariant;
}

export interface GlyphData extends GlyphMeta, GlyphVariants {}

export interface TagsetInfo {
  readonly id: string;
  readonly prefix: string;
  readonly label: string;
  readonly standard: string;
  readonly url?: string;
  readonly count: number;
}
