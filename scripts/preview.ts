/**
 * Write preview/index.html: every glyph in both fits and as a tile, the
 * stroke alphabet, and glyphs in use, with size, stroke, fit, view and theme
 * controls for checking legibility. Reads the source glyphs, so it works
 * before a build.
 *
 *   pnpm preview && open preview/index.html
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LETTERS, SIZES, compose } from './lib/letters.ts';
import { ROOT, ROOT_ATTRS, loadGlyphs, toNodes, type Glyph, type Node, type Variant } from './lib/source.ts';
import { tileSvg } from './lib/tiles.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const el = ([tag, a]: Node) => `<${tag} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`;
const svg = (v: Pick<Variant, 'x' | 'width' | 'nodes'>, cls = '') => {
  const root = Object.entries({ ...ROOT_ATTRS, width: String(v.width), viewBox: `${v.x} 0 ${v.width} 24` })
    .map(([k, val]) => `${k}="${val}"`)
    .join(' ');
  return `<svg ${root} class="${cls}" style="--k:${+(v.width / 24).toFixed(4)}" aria-hidden="true">${v.nodes.map(el).join('')}</svg>`;
};

const { tagsets, glyphs, problems } = loadGlyphs();
if (problems.length) {
  for (const p of problems) console.error(`✗ ${p}`);
  process.exit(1);
}
const byId = new Map(glyphs.map((g) => [g.id, g]));
const get = (id: string) => {
  const g = byId.get(id);
  if (!g) throw new Error(`preview: no glyph ${id}`);
  return g;
};

/** Both fits; CSS shows the one the Fit control picks. A hug-only glyph shows hug in both. */
const art = (g: Glyph) => `${svg(g.fixed ?? g.hug, `v-fixed${g.fixed ? '' : ' fallback'}`)}${svg(g.hug, 'v-hug')}`;

function badge(g: Glyph): string {
  if (!g.fixed) return '<em class="tag warn">hug only</em>';
  if (g.fixed.from === 'short') return `<em class="tag">fixed: ${esc(g.meta.short!)}</em>`;
  if (g.fixed.from === 'drawn' && g.hug.from === 'text') return '<em class="tag">fixed: symbol</em>';
  return '';
}

const card = (g: Glyph) => {
  const search = [g.id, g.meta.code, g.meta.label, g.meta.text ?? '', g.meta.short ?? '', ...(g.meta.aliases ?? []), ...(g.meta.keywords ?? [])].join(' ').toLowerCase();
  const aliases = g.meta.aliases?.length ? ` · ${g.meta.aliases.slice(0, 4).join(', ')}${g.meta.aliases.length > 4 ? '…' : ''}` : '';
  return `<figure class="card" data-search="${esc(search)}" title="${esc(`${g.component} · ${g.meta.label}${aliases}`)}">
  <div class="art">${art(g)}</div><div class="tile">${tileSvg(g).replace(/<!--.*?-->\n/, '')}</div>
  <figcaption><b>${esc(g.meta.code.trim() || g.meta.label)}</b><span>${esc(g.meta.label)}</span><code>${esc(g.component)}</code>${badge(g)}</figcaption>
</figure>`;
};

const sections = tagsets
  .map((t) => {
    const list = glyphs.filter((g) => g.tagset === t);
    const hugOnly = list.filter((g) => !g.fixed).length;
    return `<section data-tagset="${t.id}">
  <header><h2>${esc(t.label)}</h2><p>${list.length} glyphs${hugOnly ? ` (${hugOnly} hug only)` : ''} · ${t.url ? `<a href="${esc(t.url)}">${esc(t.standard)}</a>` : esc(t.standard)} · prefix <code>${t.prefix}</code>${t.frame ? ` · ${t.frame}` : ''}</p></header>
  <div class="grid">${list.map(card).join('\n')}</div>
</section>`;
  })
  .join('\n');

const compareIds = ['license-apache', 'license-lgpl', 'pos-noun', 'pos-propn', 'tech-html', 'tech-json', 'locale-en', 'license-cc', 'key-shift', 'key-enter', 'key-home', 'key-f12', 'key-k', 'math-sum', 'math-times', 'math-infinity'];
const compare = compareIds
  .map((id) => {
    const g = get(id);
    return `<div class="pair"><span class="who">${esc(g.component)}</span>
  <span class="cell">${g.fixed ? svg(g.fixed, 'show') : '<i class="none">—</i>'}</span>
  <span class="cell">${svg(g.hug, 'show')}</span>
  <span class="note">${g.fixed ? `${g.fixed.from === 'short' ? `short “${esc(g.meta.short!)}”` : g.fixed.from === 'drawn' ? (g.hug.from === 'text' ? 'symbol' : 'drawing') : 'fits'} · hug ${g.hug.width}` : `hug only · ${g.hug.width}`}</span></div>`;
  })
  .join('\n');

