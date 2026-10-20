/**
 * Glyphs by code, for tags that arrive as data. This entry imports every
 * glyph, so it opts out of tree-shaking: import named glyphs from the package
 * root when you know them at build time.
 */
import { createElement, forwardRef } from 'react';
import type { ReactNode } from 'react';
import type { GlyphComponent, GlyphProps } from './createGlyph.js';
import * as all from './generated/glyphs/index.js';
import { registry } from './generated/registry.js';
import type { TagsetId } from './generated/registry.js';
import { normalizeCode, resolveName } from './generated/resolve.js';

export { normalizeCode };
export const glyphs: Readonly<Record<string, GlyphComponent>> = all;

/** The glyph for a code: `getGlyph('licenses', 'GPL-3.0-or-later')` is `LicenseGpl`. */
export function getGlyph(tagset: TagsetId, code: string | null | undefined): GlyphComponent | undefined {
  const name = resolveName(registry, tagset, code);
  return name ? glyphs[name] : undefined;
}

export interface TagGlyphProps extends GlyphProps {
  tagset: TagsetId;
  code: string | null | undefined;
  /** Rendered when no glyph claims the code. Default: nothing. */
  fallback?: ReactNode;
}

/**
 * Render the glyph for a code: `<TagGlyph tagset="locales" code="pt-BR" />`.
 * The title defaults to the glyph's label ("Portuguese"); pass `title=""` to
 * make it decorative.
 */
export const TagGlyph = forwardRef<SVGSVGElement, TagGlyphProps>(function TagGlyph({ tagset, code, fallback = null, title, ...props }, ref) {
  const Glyph = getGlyph(tagset, code);
  if (!Glyph) return fallback;
  return createElement(Glyph, { ref, title: title ?? Glyph.meta.label, ...props });
});
