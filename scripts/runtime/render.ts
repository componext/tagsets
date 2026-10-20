/**
 * Rendering arithmetic shared by every SDK (the build copies this file into
 * each package's src/generated/): which variant to draw, its viewBox, and its
 * width at a given size. `size` is always the height.
 */
import type { Fit, GlyphVariant, GlyphVariants } from './types.js';

/** The variant for a fit: hug when asked for, or when the glyph has no fixed form. */
export function pickVariant(glyph: GlyphVariants, fit: Fit = 'fixed'): GlyphVariant {
  return fit === 'hug' || !glyph.fixed ? glyph.hug : glyph.fixed;
}

export function viewBoxOf(v: GlyphVariant): string {
  return `${v.x} 0 ${v.width} 24`;
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * The width of a variant drawn `size` tall. Numbers scale, and so do lengths
 * with a unit ("1.5em" becomes "2.25em" for a 36-unit glyph). A size that is
 * not a plain length (a CSS variable) keeps the glyph square, and the drawing
 * scales down to fit inside it.
 */
export function widthAt(size: number | string, v: GlyphVariant): number | string {
  if (v.width === 24) return size;
  const k = v.width / 24;
  if (typeof size === 'number') return round(size * k);
  const m = /^(\d*\.?\d+)([a-z%]*)$/i.exec(size.trim());
  return m ? `${round(Number(m[1]) * k)}${m[2]}` : size;
}

/** The stroke width that renders `strokeWidth` px at `size` px tall. */
export function absoluteStroke(strokeWidth: number | string, size: number | string): number | string {
  const w = Number(strokeWidth);
  const s = Number(size);
  return Number.isFinite(w) && Number.isFinite(s) && s > 0 ? round((w * 24) / s) : strokeWidth;
}
