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
  assert.equal(items.length, 25);
  assert.match(items.find(item => item.id === 'hydrogel-patches').description, /Faberlic Oceanum/);
  assert.doesNotMatch(html, /data-view="landscape"|Selected projects/i);
});

function webpDimensions(bytes) {
  assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
  assert.equal(bytes.subarray(8, 12).toString(), 'WEBP');
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const type = bytes.subarray(offset, offset + 4).toString();
    const start = offset + 8;
    if (type === 'VP8X') return [bytes.readUIntLE(start + 4, 3) + 1, bytes.readUIntLE(start + 7, 3) + 1];
    if (type === 'VP8 ') return [bytes.readUInt16LE(start + 6) & 0x3fff, bytes.readUInt16LE(start + 8) & 0x3fff];
    if (type === 'VP8L') {
      const bits = bytes.readUInt32LE(start + 1);
      return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
    }
    const size = bytes.readUInt32LE(offset + 4);
    offset = start + size + (size % 2);
  }
  assert.fail('WebP image has no dimensions');
}

test('every responsive photo shares the uncropped 3:2 frame and accurate intrinsic dimensions', async () => {
  for (const item of items) {
    for (const [path, expected] of [
      [item.image, [item.width || 1536, item.height || 1024]],
      [`/assets/${item.id}-768.webp`, [768, 512]],
      [`/assets/${item.id}-192.webp`, [192, 128]],
    ]) {
      const dimensions = webpDimensions(await readFile(new URL(`../dist${path}`, import.meta.url)));
      assert.deepEqual(dimensions, expected, path);
      assert.equal(dimensions[0] * 2, dimensions[1] * 3, `${path} must use the shared 3:2 composition`);
    }
  }
});

test('shop links preserve the requested products and kimono variant', () => {
  const linked = items.filter(item => item.url);
  assert.deepEqual(linked.map(item => item.id), ['rose-jam', 'crane-kimono', 'k18-hair-mask', 'rare-beauty-highlighter', 'janssen-cleanser', 'kaws-universe-set', 'davines-solu-scrub', 'airpods-5']);
  const kimono = linked.find(item => item.id === 'crane-kimono');
  assert.match(kimono.description, /Размер M/);
  const url = new URL(kimono.url);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'www.homeokat.com');
  assert.equal(url.searchParams.get('variant'), 'c552ba2c-10b2-4525-be7e-bbda1d341c6f');
  for (const [id, product] of [['rose-jam', 'MLAU5270707444'], ['k18-hair-mask', 'MLAU4002316294']]) {
    const shop = new URL(linked.find(item => item.id === id).url);
    assert.equal(shop.protocol, 'https:');
    assert.equal(shop.hostname, 'www.mercadolibre.com.ar');
    assert.ok(shop.pathname.endsWith(`/up/${product}`));
  }
  assert.equal(linked.find(item => item.id === 'rare-beauty-highlighter').url, 'https://www.mercadolibre.com.ar/rare-beauty-highlighter-mesmerize-tono-del-iluminador-rosa-gold/p/MLA27976835');
  const kaws = linked.find(item => item.id === 'kaws-universe-set');
  assert.equal(kaws.url, 'https://stockx.com/kaws-universe-x-uniqlo-bag-charm-set-of-3-yellow-blue-light-green');
  assert.match(kaws.title, /KAWS UNIVERSE × UNIQLO/);
  assert.match(kaws.description, /Bag Charm Set of 3/);
  const scrub = linked.find(item => item.id === 'davines-solu-scrub');
  assert.equal(scrub.url, 'https://www.caretobeauty.com/ar/en/davines-solu-sea-salt-scrub-cleanser-250ml/');
  assert.equal(scrub.description, 'SOLU Sea Salt Scrub Cleanser, 250 мл');
  assert.equal(items.find(item => item.id === 'hooded-cape').title, 'Такая накидка с капюшоном');
});

// Keep image downloads under test control so completions can arrive out of
// order, fail, or be cancelled independently of the currently displayed card.
async function carouselFixture() {
  const { runInNewContext } = await import('node:vm');
  const downloads = [];
  class Element {
    constructor(className = '') {
      this.className = className;
      this.style = {};
      this.dataset = {};
      this.attributes = {};
      this.children = new Map();
      this.listeners = {};
    }
    querySelector(selector) {
      if (!this.children.has(selector)) {
        const child = new Element(selector === 'img' ? 'selected-image' : '');
        child.parent = this;
        this.children.set(selector, child);
      }
      return this.children.get(selector);
    }
    setAttribute(name, value) { this.attributes[name] = value; }
    removeAttribute(name) { delete this.attributes[name]; delete this[name]; }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    append() {}
    replaceChildren() {}
    decode() {
      return new Promise((resolve, reject) => downloads.push({ img: this, resolve, reject }));
    }
    replaceWith(next) {
      next.parent = this.parent;
      this.parent.children.set('img', next);
      this.parent = null;
    }
  }
  const elements = new Map(['main', '.gallery', '.grid', '.selected-card', '#announcement', '.counter'].map(name => [name, new Element(name.slice(1))]));
  const selected = elements.get('.selected-card');
  const directions = [-1, 1].map(direction => {
    const button = new Element();
    button.dataset.direction = String(direction);
    return button;
  });
  const previews = Array.from({ length: 4 }, () => new Element());
  const document = {
    querySelector: name => elements.get(name),
    querySelectorAll: name => name === '[data-direction]' ? directions : name === '.preview' ? previews : [],
    createElement: () => new Element(),
  };
  const source = await readFile(new URL('../site/app.js', import.meta.url), 'utf8');
  runInNewContext(source.replace(/^import .*;\n/, ''), {
    document, items, normalizeView, wrapIndex,
    localStorage: { getItem: () => null, setItem() {} },
  });
  const finish = async (download, success = true) => {
    if (success) download.resolve();
    else download.reject(new Error('Image request failed'));
    await new Promise(resolve => setImmediate(resolve));
  };
  return { selected, elements, previews, downloads, finish, previous: () => directions[0].listeners.click(), next: () => directions[1].listeners.click() };
}

