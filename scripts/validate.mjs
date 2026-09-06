import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
if (lock.lockfileVersion !== 3 || JSON.stringify(lock.packages[''].dependencies) !== JSON.stringify(manifest.dependencies)) {
  throw Error('Manifest and frozen lock dependencies differ');
}
for (const name of ['bootstrap', 'jquery']) {
  const version = manifest.dependencies[name];
  if (!/^\d+\.\d+\.\d+$/.test(version) || lock.packages[`node_modules/${name}`]?.version !== version) {
    throw Error('Browser library is not pinned to the locked version');
  }
}
for (const file of ['script.js', 'generate-config.js']) new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), {filename: file});
for (const directory of ['scripts', 'tests']) {
  for (const file of fs.readdirSync(path.join(root, directory))) {
    if (!file.endsWith('.mjs')) continue;
    const checked = spawnSync(process.execPath, ['--check', path.join(root, directory, file)], {encoding: 'utf8', timeout: 10000});
    if (checked.error || checked.status !== 0) throw Error(`Invalid JavaScript syntax in ${directory}/${file}`);
  }
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (/\b(?:src|href)\s*=\s*["'](?:https?:)?\/\//i.test(html)) throw Error('HTML includes an uncontrolled external dependency');
const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length || !ids.includes('prognose')) throw Error('HTML application mount IDs are invalid');
const references = [...html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)\s*=\s*["']([^"']+)["']/g)].map(match => match[1]);
for (const expected of ['./assets/bootstrap.min.css', './assets/jquery.min.js', './config.js', './style.css', './script.js']) {
  if (!references.includes(expected)) throw Error('Required application asset reference is absent');
}
for (let day = 1; day <= 5; day++) {
  if (!['textTag', 'imgTag', 'descrTag', 'tempTag'].every(prefix => ids.includes(`${prefix}${day}`))) {
    throw Error('The five-day forecast layout is incomplete');
  }
}
console.log('Validated syntax, pinned browser dependencies, local assets and forecast layout.');
