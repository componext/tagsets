/**
 * The tagsets stroke alphabet, the frames text sits in, and the two widths a
 * glyph can take.
 *
 * Every character is a monoline capital, digit or arrow drawn for a 2px round
 * stroke after Nunito's rounded geometric forms, with oval bowls. The alphabet
 * is monospaced (every character takes the same cell, 4 units apart: 2px of
 * air between strokes) and comes in two optical sizes:
 *
 * - `text`, for freestanding glyphs: an 8x14 cell (16 tall in ink). Two
 *   characters span x 2..22, filling the square edge to edge, and sit at the
 *   visual size of a Lucide pictogram beside them.
 * - `framed`, inside a frame: a 6x10 cell, the most a frame's 2px of padding
 *   leaves room for.
 *
 * Both keep stems and bars on whole pixels, so 2px strokes stay crisp at 1x.
 *
 * Text is always set on one line. Two widths ("fits", as in Figma's
 * auto-layout sizing):
 * - `fixed`: the 24x24 square, which holds two characters unframed (one in a
 *   frame). Longer codes need a short form ("NP" for "PROPN") or have no
 *   fixed variant.
 * - `hug`: 24 tall, as wide as the text needs. Frames stretch: a circle
 *   becomes a pill, a key's square widens. Never narrower than the square for
 *   a framed glyph; an unframed glyph can be narrower than tall.
 *
 * Characters are written in their own cell (top-left at 0,0). Only the
 * subpath moves are absolute (`M x y`); every other command is relative, so
 * placing a character means shifting its moves and nothing else.
 */

export const GAP = 4;

export interface Letter {
  width: number;
  d: string;
}

/* Text size, 8x14: the framed drawings scaled by 4/3 and 1.4, then bars that
 * landed between pixels moved onto them (A's crossbar, the P and R bowls, the
 * stems and bars of 1, 4 and 5). Bowls are ovals up to rx 4, ry 7. */
