/**
 * Build every package from packages/glyphs.
 *
 * 1. Check: every glyph passes the grid and metadata rules, and resolves into
 *    a hug variant and, where its content fits the square, a fixed one
 *    (scripts/lib/source.ts). Any problem stops the build.
 * 2. Optimize each variant with SVGO.
 * 3. Emit, from those variants: vanilla SVGs, sprites, tiles and manifest
 *    (packages/vanilla/dist), and generated TypeScript for vanilla, React and
 *    Vue (packages/<pkg>/src/generated). `pnpm build` then compiles the
 *    packages with tsc.
 */
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { emitAll, type Built } from './lib/emit.ts';
import { optimizeGlyph } from './lib/optimize.ts';
import { ROOT, loadGlyphs, sourceSvg, type Variant } from './lib/source.ts';

const started = performance.now();
const { tagsets, glyphs, problems } = loadGlyphs();
if (problems.length) {
  for (const p of problems) console.error(`✗ ${p}`);
  console.error(`\nbuild failed: ${problems.length} problem(s)`);
  process.exit(1);
}

// Variants that draw the same thing (a framed drawing, a cropped symbol) share one optimization.
const cache = new Map<string, Variant['nodes']>();
const optimized = (v: Variant, where: string): Variant => {
  const key = JSON.stringify(v.nodes);
  if (!cache.has(key)) cache.set(key, optimizeGlyph(sourceSvg(v.nodes, `${v.x} 0 ${v.width} 24`), where));
  return { ...v, nodes: cache.get(key)! };
};

const built: Built[] = glyphs.map((glyph) => {
  const where = `${glyph.tagset.id}/${glyph.name}`;
  return { glyph, ...(glyph.fixed ? { fixed: optimized(glyph.fixed, `${where} (fixed)`) } : {}), hug: optimized(glyph.hug, `${where} (hug)`) };
});

// Start clean, buildinfo included: tsc -b keeps it beside tsconfig.json, and
// a buildinfo that outlives its dist makes tsc skip the emit.
for (const pkg of ['vanilla', 'react', 'vue']) {
  for (const p of ['dist', 'src/generated', 'tsconfig.tsbuildinfo']) rmSync(join(ROOT, 'packages', pkg, p), { recursive: true, force: true });
}

const { version } = JSON.parse(readFileSync(join(ROOT, 'packages/vanilla/package.json'), 'utf8')) as { version: string };
emitAll(tagsets, built, version);

const hugOnly = built.filter((b) => !b.fixed);
console.log(`built ${built.length} glyphs in ${tagsets.length} tagsets (${tagsets.map((t) => `${t.id} ${glyphs.filter((g) => g.tagset === t).length}`).join(', ')})`);
console.log(`hug only (${hugOnly.length}): ${hugOnly.map((b) => b.glyph.id).join(', ')}`);
console.log(`${cache.size} distinct drawings optimized in ${Math.round(performance.now() - started)}ms`);
