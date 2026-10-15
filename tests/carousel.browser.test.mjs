import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';
import { items, wrapIndex } from '../site/items.js';

let browser;
let server;
let origin;

before(async () => {
  server = spawn(process.execPath, ['scripts/serve-site.mjs'], {
    cwd: new URL('../', import.meta.url), env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const [output] = await once(server.stdout, 'data');
  origin = output.toString().match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
  assert.ok(origin, 'preview server must announce its actual ephemeral port');
  browser = await chromium.launch();
}, { timeout: 15000 });

after(async () => {
  await browser?.close();
  if (server && server.exitCode === null) {
    const exited = once(server, 'exit');
    server.kill();
    await exited;
  }
});

async function openCarousel(t, viewport = { width: 1512, height: 770 }) {
  // Each case starts without storage, memory/disk cache or service workers.
  const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
  t.after(() => context.close());
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, [], 'no uncaught browser errors'));
  return { page, context };
}

async function holdPhotos(context, latency = 0) {
  const pending = [];
  await context.route('**/*', async route => {
    if (latency) await delay(latency);
    const photo = new URL(route.request().url()).pathname.match(/\/assets\/(.+)-(768|1200|1536)\.webp$/);
    if (!photo) return route.continue();
    const gate = Promise.withResolvers();
    const request = { id: photo[1], release: gate.resolve, finished: false };
    pending.push(request);
    await gate.promise;
    // A genuine browser request/response and decode; no Image/DOM mocks.
    await route.continue();
    request.finished = true;
  });
  const waitFor = async id => {
    for (let attempt = 0; attempt < 500; attempt++) {
      const request = pending.findLast(entry => entry.id === id && !entry.finished);
      if (request) return request;
      await delay(10);
    }
    assert.fail(`full photo request never arrived: ${id}`);
  };
  return { pending, waitFor };
}

async function assertSlide(page, index, { full = false } = {}) {
  const item = items[index];
  // Wait for a decoded, correctly identified visible photo, not just its src.
  // Both responsive sizes are valid; the preview is valid while loading.
  await page.waitForFunction(({ id, full }) => {
    const img = document.querySelector('.selected-card img');
    const path = new URL(img.currentSrc || img.src).pathname;
    return img.complete && img.naturalWidth > 0 &&
      path.startsWith(`/assets/${id}-`) && (!full || !path.endsWith('-192.webp'));
  }, { id: item.id, full });
  assert.equal(await page.locator('.selected-card h2').textContent(), item.title);
  assert.equal(await page.locator('.selected-card img').getAttribute('alt'), item.alt);
  assert.equal(await page.locator('.counter').textContent(), `${index + 1}/${items.length}`);
  assert.equal(await page.locator('.selected-card p').textContent(), item.description);
  const link = page.locator('.selected-card .item-link');
  assert.equal(await link.isVisible(), Boolean(item.url));
  assert.equal(await link.getAttribute('href'), item.url || null);
}

async function assertFits(page, label) {
  const geometry = await page.evaluate(() => {
    const rect = selector => {
      const { x, y, width, height, right, bottom } = document.querySelector(selector).getBoundingClientRect();
      return { x, y, width, height, right, bottom };
    };
    return {
      width: innerWidth, height: innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      scrollX, scrollY, card: rect('.selected-card'), image: rect('.selected-card img'),
      note: rect('.wishlist-note'), text: rect('.wishlist-note p'),
      arrows: [...document.querySelectorAll('.arrow')].map(element => {
        const { x, y, right, bottom } = element.getBoundingClientRect();
        return { x, y, right, bottom };
      }),
    };
  });
  assert.ok(geometry.scrollWidth <= geometry.width + 1, `${label}: horizontal overflow`);
  assert.ok(geometry.scrollHeight <= geometry.height + 1, `${label}: vertical overflow`);
  assert.equal(geometry.scrollX, 0, `${label}: horizontal scroll position`);
  assert.equal(geometry.scrollY, 0, `${label}: vertical scroll position`);
  for (const [name, rect] of Object.entries({ card: geometry.card, image: geometry.image, disclaimer: geometry.text,
    previous: geometry.arrows[0], next: geometry.arrows[1] })) {
    assert.ok(rect.x >= -1 && rect.y >= -1 && rect.right <= geometry.width + 1 && rect.bottom <= geometry.height + 1,
      `${label}: ${name} must be fully inside the viewport: ${JSON.stringify(rect)}`);
  }
  assert.ok(geometry.card.bottom <= geometry.note.y + 1, `${label}: card overlaps disclaimer`);
  assert.ok(geometry.image.width > 0 && geometry.image.height > 0, `${label}: visible image frame`);
  return geometry;
}

