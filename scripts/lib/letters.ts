/**
 * The tagsets stroke alphabet, the frames text sits in, and the two widths a
 * glyph can take.
 *
 * Every letter is a monoline capital, digit or arrow drawn for a 2px round
 * stroke: 8 units tall (cap height) and an even number of units wide (most are
 * 4; M, W and the vertical arrows 6; the horizontal arrows 8; I is 0). Two
 * letters sit 4 apart, three or more 3 apart. So any one- to three-letter line
 * is an even number of units wide, centres on whole pixels, and keeps every
 * stroke centre on an integer coordinate: 2px strokes stay crisp at 1x.
 *
 * Text is always set on one line. Two widths ("fits", as in Figma's
 * auto-layout sizing):
 * - `fixed`: the 24x24 square. Text must fit the frame's fixed width, so long
 *   codes need a short form ("AP2" for "APACHE2") or have no fixed variant.
 * - `hug`: 24 tall, as wide as the text needs. Frames stretch: a bubble
 *   widens, a circle becomes a pill, a keycap grows. Never narrower than the
 *   square for a framed glyph; an unframed glyph can be narrower than tall.
 *
 * Letters are written in their own space (top-left at 0,0). Only the subpath
 * moves are absolute (`M x y`); every other command is relative, so placing a
 * letter means shifting its moves and nothing else.
 */

export const CAP = 8;

export interface Letter {
  width: number;
  d: string;
}

/* Radius-2 curves throughout: half of a 4-unit letter, so bowls, corners and
 * terminals all share one curvature. */
export const LETTERS: Readonly<Record<string, Letter>> = {
  A: { width: 4, d: 'M0 8v-6a2 2 0 0 1 4 0v6M0 5h4' },
  B: { width: 4, d: 'M0 0h2a2 2 0 0 1 0 4h-2zm0 4h2a2 2 0 0 1 0 4h-2z' },
  C: { width: 4, d: 'M4 0h-2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2' },
  D: { width: 4, d: 'M0 0h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2z' },
  E: { width: 4, d: 'M4 0h-4v8h4M0 4h3' },
  F: { width: 4, d: 'M4 0h-4v8M0 4h3' },
  G: { width: 4, d: 'M4 0h-2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v-4h-2' },
  H: { width: 4, d: 'M0 0v8M4 0v8M0 4h4' },
  I: { width: 0, d: 'M0 0v8' },
  J: { width: 4, d: 'M4 0v6a2 2 0 0 1-4 0' },
  K: { width: 4, d: 'M0 0v8M4 0l-4 4 4 4' },
  L: { width: 4, d: 'M0 0v8h4' },
  M: { width: 6, d: 'M0 8v-8l3 4 3-4v8' },
  N: { width: 4, d: 'M0 8v-8l4 8v-8' },
  O: { width: 4, d: 'M0 2a2 2 0 0 1 4 0v4a2 2 0 0 1-4 0z' },
  P: { width: 4, d: 'M0 8v-8h2a2 2 0 0 1 0 4h-2' },
  Q: { width: 4, d: 'M0 2a2 2 0 0 1 4 0v4a2 2 0 0 1-4 0zM2 6l2 2' },
  R: { width: 4, d: 'M0 8v-8h2a2 2 0 0 1 0 4h-2M2 4l2 4' },
  S: { width: 4, d: 'M4 0h-2a2 2 0 0 0 0 4a2 2 0 0 1 0 4h-2' },
  T: { width: 4, d: 'M0 0h4M2 0v8' },
  U: { width: 4, d: 'M0 0v6a2 2 0 0 0 4 0v-6' },
  V: { width: 4, d: 'M0 0l2 8 2-8' },
  W: { width: 6, d: 'M0 0l1 8 2-5 2 5 1-8' },
  X: { width: 4, d: 'M0 0l4 8M4 0l-4 8' },
  Y: { width: 4, d: 'M0 0l2 4 2-4M2 4v4' },
  Z: { width: 4, d: 'M0 0h4l-4 8h4' },
  '0': { width: 4, d: 'M0 2a2 2 0 0 1 4 0v4a2 2 0 0 1-4 0z' },
  '1': { width: 2, d: 'M0 2l2-2v8' },
  '2': { width: 4, d: 'M0 2a2 2 0 0 1 4 0c0 2-4 3-4 6h4' },
  '3': { width: 4, d: 'M0 0h2a2 2 0 0 1 0 4h-1m1 0a2 2 0 0 1 0 4h-2' },
  '4': { width: 4, d: 'M3 8v-8l-3 6h4' },
  '5': { width: 4, d: 'M4 0h-4v4h2a2 2 0 0 1 0 4h-2' },
  '6': { width: 4, d: 'M4 0h-2a2 2 0 0 0-2 2v4a2 2 0 0 0 4 0a2 2 0 0 0-4 0' },
  '7': { width: 4, d: 'M0 0h4l-3 8' },
  '8': { width: 4, d: 'M2 4a2 2 0 1 0 0-4a2 2 0 1 0 0 4a2 2 0 1 0 0 4a2 2 0 1 0 0-4' },
  '9': { width: 4, d: 'M0 8h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-4 0a2 2 0 0 0 4 0' },
  // h.01 rather than h0: a zero-length segment is dropped by optimizers.
  '.': { width: 0, d: 'M0 8h.01' },
  '-': { width: 4, d: 'M0 4h4' },
  '+': { width: 4, d: 'M0 4h4M2 2v4' },
  '/': { width: 4, d: 'M0 8l4-8' },
  // Arrows, for arrow keys and short forms: heads have 3-unit arms.
  '↑': { width: 6, d: 'M3 8v-8M0 3l3-3 3 3' },
  '↓': { width: 6, d: 'M3 0v8M0 5l3 3 3-3' },
  '←': { width: 8, d: 'M8 4h-8M3 1l-3 3 3 3' },
  '→': { width: 8, d: 'M0 4h8M5 1l3 3-3 3' },
  '↖': { width: 6, d: 'M6 8l-6-8M0 4v-4h4' },
  '↘': { width: 6, d: 'M0 0l6 8M6 4v4h-4' },
};

