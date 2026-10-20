# tagsets-vue

Tagsets glyphs as Vue 3 components: licenses (SPDX), locales (ISO 639-1 / BCP 47), part-of-speech tags (UD UPOS), tech abbreviations, keyboard keys and math symbols, on Lucide's 24px stroke grid.

```vue
<script setup>
import { LicenseApache } from 'tagsets-vue';
import { TagGlyph } from 'tagsets-vue/dynamic';
</script>

<template>
  <LicenseApache :size="20" title="Apache License 2.0" />
  <TagGlyph tagset="keys" :code="event.code" fit="hug">
    <template #fallback>{{ event.key }}</template>
  </TagGlyph>
</template>
```

Props: `size` (24, the height), `fit` (`fixed`, or `hug` for the full text on one line; glyphs with no fixed form always hug), `color` (`currentColor`), `stroke-width` (2), `absolute-stroke-width`, `title`; other attributes fall through to the `<svg>`. Without a `title` or `aria-label` a glyph is `aria-hidden`. Vue 3.3 or later.

See the repository README for the design rules and the full list.
