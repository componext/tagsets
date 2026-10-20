/**
 * Spacing rules, checked on every variant of every glyph:
 *
 * - Separate strokes either join (their centrelines meet or cross) or keep at
 *   least 1px of air between their ink.
 * - In a framed glyph, everything inside keeps at least 2px of air from the
 *   frame, unless it deliberately crosses it (the slash in a "no" mark).
 *
 * Ink reaches 1 unit either side of a 2px stroke's centreline, so 1px of air
 * is a centreline distance of 3, and 2px is 4. Strokes are sampled every 0.05
 * units; sampling can only overestimate a distance, by at most about 0.04.
 */
import svgpath from 'svgpath';
import type { Node } from './source.ts';

type Pt = readonly [number, number];

const STEP = 0.05;
/** Centreline distance below which two strokes count as joined. */
const JOINED = 0.25;
/** Slack for arc-to-curve approximation: a design at exactly 1px or 2px passes. */
const SLACK = 0.02;

function line(out: Pt[], [x0, y0]: Pt, [x1, y1]: Pt) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / STEP));
  for (let i = 1; i <= n; i++) out.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
}

function cubic(out: Pt[], p0: Pt, p1: Pt, p2: Pt, p3: Pt) {
  const length = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) + Math.hypot(p3[0] - p2[0], p3[1] - p2[1]);
  const n = Math.max(1, Math.ceil(length / STEP));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
}

/** Points along each subpath of a path, every STEP units or closer. */
function samplePath(d: string): Pt[][] {
  const runs: Pt[][] = [];
  let run: Pt[] = [];
  let start: Pt = [0, 0];
  svgpath(d)
    .abs()
    .unshort()
    .unarc()
    .iterate((seg, _i, x, y) => {
      const [cmd, ...v] = seg as [string, ...number[]];
      const at: Pt = [x, y];
      if (cmd === 'M') {
        if (run.length) runs.push(run);
        start = [v[0]!, v[1]!];
        run = [start];
      } else if (cmd === 'L') line(run, at, [v[0]!, v[1]!]);
      else if (cmd === 'H') line(run, at, [v[0]!, y]);
      else if (cmd === 'V') line(run, at, [x, v[0]!]);
      else if (cmd === 'C') cubic(run, at, [v[0]!, v[1]!], [v[2]!, v[3]!], [v[4]!, v[5]!]);
      else if (cmd === 'Q') cubic(run, at, [x + (2 / 3) * (v[0]! - x), y + (2 / 3) * (v[1]! - y)], [v[2]! + (2 / 3) * (v[0]! - v[2]!), v[3]! + (2 / 3) * (v[1]! - v[3]!)], [v[2]!, v[3]!]);
      else if (cmd === 'Z' || cmd === 'z') line(run, at, start);
    });
  if (run.length) runs.push(run);
  return runs;
}

/** The element as a path, so every shape is sampled one way. */
function toPath([tag, a]: Node): string {
  const n = (k: string) => Number(a[k] ?? 0);
  switch (tag) {
    case 'path':
      return a.d ?? '';
    case 'circle':
      return `M${n('cx') - n('r')} ${n('cy')}a${n('r')} ${n('r')} 0 1 0 ${2 * n('r')} 0a${n('r')} ${n('r')} 0 1 0 ${-2 * n('r')} 0z`;
    case 'ellipse':
      return `M${n('cx') - n('rx')} ${n('cy')}a${n('rx')} ${n('ry')} 0 1 0 ${2 * n('rx')} 0a${n('rx')} ${n('ry')} 0 1 0 ${-2 * n('rx')} 0z`;
    case 'rect': {
      const [x, y, w, h] = [n('x'), n('y'), n('width'), n('height')];
      const r = Math.min(n('rx') || n('ry'), w / 2, h / 2);
      return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${2 * r - w}a${r} ${r} 0 0 1 ${-r} ${-r}v${2 * r - h}a${r} ${r} 0 0 1 ${r} ${-r}z`;
    }
    case 'line':
      return `M${n('x1')} ${n('y1')}L${n('x2')} ${n('y2')}`;
    default: {
      const p = (a.points ?? '').trim().split(/[\s,]+/).map(Number);
      const pairs = p.flatMap((v, i) => (i % 2 ? [] : [`${v} ${p[i + 1]}`]));
      return `M${pairs.join('L')}${tag === 'polygon' ? 'z' : ''}`;
    }
  }
}

function minDistance(a: Pt[][], b: Pt[][]): number {
  let best = Infinity;
  for (const ra of a) {
    for (const rb of b) {
      for (const [x1, y1] of ra) {
        for (const [x2, y2] of rb) {
          const dx = x1 - x2;
          const dy = y1 - y2;
          const d = dx * dx + dy * dy;
          if (d < best) best = d;
        }
      }
    }
  }
  return Math.sqrt(best);
}

/**
 * Spacing problems in one variant. `frameCount` is how many leading elements
 * are the frame (0 for an unframed glyph).
 */
export function spacingProblems(nodes: readonly Node[], frameCount: number, where: string): string[] {
  const problems: string[] = [];
  const sampled = nodes.map((node) => samplePath(toPath(node)));
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = minDistance(sampled[i]!, sampled[j]!);
      if (d < JOINED) continue;
      const air = d - 2;
      const framing = i < frameCount && j >= frameCount;
      const need = framing ? 2 : 1;
      if (air < need - SLACK) {
        const what = framing ? `content element ${j + 1} sits ${air.toFixed(2)}px from the frame` : `elements ${i + 1} and ${j + 1} come within ${air.toFixed(2)}px of each other`;
        problems.push(`${where}: ${what}; keep ${need}px or join them`);
      }
    }
  }
  return problems;
}