const TEXT_GLYPHS: Readonly<Record<string, string>> = {
  A: 'M0 14l4-14 4 14M1.2 10h5.6',
  B: 'M0 0h4a3.333 3.5 0 0 1 0 7h-4zm0 7h4.667a3.333 3.5 0 0 1 0 7h-4.667z',
  C: 'M7.2 2.8a4 7 0 1 0 0 8.4',
  D: 'M0 0h2.667a5.333 7 0 0 1 0 14h-2.667z',
  E: 'M8 0h-8v14h8M0 7h6.667',
  F: 'M8 0h-8v14M0 7h6.667',
  G: 'M7.2 2.8a4 7 0 1 0 .8 4.2h-3.333',
  H: 'M0 0v14M8 0v14M0 7h8',
  I: 'M4 0v14M1.333 0h5.334M1.333 14h5.334',
  J: 'M8 0v8.4a4 5.6 0 0 1-8 0',
  K: 'M0 0v14M8 0l-8 8.4M2.667 5.6l5.333 8.4',
  L: 'M0 0v14h8',
  M: 'M0 14v-14l4 8.4 4-8.4v14',
  N: 'M0 14v-14l8 14v-14',
  O: 'M4 0a4 7 0 1 0 0 14a4 7 0 1 0 0-14',
  P: 'M0 14v-14h4a4 4 0 0 1 0 8h-4',
  Q: 'M4 0a4 7 0 1 0 0 14a4 7 0 1 0 0-14M4.667 10.5l3.333 3.5',
  R: 'M0 14v-14h4a4 4 0 0 1 0 8h-4M4 8l4 6',
  S: 'M7.467 1.75a4 3.5 0 1 0-3.467 5.25a4 3.5 0 1 1-3.467 5.25',
  T: 'M0 0h8M4 0v14',
  U: 'M0 0v8.4a4 5.6 0 0 0 8 0v-8.4',
  V: 'M0 0l4 14 4-14',
  W: 'M0 0l2 14 2-8.4 2 8.4 2-14',
  X: 'M0 0l8 14M8 0l-8 14',
  Y: 'M0 0l4 7 4-7M4 7v7',
  Z: 'M0 0h8l-8 14h8',
  '0': 'M4 0a3.333 7 0 1 0 0 14a3.333 7 0 1 0 0-14',
  '1': 'M1.5 3.5l3.5-3.5v14',
  '2': 'M0 3.85a4 3.85 0 0 1 8 0c0 3.5-8 6.3-8 10.15h8',
  '3': 'M.533 1.75a4 3.5 0 1 1 3.467 5.25a4 3.5 0 1 1-3.467 5.25',
  '4': 'M5 14v-14l-5 10h8',
  '5': 'M8 0h-7v6h3a3.667 4 0 0 1 0 8h-4',
  '6': 'M6.667 .7c-4-2.1-6.667 1.4-6.667 9.1a4 4.2 0 1 0 8 0a4 4.2 0 1 0-8 0',
  '7': 'M0 0h8l-5.333 14',
  '8': 'M4 6.44a3.467 3.22 0 1 0 0-6.44a3.467 3.22 0 1 0 0 6.44a4 3.78 0 1 0 0 7.56a4 3.78 0 1 0 0-7.56',
  '9': 'M1.333 13.3c4 2.1 6.667-1.4 6.667-9.1a4 4.2 0 1 0-8 0a4 4.2 0 1 0 8 0',
  '.': 'M4 14h.01',
  '-': 'M1.333 7h5.334',
  '+': 'M0 7h8M4 3v8',
  '/': 'M0 14l8-14',
  '↑': 'M4 14v-14M0 4l4-4 4 4',
  '↓': 'M4 0v14M0 10l4 4 4-4',
  '←': 'M8 7h-8M4 3l-4 4 4 4',
  '→': 'M0 7h8M4 3l4 4-4 4',
  '↖': 'M8 14l-8-14M0 5v-5h5',
  '↘': 'M0 0l8 14M8 9v5h-5',
};

/* Framed size, 6x10. Bowls are ovals (rx 3, up to ry 5): Nunito's round forms
 * stretched to the cell. Terminals are round caps; joins are round. */
