import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LETTERS, compose, frameElements, textWidth } from '../scripts/lib/letters.ts';
import { bboxAll, lintNodes, lintSvg, loadGlyphs, sourceSvg, toNodes } from '../scripts/lib/source.ts';
import { normalizeCode } from '../scripts/runtime/resolve.ts';
import { spacingProblems } from '../scripts/lib/spacing.ts';

const { glyphs, problems } = loadGlyphs();
const glyph = (id: string) => glyphs.find((g) => g.id === id)!;
const svgWith = (children: string, root = '') => sourceSvg([]).replace('>\n</svg>', `${root}>\n${children}\n</svg>`);

test('every source glyph passes the grid and metadata rules', () => {
  assert.deepEqual(problems, []);
  assert.ok(glyphs.length >= 195);
});

test('every character takes the 6-unit cell and composes inside the grid', () => {
  for (const [c, letter] of Object.entries(LETTERS)) {
    assert.equal(letter.width, 6, `${c} is ${letter.width} wide`);
    const { elements } = compose(c, 'none', 'fixed');
    assert.deepEqual(lintNodes(toNodes(elements), c), [], `letter ${c}`);
  }
});

test('text is always one line: composed letters share one cap line in both fits', () => {
  for (const g of glyphs) {
    for (const v of [g.fixed, g.hug]) {
      if (!v || v.from === 'drawn') continue;
      const frameCount = frameElements(g.frame, v.width).length;
      const [, y0, , y1] = bboxAll(v.nodes.slice(frameCount));
      assert.ok(y1 - y0 <= 10.01, `${g.id} ${v === g.fixed ? 'fixed' : 'hug'} spans ${y0}..${y1}`);
    }
  }
});

test('fixed is the 24px square; hug is 24 tall and only as wide as its content', () => {
  for (const g of glyphs) {
    if (g.fixed) assert.equal(g.fixed.width, 24, g.id);
    if (g.frame !== 'none') assert.ok(g.hug.width >= 24, `${g.id}: a framed hug is never narrower than the square`);
  }
  assert.equal(glyph('locale-en').hug.width, 20, 'two characters: 16 units plus padding');
  assert.equal(glyph('license-apache').hug.width, 70);
  assert.equal(glyph('license-mit').hug.width, 30);
  assert.equal(glyph('pos-x').hug.width, 10, 'unframed hug can be narrower than tall');
  assert.equal(glyph('key-shift').hug.width, 60);
  assert.equal(glyph('key-f1').hug.width, 30);
  assert.equal(glyph('key-k').hug.width, 24);
  assert.deepEqual([glyph('math-sum').hug.x, glyph('math-sum').hug.width], [4, 16], 'drawn unframed glyphs crop to their ink');
});

test('the square holds two characters; longer codes use a short form or are hug-only', () => {
  assert.equal(glyph('locale-en').fixed?.from, 'text');
  assert.equal(glyph('pos-noun').fixed?.from, 'short');
  assert.equal(glyph('pos-propn').fixed?.from, 'short');
  assert.equal(glyph('key-home').fixed?.from, 'short');
  assert.equal(glyph('key-shift').fixed?.from, 'drawn');
  assert.equal(glyph('key-shift').hug.from, 'text');
  for (const id of ['license-mit', 'license-apache', 'tech-api', 'pos-adj', 'key-f1', 'key-fn']) assert.equal(glyph(id).fixed, undefined, id);
  for (const g of glyphs) {
    if (g.tagset.id === 'locales' || g.tagset.id === 'math') assert.ok(g.fixed, `${g.id} has a fixed form`);
    if (g.fixed?.from === 'text') assert.ok([...g.meta.text!].length <= (g.frame === 'none' ? 2 : 1), `${g.id} fits the square`);
  }
});

test('frames stretch when hugging', () => {
  assert.equal(compose('C', 'circle', 'hug').elements[0]!.tag, 'circle', 'a circle stays a circle while it fits');
  assert.match(compose('CC0', 'circle', 'hug').elements[0]!.attrs.d!, /^M12 2h\d+a10 10/, 'and becomes a pill when it does not');
  assert.equal(compose('E', 'bubble', 'hug').width, 24);
  assert.equal(compose('EN', 'none', 'fixed').elements.map((e) => e.attrs.d).join(' '), 'M10 7h-6v10h6M4 12h5 M14 17v-10l6 10v-10', 'a pair spans x 4..20, y 7..17');
  assert.equal(compose('ENGLISH', 'bubble', 'hug').width, textWidth('ENGLISH') + 12);
  assert.equal(compose('BACKSPACE', 'keycap', 'hug').elements[0]!.attrs.width, String(textWidth('BACKSPACE') + 8));
  assert.throws(() => compose('APACHE2', 'none', 'fixed'), /fixed none glyph fits 20/);
  assert.throws(() => compose('ESC', 'keycap', 'fixed'), /fits 10/);
  assert.throws(() => textWidth('a'), /no letter "a"/);
});