const next = page => page.locator('[data-direction="1"]').click();
const previous = page => page.locator('[data-direction="-1"]').click();

test('cold slow load shows the first preview before its full photo, without moving the card', { timeout: 20000 }, async t => {
  const { page, context } = await openCarousel(t);
  const photos = await holdPhotos(context, 100);
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  const first = await photos.waitFor(items[0].id);
  await assertSlide(page, 0);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(first.finished, false, 'the full photo is still held on the network');
  const before = await assertFits(page, 'cold first preview');
  first.release();
  await assertSlide(page, 0, { full: true });
  const after = await assertFits(page, 'decoded first photo');
  assert.deepEqual(after.card, before.card, 'decoding must not shift the card or disclaimer');
  assert.deepEqual(after.text, before.text);
});

for (const completionOrder of [[2, 1], [1, 2]]) {
  test(`late photos completed in order ${completionOrder} cannot overwrite a newer selection`, { timeout: 20000 }, async t => {
    const { page, context } = await openCarousel(t);
    const photos = await holdPhotos(context);
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    (await photos.waitFor(items[0].id)).release();
    await assertSlide(page, 0, { full: true });
    await next(page);
    await photos.waitFor(items[1].id);
    await next(page);
    await photos.waitFor(items[2].id);
    await previous(page);
    await assertSlide(page, 1);
    for (const index of completionOrder) {
      const photo = await photos.waitFor(items[index].id);
      // Synchronize on the actual response; then allow browser decoding/paint.
      const response = page.waitForResponse(response => response.url().includes(`/assets/${items[index].id}-`) &&
        !response.url().endsWith('-192.webp'));
      photo.release();
      await (await response).finished();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await assertSlide(page, 1, { full: index === 1 || completionOrder.indexOf(1) < completionOrder.indexOf(index) });
    }
    await assertFits(page, 'out-of-order completion');
  });
}

test('two rapid laps, reversal and keyboard navigation keep the latest wish through delayed responses', { timeout: 30000 }, async t => {
  const { page, context } = await openCarousel(t);
  const photos = await holdPhotos(context);
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  for (let step = 1; step <= items.length * 2 + 3; step++) {
    await next(page);
    await assertSlide(page, wrapIndex(step, items.length));
  }
  await previous(page);
  await page.locator('.gallery').focus();
  await page.keyboard.press('ArrowLeft');
  await assertSlide(page, 1);
  // All stale requests finish after navigation, including cancelled requests.
  for (const photo of photos.pending) if (photo.id !== items[1].id) photo.release();
  const current = await photos.waitFor(items[1].id);
  current.release();
  await assertSlide(page, 1, { full: true });
  await assertFits(page, 'rapid navigation');
});

for (const viewport of [
  { width: 1512, height: 770 }, { width: 390, height: 844 }, { width: 360, height: 640 },
  { width: 844, height: 390 }, { width: 1024, height: 640 },
]) {
  test(`all wishes fit with their disclaimer at ${viewport.width}×${viewport.height}`, { timeout: 30000 }, async t => {
    const { page, context } = await openCarousel(t, viewport);
    // Held full photos exercise the preview layout on a fresh cache as well.
    const photos = await holdPhotos(context);
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    for (let index = 0; index < items.length; index++) {
      if (index) await next(page);
      await assertSlide(page, index);
      const label = `${viewport.width}×${viewport.height}: ${items[index].id}`;
      const preview = await assertFits(page, `${label} preview`);
      (await photos.waitFor(items[index].id)).release();
      await assertSlide(page, index, { full: true });
      const decoded = await assertFits(page, `${label} full`);
      assert.deepEqual(decoded.card, preview.card, `${label}: no layout shift`);
      assert.deepEqual(decoded.text, preview.text, `${label}: no disclaimer shift`);
    }
  });
}