const inline = (id: string, fit: 'fixed' | 'hug') => {
  const g = get(id);
  return svg(fit === 'hug' ? g.hug : (g.fixed ?? g.hug), 'inline');
};
const shortcut = (fit: 'fixed' | 'hug') => ['key-meta', 'key-shift', 'key-p'].map((id) => inline(id, fit)).join('');
const inUse = `<div class="use">
  <p><span class="lbl">Shortcut, fixed</span> Command palette ${shortcut('fixed')}</p>
  <p><span class="lbl">Shortcut, hug</span> Command palette ${shortcut('hug')}</p>
  <p><span class="lbl">Math, hug</span> if a ${inline('math-less-equal', 'hug')} b then ${inline('math-sum', 'hug')} x ${inline('math-element-of', 'hug')} ${inline('math-empty-set', 'hug')} ${inline('math-implies', 'hug')} done</p>
  <p><span class="lbl">Licenses, fixed</span> ${['license-mit', 'license-apache', 'license-gpl', 'license-lgpl', 'license-cc-by'].map((id) => inline(id, 'fixed')).join(' ')}</p>
  <p><span class="lbl">Licenses, hug</span> ${['license-mit', 'license-apache', 'license-gpl', 'license-lgpl', 'license-cc-by'].map((id) => inline(id, 'hug')).join(' ')}</p>
  <p><span class="lbl">Tokens, fixed</span> The${inline('pos-det', 'fixed')} quick${inline('pos-adj', 'fixed')} fox${inline('pos-noun', 'fixed')} jumps${inline('pos-verb', 'fixed')} over${inline('pos-adp', 'fixed')} Rome${inline('pos-propn', 'fixed')}${inline('pos-punct', 'fixed')}</p>
</div>`;

/** Each character in both optical sizes: text (freestanding) and framed (in a key). */
const alphabet = Object.keys(LETTERS)
  .map((c) => {
    const text = compose(c, 'none', 'fixed');
    const framed = compose(c, 'keycap', 'fixed');
    const both = `${svg({ x: 0, width: text.width, nodes: toNodes(text.elements) }, 'show')}${svg({ x: 0, width: framed.width, nodes: toNodes(framed.elements) }, 'show')}`;
    return `<figure class="card letter" data-search="${esc(c.toLowerCase())}"><div class="art pair-art">${both}</div><figcaption><b>${esc(c)}</b></figcaption></figure>`;
  })
  .join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tagsets preview</title>
