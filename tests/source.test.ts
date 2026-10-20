import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FRAME_SPECS, LETTERS, compose, textWidth } from '../scripts/lib/letters.ts';
import { bboxAll, lintNodes, lintSvg, loadGlyphs, sourceSvg, toNodes } from '../scripts/lib/source.ts';
import { normalizeCode } from '../scripts/runtime/resolve.ts';

const { glyphs, problems } = loadGlyphs();
const glyph = (id: string) => glyphs.find((g) => g.id === id)!;
const svgWith = (children: string, root = '') => sourceSvg([]).replace('>\n</svg>', `${root}>\n${children}\n</svg>`);

test('every source glyph passes the grid and metadata rules', () => {
  assert.deepEqual(problems, []);
  assert.ok(glyphs.length >= 195);
});

test('every letter has an even width and composes inside the grid', () => {
  for (const [c, letter] of Object.entries(LETTERS)) {
    assert.equal(letter.width % 2, 0, `${c} is ${letter.width} wide`);
    const { elements } = compose(c, 'none', 'fixed');
    assert.deepEqual(lintNodes(toNodes(elements), c), [], `letter ${c}`);
  }
});

test('text is always one line: composed letters share one cap line in both fits', () => {
  for (const g of glyphs) {
    for (const v of [g.fixed, g.hug]) {
      if (!v || v.from === 'drawn') continue;
      const frameCount = FRAME_SPECS[g.frame].draw(v.width - 4).length;
      const [, y0, , y1] = bboxAll(v.nodes.slice(frameCount));
      assert.ok(y1 - y0 <= 8.01, `${g.id} ${v === g.fixed ? 'fixed' : 'hug'} spans ${y0}..${y1}`);
    }
  }
});

test('fixed is the 24px square; hug is 24 tall and only as wide as its content', () => {
  for (const g of glyphs) {
    if (g.fixed) assert.equal(g.fixed.width, 24, g.id);
    if (g.frame !== 'none') assert.ok(g.hug.width >= 24, `${g.id}: a framed hug is never narrower than the square`);
  }
  assert.equal(glyph('license-apache').hug.width, 50);
  assert.equal(glyph('license-mit').hug.width, 20);
  assert.equal(glyph('pos-x').hug.width, 8, 'unframed hug can be narrower than tall');
  assert.equal(glyph('key-shift').hug.width, 40);
  assert.equal(glyph('key-k').hug.width, 24);
  assert.deepEqual([glyph('math-sum').hug.x, glyph('math-sum').hug.width], [4, 16], 'drawn unframed glyphs crop to their ink');
});

test('a long code uses its short form when fixed, or is hug-only', () => {
  const apache = glyph('license-apache');
  assert.equal(apache.fixed?.from, 'short');
  assert.equal(glyph('pos-noun').fixed?.from, 'short');
  assert.equal(glyph('key-shift').fixed?.from, 'drawn');
  assert.equal(glyph('key-shift').hug.from, 'text');
  const hugOnly = glyphs.filter((g) => !g.fixed).map((g) => g.id).sort();
  assert.deepEqual(hugOnly, ['key-f10', 'key-f12', 'key-page-down', 'key-page-up', 'license-agpl', 'license-eupl', 'license-lgpl', 'license-zlib', 'tech-http', 'tech-json']);
});

test('frames stretch when hugging', () => {
  assert.equal(compose('CC', 'circle', 'hug').elements[0]!.tag, 'circle', 'a circle stays a circle while it fits');
  assert.match(compose('CC0', 'circle', 'hug').elements[0]!.attrs.d!, /^M12 2h\d+a10 10/, 'and becomes a pill when it does not');
  assert.equal(compose('EN', 'bubble', 'hug').width, 24);
  assert.equal(compose('ENGLISH', 'bubble', 'hug').width, textWidth('ENGLISH') + 12);
  assert.equal(compose('BACKSPACE', 'keycap', 'hug').elements[0]!.attrs.width, String(textWidth('BACKSPACE') + 8));
  assert.throws(() => compose('APACHE2', 'none', 'fixed'), /fixed none glyph fits 20/);
  assert.throws(() => compose('ESC', 'keycap', 'fixed'), /fits 14/);
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
  assert.match(lintSvg(svgWith('<path d="M12 5v10" />'), 't', 'keycap').join(), /a keycap glyph starts with <rect/);
  const keycap = '<rect x="2" y="2" width="20" height="20" rx="3" />\n<path d="M2 18h20" />';
  assert.deepEqual(lintSvg(svgWith(`${keycap}\n<path d="M12 5v10" />`), 't', 'keycap'), []);
  assert.match(lintSvg(svgWith(`${keycap}\n<path d="M12 5v12" />`), 't', 'keycap').join(), /inside a keycap it stays within/);
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
