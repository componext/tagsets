# tagsets

Glyphs for standardized metadata codes, without a framework: licenses (SPDX), locales (ISO 639-1 / BCP 47), part-of-speech tags (UD UPOS), tech abbreviations, keyboard keys and math symbols, on Lucide's 24px stroke grid. For components, see `tagsets-react` and `tagsets-vue`.

Every glyph is 24 tall in up to two fits: `fixed` (the 24×24 square, with a short form or symbol when the full text does not fit) and `hug` (as wide as the full text, on one line).

- `svg/fixed/<tagset>/<name>.svg`, `svg/hug/<tagset>/<name>.svg`: optimized glyphs, safe in `<img>` and CSS. Hug-only glyphs have no fixed file.
- `sprite.svg` (fixed, or hug where there is none) and `sprite-hug.svg`: one `<symbol id="license-mit">` per glyph, each with its own `viewBox`.
- `tiles/<tagset>/<name>.svg`: 72px tiles in the UNA launcher style, with page-unique ids. Round the corners in CSS.
- `manifest.json`: every tagset and glyph, with codes, aliases, labels, widths and file paths.

```js
import { LicenseApache, getGlyph, toSvg, createElement, replaceElements } from 'tagsets';

toSvg(LicenseApache);                        // AP2, 24×24
toSvg(LicenseApache, { fit: 'hug' });        // APACHE2, 50×24
getGlyph('keys', 'ShiftLeft');               // KeyShift
replaceElements();                           // <i data-tagset="pos" data-code="NOUN" data-fit="hug"></i> → <svg>
```

See the repository README for the design rules and the full list.