<style>
:root{--bg:#fafafa;--panel:#fff;--ink:#18181b;--muted:#71717a;--line:#e4e4e7;--accent:#0284c7;--warn:#b45309;--size:24px;--stroke:2;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0c0c0e;--panel:#18181b;--ink:#f4f4f5;--muted:#a1a1aa;--line:#27272a;--accent:#38bdf8;--warn:#fbbf24;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0c0c0e;--panel:#18181b;--ink:#f4f4f5;--muted:#a1a1aa;--line:#27272a;--accent:#38bdf8;--warn:#fbbf24;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.bar{position:sticky;top:0;z-index:1;display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;padding:12px 16px;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.bar h1{margin:0;font-size:16px;font-weight:600;letter-spacing:-.01em}
.bar h1 span{color:var(--muted);font-weight:400}
.ctl{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:12px}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:8px;overflow:hidden}
.seg button{font:inherit;font-size:12px;color:var(--ink);background:var(--panel);border:0;border-left:1px solid var(--line);padding:5px 9px;cursor:pointer;min-width:34px}
.seg button:first-child{border-left:0}
.seg button[aria-pressed="true"]{background:var(--ink);color:var(--bg)}
input[type=search]{font:inherit;color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:6px 10px;width:210px}
main{padding:8px 16px 48px;max-width:1280px;margin:0 auto}
section header{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;margin:28px 0 12px}
h2{margin:0;font-size:15px;font-weight:600}
section header p{margin:0;color:var(--muted);font-size:12px}
a{color:var(--accent)}
code{font:12px ui-monospace,SFMono-Regular,Menlo,monospace}
svg{stroke-width:var(--stroke)}
svg.show,.art svg{height:var(--size);width:calc(var(--size) * var(--k))}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(136px,1fr));gap:8px}
.card{margin:0;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 10px 10px;display:flex;flex-direction:column;align-items:center;gap:10px;min-width:0}
.art{height:64px;display:grid;place-items:center;max-width:100%;overflow:hidden}
.pair-art{display:flex;gap:10px;align-items:center}
.art .v-hug{display:none}
[data-fit="hug"] .art .v-fixed{display:none}
[data-fit="hug"] .art .v-hug{display:block}
.art .fallback{outline:1px dashed var(--warn);outline-offset:3px;border-radius:2px}
.tile{display:none;height:64px;place-items:center}
.tile svg{width:56px;height:56px;border-radius:13px;box-shadow:0 1px 2px #0003,0 6px 12px -6px #0006}
[data-view="tiles"] .card .art{display:none}
[data-view="tiles"] .card .tile{display:grid}
[data-view="tiles"] .letter{display:none}
figcaption{display:flex;flex-direction:column;align-items:center;text-align:center;gap:1px;min-width:0;width:100%}
figcaption b{font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
figcaption span{color:var(--muted);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
figcaption code{color:var(--muted);font-size:10px}
.tag{font-style:normal;font-size:10px;color:var(--muted);border:1px solid var(--line);border-radius:5px;padding:0 5px;margin-top:4px}
.tag.warn{color:var(--warn);border-color:color-mix(in srgb,var(--warn) 40%,transparent)}
.compare{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:6px 18px;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
.pair{display:grid;grid-template-columns:118px 44px 1fr;align-items:center;gap:4px 10px;min-height:48px}
.pair .who{font:11px ui-monospace,Menlo,monospace;color:var(--muted);overflow:hidden;text-overflow:ellipsis}
.pair .note{grid-column:2/4;font-size:11px;color:var(--muted);margin-top:-6px}
.pair .cell{display:flex;align-items:center;min-height:32px}
.pair .none{color:var(--muted);font-style:normal}
.use{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:6px 14px;font-size:15px}
.use p{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin:8px 0}
.use .lbl{width:130px;color:var(--muted);font-size:12px}
svg.inline{height:1.4em;width:calc(1.4em * var(--k));vertical-align:middle}
.hidden{display:none}
@media (max-width:560px){input[type=search]{width:100%}.grid{grid-template-columns:repeat(auto-fill,minmax(108px,1fr))}.use .lbl{width:100%}}
</style>
</head>
<body>
<div class="bar">
  <h1>Tagsets <span>${glyphs.length} glyphs</span></h1>
  <div class="ctl">Size <div class="seg" data-var="--size" data-unit="px">${[16, 20, 24, 32, 48].map((s) => `<button aria-pressed="${s === 24}">${s}</button>`).join('')}</div></div>
  <div class="ctl">Stroke <div class="seg" data-var="--stroke" data-unit="">${[1.5, 2, 2.5].map((s) => `<button aria-pressed="${s === 2}">${s}</button>`).join('')}</div></div>
  <div class="ctl">Fit <div class="seg" data-attr="data-fit">${['fixed', 'hug'].map((s) => `<button aria-pressed="${s === 'fixed'}">${s}</button>`).join('')}</div></div>
  <div class="ctl">View <div class="seg" data-attr="data-view">${['glyphs', 'tiles'].map((s) => `<button aria-pressed="${s === 'glyphs'}">${s}</button>`).join('')}</div></div>
  <div class="ctl">Theme <div class="seg" data-attr="data-theme">${['auto', 'light', 'dark'].map((s) => `<button aria-pressed="${s === 'auto'}">${s}</button>`).join('')}</div></div>
  <input type="search" placeholder="Search codes, labels, aliases" aria-label="Search glyphs">
</div>
<main>
<section data-tagset="compare">
  <header><h2>Fixed and hug</h2><p>Fixed is the 24×24 square, with a short form or symbol when the text does not fit; hug is 24 tall and as wide as the full text. Dashed in the grid below: no fixed form, so fixed falls back to hug.</p></header>
  <div class="compare">${compare}</div>
</section>
<section data-tagset="use">
  <header><h2>In use</h2><p>Glyphs inline with 15px text, at 1.4em</p></header>
  ${inUse}
</section>
${sections}
<section data-tagset="alphabet">
  <header><h2>Stroke alphabet</h2><p>${Object.keys(LETTERS).length} characters in two sizes: text ${SIZES.text.cell}×${SIZES.text.cap} (freestanding) and framed ${SIZES.framed.cell}×${SIZES.framed.cap} (in a key)</p></header>
  <div class="grid">${alphabet}</div>
</section>
</main>
<script>
for (const seg of document.querySelectorAll('.seg')) {
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    for (const x of seg.children) x.setAttribute('aria-pressed', String(x === b));
    const v = b.textContent;
    if (seg.dataset.var) document.documentElement.style.setProperty(seg.dataset.var, v + seg.dataset.unit);
    if (seg.dataset.attr === 'data-theme') v === 'auto' ? document.documentElement.removeAttribute('data-theme') : document.documentElement.setAttribute('data-theme', v);
    else if (seg.dataset.attr) document.body.setAttribute(seg.dataset.attr, v);
  });
}
document.querySelector('input[type=search]').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  for (const c of document.querySelectorAll('.card')) c.classList.toggle('hidden', !!q && !c.dataset.search.includes(q));
  for (const s of document.querySelectorAll('section')) s.classList.toggle('hidden', !!q && !s.querySelector('.card:not(.hidden)'));
});
</script>
</body>
</html>
`;

const out = join(ROOT, 'preview');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), html);
console.log(`preview: ${glyphs.length} glyphs → preview/index.html`);
