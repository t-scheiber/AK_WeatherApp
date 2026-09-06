import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let fixture;
before(() => {
  fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'weather-static-build-'));
  for (const file of ['index.html', 'script.js', 'style.css', 'generate-config.js', 'package.json', 'package-lock.json']) {
    fs.copyFileSync(path.join(root, file), path.join(fixture, file));
  }
  for (const directory of ['scripts', 'images']) fs.cpSync(path.join(root, directory), path.join(fixture, directory), {recursive: true});
  fs.mkdirSync(path.join(fixture, 'node_modules'), {recursive: true});
  for (const name of ['bootstrap', 'jquery']) fs.cpSync(path.join(root, 'node_modules', name), path.join(fixture, 'node_modules', name), {recursive: true});
  fs.writeFileSync(path.join(fixture, '.env'), 'SYNTHETIC_INTERNAL_VALUE=do-not-publish');
  fs.mkdirSync(path.join(fixture, '.github')); fs.writeFileSync(path.join(fixture, '.github', 'internal.txt'), 'do-not-publish');
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], {cwd: fixture, env: {PATH: process.env.PATH, CI: 'true'}, encoding: 'utf8', timeout: 10000});
  assert.equal(result.status, 0, result.stderr);
});
after(() => {if (fixture) fs.rmSync(fixture, {recursive: true, force: true});});
test('build publishes only the selected static application files', () => {
  assert.deepEqual(fs.readdirSync(path.join(fixture, 'dist')).sort(), ['assets', 'config.js', 'images', 'index.html', 'script.js', 'style.css']);
  for (const forbidden of ['.env', '.github', 'package.json', 'package-lock.json', 'node_modules', 'generate-config.js', 'scripts', 'tests']) {
    assert.equal(fs.existsSync(path.join(fixture, 'dist', forbidden)), false);
  }
});
test('built jQuery and Bootstrap assets are byte-identical to the installed pinned packages', () => {
  for (const [installed, built] of [
    ['jquery/dist/jquery.min.js', 'jquery.min.js'],
    ['bootstrap/dist/css/bootstrap.min.css', 'bootstrap.min.css'],
    ['bootstrap/dist/css/bootstrap.min.css.map', 'bootstrap.min.css.map'],
    ['jquery/LICENSE.txt', 'jquery.LICENSE.txt'],
    ['bootstrap/LICENSE', 'bootstrap.LICENSE.txt'],
  ]) assert.deepEqual(fs.readFileSync(path.join(fixture, 'dist/assets', built)), fs.readFileSync(path.join(root, 'node_modules', installed)));
});
test('all static HTML script and stylesheet references resolve within the artifact', () => {
  const html = fs.readFileSync(path.join(fixture, 'dist/index.html'), 'utf8');
  const references = [...html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)\s*=\s*["']([^"']+)["']/g)].map(match => match[1]);
  for (const reference of references) {
    assert.doesNotMatch(reference, /^(?:https?:)?\/\//);
    assert.equal(fs.statSync(path.join(fixture, 'dist', reference)).isFile(), true);
  }
});
test('synthetic build configuration remains valid and private source content is excluded', () => {
  const content = fs.readFileSync(path.join(fixture, 'dist/config.js'), 'utf8');
  const config = vm.runInNewContext(content + '\nCONFIG', {}, {timeout: 1000});
  assert.equal(config.OPENWEATHER_API_KEY, '');
  assert.doesNotMatch(content, /SYNTHETIC_INTERNAL_VALUE|do-not-publish/);
});
test('installed package drift stops the build', () => {
  const file = path.join(fixture, 'node_modules/jquery/package.json');
  const original = fs.readFileSync(file);
  try {
    const changed = JSON.parse(original); changed.version = '0.0.0'; fs.writeFileSync(file, JSON.stringify(changed));
    const result = spawnSync(process.execPath, ['scripts/build.mjs'], {cwd: fixture, env: {PATH: process.env.PATH, CI: 'true'}, encoding: 'utf8', timeout: 10000});
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /differs from the pinned manifest/);
  } finally {fs.writeFileSync(file, original);}
});
