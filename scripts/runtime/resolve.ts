/**
 * Code resolution, shared by every SDK (the build copies this file into each
 * package's src/generated/) and by the build itself, which uses it to catch
 * two glyphs claiming the same code.
 *
 * Data carries codes in many spellings: `GPL-3.0-or-later`, `en_US`, `nn`.
 * Each tagset normalizes a code to a registry key, and the registry maps keys
 * to glyphs.
 */

/**
 * - `spdx`: upper case; the first id of an SPDX expression; `+`, `-only`,
 *   `-or-later`, `-N-Clause` and version suffixes dropped. `GPL-3.0-or-later`
 *   and `(MIT OR Apache-2.0)` become `GPL` and `MIT`.
 * - `bcp47`: the primary language subtag, lower case. `zh-Hant-TW` becomes `zh`.
 * - `upper`: upper case.
 * - `key`: a KeyboardEvent `key` or `code`, upper case: `KeyA` and `a` become
 *   `A`, `Digit1` and `Numpad1` become `1`, `ShiftLeft` becomes `SHIFT`, and
 *   the space character becomes `SPACE`.
 * - `latex`: one leading backslash dropped, case kept: `\Delta` and `Delta`
 *   match each other but not `\delta`.
 */
export type Normalize = 'spdx' | 'bcp47' | 'upper' | 'key' | 'latex';

export interface RegistryTagset {
  normalize: Normalize;
  /** Normalized code to glyph component name. */
  keys: Readonly<Record<string, string>>;
}

export type Registry = Readonly<Record<string, RegistryTagset>>;

export function normalizeCode(code: string, how: Normalize): string {
  if (how === 'key' && code === ' ') return 'SPACE';
  const c = code.trim();
  if (how === 'bcp47') return (c.split(/[-_]/)[0] ?? '').toLowerCase();
  if (how === 'upper') return c.toUpperCase();
  if (how === 'latex') return c.replace(/^\\(?=.)/, '');
  if (how === 'key') {
    return c
      .replace(/^(?:Key|Digit|Numpad)(?=\w)/, '')
      .replace(/^(Shift|Control|Alt|Meta)(?:Left|Right)$/, '$1')
      .toUpperCase();
  }
  const first = c.replace(/[()]/g, '').trim().split(/\s+(?:OR|AND|WITH)\s+/i)[0] ?? '';
  return first
    .toUpperCase()
    .replace(/\+$/, '')
    .replace(/-(?:ONLY|OR-LATER)$/, '')
    .replace(/-\d+-CLAUSE(?:-[A-Z]+)*$/, '')
    .replace(/-\d+(?:\.\d+)*$/, '');
}

/** The component name for a code in a tagset, or undefined if no glyph claims it. */
export function resolveName(registry: Registry, tagset: string, code: string | null | undefined): string | undefined {
  const set = registry[tagset];
  if (!set || !code || !Object.hasOwn(set.keys, normalizeCode(code, set.normalize))) return undefined;
  return set.keys[normalizeCode(code, set.normalize)];
}
