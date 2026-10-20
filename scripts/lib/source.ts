/**
 * Source glyphs: loading, strict parsing, the rules every glyph must pass,
 * and resolving each glyph into its fixed and hug variants.
 *
 * packages/glyphs/<tagset>/_tagset.json   the tagset
 * packages/glyphs/<tagset>/<name>.json    one glyph: codes, label, and its text
 * packages/glyphs/<tagset>/<name>.svg     a hand-drawn fixed variant (optional)
 *
 * A glyph with `text` is composed from the stroke alphabet: its hug variant
 * always, its fixed variant when the text (or its `short` form) fits the
 * square. A drawn SVG, when present, is the fixed variant; with no `text` it
 * is the hug variant too (cropped to its ink when unframed).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svgPathBbox } from 'svg-path-bbox';
import { FRAMES, FRAME_SPECS, LETTERS, compose, fitsFixed, type Element, type Fit, type Frame } from './letters.ts';
import { normalizeCode, type Normalize } from '../runtime/resolve.ts';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
export const GLYPHS_DIR = join(ROOT, 'packages/glyphs');

export type Node = [tag: string, attrs: Record<string, string>];

export interface Tagset {
  id: string;
  prefix: string;
  label: string;
  description: string;
  standard: string;
  url?: string;
  normalize: Normalize;
  frame?: Frame;
  /** Glyph names to list first, in this order; the rest follow by name. */
  order?: string[];
  tile: { from: string; to: string; inside: [string, string] };
}

export interface GlyphMeta {
  label: string;
  code: string;
  aliases?: string[];
  text?: string;
  short?: string;
  frame?: Frame;
  keywords?: string[];
  credit?: string;
}

/** One drawing: viewBox `${x} 0 ${width} 24`. */
export interface Variant {
  x: number;
  width: number;
  nodes: Node[];
  /** What it shows: composed text, its short form, or a drawing. */
  from: 'text' | 'short' | 'drawn';
}

export interface Glyph {
  tagset: Tagset;
  /** File stem: `mit`. */
  name: string;
  /** Unique across tagsets: `license-mit`. Sprite symbol id and CSS class. */
  id: string;
  /** Unique across tagsets: `LicenseMit`. */
  component: string;
  meta: GlyphMeta;
  frame: Frame;
  fixed?: Variant;
  hug: Variant;
}

/** The root of every source SVG, exactly: Lucide's attributes. */
export const ROOT_ATTRS: Readonly<Record<string, string>> = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '24',
  height: '24',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
};

/** Shape elements and the only attributes they may carry: geometry, never style. */
const SHAPES: Readonly<Record<string, readonly string[]>> = {
  path: ['d'],
  circle: ['cx', 'cy', 'r'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  line: ['x1', 'y1', 'x2', 'y2'],
  polyline: ['points'],
  polygon: ['points'],
};

const META_KEYS = new Set(['$schema', 'label', 'code', 'aliases', 'text', 'short', 'frame', 'keywords', 'credit']);
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Stroke centres stay 2 units inside the viewBox: Lucide's 1px padding for a 2px stroke. */
const PAD = 2;
const EPS = 0.01;

export const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
export const pascal = (s: string) => s.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
export const toNodes = (els: readonly Element[]): Node[] => els.map((e): Node => [e.tag, { ...e.attrs }]);

function attrs(s: string, where: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /\s*([\w:-]+)="([^"]*)"\s*/y;
  let i = 0;
  while (i < s.length) {
    re.lastIndex = i;
    const m = re.exec(s);
    if (!m) {
      if (s.slice(i).trim() === '') break;
      throw new Error(`${where}: cannot read attributes near "${s.slice(i, i + 30).trim()}"`);
    }
    out[m[1]!] = m[2]!;
    i = re.lastIndex;
  }
  return out;
}

