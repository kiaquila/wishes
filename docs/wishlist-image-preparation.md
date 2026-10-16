# Wishlist image preparation — 2026-10-15

All delivered images use a 3:2 canvas: 1536×1024, 768×512 and 192×128.
The pouch retains its existing 1200px filename and uses 1200×800 at full size.
Edited images were exported as WebP, quality 72, method 6; previews use quality
45. No images are stretched. Existing rose jam, patches, Italy and KAWS assets
already had the target ratio and are unchanged.

## Sources and shop selection

- **Hooded cape:** the user's attached photograph. “Накидка с капюшоном”
  describes the long, open-front hooded garment without assigning an unverified
  brand or product model. The caption says “Такая”, matching the slippers.
- **Davines:** the requested [Gold Apple product](https://goldapple.ru/28140500001-soly)
  is SOLU Sea Salt Scrub Cleanser, 250 ml. The photo comes from the
  [Care to Beauty packshot](https://www.caretobeauty.com/media/catalog/product/d/a/davines-solu-sea-salt-scrub-cleanser-250ml-1.jpg).
  Its [Argentina product page](https://www.caretobeauty.com/ar/en/davines-solu-sea-salt-scrub-cleanser-250ml/)
  reported in-stock availability at USD 38.17 on October 15. Its product data
  identifies EAN 8004608276944 and delivery eligibility for AR. This is an
  international retailer shipping to Argentina; shipping and import charges
  are additional and depend on checkout. The price is not a guaranteed lowest
  delivered total. The matching [Mercado Libre catalogue page](https://www.mercadolibre.com.ar/limpiador-davines-solu-exfoliante-de-sal-marina-para-cabell/p/MLA2068339112)
  was unavailable, while indexed import offers were substantially more expensive.
- **K18:** the old photo showed 50 ml although the wish specifies 150 ml.
  The replacement comes from the [official 150 ml product page](https://www.k18hairpro.com/products/professional-molecular-repair-mask-150-ml)
  ([packshot](https://www.k18hairpro.com/cdn/shop/files/Mask_Hero.jpg?v=1772141351&width=1600)).
- **Waterfall:** a generic experience photo was replaced with a
  [forest waterfall and natural pool from Unsplash](https://images.unsplash.com/photo-1620658927695-c33df6fb8130?w=1800&q=85&fit=max).
- Other edited photos use the existing wishlist assets as references.

## Imagegen editing and quality control

The built-in imagegen tool extended backgrounds, preserving the reference
subjects and checking the outputs visually before WebP export. Cropping alone
was used for Montenegro and Torres (4:3 to 3:2), and for the Davines packshot's
empty white margins. No product was replaced with a generated lookalike.

The first cape output made the garment too small. A second pass removed excess
sky/foreground and enlarged the original subject before extending the sides;
the hood, beaded fabric and complete hem remain visible. All final assets were
compared in a contact sheet, then reviewed in Chrome's grid and carousel.
Product sizes, complete silhouettes, kimono sleeves, pouch tassels, slipper
bows, album text and the three KAWS charms were checked visually.

Shared first-pass prompt (cape, kimono, pouch, slippers, Rare Beauty, Janssen),
with the bracketed subject constraint expanded for each reference:

> Use case: precise-object-edit. Edit target: the attached original wishlist photo. Outpaint this photo horizontally into a landscape 3:2 photograph, 1536x1024 composition. Preserve [the complete reference subject and its original background]. Keep original subject unchanged, proportions, details, position within original image, colours, lighting and photographic grain. Fit the complete original subject at a comfortable large scale with modest breathing room above and below. Generate coherent natural background to the left and right to fill the landscape canvas seamlessly. No borders, no bars, no mirror or blur fill, no duplicates, no added decorations, no new text. Keep all existing text and product details exact. Output ONE final 3:2 landscape photo.

For the kimono, preserve both sleeves, hem, hanger, embroidered cranes and
orange trim. For the pouch, preserve the chain, tassels and embroidery and
remove the captured scrollbar at the right edge. For the slippers, preserve
both shoes, toes, heels and bows. For Rare Beauty, preserve the complete open
compact and lid. For Janssen, preserve the full bottle and 200 ml label.

Shared second-batch prompt (turtles, caviar, cliff restaurant, mountain
restaurant, mug, New York, Taj Mahal and Yatao), with a subject-specific clause:

> Use case: precise-object-edit. Edit target: attached original photo. Outpaint into ONE seamless landscape 3:2 image (1536x1024 composition). Preserve [the original subject, its distinctive details and matching background]. Keep original subject identity, geometry, materials, texture, colour and lighting. Preserve all important original details without cropping. The main subject should fill about 78–88% of the image height, with tasteful breathing room, without stretching or distortion. Generate a coherent continuation of the ORIGINAL background to the sides. No borders, blur fill, mirror fill, seam, duplicates, decorations, added text. Exact existing product text stays unchanged.

Subject clauses retain all turtles and flippers, caviar/plate/spoon/toast,
restaurant cliff/sea/person, mountain tables/glacier, mug/saucer/shelf,
Manhattan Bridge/buildings, and the Taj Mahal/moon/reflection respectively.
Yatao retains the square album artwork and MANA/YATAO text, extending only its
white surround.

Exact final cape prompt:

> Use case: precise-object-edit. Edit target: attached original photograph. Produce one 1536x1024 LANDSCAPE 3:2 photograph by extending the existing background horizontally. Crop away most of the empty sky above and excessive foreground below, so the original woman and exact beaded hooded ivory cape fill 80 percent of canvas height from hood to feet. Keep her original face/profile, pose, both feet, cape texture, bead arrangement and full hem unchanged. Extend ONLY sea, pale sky and layered rocks horizontally. Straight horizon, same soft photographic grain. The cape must be large enough to show its beadwork clearly. Preserve subject identity, exact geometry, colours and lighting. No stretching, no blur or mirror padding, no borders, no duplicates or decorations.

Exact K18 prompt:

> Use case: precise-object-edit. Edit target: attached original photograph. Produce one 1536x1024 LANDSCAPE 3:2 photograph by extending the existing background horizontally. Keep the exact entire white K18 professional molecular repair hair mask 150 ml bottle and its shadow unchanged, including all original brand label text and the original 150 ml / 5 fl oz liq amount. Fill 82 percent of the image height with the bottle, with breathing room. Extend ONLY the same coral red plain wall and surface to left and right. Do not change or invent any label text. Preserve subject identity, exact geometry, colours and lighting. No stretching, no blur or mirror padding, no borders, no duplicates or decorations.

Exact waterfall prompt:

> Use case: precise-object-edit. Edit target: attached original photograph. Produce one 1536x1024 LANDSCAPE 3:2 photograph by extending the existing background horizontally. Preserve the original complete waterfall from its source at top to its plunge into the turquoise natural pool. Extend ONLY the same lush green forest, rock cliff and clear blue-green pool to the left and right. Keep water and rock texture photographic and natural. No people or added features. Preserve subject identity, exact geometry, colours and lighting. No stretching, no blur or mirror padding, no borders, no duplicates or decorations.

## K18 neutral background — 2026-10-16

At the user's request, the built-in imagegen tool replaced K18's coral backdrop
with light warm gray / greige. The existing wishlist photo was the edit target.
The complete 150 ml bottle, label, framing and soft rightward shadow were
checked visually before exporting all three responsive WebP sizes using the
same settings above. The image alt text now describes the neutral background.
The existing Janssen card also links to the user's exact
[IDN Cosmetics product URL](https://idn-cosmetics.com/en/janssen-cosmetics-oily-skin-purifying-cleansing-gel).

Exact background-edit prompt:

> Use case: precise-object-edit. Asset type: wishlist product photo. Input image: edit target, the existing 1536x1024 K18 photo. Replace ONLY the saturated coral-red background and ground surface with a quiet very light neutral warm gray / soft greige seamless studio background. Preserve the complete exact original white K18 professional molecular repair hair mask 150 ml bottle: identical silhouette, position, scale, cap, proportions, all original black and coral label printing and exact text including 150 ml / 5 fl oz liq. Preserve the direction and soft shape of its cast shadow on the neutral ground. Maintain the 3:2 landscape 1536x1024 composition and the bottle occupying approximately 82 percent of image height. Keep product photographic and unchanged; no new objects, no added typography, no border, no crop, no decorations, no colorful tint. Change only the background to light neutral gray-beige.