/** Shift a letter path: every absolute move gets the offset, nothing else. */
export function place(d: string, dx: number, dy: number): string {
  return d.replace(/M(-?\d*\.?\d+)[ ,](-?\d*\.?\d+)/g, (_, x: string, y: string) => `M${+x + dx} ${+y + dy}`);
}

export type Fit = 'fixed' | 'hug';
export const FITS: readonly Fit[] = ['fixed', 'hug'];

/**
 * What a glyph's content sits in:
 * - `none`: nothing; text or symbol on the bare grid.
 * - `bubble`: a speech bubble with its tail at the bottom left (locales).
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
  none: { top: 8, fixedMax: 20, pad: 0, draw: () => [] },
  bubble: {
    top: 6,
    fixedMax: 14,
    pad: 4,
    content: [5, 5, 19, 15],
    draw: (w) => [{ tag: 'path', attrs: { d: `M2 4a2 2 0 0 1 2-2h${w - 4}a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-${w - 8}l-4 4v-4a2 2 0 0 1-2-2z` } }],
  },
  circle: {
    top: 8,
    fixedMax: 12,
    pad: 4,
    draw: (w) =>
      w === 20
        ? [{ tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } }]
        : [{ tag: 'path', attrs: { d: `M12 2h${w - 20}a10 10 0 0 1 0 20h-${w - 20}a10 10 0 0 1 0-20z` } }],
  },
  keycap: {
    top: 6,
    fixedMax: 14,
    pad: 4,
    content: [5, 5, 19, 15],
    draw: (w): Element[] => [
      { tag: 'rect', attrs: { x: '2', y: '2', width: String(w), height: '20', rx: '3' } },
      { tag: 'path', attrs: { d: `M2 18h${w}` } },
    ],
  },
};

/** Two characters sit 4 apart, any other count 3 apart. */
function gapFor(count: number): number {
  return count === 2 ? 4 : 3;
}

export function textWidth(text: string): number {
  const chars = [...text];
  const widths = chars.map((c) => {
    const letter = LETTERS[c];
    if (!letter) throw new Error(`no letter "${c}" in the stroke alphabet`);
    return letter.width;
  });
  return widths.reduce((a, b) => a + b, 0) + gapFor(chars.length) * (chars.length - 1);
}

/** Whether text fits a frame's fixed (24x24) variant. */
export function fitsFixed(text: string, frame: Frame): boolean {
  return textWidth(text) <= FRAME_SPECS[frame].fixedMax;
}

function letters(text: string, x0: number, top: number): Element[] {
  const chars = [...text];
  const gap = gapFor(chars.length);
  let x = x0;
  return chars.map((c) => {
    const letter = LETTERS[c]!;
    const el: Element = { tag: 'path', attrs: { d: place(letter.d, x, top) } };
    x += letter.width + gap;
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
