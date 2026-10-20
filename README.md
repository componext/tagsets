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

- **`hug`**: as wide as its content. The full text, always on one line: `APACHE2`, `NOUN`, `SHIFT`. Frames stretch with it: a speech bubble widens, a circle becomes a pill, a keycap grows. An unframed glyph can be narrower than it is tall (`X`, `×`).
- **`fixed`**: the 24×24 square. When the full text does not fit, the glyph uses its short form (`AP2`, `N`, `PRO`) or its symbol (`⇧`, `⏎`, `⌘`). When neither exists, there is no fixed form and `fixed` falls back to `hug`.

| Glyph | Fixed | Hug |
|---|---|---|
| `LicenseApache` | `AP2` | `APACHE2` (50 wide) |
| `PosNoun` | `N` | `NOUN` (29) |
| `KeyShift` | `⇧` | `SHIFT` keycap (40) |
| `KeyHome` | `↖` | `HOME` keycap (39) |
| `LocaleEn`, `KeyK`, `LicenseCc` | same as hug | 24 |
| `MathSum` | `∑` in the square | `∑` cropped to its ink (16) |
| `LicenseLgpl`, `TechJson`, `KeyF12` … | none | `LGPL` (29), `JSON` (29), `F12` keycap (28) |

Ten glyphs are hug-only: `AGPL`, `EUPL`, `LGPL`, `ZLIB`, `HTTP`, `JSON`, `F10`, `F12`, `PgUp`, `PgDn`. Nothing is ever set on two lines.

## Packages

Named after Lucide's (`lucide`, `lucide-react`): all three names, and the `@tagsets` npm scope, were unregistered on 2026-10-20.

| Package | What it ships |
|---|---|
| `tagsets` | Glyph data, `toSvg`, `createElement`, `replaceElements`, `getGlyph`; optimized SVGs per fit (`svg/fixed/`, `svg/hug/`), `sprite.svg`, `sprite-hug.svg`, tiles, `manifest.json` |
| `tagsets-react` | One component per glyph; `TagGlyph` and `getGlyph` for codes from data (`tagsets-react/dynamic`) |
| `tagsets-vue` | The same for Vue 3 |
| `tagsets-glyphs` | The source (private): one `.json` per glyph, plus an `.svg` for each hand-drawn one |

```tsx
import { LicenseApache, KeyMeta, KeyK } from 'tagsets-react';
import { TagGlyph } from 'tagsets-react/dynamic';

<LicenseApache size={20} title="Apache License 2.0" />   // AP2, 20×20
<LicenseApache size={20} fit="hug" />                   // APACHE2, 41.7×20
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
3. **Pick one fit per row.** Fixed glyphs line up in columns; hug glyphs read like words. A fixed row can still contain the ten hug-only glyphs, which come out wider than the rest. Sprites follow the same rule: `sprite.svg` holds the fixed form (or hug where there is none), `sprite-hug.svg` the hug form, each with its own `viewBox`, so size `<use>` boxes from `manifest.json`.
4. **16px is the floor.** Letter counters are 2 grid units, which is 1.33px at 16px. Below that, or with `strokeWidth` above 2.5, letters close up. Keep `absoluteStrokeWidth` for sizes of 24px and up: below 24px it thickens the stroke in grid units (2px at 16px is 3 units) and closes the counters.
5. **Tiles inline, statics anywhere.** SVG files and sprites work in `<img>`, CSS and `<use>`. Tile ids are suffixed with the glyph id, so any number can be inlined on one page. Tiles are square, so round the corners in CSS (16px at 72px). A hug-only glyph's tile shrinks it to fit.
6. **Codes resolve, they are not validated.** `getGlyph('licenses', 'GPL-2.0-only')` returns the GPL family glyph; versions share it (so `Apache-1.1` shows `AP2`). Keys follow macOS: `Meta` is `⌘`/`CMD`, `Alt` is `⌥`/`ALT`. A code nobody claims returns `undefined` (React: `fallback`, Vue: `#fallback` slot, vanilla: the placeholder stays).
7. **The dynamic entry imports everything.** `tagsets-react/dynamic` and `tagsets-vue/dynamic` bundle all 195 glyphs (about 130KB unminified, 12KB gzipped). Import named glyphs from the package root when the codes are known at build time.
8. **Marks and credits.** The CC glyphs are drawn here, not copied, but "CC" and its marks are Creative Commons trademarks: use them to indicate a CC license. `⌘` follows Lucide's `command` icon (ISC, `LICENSE-lucide`).

## How glyphs are made

Most tags are codes, so most glyphs are text, set in a monoline **stroke alphabet** (`scripts/lib/letters.ts`): capitals, digits and arrows 8 units tall, an even number of units wide (most 4; M, W, ↑, ↓ 6; ←, → 8; I 0), with radius-2 curves throughout. Even widths and gaps put every line on whole pixels, so 2px strokes stay crisp at 1×.

A glyph's `.json` holds its codes and, for text, `"text"` and an optional `"short"`. The build composes both fits from them; nothing generated is written back to the source. A drawn `<name>.svg` beside the JSON is the fixed form; with no `text` it is the hug form too.

Text sits in a **frame**, set per tagset or per glyph:

| Frame | Fixed holds | Hug | Used for |
|---|---|---|---|
| `none` | 20 units: three letters | text + 2 each side | licenses, POS, tech, math |
| `bubble` | 14 units: two letters | bubble widens | locales |
| `circle` | 12 units: two letters | becomes a pill | `CC`, `©`, CC0 |
| `keycap` | 14 units: two letters | keycap grows | keys |

The square is small: three 4-unit letters with two 3-unit gaps fill its 20-unit live area, and a frame leaves room for two. Anything longer needs a short form, a symbol, or stays hug-only.

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

The build fails on any rule a glyph breaks: wrong root attributes, style on children, geometry outside the grid, a drawn glyph whose frame differs from its tagset's, content outside its frame, a short form that does not fit or is never used, two glyphs claiming one code, a character the alphabet lacks.

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

Check with `npx -y npm@11.21.1 trust list tagsets`. After the first release through the workflow, set each package's **Settings → Publishing access** on npmjs.com to "Require two-factor authentication and disallow tokens": the workflow keeps working, and nothing else can publish. Optionally, add required reviewers or a `v*` tag rule to the `npm` environment in the repository's settings.