/** Parse a flat SVG: one root, self-closing shape children, comments. Anything else throws. */
export function parseSvg(svg: string, where: string): { attrs: Record<string, string>; children: Node[] } {
  const body = svg.replace(/<!--[\s\S]*?-->/g, '').trim();
  const m = /^<svg\b([^>]*)>([\s\S]*)<\/svg>$/.exec(body);
  if (!m) throw new Error(`${where}: expected a single <svg> element`);
  const children: Node[] = [];
  const inner = m[2]!;
  const re = /\s*<(\w+)\b([^>]*?)\s*\/>\s*/y;
  let i = 0;
  while (i < inner.length) {
    re.lastIndex = i;
    const c = re.exec(inner);
    if (!c) {
      if (inner.slice(i).trim() === '') break;
      throw new Error(`${where}: only self-closing shape elements are allowed, found "${inner.slice(i, i + 40).trim()}"`);
    }
    children.push([c[1]!, attrs(c[2]!, where)]);
    i = re.lastIndex;
  }
  return { attrs: attrs(m[1]!, where), children };
}

const attrText = (a: Record<string, string>) => Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ');

/** An SVG in Lucide's source layout: one attribute per line, one element per line. */
export function sourceSvg(nodes: readonly Node[], viewBox = '0 0 24 24'): string {
  const root = { ...ROOT_ATTRS, viewBox };
  const out = ['<svg', ...Object.entries(root).map(([k, v]) => `  ${k}="${v}"`), '>'];
  for (const [tag, a] of nodes) out.push(`  <${tag} ${attrText(a)} />`);
  out.push('</svg>', '');
  return out.join('\n');
}

/** Stroke-centre bounding box of one element. */
export function bbox([tag, a]: Node): [number, number, number, number] {
  const n = (k: string) => Number(a[k] ?? 0);
  switch (tag) {
    case 'path':
      return svgPathBbox(a.d ?? '');
    case 'circle':
      return [n('cx') - n('r'), n('cy') - n('r'), n('cx') + n('r'), n('cy') + n('r')];
    case 'ellipse':
      return [n('cx') - n('rx'), n('cy') - n('ry'), n('cx') + n('rx'), n('cy') + n('ry')];
    case 'rect':
      return [n('x'), n('y'), n('x') + n('width'), n('y') + n('height')];
    case 'line':
      return [Math.min(n('x1'), n('x2')), Math.min(n('y1'), n('y2')), Math.max(n('x1'), n('x2')), Math.max(n('y1'), n('y2'))];
    default: {
      const p = (a.points ?? '').trim().split(/[\s,]+/).map(Number);
      const xs = p.filter((_, i) => i % 2 === 0);
      const ys = p.filter((_, i) => i % 2 === 1);
      return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    }
  }
}

export function bboxAll(nodes: readonly Node[]): [number, number, number, number] {
  const boxes = nodes.map(bbox);
  return [Math.min(...boxes.map((b) => b[0])), Math.min(...boxes.map((b) => b[1])), Math.max(...boxes.map((b) => b[2])), Math.max(...boxes.map((b) => b[3]))];
}

const round = (v: number) => Math.round(v * 1000) / 1000;

/** Geometry rules for one variant: shapes only, geometry only, stroke centres 2 units inside the viewBox. */
export function lintNodes(nodes: readonly Node[], where: string, x = 0, width = 24): string[] {
  const problems: string[] = [];
  if (nodes.length === 0) problems.push(`${where}: draws nothing`);
  for (const node of nodes) {
    const [tag, a] = node;
    const allowed = SHAPES[tag];
    if (!allowed) {
      problems.push(`${where}: <${tag}> is not allowed (use ${Object.keys(SHAPES).join(', ')})`);
      continue;
    }
    for (const k of Object.keys(a)) if (!allowed.includes(k)) problems.push(`${where}: <${tag}> may not carry ${k}= (geometry only; style lives on the root)`);
    const [x0, y0, x1, y1] = bbox(node);
    if ([x0, y0, x1, y1].some((v) => !Number.isFinite(v))) problems.push(`${where}: <${tag}> has unreadable geometry`);
    else if (x0 < x + PAD - EPS || y0 < PAD - EPS || x1 > x + width - PAD + EPS || y1 > 24 - PAD + EPS) {
      problems.push(`${where}: <${tag}> reaches ${[x0, y0, x1, y1].map(round).join(', ')}; stroke centres must stay within ${x + PAD}..${x + width - PAD} x ${PAD}..${24 - PAD}`);
    }
  }
  return problems;
}

