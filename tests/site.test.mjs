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

// Model request state separately from attributes: updating src/srcset on a
// mounted image does not discard the bitmap the browser already decoded.
async function carouselFixture() {
  const { runInNewContext } = await import('node:vm');
  class Element {
    constructor(className = '') {
      this.className = className;
      this.classList = { contains: name => this.className.split(' ').includes(name) };
      this.style = {};
      this.dataset = {};
      this.attributes = {};
      this.children = new Map();
      this.listeners = {};
      this.paintedImage = null;
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
    removeAttribute(name) { delete this.attributes[name]; }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    append() {}
    replaceChildren() {}
    cloneNode() {
      const clone = new Element(this.className);
      for (const name of ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'fetchPriority']) clone[name] = this[name];
      clone.style = { ...this.style };
      return clone;
    }
    replaceWith(next) {
      next.parent = this.parent;
      this.parent.children.set('img', next);
      this.parent = null;
    }
  }
  const elements = new Map(['main', '.gallery', '.grid', '.selected-card', '#announcement', '.counter'].map(name => [name, new Element(name.slice(1))]));
  const selected = elements.get('.selected-card');
  selected.querySelector('img').fetchPriority = 'high';
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
  return { selected, elements, previews, previous: () => directions[0].listeners.click(), next: () => directions[1].listeners.click() };
}

test('navigation discards the previous bitmap while the new image is pending', async () => {
  const { selected, elements, next, previous } = await carouselFixture();
  const first = selected.querySelector('img');
  first.paintedImage = items[0].image;
  next();
  const second = selected.querySelector('img');
  assert.notEqual(second, first);
  assert.equal(first.parent, null);
  assert.equal(second.paintedImage, null, 'the next title must never accompany the previous decoded bitmap');
  assert.equal(second.src, items[1].image);
  assert.match(second.srcset, /hydrogel-patches-768.webp/);
  assert.equal(second.fetchPriority, 'high');
  assert.equal(second.className, 'selected-image');
  assert.equal(selected.querySelector('h2').textContent, items[1].title);
  assert.equal(elements.get('.counter').textContent, '2/20');
  next();
  const third = selected.querySelector('img');
  previous();
  const latest = selected.querySelector('img');
  third.paintedImage = items[2].image; // An older request finishes out of order.
  assert.equal(third.parent, null);
  assert.equal(latest.paintedImage, null);
  assert.equal(latest.src, items[1].image);
  assert.equal(selected.querySelector('h2').textContent, items[1].title);
});

test('wraparound, preview and keyboard navigation keep the selected content together', async () => {
  const { selected, elements, previews, previous } = await carouselFixture();
  previous();
  assert.equal(selected.querySelector('img').src, items.at(-1).image);
  assert.equal(elements.get('.counter').textContent, '20/20');
  previews[2].onclick();
  assert.equal(selected.querySelector('img').src, items[0].image);
  elements.get('.gallery').listeners.keydown({ key: 'ArrowRight', preventDefault() {} });
  assert.equal(selected.querySelector('img').src, items[1].image);
  assert.equal(selected.querySelector('h2').textContent, items[1].title);
});