test('pending slides show their own preview and ignore out-of-order downloads', async () => {
  const { selected, elements, downloads, finish, next, previous } = await carouselFixture();
  const first = selected.querySelector('img');
  next();
  const secondPreview = selected.querySelector('img');
  assert.notEqual(secondPreview, first);
  assert.equal(secondPreview.src, '/assets/hydrogel-patches-192.webp');
  assert.equal(secondPreview.alt, items[1].alt);
  assert.equal(selected.querySelector('h2').textContent, items[1].title);
  assert.equal(elements.get('.counter').textContent, `2/${items.length}`);
  const secondDownload = downloads[1];
  next();
  const thirdDownload = downloads[2];
  previous();
  assert.equal(downloads.length, 3, 'returning to a pending neighbour reuses its request');
  await finish(thirdDownload);
  await finish(downloads[0]);
  assert.equal(selected.querySelector('img').src, '/assets/hydrogel-patches-192.webp');
  await finish(secondDownload);
  assert.equal(selected.querySelector('img'), secondDownload.img);
  assert.equal(selected.querySelector('img').src, items[1].image);
  assert.equal(selected.querySelector('img').fetchPriority, 'high');
  assert.equal(selected.querySelector('img').className, 'selected-image');
  assert.equal(selected.querySelector('h2').textContent, items[1].title);
});

test('adjacent photos warm after the selected photo and decoded photos are reused', async () => {
  const { selected, downloads, finish, next, previous } = await carouselFixture();
  assert.equal(downloads.length, 1, 'initial rendering must not compete with preloads');
  await finish(downloads[0]);
  assert.equal(downloads.length, 3);
  assert.equal(downloads[1].img.src, items.at(-1).image);
  assert.equal(downloads[2].img.src, items[1].image);
  assert.equal(downloads[2].img.fetchPriority, 'low');
  await finish(downloads[2]);
  next();
  assert.equal(selected.querySelector('img'), downloads[2].img);
  assert.equal(downloads[2].img.fetchPriority, 'high');
  previous();
  assert.equal(selected.querySelector('img'), downloads[0].img);
});

test('rapid navigation cancels distant pending photos and keeps the latest selection', async () => {
  const { selected, downloads, finish, next } = await carouselFixture();
  for (let i = 0; i < 10; i++) next();
  assert.equal(downloads[0].img.src, undefined, 'distant requests are released');
  assert.equal(downloads[0].img.srcset, undefined);
  for (const old of downloads.slice(0, -1).reverse()) await finish(old);
  assert.equal(selected.querySelector('img').src, `/assets/${items[10].id}-192.webp`);
  await finish(downloads[10]);
  assert.equal(selected.querySelector('img').src, items[10].image);
  assert.equal(downloads.length, 12, 'only the latest selection warms its missing neighbour');
});

test('a failed full photo keeps its preview and can be retried on return', async () => {
  const { selected, downloads, finish, next, previous } = await carouselFixture();
  await finish(downloads[0], false);
  assert.equal(selected.querySelector('img').src, '/assets/rose-jam-192.webp');
  next();
  previous();
  const retry = downloads.at(-1);
  assert.equal(retry.img.src, items[0].image);
  assert.notEqual(retry.img, downloads[0].img);
  await finish(retry);
  assert.equal(selected.querySelector('img'), retry.img);
});

test('wraparound, preview and keyboard navigation keep the selected content together', async () => {
  const { selected, elements, previews, previous } = await carouselFixture();
  previous();
  assert.equal(selected.querySelector('img').src, `/assets/${items.at(-1).id}-192.webp`);
  assert.equal(elements.get('.counter').textContent, `${items.length}/${items.length}`);
  previews[2].onclick();
  assert.equal(selected.querySelector('img').src, '/assets/rose-jam-192.webp');
  elements.get('.gallery').listeners.keydown({ key: 'ArrowRight', preventDefault() {} });
  assert.equal(selected.querySelector('img').src, '/assets/hydrogel-patches-192.webp');
  assert.equal(selected.querySelector('h2').textContent, items[1].title);
});