/** Every rule a hand-drawn source SVG must pass, including its frame if it has one. */
export function lintSvg(svg: string, where: string, frame: Frame = 'none'): string[] {
  let parsed;
  try {
    parsed = parseSvg(svg, where);
  } catch (e) {
    return [(e as Error).message];
  }
  const problems: string[] = [];
  for (const [k, v] of Object.entries(ROOT_ATTRS)) {
    if (parsed.attrs[k] !== v) problems.push(`${where}: root needs ${k}="${v}"${parsed.attrs[k] ? `, has "${parsed.attrs[k]}"` : ''}`);
  }
  for (const k of Object.keys(parsed.attrs)) if (!(k in ROOT_ATTRS)) problems.push(`${where}: root attribute ${k} is not allowed`);
  problems.push(...lintNodes(parsed.children, where));

  // A framed drawing starts with the frame exactly as the layout draws it, so
  // drawn and composed glyphs in one tagset share one frame.
  const spec = FRAME_SPECS[frame];
  const expected = toNodes(spec.draw(20));
  const actual = parsed.children.slice(0, expected.length);
  if (JSON.stringify(actual.map(([t, a]) => [t, attrText(a)])) !== JSON.stringify(expected.map(([t, a]) => [t, attrText(a)]))) {
    problems.push(`${where}: a ${frame} glyph starts with ${expected.map(([t, a]) => `<${t} ${attrText(a)} />`).join(' ')}`);
  }
  const content = parsed.children.slice(expected.length);
  if (spec.content && content.length) {
    const [x0, y0, x1, y1] = bboxAll(content);
    const [cx0, cy0, cx1, cy1] = spec.content;
    if (x0 < cx0 - EPS || y0 < cy0 - EPS || x1 > cx1 + EPS || y1 > cy1 + EPS) {
      problems.push(`${where}: content reaches ${[x0, y0, x1, y1].map(round).join(', ')}; inside a ${frame} it stays within ${cx0}..${cx1} x ${cy0}..${cy1}`);
    }
  }
  return problems;
}

export function loadTagsets(): Tagset[] {
  return readdirSync(GLYPHS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(GLYPHS_DIR, d.name, '_tagset.json')))
    .map((d) => JSON.parse(readFileSync(join(GLYPHS_DIR, d.name, '_tagset.json'), 'utf8')) as Tagset)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function composed(text: string, frame: Frame, fit: Fit, from: Variant['from']): Variant {
  const { width, elements } = compose(text, frame, fit);
  return { x: 0, width, nodes: toNodes(elements), from };
}

/**
 * Load every glyph, check it, and resolve its variants. Problems are
 * collected, not thrown, so one run reports all of them.
 */
