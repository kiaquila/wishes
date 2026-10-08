import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const revision = process.argv[2];
if (!/^[a-f0-9]{40}$/.test(revision || '')) throw new Error('A full revision SHA is required.');
const origin = 'https://wishes.ks-design.art';
const actual = await fetch(`${origin}/__revision`, { cache: 'no-store' });
if (!actual.ok || (await actual.text()).trim() !== revision) throw new Error('Live revision differs from the reviewed merge.');
const root = resolve(import.meta.dirname, '../site');
async function verify(directory = '') {
  for (const entry of await readdir(resolve(root, directory), { withFileTypes: true })) {
    const path = `${directory}${entry.name}`;
    if (entry.isDirectory()) { await verify(`${path}/`); continue; }
    const response = await fetch(`${origin}/${path === 'index.html' ? '' : path}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${path} returned ${response.status}.`);
    const expected = createHash('sha256').update(await readFile(resolve(root, path))).digest('hex');
    const delivered = createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
    if (expected !== delivered) throw new Error(`${path} differs from the reviewed source.`);
  }
}
await verify();
console.log(`All live files match reviewed revision ${revision}.`);
