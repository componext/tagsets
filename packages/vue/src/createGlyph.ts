import { h } from 'vue';
import type { FunctionalComponent, PropType } from 'vue';
import { absoluteStroke, pickVariant, viewBoxOf, widthAt } from './generated/render.js';
import type { Fit, GlyphMeta, GlyphVariant, GlyphVariants } from './generated/types.js';

export interface GlyphProps {
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
   * an image; without one it is `aria-hidden`, like a decorative icon.
   */
  title?: string;
}

export type GlyphComponent = FunctionalComponent<GlyphProps> & GlyphVariants & { readonly meta: GlyphMeta };

export const defaultAttributes = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
} as const;

/** Declared so kebab-case attributes map to props and `absolute-stroke-width` casts to a boolean. */
export const glyphProps = {
  size: [Number, String] as PropType<number | string>,
  fit: String as PropType<Fit>,
  color: String,
  strokeWidth: [Number, String] as PropType<number | string>,
  absoluteStrokeWidth: Boolean,
  title: String,
};

export function createGlyph(meta: GlyphMeta, fixed: GlyphVariant | null, hug: GlyphVariant): GlyphComponent {
  const variants = { fixed, hug };
  // Undeclared attributes (class, style, aria-*, listeners) fall through to the <svg>.
  const Glyph: FunctionalComponent<GlyphProps> = (props, { attrs, slots }) => {
    const size = props.size ?? 24;
    const strokeWidth = props.strokeWidth ?? 2;
    const v = pickVariant(variants, props.fit);
    const labelled = Boolean(props.title || attrs['aria-label'] || attrs['aria-labelledby']);
    return h(
      'svg',
      {
        ...defaultAttributes,
        width: widthAt(size, v),
        height: size,
        viewBox: viewBoxOf(v),
        stroke: props.color ?? 'currentColor',
        'stroke-width': props.absoluteStrokeWidth ? absoluteStroke(strokeWidth, size) : strokeWidth,
        class: ['tagsets', `tagsets-${meta.id}`, v === fixed ? null : 'tagsets-hug'],
        ...(labelled ? { role: 'img' } : { 'aria-hidden': 'true' }),
      },
      [props.title ? h('title', props.title) : null, ...v.node.map(([tag, a]) => h(tag, { ...a })), slots.default?.()],
    );
  };
  Glyph.props = glyphProps;
  Glyph.displayName = meta.component;
  return Object.assign(Glyph, { meta, fixed, hug });
}
