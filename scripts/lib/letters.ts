/**
 * The tagsets stroke alphabet, the frames text sits in, and the two widths a
 * glyph can take.
 *
 * Every character is a monoline capital, digit or arrow drawn for a 2px round
 * stroke after Nunito's rounded geometric forms, stretched to one size: 10
 * units tall and 6 wide on the stroke centreline (12 by 8 in ink), with oval
 * bowls. The alphabet is monospaced: every character takes the same 6-unit
 * cell, and characters sit 4 apart (2px of air between strokes). Two
 * characters span x 4..20, so a pair fills the 24px square edge to edge (ink
 * 3..21), and every line of n characters is 10n - 4 units wide.
 *
 * Text is always set on one line. Two widths ("fits", as in Figma's
 * auto-layout sizing):
 * - `fixed`: the 24x24 square, which holds two characters unframed (one in a
 *   frame). Longer codes need a short form ("NP" for "PROPN") or have no
 *   fixed variant.
 * - `hug`: 24 tall, as wide as the text needs. Frames stretch: a circle
 *   becomes a pill, a keycap grows. Never narrower than the square for a
 *   framed glyph; an unframed glyph can be narrower than tall.
 *
 * Characters are written in their own cell (top-left at 0,0). Only the
 * subpath moves are absolute (`M x y`); every other command is relative, so
 * placing a character means shifting its moves and nothing else.
 */

export const CAP = 10;
export const CELL = 6;
export const GAP = 4;

export interface Letter {
  width: number;
  d: string;
}

/* Bowls are ovals (rx 3, up to ry 5): Nunito's round forms stretched to the
 * cell. Terminals are round caps; joins are round. */
const GLYPHS: Readonly<Record<string, string>> = {
  A: 'M0 10l3-10 3 10M1 7h4',
  B: 'M0 0h3a2.5 2.5 0 0 1 0 5h-3zm0 5h3.5a2.5 2.5 0 0 1 0 5h-3.5z',
  C: 'M5.4 2a3 5 0 1 0 0 6',
  D: 'M0 0h2a4 5 0 0 1 0 10h-2z',
  E: 'M6 0h-6v10h6M0 5h5',
  F: 'M6 0h-6v10M0 5h5',
  G: 'M5.4 2a3 5 0 1 0 .6 3h-2.5',
  H: 'M0 0v10M6 0v10M0 5h6',
  I: 'M3 0v10M1 0h4M1 10h4',
  J: 'M6 0v6a3 4 0 0 1-6 0',
  K: 'M0 0v10M6 0l-6 6M2 4l4 6',
  L: 'M0 0v10h6',
  M: 'M0 10v-10l3 6 3-6v10',
  N: 'M0 10v-10l6 10v-10',
  O: 'M3 0a3 5 0 1 0 0 10a3 5 0 1 0 0-10',
  P: 'M0 10v-10h3a3 3 0 0 1 0 6h-3',
  Q: 'M3 0a3 5 0 1 0 0 10a3 5 0 1 0 0-10M3.5 7.5l2.5 2.5',
  R: 'M0 10v-10h3a3 3 0 0 1 0 6h-3M3 6l3 4',
  S: 'M5.6 1.25a3 2.5 0 1 0-2.6 3.75a3 2.5 0 1 1-2.6 3.75',
  T: 'M0 0h6M3 0v10',
  U: 'M0 0v6a3 4 0 0 0 6 0v-6',
  V: 'M0 0l3 10 3-10',
  W: 'M0 0l1.5 10 1.5-6 1.5 6 1.5-10',
  X: 'M0 0l6 10M6 0l-6 10',
  Y: 'M0 0l3 5 3-5M3 5v5',
  Z: 'M0 0h6l-6 10h6',
  // Zero is narrower than O (rx 2.5), as in Nunito.
  '0': 'M3 0a2.5 5 0 1 0 0 10a2.5 5 0 1 0 0-10',
  '1': 'M1 2.5l3-2.5v10',
  '2': 'M0 2.75a3 2.75 0 0 1 6 0c0 2.5-6 4.5-6 7.25h6',
  '3': 'M.4 1.25a3 2.5 0 1 1 2.6 3.75a3 2.5 0 1 1-2.6 3.75',
  '4': 'M4 10v-10l-4 7h6',
  '5': 'M6 0h-5.5v4.5h2.5a2.75 2.75 0 0 1 0 5.5h-3',
  '6': 'M5 .5c-3-1.5-5 1-5 6.5a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  '7': 'M0 0h6l-4 10',
  '8': 'M3 4.6a2.6 2.3 0 1 0 0-4.6a2.6 2.3 0 1 0 0 4.6a3 2.7 0 1 0 0 5.4a3 2.7 0 1 0 0-5.4',
  '9': 'M1 9.5c3 1.5 5-1 5-6.5a3 3 0 1 0-6 0a3 3 0 1 0 6 0',
  // h.01 rather than h0: a zero-length segment is dropped by optimizers.
  '.': 'M3 10h.01',
  '-': 'M1 5h4',
  '+': 'M0 5h6M3 2v6',
  '/': 'M0 10l6-10',
  // Arrows, for arrow keys and short forms: heads have 3-unit arms.
  '↑': 'M3 10v-10M0 3l3-3 3 3',
  '↓': 'M3 0v10M0 7l3 3 3-3',
  '←': 'M6 5h-6M3 2l-3 3 3 3',
  '→': 'M0 5h6M3 2l3 3-3 3',
  '↖': 'M6 10l-6-10M0 4v-4h4',
  '↘': 'M0 0l6 10M6 6v4h-4',
};

