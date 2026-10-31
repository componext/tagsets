import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { LicenseLgpl, LocaleEn, MathSum, PosNoun, getGlyph, glyphs, registry, tagsets, toSvg } from 'tagsets';
import { loadGlyphs } from '../scripts/lib/source.ts';

const dist = dirname(createRequire(import.meta.url).resolve('tagsets/manifest.json'));
type ManifestVariant = { svg: string; width: number; x?: number; shows: string };
const manifest = JSON.parse(readFileSync(join(dist, 'manifest.json'), 'utf8')) as {
  tagsets: { id: string; count: number }[];
  glyphs: { id: string; component: string; fixed: ManifestVariant | null; hug: ManifestVariant; tile: string }[];
};

test('the manifest lists every source glyph, and every file it names exists', () => {
  const { glyphs: source } = loadGlyphs();
  assert.equal(manifest.glyphs.length, source.length);
  assert.equal(Object.keys(glyphs).length, source.length);
  for (const g of manifest.glyphs) {
    if (g.fixed) assert.ok(existsSync(join(dist, g.fixed.svg)), g.fixed.svg);
    assert.ok(existsSync(join(dist, g.hug.svg)), g.hug.svg);
    assert.ok(existsSync(join(dist, g.tile)), g.tile);
    assert.equal(glyphs[g.component]?.fixed === null, g.fixed === null, g.component);
  }
  assert.deepEqual(manifest.tagsets.map((t) => t.id), tagsets.map((t) => t.id));
  const apache = manifest.glyphs.find((g) => g.id === 'license-apache')!;
  assert.deepEqual([apache.fixed, apache.hug.shows, apache.hug.width], [null, 'APACHE2', 84]);
  const noun = manifest.glyphs.find((g) => g.id === 'pos-noun')!;
  assert.deepEqual([noun.fixed?.shows, noun.hug.shows, noun.hug.width], ['N', 'NOUN', 48]);
});

test('sprites hold one symbol per glyph, with the right viewBox', () => {
  const fixed = readFileSync(join(dist, 'sprite.svg'), 'utf8');
  const hug = readFileSync(join(dist, 'sprite-hug.svg'), 'utf8');
  for (const g of manifest.glyphs) {
    const fallback = g.fixed ?? g.hug;
    assert.ok(fixed.includes(`<symbol id="${g.id}" viewBox="${fallback.x ?? 0} 0 ${fallback.width} 24"`), g.id);
    assert.ok(hug.includes(`<symbol id="${g.id}" viewBox="${g.hug.x ?? 0} 0 ${g.hug.width} 24"`), g.id);
  }
});

test('tiles have page-unique ids', () => {
  const ids = new Set<string>();
  for (const g of manifest.glyphs) {
    for (const [, id] of readFileSync(join(dist, g.tile), 'utf8').matchAll(/ id="([^"]+)"/g)) {
      assert.ok(!ids.has(id!), `${id} repeats`);
      ids.add(id!);
    }
  }
});

test('codes from data resolve to glyphs', () => {
  const cases: [Parameters<typeof getGlyph>[0], string, string | undefined][] = [
    ['licenses', 'Expat', 'LicenseMit'],
    ['licenses', 'GPL-3.0-or-later', 'LicenseGpl'],
    ['licenses', '(MIT OR Apache-2.0)', 'LicenseMit'],
    ['licenses', 'Apache-2.0', 'LicenseApache'],
    ['licenses', 'BSD-3-Clause', 'LicenseBsd'],
    ['licenses', 'CC-BY-NC-ND-4.0', 'LicenseCcNd'],
    ['licenses', 'CC0-1.0', 'LicenseCcZero'],
    ['licenses', 'WTFPL', undefined],
    ['locales', 'pt-BR', 'LocalePt'],
    ['locales', 'zh_Hant_TW', 'LocaleZh'],
    ['locales', 'ger', 'LocaleDe'],
    ['locales', 'nb-NO', 'LocaleNo'],
    ['pos', 'nn', 'PosNoun'],
    ['pos', 'NNP', 'PosPropn'],
    ['pos', 'PRP$', 'PosPron'],
    ['tech', 'yml', 'TechYaml'],
    ['keys', 'a', 'KeyA'],
    ['keys', 'KeyA', 'KeyA'],
    ['keys', 'Digit7', 'Key7'],
    ['keys', 'ShiftRight', 'KeyShift'],
    ['keys', 'Meta', 'KeyMeta'],
    ['keys', '⌘', 'KeyMeta'],
    ['keys', ' ', 'KeySpace'],
    ['keys', 'Esc', 'KeyEscape'],
    ['keys', 'NumpadEnter', 'KeyEnter'],
    ['keys', 'ArrowLeft', 'KeyArrowLeft'],
    ['keys', 'F12', 'KeyF12'],
    ['keys', 'Dead', undefined],
    ['math', '\\leq', 'MathLessEqual'],
    ['math', 'leq', 'MathLessEqual'],
    ['math', '≤', 'MathLessEqual'],
    ['math', '<=', 'MathLessEqual'],
    ['math', '\\Delta', 'MathDelta'],
    ['math', '\\delta', undefined],
    ['math', '\\Sigma', 'MathSum'],
    ['math', 'constructor', undefined],
  ];
  for (const [tagset, code, expected] of cases) assert.equal(getGlyph(tagset, code)?.component, expected, `${tagset} ${JSON.stringify(code)}`);
  assert.equal(getGlyph('licenses', ''), undefined);
  assert.equal(getGlyph('nope' as 'licenses', 'MIT'), undefined);
  assert.ok(Object.keys(registry.keys!.keys).length > 68);
});

test('toSvg draws the fit asked for, sized by height', () => {
  const plain = toSvg(LocaleEn);
  assert.match(plain, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"/);
  assert.match(plain, /class="tagsets tagsets-locale-en" aria-hidden="true"/);
  assert.equal(plain.match(/<path /g)?.length, 2);

  assert.match(toSvg(PosNoun), /width="24" height="24" viewBox="0 0 24 24"/);
  assert.match(toSvg(PosNoun, { fit: 'hug', size: 48 }), /width="96" height="48" viewBox="0 0 48 24".*class="tagsets tagsets-pos-noun tagsets-hug"/);
  assert.match(toSvg(LicenseLgpl), /width="48" height="24" viewBox="0 0 48 24"/, 'no fixed form: falls back to hug');
  assert.match(toSvg(MathSum, { fit: 'hug', size: '1.5em' }), /width="1em" height="1.5em" viewBox="4 0 16 24"/);

  const custom = toSvg(LocaleEn, { size: 48, color: '#0a0', strokeWidth: 2, absoluteStrokeWidth: true, title: 'English <3', class: 'x', attrs: { 'data-k': 1 } });
  assert.match(custom, /stroke="#0a0" stroke-width="1"/);
  assert.match(custom, /class="tagsets tagsets-locale-en x" role="img" data-k="1"><title>English &lt;3<\/title>/);
});
