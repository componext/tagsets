import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { LicenseApache, LicenseLgpl, LicenseMit, LocaleEn, MathTimes, PosNoun, TechJson } from 'tagsets-vue';
import { TagGlyph, getGlyph } from 'tagsets-vue/dynamic';

const render = (render: () => ReturnType<typeof h>) => renderToString(createSSRApp({ render }));

test('a glyph renders with Lucide defaults and is decorative without a title', async () => {
  const html = await render(() => h(LicenseMit));
  assert.match(html, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tagsets tagsets-license-mit" aria-hidden="true">/);
  assert.equal(html.match(/<path /g)?.length, 3);
  assert.equal(LicenseMit.displayName, 'LicenseMit');
});

test('fit picks the square or the hugging width; size is the height', async () => {
  assert.match(await render(() => h(LicenseApache)), /width="24" height="24" viewBox="0 0 24 24"/);
  assert.match(await render(() => h(LicenseApache, { fit: 'hug', size: 12 })), /width="25" height="12" viewBox="0 0 50 24".*tagsets-hug/);
  assert.match(await render(() => h(LicenseLgpl)), /width="29" height="24"/, 'no fixed form: falls back to hug');
  assert.match(await render(() => h(MathTimes, { fit: 'hug' })), /width="14" height="24" viewBox="5 0 14 24"/);
});

test('props apply, kebab-case included, and extra attributes fall through', async () => {
  const html = await render(() => h(TechJson, { size: 16, color: 'red', 'stroke-width': 1.5, class: 'x', 'data-k': 'v' }));
  assert.match(html, /height="16"/);
  assert.match(html, /stroke="red" stroke-width="1\.5"/);
  assert.match(html, /class="tagsets tagsets-tech-json tagsets-hug x"/);
  assert.match(html, /data-k="v"/);
});

test('absolute-stroke-width casts to a boolean and keeps the stroke in pixels', async () => {
  assert.match(await render(() => h(PosNoun, { size: 48, 'absolute-stroke-width': '' })), /stroke-width="1"/);
});

test('a title or aria-label makes it an image with a name', async () => {
  const titled = await render(() => h(LocaleEn, { title: 'English' }));
  assert.match(titled, /role="img"/);
  assert.match(titled, /<title>English<\/title>/);
  assert.doesNotMatch(titled, /aria-hidden/);
  assert.match(await render(() => h(LocaleEn, { 'aria-label': 'English' })), /role="img"/);
});

test('TagGlyph renders the glyph for a code, titled with its label, or its fallback slot', async () => {
  assert.equal(getGlyph('pos', 'VBZ')?.meta.component, 'PosVerb');
  const html = await render(() => h(TagGlyph, { tagset: 'licenses', code: 'Apache-2.0', size: 20, fit: 'hug', class: 'y' }));
  assert.match(html, /tagsets-license-apache tagsets-hug y/);
  assert.match(html, /height="20"/);
  assert.match(html, /<title>Apache License<\/title>/);
  const fallback = await render(() => h(TagGlyph, { tagset: 'licenses', code: 'WTFPL' }, { fallback: () => 'none' }));
  assert.equal(fallback.replace(/<!--[[\]]-->/g, ''), 'none');
});
