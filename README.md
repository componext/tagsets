# Tagsets

[![CI](https://github.com/componext/tagsets/actions/workflows/ci.yml/badge.svg)](https://github.com/componext/tagsets/actions/workflows/ci.yml) [![npm](https://img.shields.io/npm/v/tagsets)](https://www.npmjs.com/package/tagsets)

Glyphs for standardized metadata codes, drawn on Lucide's grid: 24 tall, 2px round strokes, 1px padding. 195 glyphs in six tagsets:

| Tagset | Prefix | Standard | Glyphs | Resolves |
|---|---|---|---|---|
| `keys` | `Key` | UI Events `KeyboardEvent.key` | 68 | `a`, `KeyA`, `ShiftLeft`, `" "`, `NumpadEnter`, `⌘` |
| `licenses` | `License` | SPDX License List | 22 | `GPL-3.0-or-later`, `BSD-3-Clause`, `(MIT OR Apache-2.0)`, `CC-BY-SA-4.0` |
| `locales` | `Locale` | ISO 639-1 / BCP 47 | 26 | `en`, `pt-BR`, `zh_Hant_TW`, ISO 639-2 `ger` |
| `math` | `Math` | LaTeX / Unicode | 37 | `\leq`, `leq`, `≤`, `<=`; case-sensitive (`\Delta` ≠ `\delta`) |
| `pos` | `Pos` | Universal Dependencies UPOS | 17 | `NOUN`, Penn Treebank `NN`, `NNP`, `PRP$` |
| `tech` | `Tech` | Common usage | 25 | `JSON`, `yml`, `https` |

Every glyph also ships as a 72px tile in the style of the UNA launcher icons, in its tagset's colour.

## Fixed and hug

Every glyph is 24 tall and comes in up to two widths, named after Figma's auto-layout sizing:

- **`hug`**: as wide as its content. The full text, always on one line: `MIT`, `NOUN`, `APACHE2`, `SHIFT`. Frames stretch with it: a circle becomes a pill, a key's square widens. An unframed glyph can be narrower than it is tall (`X`, `×`).
- **`fixed`**: the 24×24 square, which holds two characters (one inside a frame). When the full text does not fit, the glyph uses a recognizable short form (`N` for `NOUN`, `NP` for `PROPN`) or its symbol (`⇧`, `⏎`, `⌘`). When neither exists, there is no fixed form and `fixed` falls back to `hug`.

| Glyph | Fixed | Hug |
|---|---|---|
| `LocaleEn` | `EN`, filling the square | the same (24) |
| `PosNoun`, `PosPropn` | `N`, `NP` | `NOUN` (48), `PROPN` (60) |
| `KeyShift`, `KeyHome` | `⇧`, `↖` | `SHIFT` keycap (60), `HOME` keycap (50) |
| `KeyK`, `LicenseCc` | same as hug | 24 |
| `MathSum` | `∑` in the square | `∑` cropped to its ink (16) |
| `LicenseMit`, `TechApi`, `LicenseApache`, `KeyF1` | none | `MIT` (36), `API` (36), `APACHE2` (84), `F1` keycap (30) |

61 glyphs are hug-only: the three-letter and longer license, tech and POS codes with no recognizable two-character short form, plus `Fn`, `F1`–`F12`, `PgUp` and `PgDn`. Nothing is ever set on two lines.

## Packages

Named after Lucide's (`lucide`, `lucide-react`): all three names, and the `@tagsets` npm scope, were unregistered on 2026-10-20.

| Package | What it ships |
|---|---|
| `tagsets` | Glyph data, `toSvg`, `createElement`, `replaceElements`, `getGlyph`; optimized SVGs per fit (`svg/fixed/`, `svg/hug/`), `sprite.svg`, `sprite-hug.svg`, tiles, `manifest.json` |
| `tagsets-react` | One component per glyph; `TagGlyph` and `getGlyph` for codes from data (`tagsets-react/dynamic`) |
| `tagsets-vue` | The same for Vue 3 |
| `tagsets-glyphs` | The source (private): one `.json` per glyph, plus an `.svg` for each hand-drawn one |

```tsx
import { LicenseMit, PosNoun, KeyMeta, KeyK } from 'tagsets-react';
import { TagGlyph } from 'tagsets-react/dynamic';

<PosNoun size={20} title="Noun" />                       // N, 20×20
<PosNoun size={20} fit="hug" />                          // NOUN, 40×20
<LicenseMit />                                           // hug only: MIT, 36×24
<KeyMeta /><KeyK />                                      // ⌘ K
<TagGlyph tagset="keys" code={event.code} fit="hug" />   // ShiftLeft → SHIFT keycap
<TagGlyph tagset="licenses" code={pkg.license} fallback={pkg.license} />
```

```vue
<script setup>
import { PosNoun } from 'tagsets-vue';
import { TagGlyph } from 'tagsets-vue/dynamic';
</script>

<template>
  <PosNoun :size="16" fit="hug" />
  <TagGlyph tagset="math" :code="symbol.latex" fit="hug" />
</template>
```

```html
<i data-tagset="locales" data-code="pt-BR"></i>
<i data-tagset="keys" data-code="Enter" data-fit="hug"></i>
<script type="module">
  import { replaceElements, toSvg, TechJson } from 'tagsets';
  replaceElements();
  const markup = toSvg(TechJson, { size: 32 });
</script>

<svg width="24" height="24"><use href="/sprite.svg#license-gpl" /></svg>
```

Every component takes `size` (24, the height), `fit` (`fixed`), `color` (`currentColor`), `strokeWidth` (2), `absoluteStrokeWidth` and `title`, and passes any other attribute to the `<svg>`. Components also expose `meta`, `fixed` and `hug` (each variant's `x`, `width` and nodes); a fixed form is `null` when there is none.

## Things the integration must respect

1. **Name what stands in for text.** A glyph is `aria-hidden` unless it has a `title` or `aria-label`. A tag glyph usually *is* the content (a license column, a language switcher, a shortcut hint), so give it one unless a visible label sits next to it. `TagGlyph` and `replaceElements` title themselves with the glyph's label; pass `title=""` to opt out.
2. **`size` is the height.** A fixed glyph is `size` square; a hug glyph is `size × width / 24` wide. Numbers and plain lengths (`"1.5em"`) scale; anything else (`var(--s)`) keeps the box square and the drawing shrinks to fit it. Hugging glyphs carry the class `tagsets-hug`.
3. **Pick one fit per row.** Fixed glyphs line up in columns; hug glyphs read like words. A fixed row can still contain hug-only glyphs (most three-letter codes), which come out wider than the rest. Sprites follow the same rule: `sprite.svg` holds the fixed form (or hug where there is none), `sprite-hug.svg` the hug form, each with its own `viewBox`, so size `<use>` boxes from `manifest.json`.
4. **12px is the floor.** Freestanding characters are 14 grid units tall with 6-unit counters (4px of air at 16px); characters in a key are 10 tall with 4-unit counters (2.7px at 16px, 2px at 12px). Below that, or with `strokeWidth` above 2.5, they close up. Keep `absoluteStrokeWidth` for sizes of 24px and up: below 24px it thickens the stroke in grid units (2px at 16px is 3 units) and closes the counters.
5. **Tiles inline, statics anywhere.** SVG files and sprites work in `<img>`, CSS and `<use>`. Tile ids are suffixed with the glyph id, so any number can be inlined on one page. Tiles are square, so round the corners in CSS (16px at 72px). A hug-only glyph's tile shrinks it to fit.
6. **Codes resolve, they are not validated.** `getGlyph('licenses', 'GPL-2.0-only')` returns the GPL family glyph; versions share it (so `Apache-1.1` shows `APACHE2`). Keys follow macOS: `Meta` is `⌘`/`CMD`, `Alt` is `⌥`/`ALT`. A code nobody claims returns `undefined` (React: `fallback`, Vue: `#fallback` slot, vanilla: the placeholder stays).
7. **The dynamic entry imports everything.** `tagsets-react/dynamic` and `tagsets-vue/dynamic` bundle all 195 glyphs (about 130KB unminified, 12KB gzipped). Import named glyphs from the package root when the codes are known at build time.
8. **Marks and credits.** The CC glyphs are drawn here, not copied, but "CC" and its marks are Creative Commons trademarks: use them to indicate a CC license. The `bubble` frame is Lucide's `message-square`, path for path, and `⌘` follows Lucide's `command` icon, and keys sit in Lucide's `square` (all ISC, `LICENSE-lucide`). The letterforms follow Nunito's rounded capitals, redrawn as single strokes.

## How glyphs are made

Most tags are codes, so most glyphs are text, set in a monoline **stroke alphabet** (`scripts/lib/letters.ts`): capitals, digits and arrows after Nunito's rounded geometric capitals, drawn as single 2px strokes with oval bowls. The alphabet is monospaced, characters sit 4 apart (2px of air between strokes), and it comes in two optical sizes:

- **Text**, for freestanding glyphs: an 8×14 cell (16 tall in ink). A pair fills the square edge to edge and sits at the visual size of a Lucide pictogram beside it.
- **Framed**, inside a key or a circle: a 6×10 cell, the most a frame's 2px of padding leaves room for.

In both, stems and bars land on whole pixels, so they stay crisp at 1×.

A glyph's `.json` holds its codes and, for text, `"text"` and an optional `"short"`. The build composes both fits from them; nothing generated is written back to the source. A drawn `<name>.svg` beside the JSON is the fixed form; with no `text` it is the hug form too.

Text sits in a **frame**, set per tagset or per glyph:

| Frame | Fixed holds | Hug | Used for |
|---|---|---|---|
| `none` | two text-size characters | text + 2 each side | locales, licenses, POS, tech, math |
| `circle` | one framed-size character | becomes a pill | `©`, CC0 |
| `keycap` | one framed-size character | square widens | keys (Lucide `square`) |
| `bubble` | one framed-size character | body widens, tail stays | no tagset by default (Lucide `message-square`) |

The square is small: two 8-unit text characters and their 4-unit gap fill its 20-unit live area, and a frame leaves room for one 6-unit framed character.

Keys sit in Lucide's `square` (18px, 2px corners); language codes and other tags stand free. Two spacing rules hold everywhere, and the build checks them on every variant (`scripts/lib/spacing.ts`): separate strokes either join or keep at least 1px of air between them, and anything inside a frame keeps at least 2px of air from it (a slash may cross it). A character in a key has exactly 2px above and below. Three-letter codes need a recognizable two-character short form (`NP`, `CC`) or a symbol, or stay hug-only.

### Adding a glyph

1. Add `packages/glyphs/<tagset>/<name>.json` with `label`, `code` and any `aliases` (see `glyph.schema.json`).
2. Either add `"text"` (and a recognizable `"short"` if the text is too wide for the square), or draw `<name>.svg` on the grid. Copy an existing drawn glyph for the root; children are bare shapes (`path`, `circle`, `rect`, `line`, `polyline`, `polygon`, `ellipse`) with geometry only, stroke centres inside 2..22. A framed drawing starts with its frame exactly, and keeps its content inside it.
3. `pnpm check`, then `pnpm preview` to look at it at 16–48px, in both fits and as a tile.

A new tagset is a folder with a `_tagset.json`: `id`, a PascalCase `prefix`, `label`, `standard`, `normalize` (`spdx`, `bcp47`, `upper`, `key` or `latex`), an optional `frame` and display `order`, and a `tile` palette.

## Scripts

| Command | Does |
|---|---|
| `pnpm build` | Check every glyph, compose both fits, optimize with SVGO, emit all packages, compile with `tsc` |
| `pnpm test` | Source rules, fits, code resolution, vanilla assets, React and Vue rendering |
| `pnpm check` | Build, typecheck, test |
| `pnpm preview` | Write `preview/index.html`: every glyph in both fits and as a tile, glyphs in use, the alphabet |
| `pnpm versions check` / `set X.Y.Z` | Check, or set, the one version the three published packages share |

The build fails on any rule a glyph breaks: wrong root attributes, style on children, geometry outside the grid, strokes closer than 1px without joining, content within 2px of its frame, a drawn glyph whose frame differs from its tagset's, content outside its frame, a short form that does not fit or is never used, two glyphs claiming one code, a character the alphabet lacks.

Requires Node 22.18+ (scripts run as TypeScript directly) and pnpm.

## Releasing

CI (`.github/workflows/ci.yml`) runs on every push to `main` and every pull request, on Node 22 and 24: versions in lockstep, `pnpm check`, and a dry-run pack of each package.

`tagsets`, `tagsets-react` and `tagsets-vue` release together, at one version, from `.github/workflows/release.yml`. Publishing a GitHub release tagged `vX.Y.Z` builds, checks and publishes all three through [npm trusted publishing](https://docs.npmjs.com/trusted-publishers): npm trusts that workflow, so there is no npm token, no one-time code and no passkey prompt, and each version gets a provenance statement. A release marked as a prerelease publishes under the `next` dist-tag. Re-running a release skips the packages already published.

1. `pnpm versions set 0.2.0`, commit, and merge to `main`.
2. `gh release create v0.2.0 --generate-notes` (add `--prerelease` for `next`).
3. Watch the Release workflow; the tag must match the packages' version or it stops before publishing.

**One-time setup**, by an owner of the npm packages, approved with the account's passkey. Register the workflow as each package's trusted publisher (npm 11.21 or later; `npm@latest` needs Node 24.15+):

```bash
for p in tagsets tagsets-react tagsets-vue; do npx -y npm@11.21.1 trust github "$p" --repo componext/tagsets --file release.yml --env npm --allow-publish; done
```

Or on npmjs.com, which handles a passkey more reliably than the CLI's browser handshake: each package's **Settings → Trusted Publisher → GitHub Actions**, with organization `componext`, repository `tagsets`, workflow `release.yml` and environment `npm`. Check with `npx -y npm@11.21.1 trust list tagsets` (it asks for 2FA too). After the first release through the workflow, set each package's **Settings → Publishing access** on npmjs.com to "Require two-factor authentication and disallow tokens": the workflow keeps working, and nothing else can publish. Optionally, add required reviewers or a `v*` tag rule to the `npm` environment in the repository's settings.
