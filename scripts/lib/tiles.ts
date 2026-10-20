/**
 * 72px tiles in the style of the UNA launcher icons: a vertical
 * gradient tile in the tagset's colour, a faint backdrop, the glyph's frame
 * filled with a darker inside gradient, the glyph in white 4px strokes, and the
 * "lit" pass: the same glyph in black, 1px lower, through a 10-20% white mask.
 *
 * A tile shows the fixed variant at the UNA glyph size. A hug-only glyph is
 * scaled down until its width fits. Tiles are square; the host rounds the
 * corners (the launcher uses 16-17px). Every id is suffixed with the glyph id,
 * so any number of tiles can be inlined on one page.
 */
import { FRAME_SPECS } from './letters.ts';
import type { Glyph, Node, Variant } from './source.ts';

const SIZE = 72;
/** 24 to 54: the glyph's 20px live area becomes 45px, the UNA glyph size. */
const SCALE = 2.25;
/** Widest a scaled-down hug glyph may be. */
const MAX_WIDTH = 64;
const STROKE = 4;

const el = ([tag, a]: Node) => `<${tag} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`;
const n = (v: number) => +v.toFixed(4);

export function tileSvg(g: Glyph, v: Variant = g.fixed ?? g.hug): string {
  const k = g.id;
  const { from, to, inside } = g.tagset.tile;
  const scale = Math.min(SCALE, MAX_WIDTH / v.width);
  const tx = (SIZE - v.width * scale) / 2 - v.x * scale;
  const ty = (SIZE - 24 * scale) / 2;
  const at = (dy: number) => `translate(${n(tx)} ${n(ty + dy)}) scale(${n(scale)})`;
  const stroke = `stroke-width="${n(STROKE / scale)}" stroke-linecap="round" stroke-linejoin="round"`;
  const art = v.nodes.map(el).join('');
  const frame = FRAME_SPECS[g.frame].draw(v.width - 4)[0];
  const shape = frame ? `<${frame.tag} ${Object.entries(frame.attrs).map(([a, b]) => `${a}="${b}"`).join(' ')}/>` : '';

  return [
    `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" fill="none" xmlns="http://www.w3.org/2000/svg">`,
    `<!-- tagsets ${k}: ${g.meta.label} -->`,
    `<rect width="${SIZE}" height="${SIZE}" fill="url(#bg-${k})"/>`,
    `<rect width="${SIZE}" height="${SIZE}" fill="url(#dots-${k})" opacity=".14"/>`,
    shape && `<g transform="${at(0)}" fill="url(#inside-${k})" opacity=".55">${shape}</g>`,
    `<g transform="${at(0)}" stroke="white" ${stroke}>${art}</g>`,
    `<g mask="url(#lit-${k})"><g transform="${at(1)}" stroke="black" ${stroke}>${art}</g></g>`,
    '<defs>',
    `<linearGradient id="bg-${k}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`,
    shape && `<linearGradient id="inside-${k}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${inside[0]}"/><stop offset="1" stop-color="${inside[1]}"/></linearGradient>`,
    `<linearGradient id="light-${k}" x1="36" y1="${n(ty + 1)}" x2="36" y2="${n(SIZE - ty + 1)}" gradientUnits="userSpaceOnUse"><stop stop-color="white" stop-opacity=".1"/><stop offset="1" stop-color="white" stop-opacity=".2"/></linearGradient>`,
    `<mask id="lit-${k}" maskUnits="userSpaceOnUse" x="0" y="0" width="${SIZE}" height="${SIZE}"><rect width="${SIZE}" height="${SIZE}" fill="url(#light-${k})"/></mask>`,
    `<pattern id="dots-${k}" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1" fill="white"/></pattern>`,
    '</defs>',
    '</svg>',
    '',
  ]
    .filter(Boolean)
    .join('\n');
}
