import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { items, normalizeView, views, wrapIndex } from '../site/items.js';

test('carousel wraps in both directions, including repeated navigation', () => {
  assert.equal(wrapIndex(-1, 2), 1);
  assert.equal(wrapIndex(2, 2), 0);
  assert.equal(wrapIndex(-5, 2), 1);
  assert.equal(wrapIndex(7, 2), 1);
});

test('removed or invalid saved layouts fall back to the slider', () => {
  assert.deepEqual(views, ['gallery', 'square']);
  assert.equal(normalizeView('landscape'), 'gallery');
  assert.equal(normalizeView(null), 'gallery');
  assert.equal(normalizeView('square'), 'square');
});

test('the built wishlist ships all photos, thumbnails, fonts and referenced resources', async () => {
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  const resources = [...html.matchAll(/\/(?:assets\/[\w.-]+|styles\.css|app\.js|items\.js)/g)].map(match => match[0]);
  const photos = items.flatMap(item => [item.image, `/assets/${item.id}-768.webp`, `/assets/${item.id}-192.webp`]);
  for (const path of [...resources, ...photos, '/items.js', '/assets/fonts/manrope-latin.woff2', '/assets/fonts/manrope-cyrillic.woff2']) {
    const content = await readFile(new URL(`../dist${path}`, import.meta.url));
    assert.ok(content.length > 0, `${path} must ship in the build`);
    if (path.endsWith('.webp')) assert.equal(content.subarray(8, 12).toString(), 'WEBP');
  }
  assert.equal(items.length, 20);
  assert.match(items.find(item => item.id === 'hydrogel-patches').description, /Faberlic Oceanum/);
  assert.doesNotMatch(html, /data-view="landscape"|Selected projects/i);
});

test('only the kimono links to the requested shop variant, with size M', () => {
  const linked = items.filter(item => item.url);
  assert.equal(linked.length, 1);
  assert.equal(linked[0].id, 'crane-kimono');
  assert.match(linked[0].description, /Размер M/);
  const url = new URL(linked[0].url);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'www.homeokat.com');
  assert.equal(url.searchParams.get('variant'), 'c552ba2c-10b2-4525-be7e-bbda1d341c6f');
});
