# tagsets-react

Tagsets glyphs as React components: licenses (SPDX), locales (ISO 639-1 / BCP 47), part-of-speech tags (UD UPOS), tech abbreviations, keyboard keys and math symbols, on Lucide's 24px stroke grid.

```tsx
import { LicenseApache, KeyMeta, KeyK } from 'tagsets-react';
import { TagGlyph, getGlyph } from 'tagsets-react/dynamic';
import PosNoun from 'tagsets-react/glyphs/pos-noun';

<LicenseApache size={20} title="Apache License 2.0" />   // fixed: AP2 in the square
<LicenseApache size={20} fit="hug" />                   // hug: APACHE2, as wide as it needs
<KeyMeta /><KeyK />                                      // ⌘ K
<TagGlyph tagset="licenses" code="GPL-3.0-or-later" fallback="GPL" />
```

Props: `size` (24, the height), `fit` (`fixed`, or `hug` for the full text on one line; glyphs with no fixed form always hug), `color` (`currentColor`), `strokeWidth` (2), `absoluteStrokeWidth`, `title`, and any SVG attribute. Without a `title` or `aria-label` a glyph is `aria-hidden`. Each component carries `meta`, `fixed` and `hug`. React 18 or later.

See the repository README for the design rules and the full list.
