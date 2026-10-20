/**
 * The published packages (tagsets, tagsets-react, tagsets-vue) release in
 * lockstep: one version for all three.
 *
 *   node scripts/versions.ts check            all three share one version
 *   node scripts/versions.ts check v0.2.0     ... and it matches this tag
 *   node scripts/versions.ts set 0.2.0        set it in all three
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/source.ts';

const PACKAGES = ['vanilla', 'react', 'vue'].map((dir) => join(ROOT, 'packages', dir, 'package.json'));
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

const read = (file: string) => JSON.parse(readFileSync(file, 'utf8')) as { name: string; version: string };
const fail = (message: string): never => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

const [command, arg] = process.argv.slice(2);

if (command === 'set') {
  if (!arg || !SEMVER.test(arg)) fail(`usage: versions.ts set <version>, e.g. 0.2.0 (got ${arg ?? 'nothing'})`);
  for (const file of PACKAGES) {
    const text = readFileSync(file, 'utf8');
    const { name, version } = read(file);
    writeFileSync(file, text.replace(/"version": "[^"]+"/, `"version": "${arg}"`));
    console.log(`${name}: ${version} → ${arg}`);
  }
} else if (command === 'check') {
  const packages = PACKAGES.map(read);
  const versions = new Set(packages.map((p) => p.version));
  if (versions.size !== 1) fail(`versions differ: ${packages.map((p) => `${p.name}@${p.version}`).join(', ')}`);
  const [version] = versions;
  if (arg !== undefined && arg !== `v${version}`) fail(`tag ${arg} does not match the packages' version ${version} (expected v${version})`);
  console.log(`${packages.map((p) => p.name).join(', ')} at ${version}${arg ? `, matching ${arg}` : ''}`);
} else {
  fail('usage: versions.ts check [vX.Y.Z] | set X.Y.Z');
}