export function loadGlyphs(): { tagsets: Tagset[]; glyphs: Glyph[]; problems: string[] } {
  const problems: string[] = [];
  const tagsets = loadTagsets();
  const glyphs: Glyph[] = [];
  const ids = new Map<string, string>();
  const prefixes = new Set<string>();

  for (const tagset of tagsets) {
    const dir = join(GLYPHS_DIR, tagset.id);
    if (!/^[A-Z][A-Za-z0-9]*$/.test(tagset.prefix)) problems.push(`${tagset.id}/_tagset.json: prefix must be PascalCase`);
    if (prefixes.has(tagset.prefix)) problems.push(`${tagset.id}/_tagset.json: prefix ${tagset.prefix} is taken`);
    prefixes.add(tagset.prefix);
    if (tagset.frame && !FRAMES.includes(tagset.frame)) problems.push(`${tagset.id}/_tagset.json: unknown frame ${tagset.frame}`);

    const keys = new Map<string, string>();
    const files = readdirSync(dir).filter((f) => !f.startsWith('_'));
    for (const f of files) {
      const stem = f.replace(/\.(json|svg)$/, '');
      if (f.endsWith('.svg') && !files.includes(`${stem}.json`)) problems.push(`${tagset.id}/${f}: has no ${stem}.json`);
      if (!f.endsWith('.svg') && !f.endsWith('.json')) problems.push(`${tagset.id}/${f}: unexpected file`);
    }

    const order = tagset.order ?? [];
    for (const n of order) if (!files.includes(`${n}.json`)) problems.push(`${tagset.id}/_tagset.json: order lists ${n}, which has no ${n}.json`);
    const rank = (f: string) => {
      const i = order.indexOf(f.slice(0, -5));
      return i === -1 ? order.length : i;
    };
    const jsons = files.filter((f) => f.endsWith('.json')).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'en', { numeric: true }));
    for (const f of jsons) {
      const name = f.slice(0, -5);
      const where = `${tagset.id}/${name}`;
      if (!NAME.test(name)) problems.push(`${where}: file names are lowercase kebab-case`);
      let meta: GlyphMeta;
      try {
        meta = JSON.parse(readFileSync(join(dir, f), 'utf8')) as GlyphMeta;
      } catch (e) {
        problems.push(`${where}.json: ${(e as Error).message}`);
        continue;
      }
      for (const k of Object.keys(meta)) if (!META_KEYS.has(k)) problems.push(`${where}.json: unknown key "${k}"`);
      if (!meta.label?.trim()) problems.push(`${where}.json: needs a label`);
      if (!meta.code?.length) problems.push(`${where}.json: needs a code`);
      const frame = meta.frame ?? tagset.frame ?? 'none';
      if (!FRAMES.includes(frame)) problems.push(`${where}.json: unknown frame ${frame}`);
      const missing = [...new Set([...(meta.text ?? ''), ...(meta.short ?? '')].filter((c) => !LETTERS[c]))];
      for (const c of missing) problems.push(`${where}.json: the stroke alphabet has no "${c}"`);

      // Every code and alias must resolve here and nowhere else in the tagset.
      for (const code of [meta.code, ...(meta.aliases ?? [])].filter((c) => c !== undefined)) {
        const key = normalizeCode(code, tagset.normalize);
        const owner = keys.get(key);
        if (owner && owner !== name) problems.push(`${where}.json: "${code}" resolves to ${key}, already claimed by ${owner}`);
        keys.set(key, name);
      }

      const id = `${kebab(tagset.prefix)}-${name}`;
      const component = tagset.prefix + pascal(name);
      if (ids.has(id)) problems.push(`${where}: id ${id} clashes with ${ids.get(id)}`);
      ids.set(id, where);

      const svgFile = join(dir, `${name}.svg`);
      let drawn: Node[] | undefined;
      if (existsSync(svgFile)) {
        const svg = readFileSync(svgFile, 'utf8');
        const lint = lintSvg(svg, `${where}.svg`, frame);
        problems.push(...lint);
        if (lint.length === 0) drawn = parseSvg(svg, where).children;
      }
      if (meta.text === undefined && !existsSync(svgFile)) {
        problems.push(`${where}: needs text in ${name}.json or a drawn ${name}.svg`);
        continue;
      }
      if (missing.length) continue;

      let fixed: Variant | undefined;
      let hug: Variant | undefined;
      try {
        if (drawn) fixed = { x: 0, width: 24, nodes: drawn, from: 'drawn' };
        else if (meta.text !== undefined && fitsFixed(meta.text, frame)) fixed = composed(meta.text, frame, 'fixed', 'text');
        else if (meta.short !== undefined) fixed = composed(meta.short, frame, 'fixed', 'short');

        if (meta.short !== undefined && (drawn || (meta.text !== undefined && fitsFixed(meta.text, frame)))) {
          problems.push(`${where}.json: short "${meta.short}" is unused: ${drawn ? 'the drawn SVG is the fixed variant' : 'the text already fits'}`);
        }

        if (meta.text !== undefined) hug = composed(meta.text, frame, 'hug', 'text');
        else if (drawn && frame === 'none') {
          const [x0, , x1] = bboxAll(drawn);
          hug = { x: round(x0 - PAD), width: round(x1 - x0 + 2 * PAD), nodes: drawn, from: 'drawn' };
        } else if (drawn) hug = { x: 0, width: 24, nodes: drawn, from: 'drawn' };
      } catch (e) {
        problems.push(`${where}.json: ${(e as Error).message}`);
        continue;
      }
      if (!hug) continue;
      if (fixed && fixed.from !== 'drawn') problems.push(...lintNodes(fixed.nodes, `${where} (fixed)`));
      problems.push(...lintNodes(hug.nodes, `${where} (hug)`, hug.x, hug.width));

      glyphs.push({ tagset, name, id, component, meta, frame, ...(fixed ? { fixed } : {}), hug });
    }
  }
  return { tagsets, glyphs, problems };
}