const FRAMED_GLYPHS: Readonly<Record<string, string>> = {
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

export type Size = 'text' | 'framed';

export interface Alphabet {
  /** Cell width, in stroke-centre units. */
  cell: number;
  /** Cap height, in stroke-centre units. */
  cap: number;
  letters: Readonly<Record<string, Letter>>;
}

const alphabet = (cell: number, cap: number, glyphs: Readonly<Record<string, string>>): Alphabet => ({
  cell,
  cap,
  letters: Object.fromEntries(Object.entries(glyphs).map(([c, d]) => [c, { width: cell, d }])),
});

export const SIZES: Readonly<Record<Size, Alphabet>> = {
  text: alphabet(8, 14, TEXT_GLYPHS),
  framed: alphabet(6, 10, FRAMED_GLYPHS),
};

/** The characters the alphabet has (both sizes have the same set). */
export const LETTERS = SIZES.text.letters;

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
 * - `keycap`: Lucide's square, 18px with 2px corners, wider when hugging (keys).
 *
 * Inside a frame, text and drawn content keep 2px of air from the frame's
 * stroke; nothing anywhere comes closer than 1px to a stroke it does not join.
 */
export type Frame = 'none' | 'bubble' | 'circle' | 'keycap';
export const FRAMES: readonly Frame[] = ['none', 'bubble', 'circle', 'keycap'];

export interface Element {
  tag: 'path' | 'circle' | 'rect';
  attrs: Record<string, string>;
}

interface FrameSpec {
  /** Which optical size of the alphabet the frame sets. */
  size: Size;
  /** Distance from the canvas edge to the frame's stroke centre. */
  inset: number;
  /** Cap line of the text: vertically centred in the frame's face. */
  top: number;
  /** Widest text the fixed (24x24) variant takes, in stroke-centre units. */
  fixedMax: number;
  /** Stroke-centre distance from text to frame when hugging. */
  pad: number;
  /** Where drawn content may go in a fixed glyph (stroke centres), if the frame constrains it. */
  content?: readonly [x0: number, y0: number, x1: number, y1: number];
  /** The frame, `w` units wide between its stroke centres, starting at x=inset. */
  draw(w: number): Element[];
}

/* Stroke centres stay inside 2..22: Lucide's 1px padding for a 2px stroke.
 * Inside a frame, content keeps at least 1px of air from the frame's stroke. */
export const FRAME_SPECS: Readonly<Record<Frame, FrameSpec>> = {
  // Two text-size characters: 20 units, x 2..22, y 5..19.
  none: { size: 'text', inset: 2, top: 5, fixedMax: 20, pad: 0, draw: () => [] },
  // Lucide's message-square (ISC), path for path at w=20: a body from y 3 to
  // 19 with the tail running off its left edge. Hugging widens the body only;
  // the tail keeps Lucide's exact curve.
  bubble: {
    size: 'framed',
    inset: 2,
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
    size: 'framed',
    inset: 2,
    top: 7,
    fixedMax: 6,
    pad: 6,
    draw: (w) =>
      w === 20
        ? [{ tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } }]
        : [{ tag: 'path', attrs: { d: `M12 2h${w - 20}a10 10 0 0 1 0 20h-${w - 20}a10 10 0 0 1 0-20z` } }],
  },
  // Lucide's square: stroke centres 3..21, inside 4..20. A character (ink
  // y 6..18) or drawn content (ink within 6..18) keeps 2px of air all round.
  keycap: {
    size: 'framed',
    inset: 3,
    top: 7,
    fixedMax: 10,
    pad: 4,
    content: [7, 7, 17, 17],
    draw: (w): Element[] => [{ tag: 'rect', attrs: { x: '3', y: '3', width: String(w), height: '18', rx: '2' } }],
  },
};

export function textWidth(text: string, size: Size = 'text'): number {
  const chars = [...text];
  const widths = chars.map((c) => {
    const letter = SIZES[size].letters[c];
    if (!letter) throw new Error(`no letter "${c}" in the stroke alphabet`);
    return letter.width;
  });
  return widths.reduce((a, b) => a + b, 0) + GAP * (chars.length - 1);
}

/** A frame's elements for a variant `width` wide (24 for fixed). */
export function frameElements(frame: Frame, width: number): Element[] {
  const spec = FRAME_SPECS[frame];
  return spec.draw(width - 2 * spec.inset);
}

/** Whether text fits a frame's fixed (24x24) variant. */
export function fitsFixed(text: string, frame: Frame): boolean {
  return textWidth(text, FRAME_SPECS[frame].size) <= FRAME_SPECS[frame].fixedMax;
}

function letters(text: string, x0: number, top: number, size: Size): Element[] {
  let x = x0;
  return [...text].map((c) => {
    const letter = SIZES[size].letters[c]!;
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
  const tw = textWidth(text, spec.size);
  if (fit === 'fixed') {
    if (tw > spec.fixedMax) throw new Error(`"${text}" is ${tw} units wide; a fixed ${frame} glyph fits ${spec.fixedMax}`);
    return { width: 24, elements: [...frameElements(frame, 24), ...letters(text, Math.floor((24 - tw) / 2), spec.top, spec.size)] };
  }
  if (frame === 'none') return { width: tw + 4, elements: letters(text, 2, spec.top, spec.size) };
  const w = Math.max(24 - 2 * spec.inset, tw + 2 * spec.pad);
  return { width: w + 2 * spec.inset, elements: [...spec.draw(w), ...letters(text, spec.inset + Math.floor((w - tw) / 2), spec.top, spec.size)] };
}
