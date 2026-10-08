import { items, normalizeView, wrapIndex } from './items.js';

const main = document.querySelector('main');
const gallery = document.querySelector('.gallery');
const grid = document.querySelector('.grid');
const selected = document.querySelector('.selected-card');
const announcement = document.querySelector('#announcement');
const viewButtons = [...document.querySelectorAll('[data-view]')];
let index = 0;

function fillCard(card, item) {
  const img = card.querySelector('img');
  img.src = item.image;
  img.srcset = `/assets/${item.id}-768.webp 768w, ${item.image} ${item.width || 1536}w`;
  img.sizes = card.classList.contains('selected-card')
    ? '(max-width: 760px) calc(100vw - 84px), min(50vw, max(432px, calc((60vh - 176px) * 1.92)))'
    : '(max-width: 480px) calc(100vw - 68px), (max-width: 760px) 40vw, 26vw';
  img.alt = item.alt;
  img.width = item.width || 1536;
  img.height = item.height || 1024;
  img.style.objectFit = item.fit || 'cover';
  img.style.backgroundColor = item.background || 'transparent';
  card.querySelector('h2').textContent = item.title;
  const description = card.querySelector('p');
  description.textContent = item.description;
  description.hidden = !item.description;
  const link = card.querySelector('.item-link');
  link.hidden = !item.url;
  if (item.url) {
    link.href = item.url;
    link.setAttribute('aria-label', `Посмотреть в магазине: ${item.title}`);
  } else {
    link.removeAttribute('href');
    link.removeAttribute('aria-label');
  }
  card.setAttribute('aria-label', item.title);
}

for (const item of items) {
  const card = document.createElement('article');
  card.className = 'grid-card';
  // Only static structure is HTML; item content is assigned with textContent.
  card.innerHTML = '<img width="1536" height="1024" alt=""><div class="card-copy"><h2></h2><p></p><a class="item-link" target="_blank" rel="noopener noreferrer">ПОСМОТРЕТЬ В МАГАЗИНЕ <span aria-hidden="true">↗</span></a></div>';
  card.querySelector('img').loading = 'lazy';
  fillCard(card, item);
  grid.append(card);
}

function select(nextIndex, announce = true) {
  index = wrapIndex(nextIndex, items.length);
  fillCard(selected, items[index]);
  document.querySelector('.counter').textContent = `${index + 1}/${items.length}`;
  // Each item appears only once, even with fewer wishes than preview slots.
  const seen = new Set([index]);
  const neighbours = [-2, -1, 1, 2].map(offset => {
    const neighbour = wrapIndex(index + offset, items.length);
    if (seen.has(neighbour)) return null;
    seen.add(neighbour);
    return neighbour;
  });
  document.querySelectorAll('.preview').forEach((button, position) => {
    const neighbour = neighbours[position];
    button.hidden = neighbour === null;
    if (neighbour === null) return;
    const item = items[neighbour];
    const img = document.createElement('img');
    img.src = `/assets/${item.id}-192.webp`;
    img.alt = '';
    img.width = 192;
    img.height = 128;
    img.style.objectFit = item.fit || 'cover';
    img.style.backgroundColor = item.background || 'transparent';
    button.replaceChildren(img);
    button.setAttribute('aria-label', `Выбрать: ${item.title}`);
    button.onclick = () => select(neighbour);
  });
  if (announce) announcement.textContent = `${index + 1} из ${items.length}. ${items[index].title}`;
}

function setView(view) {
  view = normalizeView(view);
  main.dataset.mode = view;
  gallery.hidden = view !== 'gallery';
  grid.hidden = view === 'gallery';
  for (const button of viewButtons) button.setAttribute('aria-pressed', String(button.dataset.view === view));
  try { localStorage.setItem('wishlist-view', view); } catch { /* Rendering also works without storage. */ }
}

for (const button of viewButtons) button.addEventListener('click', () => setView(button.dataset.view));
for (const button of document.querySelectorAll('[data-direction]')) {
  button.addEventListener('click', () => select(index + Number(button.dataset.direction)));
}
gallery.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  select(index + (event.key === 'ArrowRight' ? 1 : -1));
});
let touchStart;
gallery.addEventListener('touchstart', (event) => {
  if (event.touches.length !== 1) { touchStart = undefined; return; }
  touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
}, { passive: true });
gallery.addEventListener('touchend', (event) => {
  if (!touchStart) return;
  const dx = event.changedTouches[0].clientX - touchStart.x;
  const dy = event.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) select(index + (dx < 0 ? 1 : -1));
  touchStart = undefined;
}, { passive: true });
gallery.addEventListener('touchcancel', () => { touchStart = undefined; }, { passive: true });

select(0, false);
try { setView(localStorage.getItem('wishlist-view') || 'gallery'); } catch { setView('gallery'); }
