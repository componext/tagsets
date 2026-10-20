/**
 * Glyphs by code, for tags that arrive as data. This entry imports every
 * glyph, so it opts out of tree-shaking: import named glyphs from the package
 * root when you know them at build time.
 */
import { h } from 'vue';
import type { FunctionalComponent, PropType } from 'vue';
import { glyphProps } from './createGlyph.js';
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
}

/**
 * Render the glyph for a code: `<TagGlyph tagset="locales" code="pt-BR" />`.
 * The title defaults to the glyph's label ("Portuguese"); pass `title=""` to
 * make it decorative. When no glyph claims the code, the `fallback` slot renders.
 */
export const TagGlyph: FunctionalComponent<TagGlyphProps> = (props, { slots }) => {
  const Glyph = getGlyph(props.tagset, props.code);
  if (!Glyph) return slots.fallback?.() ?? null;
  const { tagset: _t, code: _c, title, ...rest } = props;
  return h(Glyph, { ...rest, title: title ?? Glyph.meta.label });
};
TagGlyph.props = {
  ...glyphProps,
  tagset: { type: String as PropType<TagsetId>, required: true },
  code: { type: String as PropType<string | null | undefined>, default: undefined },
};
TagGlyph.displayName = 'TagGlyph';
