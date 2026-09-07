import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'dist');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const name of ['bootstrap', 'jquery']) {
  const installed = JSON.parse(fs.readFileSync(path.join(root, 'node_modules', name, 'package.json'), 'utf8'));
  if (installed.version !== manifest.dependencies[name]) throw Error(`Installed ${name} differs from the pinned manifest`);
}
const generated = spawnSync(process.execPath, [path.join(root, 'generate-config.js')], {cwd: root, encoding: 'utf8', timeout: 10000});
if (generated.error || generated.status !== 0) throw Error('Public configuration generation failed');

fs.rmSync(destination, {recursive: true, force: true});
fs.mkdirSync(destination);
let copied = 0;
function copy(relativeSource, relativeDestination = relativeSource) {
  const source = path.join(root, relativeSource);
  const target = path.join(destination, relativeDestination);
  if (!fs.lstatSync(source).isFile() || !fs.realpathSync(source).startsWith(root + path.sep)) {
    throw Error('Static asset is not a regular project file');
  }
  if (fs.statSync(source).size > 2 * 1024 * 1024) throw Error('Static asset exceeds the size limit');
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(source, target);
  copied++;
}
for (const file of ['index.html', 'script.js', 'style.css', 'config.js']) copy(file);
for (const entry of fs.readdirSync(path.join(root, 'images'), {withFileTypes: true})) {
  if (entry.isFile() && /\.(?:png|jpe?g|svg|webp|ico|json|xml)$/i.test(entry.name)) copy(`images/${entry.name}`);
}
for (const [source, target] of [
  ['node_modules/bootstrap/dist/css/bootstrap.min.css', 'assets/bootstrap.min.css'],
  ['node_modules/bootstrap/dist/css/bootstrap.min.css.map', 'assets/bootstrap.min.css.map'],
  ['node_modules/bootstrap/LICENSE', 'assets/bootstrap.LICENSE.txt'],
  ['node_modules/jquery/dist/jquery.min.js', 'assets/jquery.min.js'],
  ['node_modules/jquery/LICENSE.txt', 'assets/jquery.LICENSE.txt'],
]) copy(source, target);
console.log(`Built ${copied} allowlisted static files in dist/.`);