test('lint rejects style on children, groups, wrong roots, out-of-grid geometry and a wrong frame', () => {
  assert.deepEqual(lintSvg(svgWith('<path d="M4 4h16" />'), 't'), []);
  assert.match(lintSvg(svgWith('<path d="M4 4h16" fill="red" />'), 't').join(), /may not carry fill/);
  assert.match(lintSvg(svgWith('<g><path d="M4 4h16" /></g>'), 't').join(), /only self-closing/);
  assert.match(lintSvg(svgWith('<path d="M1 4h16" />'), 't').join(), /within 2\.\.22/);
  assert.match(lintSvg(svgWith('<circle cx="12" cy="12" r="11" />'), 't').join(), /within 2\.\.22/);
  assert.match(lintSvg(svgWith('<path d="M4 4h16" />', ' class="x"'), 't').join(), /class is not allowed/);
  assert.match(lintSvg(sourceSvg([]).replace('stroke-width="2"', 'stroke-width="1.5"'), 't').join(), /stroke-width="2"/);
  assert.match(lintSvg(svgWith('<path d="M12 7v10" />'), 't', 'keycap').join(), /a keycap glyph starts with <rect/);
  const keycap = '<rect x="3" y="3" width="18" height="18" rx="2" />';
  assert.deepEqual(lintSvg(svgWith(`${keycap}\n<path d="M12 7v10" />`), 't', 'keycap'), []);
  assert.match(lintSvg(svgWith(`${keycap}\n<path d="M12 6v12" />`), 't', 'keycap').join(), /inside a keycap it stays within/);
});

test('spacing: strokes join or keep 1px of air; content keeps 2px from its frame', () => {
  const bar = (y: number): [string, Record<string, string>] => ['path', { d: `M4 ${y}h16` }];
  assert.deepEqual(spacingProblems([bar(4), bar(7)], 0, 't'), [], '3 apart is 1px of air');
  assert.match(spacingProblems([bar(4), bar(6.5)], 0, 't').join(), /within 0\.50px/);
  assert.deepEqual(spacingProblems([bar(4), ['path', { d: 'M12 4v10' }]], 0, 't'), [], 'joined strokes are fine');
  const frame: [string, Record<string, string>] = ['rect', { x: '3', y: '3', width: '18', height: '18', rx: '2' }];
  assert.deepEqual(spacingProblems([frame, ['path', { d: 'M7 12h10' }]], 1, 't'), [], '4 from the frame is 2px');
  assert.match(spacingProblems([frame, ['path', { d: 'M6 12h12' }]], 1, 't').join(), /1\.00px from the frame/);
  assert.deepEqual(spacingProblems([['circle', { cx: '12', cy: '12', r: '10' }], ['path', { d: 'm4.93 4.93 14.14 14.14' }]], 1, 't'), [], 'a slash may cross its frame');
  // The CC mark as first drawn: its c's sat 0.57px apart.
  const oldCc: [string, Record<string, string>][] = [['circle', { cx: '12', cy: '12', r: '10' }], ['path', { d: 'M10.18 9.7a3 3 0 1 0 0 4.6' }], ['path', { d: 'M17.68 9.7a3 3 0 1 0 0 4.6' }]];
  assert.ok(spacingProblems(oldCc, 1, 'cc').length > 0);
});

test('codes normalize per tagset', () => {
  const spdx = (c: string) => normalizeCode(c, 'spdx');
  assert.equal(spdx('GPL-3.0-or-later'), 'GPL');
  assert.equal(spdx('LGPL-2.1-only'), 'LGPL');
  assert.equal(spdx('GPL-2.0+'), 'GPL');
  assert.equal(spdx('BSD-3-Clause-Clear'), 'BSD');
  assert.equal(spdx('Apache-2.0'), 'APACHE');
  assert.equal(spdx('CC-BY-SA-4.0'), 'CC-BY-SA');
  assert.equal(spdx('(MIT OR Apache-2.0)'), 'MIT');
  assert.equal(spdx('GPL-2.0-only WITH Classpath-exception-2.0'), 'GPL');
  assert.equal(normalizeCode('zh-Hant-TW', 'bcp47'), 'zh');
  assert.equal(normalizeCode('pt_BR', 'bcp47'), 'pt');
  assert.equal(normalizeCode(' nn ', 'upper'), 'NN');
  const key = (c: string) => normalizeCode(c, 'key');
  assert.equal(key('a'), 'A');
  assert.equal(key('KeyA'), 'A');
  assert.equal(key('Digit1'), '1');
  assert.equal(key('Numpad1'), '1');
  assert.equal(key('NumpadEnter'), 'ENTER');
  assert.equal(key('ShiftLeft'), 'SHIFT');
  assert.equal(key('MetaRight'), 'META');
  assert.equal(key('ArrowLeft'), 'ARROWLEFT');
  assert.equal(key(' '), 'SPACE');
  assert.equal(normalizeCode('\\Delta', 'latex'), 'Delta');
  assert.equal(normalizeCode('Delta', 'latex'), 'Delta');
  assert.equal(normalizeCode('\\', 'latex'), '\\');
});
