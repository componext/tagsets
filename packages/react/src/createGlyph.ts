import { createElement, forwardRef } from 'react';
import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';
import { absoluteStroke, pickVariant, viewBoxOf, widthAt } from './generated/render.js';
import type { Fit, GlyphMeta, GlyphVariant, GlyphVariants } from './generated/types.js';

export interface GlyphProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  /** Height, and the width of a fixed glyph. Default 24. */
  size?: number | string;
  /**
   * `fixed` (default): the 24x24 square, showing a short form or symbol when
   * the full text does not fit; glyphs with no fixed form fall back to hug.
   * `hug`: as wide as the full text, which is always on one line.
   */
  fit?: Fit;
  /** Stroke colour. Default `currentColor`. */
  color?: string;
  /** Stroke width in grid units (1/24 of the height). Default 2. */
  strokeWidth?: number | string;
  /** Keep the stroke `strokeWidth` pixels wide at any size. */
  absoluteStrokeWidth?: boolean;
  /**
   * Accessible name. With a title (or `aria-label`), the glyph is announced as
   * an image; without one it is `aria-hidden`, like a decorative icon. A tag
   * glyph usually stands in for text, so give it one unless a visible label sits
   * next to it.
   */
  title?: string;
}

export type GlyphComponent = ForwardRefExoticComponent<GlyphProps & RefAttributes<SVGSVGElement>> &
  GlyphVariants & { readonly meta: GlyphMeta };

export const defaultAttributes = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function createGlyph(meta: GlyphMeta, fixed: GlyphVariant | null, hug: GlyphVariant): GlyphComponent {
  const variants = { fixed, hug };
  const Glyph = forwardRef<SVGSVGElement, GlyphProps>(function Glyph(
    { size = 24, fit = 'fixed', color = 'currentColor', strokeWidth = 2, absoluteStrokeWidth = false, title, className, children, ...rest },
    ref,
  ) {
    const v = pickVariant(variants, fit);
    const labelled = Boolean(title || rest['aria-label'] || rest['aria-labelledby']);
    return createElement(
      'svg',
      {
        ref,
        ...defaultAttributes,
        width: widthAt(size, v),
        height: size,
        viewBox: viewBoxOf(v),
        stroke: color,
        strokeWidth: absoluteStrokeWidth ? absoluteStroke(strokeWidth, size) : strokeWidth,
        className: ['tagsets', `tagsets-${meta.id}`, v === fixed ? null : 'tagsets-hug', className].filter(Boolean).join(' '),
        ...(labelled ? { role: 'img' } : { 'aria-hidden': true }),
        ...rest,
      },
      title ? createElement('title', null, title) : null,
      ...v.node.map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs })),
      children,
    );
  });
  Glyph.displayName = meta.component;
  return Object.assign(Glyph, { meta, fixed, hug });
}
