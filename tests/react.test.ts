import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { KeyShift, LicenseApache, LicenseLgpl, LicenseMit, LocaleEn, PosNoun, TechJson } from 'tagsets-react';
import { TagGlyph, getGlyph } from 'tagsets-react/dynamic';
import LicenseCc from 'tagsets-react/glyphs/license-cc';

const render = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

test('a glyph renders with Lucide defaults and is decorative without a title', () => {
  const html = render(createElement(LocaleEn));
  assert.match(html, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tagsets tagsets-locale-en" aria-hidden="true">/);
  assert.equal(html.match(/<path /g)?.length, 2);
  assert.equal(LicenseMit.displayName, 'LicenseMit');
  assert.deepEqual(LicenseMit.meta, { id: 'license-mit', name: 'mit', tagset: 'licenses', code: 'MIT', label: 'MIT License', component: 'LicenseMit' });
});

test('fit picks the square or the hugging width; size is the height', () => {
  assert.match(render(createElement(PosNoun)), /width="24" height="24" viewBox="0 0 24 24"/);
  const hug = render(createElement(PosNoun, { fit: 'hug', size: 12 }));
  assert.match(hug, /width="24" height="12" viewBox="0 0 48 24"/);
  assert.match(hug, /class="tagsets tagsets-pos-noun tagsets-hug"/);
  assert.match(render(createElement(LicenseLgpl)), /width="48" height="24" viewBox="0 0 48 24".*tagsets-hug/, 'no fixed form: falls back to hug');
  assert.match(render(createElement(LicenseLgpl, { size: '1.5em' })), /width="3em" height="1.5em"/);
  assert.match(render(createElement(KeyShift, { fit: 'hug' })), /width="60".*<rect width="54" height="18" x="3" y="3" rx="2"/);
  assert.equal(LicenseLgpl.fixed, null);
  assert.equal(LicenseApache.fixed, null);
  assert.equal(LicenseApache.hug.width, 84);
});

test('size, color, strokeWidth, className and extra attributes apply', () => {
  const data: Record<`data-${string}`, string> = { 'data-k': 'v' };
  const html = render(createElement(TechJson, { size: 16, color: 'red', strokeWidth: 1.5, className: 'x', ...data, style: { verticalAlign: 'middle' } }));
  assert.match(html, /height="16"/);
  assert.match(html, /stroke="red" stroke-width="1\.5"/);
  assert.match(html, /class="tagsets tagsets-tech-json tagsets-hug x"/);
  assert.match(html, /data-k="v"/);
  assert.match(html, /style="vertical-align:middle"/);
});

test('absoluteStrokeWidth keeps the stroke in pixels', () => {
  assert.match(render(createElement(PosNoun, { size: 48, absoluteStrokeWidth: true })), /stroke-width="1"/);
  assert.match(render(createElement(PosNoun, { size: 12, strokeWidth: 1, absoluteStrokeWidth: true })), /stroke-width="2"/);
});

test('a title or aria-label makes it an image with a name', () => {
  const titled = render(createElement(LocaleEn, { title: 'English' }));
  assert.match(titled, /role="img"/);
  assert.match(titled, /<title>English<\/title>/);
  assert.doesNotMatch(titled, /aria-hidden/);
  assert.match(render(createElement(LocaleEn, { 'aria-label': 'English' })), /role="img" aria-label="English"/);
});

test('deep imports resolve to the same component', () => {
  assert.equal(LicenseCc.meta.id, 'license-cc');
});

test('TagGlyph renders the glyph for a code, titled with its label', () => {
  assert.equal(getGlyph('licenses', 'GPL-2.0-only')?.meta.component, 'LicenseGpl');
  const html = render(createElement(TagGlyph, { tagset: 'locales', code: 'pt-BR', size: 20 }));
  assert.match(html, /tagsets-locale-pt/);
  assert.match(html, /width="20"/);
  assert.match(html, /<title>Portuguese<\/title>/);
  assert.match(render(createElement(TagGlyph, { tagset: 'keys', code: 'ShiftLeft', fit: 'hug' })), /width="60".*<title>Shift<\/title>/);
  assert.doesNotMatch(render(createElement(TagGlyph, { tagset: 'locales', code: 'pt', title: '' })), /<title>/);
  assert.equal(render(createElement(TagGlyph, { tagset: 'locales', code: 'xx' })), '');
  assert.equal(render(createElement(TagGlyph, { tagset: 'locales', code: 'xx', fallback: createElement('span', null, 'xx') })), '<span>xx</span>');
});