export const LETTERS: Readonly<Record<string, Letter>> = Object.fromEntries(
  Object.entries(GLYPHS).map(([c, d]) => [c, { width: CELL, d }]),
);

/** Shift a letter path: every absolute move gets the offset, nothing else. */
export function place(d: string, dx: number, dy: number): string {
  return d.replace(/M(-?\d*\.?\d+)[ ,](-?\d*\.?\d+)/g, (_, x: string, y: string) => `M${+(+x + dx).toFixed(3)} ${+(+y + dy).toFixed(3)}`);
}

export type Fit = 'fixed' | 'hug';
export const FITS: readonly Fit[] = ['fixed', 'hug'];

/**
 * What a glyph's content sits in:
 * - `none`: nothing; text or symbol on the bare grid (locales and most tags).
 * - `bubble`: Lucide's message-square, a speech bubble with its tail at the
 *   bottom left. No tagset uses it by default.
 * - `circle`: a 20px circle, a pill when hugging (CC-style marks).
 * - `keycap`: a key with a front lip (keys).
 */
export type Frame = 'none' | 'bubble' | 'circle' | 'keycap';
export const FRAMES: readonly Frame[] = ['none', 'bubble', 'circle', 'keycap'];

export interface Element {
  tag: 'path' | 'circle' | 'rect';
  attrs: Record<string, string>;
}

interface FrameSpec {
  /** Cap line of the text: vertically centred in the frame's face. */
  top: number;
  /** Widest text the fixed (24x24) variant takes, in stroke-centre units. */
  fixedMax: number;
  /** Stroke-centre distance from text to frame when hugging. */
  pad: number;
  /** Where drawn content may go in a fixed glyph (stroke centres), if the frame constrains it. */
  content?: readonly [x0: number, y0: number, x1: number, y1: number];
  /** The frame, `w` units wide between its stroke centres, starting at x=2. */
  draw(w: number): Element[];
}

/* Stroke centres stay inside 2..22: Lucide's 1px padding for a 2px stroke.
 * Inside a frame, content keeps at least 1px of air from the frame's stroke. */
export const FRAME_SPECS: Readonly<Record<Frame, FrameSpec>> = {
  // Two characters: 16 units, x 4..20.
  none: { top: 7, fixedMax: 20, pad: 0, draw: () => [] },
  // Lucide's message-square (ISC), path for path at w=20: a body from y 3 to
  // 19 with the tail running off its left edge. Hugging widens the body only;
  // the tail keeps Lucide's exact curve.
  bubble: {
    top: 6,
    fixedMax: 14,
    pad: 4,
    content: [5, 6, 19, 16],
    draw: (w) => [
      {
        tag: 'path',
        attrs: { d: `M${2 + w} 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h${w - 4}a2 2 0 0 1 2 2z` },
      },
    ],
  },
  // One character fits the circle; a pill's round ends need 6 units of padding
  // to clear a 10-tall line.
  circle: {
    top: 7,
    fixedMax: 6,
    pad: 6,
    draw: (w) =>
      w === 20
        ? [{ tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } }]
        : [{ tag: 'path', attrs: { d: `M12 2h${w - 20}a10 10 0 0 1 0 20h-${w - 20}a10 10 0 0 1 0-20z` } }],
  },
  // The key's face runs y 2..18 above the lip: one character, 1px of air.
  keycap: {
    top: 5,
    fixedMax: 14,
    pad: 4,
    content: [5, 5, 19, 15],
    draw: (w): Element[] => [
      { tag: 'rect', attrs: { x: '2', y: '2', width: String(w), height: '20', rx: '3' } },
      { tag: 'path', attrs: { d: `M2 18h${w}` } },
    ],
  },
};

export function textWidth(text: string): number {
  const chars = [...text];
  const widths = chars.map((c) => {
    const letter = LETTERS[c];
    if (!letter) throw new Error(`no letter "${c}" in the stroke alphabet`);
    return letter.width;
  });
  return widths.reduce((a, b) => a + b, 0) + GAP * (chars.length - 1);
}

/** Whether text fits a frame's fixed (24x24) variant. */
export function fitsFixed(text: string, frame: Frame): boolean {
  return textWidth(text) <= FRAME_SPECS[frame].fixedMax;
}

function letters(text: string, x0: number, top: number): Element[] {
  let x = x0;
  return [...text].map((c) => {
    const letter = LETTERS[c]!;
    const el: Element = { tag: 'path', attrs: { d: place(letter.d, x, top) } };
    x += letter.width + GAP;
    return el;
  });
}

export interface Composed {
  /** Width of the viewBox (its height is always 24). */
  width: number;
  elements: Element[];
}

/** Set text in a frame at a fit: frame elements first, then one path per character. */
export function compose(text: string, frame: Frame, fit: Fit): Composed {
  if ([...text].length === 0) throw new Error('no text to set');
  const spec = FRAME_SPECS[frame];
  const tw = textWidth(text);
  if (fit === 'fixed') {
    if (tw > spec.fixedMax) throw new Error(`"${text}" is ${tw} units wide; a fixed ${frame} glyph fits ${spec.fixedMax}`);
    return { width: 24, elements: [...spec.draw(20), ...letters(text, Math.floor((24 - tw) / 2), spec.top)] };
  }
  if (frame === 'none') return { width: tw + 4, elements: letters(text, 2, spec.top) };
  const w = Math.max(20, tw + 2 * spec.pad);
  return { width: w + 4, elements: [...spec.draw(w), ...letters(text, 2 + Math.floor((w - tw) / 2), spec.top)] };
}
