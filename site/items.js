export const items = [
  {
    id: 'rose-jam',
    title: 'Варенье из лепестков роз',
    description: '',
    image: '/assets/rose-jam-1536.webp',
    alt: 'Варенье из лепестков роз на керамической тарелке с золотистой ложкой',
  },
  {
    id: 'hydrogel-patches',
    title: 'Гидрогелевые патчи',
    description: 'Мои любимые — Faberlic Oceanum, но можно и другие.',
    image: '/assets/hydrogel-patches-1536.webp',
    alt: 'Зелёные гидрогелевые патчи в открытой баночке среди бирюзовой воды',
  },
  {
    id: 'crane-kimono',
    title: 'Кимоно с журавлями',
    description: 'Размер M.',
    image: '/assets/crane-kimono-1536.webp',
    width: 1536,
    height: 2048,
    fit: 'contain',
    background: '#c5b89e',
    alt: 'Розовое кимоно с вышитыми журавлями и оранжевой окантовкой',
    url: 'https://www.homeokat.com/products/japanese-cranes-sea-waves-embroidered-linen-kimono-cardigandd7e710a-53d0-4777-80b4-120b18df156e-0x9y-6jxf-st6m-hzw7-tn1t-p1zf-66eu-ysrb-qk92-nmnu-jq4r-imec-a8de-ycb8-kj5l-f1qo-xl1y-xlq0-se5k-4wl3-6nlt-ihna-wzlw-9y5b-zlfr-y6vd-7byj-xxq5-4bqn-gz7m-xj4a-lgqg?variant=c552ba2c-10b2-4525-be7e-bbda1d341c6f',
  },
  {
    id: 'velvet-pouch',
    title: 'Бархатная сумочка-мешочек',
    description: 'На цепочке или витом шнуре с кистями. Вышивка нитками: луна, звёзды или другие мистические мотивы.',
    image: '/assets/velvet-pouch-1200.webp',
    width: 1200,
    height: 1503,
    fit: 'contain',
    background: '#d1b797',
    alt: 'Бордовая бархатная сумочка-мешочек с вышивкой, цепочкой и витым шнуром с кистями',
  },
];

export const views = ['gallery', 'square'];
export const normalizeView = view => views.includes(view) ? view : 'gallery';
export const wrapIndex = (index, length) => ((index % length) + length) % length;
