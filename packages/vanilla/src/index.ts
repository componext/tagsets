/**
 * Tagsets without a framework: glyph data, SVG strings, DOM elements, and
 * replacing `<i data-tagset data-code>` placeholders in a page.
 */
import * as all from './generated/glyphs.js';
import { registry } from './generated/registry.js';
import type { TagsetId } from './generated/registry.js';
import { absoluteStroke, pickVariant, viewBoxOf, widthAt } from './generated/render.js';
import { normalizeCode, resolveName } from './generated/resolve.js';
import type { Fit, GlyphData, GlyphVariant } from './generated/types.js';

export * from './generated/glyphs.js';
export { registry, tagsets } from './generated/registry.js';
export type { TagsetId } from './generated/registry.js';
export { absoluteStroke, normalizeCode, pickVariant, viewBoxOf, widthAt };
export type { Fit, GlyphData, GlyphElement, GlyphMeta, GlyphNode, GlyphVariant, GlyphVariants, TagsetInfo } from './generated/types.js';

export const glyphs: Readonly<Record<string, GlyphData>> = all;

export interface SvgOptions {
  /** Height, and the width of a fixed glyph. Default 24. */
  size?: number | string;
  /** `fixed` (default; falls back to hug where there is no fixed form) or `hug`. */
  fit?: Fit;
  /** Stroke colour. Default `currentColor`. */
  color?: string;
  /** Stroke width in grid units (1/24 of the height). Default 2. */
  strokeWidth?: number | string;
  /** Keep the stroke `strokeWidth` pixels wide at any size. */
  absoluteStrokeWidth?: boolean;
  /** Accessible name; without one the glyph is `aria-hidden`. */
  title?: string;
  /** Extra classes, after `tagsets tagsets-<id>`. */
  class?: string;
  /** Any other attributes for the root. */
  attrs?: Readonly<Record<string, string | number>>;
}

/** The glyph for a code: `getGlyph('licenses', 'GPL-3.0-or-later')` is `LicenseGpl`. */
export function getGlyph(tagset: TagsetId, code: string | null | undefined): GlyphData | undefined {
  const name = resolveName(registry, tagset, code);
  return name ? glyphs[name] : undefined;
}

function rootAttrs(glyph: GlyphData, v: GlyphVariant, o: SvgOptions): Record<string, string> {
  const size = o.size ?? 24;
  const sw = o.strokeWidth ?? 2;
  const out: Record<string, string> = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: String(widthAt(size, v)),
    height: String(size),
    viewBox: viewBoxOf(v),
    fill: 'none',
    stroke: o.color ?? 'currentColor',
    'stroke-width': String(o.absoluteStrokeWidth ? absoluteStroke(sw, size) : sw),
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    class: ['tagsets', `tagsets-${glyph.id}`, v === glyph.fixed ? '' : 'tagsets-hug', o.class].filter(Boolean).join(' '),
  };
  if (o.title || o.attrs?.['aria-label'] || o.attrs?.['aria-labelledby']) out.role = 'img';
  else out['aria-hidden'] = 'true';
  for (const [k, v] of Object.entries(o.attrs ?? {})) out[k] = String(v);
  return out;
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The glyph as an SVG string. */
export function toSvg(glyph: GlyphData, options: SvgOptions = {}): string {
  const v = pickVariant(glyph, options.fit);
  const attrs = (a: Readonly<Record<string, string>>) => Object.entries(a).map(([k, val]) => ` ${k}="${escape(val)}"`).join('');
  const title = options.title ? `<title>${escape(options.title)}</title>` : '';
  return `<svg${attrs(rootAttrs(glyph, v, options))}>${title}${v.node.map(([tag, a]) => `<${tag}${attrs(a)}/>`).join('')}</svg>`;
}

/** The glyph as a DOM element (browsers only). */
export function createElement(glyph: GlyphData, options: SvgOptions = {}, doc: Document = document): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const v = pickVariant(glyph, options.fit);
  const svg = doc.createElementNS(ns, 'svg');
  for (const [k, val] of Object.entries(rootAttrs(glyph, v, options))) if (k !== 'xmlns') svg.setAttribute(k, val);
  if (options.title) svg.appendChild(doc.createElementNS(ns, 'title')).textContent = options.title;
  for (const [tag, a] of v.node) {
    const child = svg.appendChild(doc.createElementNS(ns, tag));
    for (const [k, val] of Object.entries(a)) child.setAttribute(k, val);
  }
  return svg;
}

export interface ReplaceOptions extends Omit<SvgOptions, 'title'> {
  /** Where to look. Default `document`. */
  root?: ParentNode;
}

/**
 * Replace every `<i data-tagset="licenses" data-code="MIT">` in `root` with its
 * glyph. The placeholder's classes carry over; `data-size`, `data-fit`,
 * `data-color` and `data-stroke-width` override the options; the title is the
 * glyph's label unless the placeholder has `data-title` (empty for
 * decorative). Placeholders with no matching glyph are left in place. Returns
 * how many were replaced.
 */
export function replaceElements(options: ReplaceOptions = {}): number {
  const { root = document, ...base } = options;
  let n = 0;
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-tagset][data-code]'))) {
    const glyph = getGlyph(el.dataset.tagset as TagsetId, el.dataset.code);
    if (!glyph) continue;
    const svg = createElement(
      glyph,
      {
        ...base,
        size: el.dataset.size ?? base.size,
        fit: (el.dataset.fit as Fit | undefined) ?? base.fit,
        color: el.dataset.color ?? base.color,
        strokeWidth: el.dataset.strokeWidth ?? base.strokeWidth,
        title: el.dataset.title ?? glyph.label,
        class: [base.class, el.getAttribute('class')].filter(Boolean).join(' ') || undefined,
      },
      el.ownerDocument,
    );
    el.replaceWith(svg);
    n++;
  }
  return n;
}
