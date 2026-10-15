# Wishlist

The supplied portfolio screenshot and live `https://ks-design.art/` are the
visual references: white background, thin header divider, Manrope typography,
light-grey cards, small adjacent previews and simple outline arrow controls.

The 68px header restores the KS DESIGN wordmark and its gradient dot. Plain
WISHLIST text is centred geometrically and matches the original navigation:
Manrope, 12.48px, weight 600 and 0.14em letter spacing. Both font subsets are
hosted locally with their OFL licence; no third-party font request is needed.

There are two layouts: slider and square grid. Previously saved rectangular
layouts fall back to the slider. The selected desktop card is slightly larger
than the live portfolio size and is centred in the viewport in both axes.
Following the small size adjustment, its image frame uses
`max(432px, (60svh - 68px - 108px) * 1.92)` width, subject
to available horizontal space, with 44px side padding. There is no section
heading or language switcher.

The square grid has three equal columns on desktop, two below 760px and one
below 480px. Short windows reduce card width. All image frames have fixed
dimensions within a given layout and viewport. The portrait kimono and pouch
photos fit inside their frames so the objects remain visible in full.

The four wishes are rose petal jam, hydrogel eye patches, a crane kimono in
size M and a velvet pouch. Only the kimono has a shop link. It preserves the
requested variant and removes the shop's tracking parameters. The pouch copy
uses the term “витой шнур с кистями” and specifies thread embroidery with moon,
star or other mystical motifs; its attached photo is a shape reference.

## Photo preparation

The built-in imagegen tool adapted the two supplied photographs. The final
photos are stored as responsive WebP variants in `site/assets/`:

- `rose-jam-1536.webp`, `rose-jam-768.webp`, `rose-jam-192.webp`
- `hydrogel-patches-1536.webp`, `hydrogel-patches-768.webp`, `hydrogel-patches-192.webp`

Prompt for each photo (the subject varies as specified below):

```text
Use case: precise-object-edit. Asset type: wishlist product photograph.
Input image: edit target. Only rotate the attached photograph 90 degrees
clockwise and crop it into a landscape 3:2 photograph, framing the SUBJECT
centrally. Keep the photographic scene, exact objects, texture, lighting and
colors unchanged. No added objects, labels, graphics, borders or retouching.
The central subject must also remain recognizable if this landscape image is
center-cropped to a square. Return one photograph.
```

Subjects:

- rose petal jam on a cream ceramic plate with a gold spoon on pink fabric
- green shimmering hydrogel eye patches in a round open jar in turquoise water

WebP encoding and smaller delivery variants preserve those resulting frames.

The kimono photograph comes directly from the product page supplied by the
user. The pouch photograph comes from the new attachment. These two photos
were only encoded and resized for delivery; their compositions are preserved.

## Validation

`npm run preflight` builds the site, checks the browser JavaScript, verifies
carousel wrapping and the real built resources, runs harness regression tests
and checks delivery against `docs/delivery-baseline.json`.

The delivery baseline uses the repository's deterministic slow-4G model,
rather than a browser stopwatch. After the requested update it changes from
1000ms first paint / 1008ms full load to 1066ms / 1271ms. The increase pays for
the exact locally hosted Manrope font subsets (39,120 bytes total), two new
visible neighbour thumbnails, and the added item/link logic. Hidden grid
photos still load lazily. The new baseline records this deliberate design
change without loosening the tolerance or changing the measurement script.

Initial Chrome visual and interaction QA on 2026-10-08 (before the revision):

- Default 1512×770: both carousel arrows and the neighbour preview work;
  the selected card is centred below the header. Rectangular and square
  grids have three equal column slots, with two populated cards.
- Square images measured about 364×364 pixels in both populated columns.
- Reloading preserves the chosen grid mode; switching back restores the
  carousel without losing navigation controls.
- 390×844: one grid column, readable text, no horizontal overflow. The
  carousel fits the screen; keyboard navigation selects the second wish.
- 844×390: the selected card fits vertically, the square grid reduces its
  image frames to about 153×153 pixels, and no horizontal overflow occurs.
- 768×1024: three smaller grid columns and no horizontal overflow. At widths
  of 760 pixels or below the grid switches to two columns, then one at 480.
- The temporary viewport override was reset and the Chrome tab was left
  open on the initial carousel view for the user's review.

Chrome visual and interaction QA after the four-item revision on 2026-10-08
(before the final small size adjustment):

- At the normal 1512×714 viewport the header is 68px tall. WISHLIST is
  horizontally centred at x=756; its Manrope weight, size and spacing match
  the reference navigation. The logo is restored on the left.
- The carousel card measures 536.71×444.40px, matching the live reference.
  Its centre is (756,357), the exact centre of the viewport. Three distinct
  neighbour previews appear for the four wishes.
- Both layout buttons work. The desktop square grid has three columns;
  700×900 has two, and 390×844 has one with 318×318px image frames.
- At 844×390 the square frames measure about 153×153px and keep three
  columns. None of the checked viewports has horizontal overflow.
- Selecting the kimono shows the complete garment, size M and the correct
  variant link. Selecting the pouch hides and clears the previous link and
  shows the requested cord, tassel and embroidery description.
- Chrome reports no console errors. The viewport override was reset and
  the local tab was left open on the kimono carousel card for review.
- Preflight passes 32 harness tests, four application tests, the real build,
  JavaScript syntax validation and the delivery budget. Synthetic harness
  fixtures clear the copied build output before creating their own files,
  keeping their regression checks independent of application assets.

Final small size adjustment on 2026-10-08: the desktop image frame grows by
8%, while the selected card grows from 536.71×444.40px to 572.60×464.59px at
1512×714. Chrome confirms its centre remains (756,357) and the page has no
horizontal overflow. Mobile and short-window size overrides are preserved.
Responsive image hints match the new frame width. Preflight passes against
the existing delivery baseline.

## Telegram wishlist update — 2026-10-13

The original four wishes remain. Sixteen wishes from the user's Telegram
wishlist were added with their source photographs; the requested treatment
and duplicate velvet pouch were skipped. The photo without a caption became
“Голубые мюли”. Product amounts and the Mesmerize shade are preserved, and the
mug says “Продаётся в New Garden.” A footer in both layouts carries the user's
note about choosing ideas according to one's wishes and possibilities.

Imported photographs retain their composition inside the existing frames.
Local WebP variants use 1536px and 768px widths, with smaller 192px previews.
Thumbnail quality is reduced to keep the initial delivery within the existing
baseline tolerance. The baseline and validation policy remain unchanged:
first paint is 1070ms and full load is 1275ms, compared with 1066ms / 1271ms.

Chrome QA at its normal desktop viewport confirms:

- Both layouts show the expanded list of 20 cards.
- Selecting the mug through a neighbour preview shows its photograph and
  New Garden note; navigation wraps from the first wish to the twentieth.
- The bottom of the grid shows the mug note and complete footer text.
- Reload preserves square-grid mode; there is no horizontal overflow,
  missing image in the visible final row, or console error.
- The local preview remains open in Chrome for the user's review.

`npm run preflight` passes all 32 harness, four site and eight production
checks, the build, JavaScript/shell syntax checks and delivery comparison.

### Footer fitting in carousel mode

The header, main content and footer share a flex-column page with a minimum
height of one viewport. The carousel no longer reserves a full viewport before
the footer. Its card is centred in the remaining space, with previews aligned
to the image. Short wide screens use an image/text split; short narrow screens
use tighter spacing and a shorter image frame. The footer and text retain their
natural height, so extreme zoom or unusually small windows can still scroll
rather than clipping content. Responsive image hints match the short wide card.

Chrome QA checked every wish at 1512×770, 1366×768, 1024×600, 844×390,
390×844, 390×667 and 360×640: all 140 cases showed the complete disclaimer
within the viewport, with no vertical or horizontal page overflow. The square
grid retains its scrolling list and footer below the final row.

Codex review identified a missing compact-layout range at 1024×640. Chrome
confirmed a 658px page in a 640px viewport. The wide short-screen breakpoint
now includes heights up to 680px, and both initial and dynamic image hints
use that same threshold. Another 120 slide/viewport cases pass at 1024×601,
1024×640, 1024×680, 1024×681, 390×761 and 360×761, including both sides of the
layout breakpoints.

## Wishlist copy revision — 2026-10-14

The visible WISHLIST label is removed; the page retains a Russian heading for
screen readers. The header uses two columns for the brand and view controls.
The footer now reads: “Здесь вообще все мои безумные идеи :) Но можно выбрать
что-то на подарок :)”.

The Torres excursion is the heading and San Valentine tasting the description.
MANYO and its responsive assets are removed. The concert, slippers (size 39),
Montenegro, patches, caviar and India copy follow the user's corrections. K18's
amount and authenticity are part of its bold heading. Rose jam and K18 link to
the supplied Mercado Libre products. Italy replaces MANYO in the total of 20
wishes, using the user's Venice attachment, resized and encoded as local WebP.

The built-in imagegen tool removed the Taj Mahal photo's black top border;
its output is encoded in the existing `taj-mahal-{1536,768,192}.webp` assets.
The final prompt was:

> Remove only the thin black horizontal strip at the very top by cropping away
> the top strip. Preserve the exact original photograph, Taj Mahal architecture,
> sunset color, crescent moon, lights, reflections, composition and all remaining
> pixels as closely as possible. Do not retouch, recreate, add detail or change
> anything else. Output the same portrait photograph with no black top border.

Chrome QA confirms the desktop carousel and three-column grid, the one-column
390px grid, all 20 titles/descriptions and the three shop links. K18's complete
heading has weight 800. All 60 carousel cases at 390×844, 360×640 and 844×390
fit the card and footer without horizontal or vertical overflow. Italy and K18
were inspected in the grid, and Italy in the carousel. No console warnings or
errors were captured. The viewport override was reset.

Preflight passes 32 harness, six site and eight production tests, build and
syntax checks. Delivery is 1071ms first paint and 1277ms full load, within the
unchanged 1066ms / 1271ms baseline tolerance.

## KAWS UNIVERSE × UNIQLO set — 2026-10-14

The twenty-first wish is “Набор брелоков KAWS UNIVERSE × UNIQLO”, with the
product name “Bag Charm Set of 3” and the Sun, Earth and Moon in its description.
Its shop link points to the user's exact
[StockX listing](https://stockx.com/kaws-universe-x-uniqlo-bag-charm-set-of-3-yellow-blue-light-green).

The listing's product photograph was processed with the built-in imagegen
tool to remove the white background and prepare a transparent 3:2 cutout.
The delivered assets are `site/assets/kaws-universe-set-1536.webp` (1536×1024),
`site/assets/kaws-universe-set-768.webp` (768×512), and
`site/assets/kaws-universe-set-192.webp` (192×128). The card uses `contain`
against the existing `#f2f2f3` background so all three charms remain visible.
WebP exports clear RGB data in fully transparent pixels and preserve it with
the encoder's `exact` option. This prevents hidden colour bands when a viewer
ignores alpha; the 1536px export's alpha mask matches the imagegen PNG exactly.

Exact image-edit prompt:

> Use case: background-extraction. Asset type: exact product photograph for a personal wishlist square grid and landscape carousel. Input image: edit target, a StockX photograph of the KAWS UNIVERSE x UNIQLO Bag Charm Set of 3. Remove only the white background and excess white canvas. Preserve the exact three photographed plush charms, their original shapes, fuzzy fabric, embroidery, blue/green Earth pattern, yellow Sun rays, pale mint Moon craters, black XX eyes, small mouths, dangling arms and legs, colored fabric straps and metallic key rings. Keep their original left-to-right order: Sun, Earth, Moon, standing side by side and not overlapping. All three key rings and limbs must remain fully inside the canvas. Frame the trio centrally on a transparent landscape 3:2 canvas, with about 7 percent empty padding around the whole group, optimized to fit entirely in a square card with object-fit contain. Do not add, redraw, restyle, recolor or change any product details. No text, labels, shadows, reflections, scenery, borders or watermark. Return one clean transparent cutout.

In-app browser QA confirms complete cutouts, readable titles and the exact
StockX link in the carousel and square grid at 1280×720 and 390×844. The
desktop grid's image frame is 310.84×310.84px. Carousel QA at 844×390 and
390×667 also confirms that the card and footer fit without page overflow.
There are no console errors; the temporary viewport override was reset.

`npm run preflight` passes 32 harness, six site and eight production tests,
the build and syntax checks. Delivery measures 1072ms first paint and 1278ms
full load against the unchanged 1066ms / 1271ms baseline.

## Carousel loading and copy revision — 2026-10-15

Rare Beauty now specifies “Оттенок Mesmerize (сухой в пудре)” and links to the
user's Mercado Libre listing. Janssen's 200 мл is in its heading, the mug is
“Такая кружка с блюдцем”, and lower captions have no full stops.

Previously, every selection replaced the visible image with an undecoded
image, leaving an empty frame during network loading. Cloning also retained
the previous responsive attributes before assigning the next sources. The
carousel now shows the selected wish's 192px preview while its responsive
photo loads and decodes. A selection token prevents older completions from
changing the latest slide. A failed full photo leaves its preview visible and
can retry on a later visit. Only the current and two adjacent photo elements
are cached; distant pending requests are released. Adjacent photos preload
at low priority after the selected photo finishes. Grid photos remain lazy.

Twenty-seven larger WebP assets were re-encoded with cwebp 1.6.0, quality 72,
method 6, retaining their dimensions and composition. Their combined size
falls from 4,739,918 to 3,796,980 bytes (19.9%). Italy's largest image falls
from 404,904 to 279,350 bytes. Initial HTML previews and counter now match the
21-item list, including KAWS. This corrects the initially stale neighbour
requests; delivery remains within the unchanged baseline tolerance.

Chrome QA on 2026-10-15:

- A temporary local server delayed full photos by 1.5 seconds. All 42 rapid
  forward selections showed a loaded image; 18 used the correct preview
  while the full photo was pending. There were no blank frames.
- All 105 carousel cases at 1512×770, 390×844, 360×640, 844×390 and 1024×640
  showed a loaded image and the full footer without page overflow.
- The grid and carousel show the revised captions and Rare Beauty link.
  No console warnings or errors were captured; viewport overrides were reset.
- Nine site tests cover delayed/out-of-order decoding, fast navigation,
  neighbour reuse, pending cancellation, failure/retry and navigation paths.
  Preflight also passes 32 harness and eight production tests plus syntax,
  build, repository and delivery checks. Delivery is 1112ms first paint and
  1321ms full load against the unchanged 1066ms / 1271ms baseline.

## Carousel browser regressions — 2026-10-15

The Node test runner now also drives a real Chromium headless browser through
the locked Playwright library. No second test runner, application framework,
external test service or production dependency is introduced. CI installs only
the headless Chromium shell and runs the suite as part of preflight.

Nine browser tests cover a cold first visit with 100ms resource latency and
indefinitely held full photos; both orders of late adjacent photo responses;
two fast laps through all wishes followed by reversal and keyboard navigation;
and all 21 wishes at 1512×770, 390×844, 360×640, 844×390 and 1024×640.
Network routing disables the HTTP cache and each case uses fresh storage.
Assertions check a loaded image belonging to the selected wish together with
its title, description, alt text, counter and shop link. The 105 slide/viewport
cases check both preview and full-photo states: the card, image, arrows and
complete disclaimer fit inside the screen, do not overlap or scroll, and do
not shift when the photo decodes. Fonts finish loading before comparing geometry.

The cold-load test exposed a real remaining bug in `48d3fe6`: the initial HTML
image requested only the full photo and the first selection reused it, so its
frame stayed blank until that response arrived. The test failed while the full
response was held. The HTML now starts with the same small preview used for
later wishes; the full photo loads separately and replaces it after decoding.
The unchanged test passes. Existing failure/retry checks also pass.

As a separate sensitivity check, temporarily removing the stale-selection guard
made both out-of-order browser tests fail. Restoring the guard made both pass.
These probes used real network responses and native image decoding; the
deliberately broken code is not committed. Screenshots were visually inspected
at 1512×770, 390×844 and 360×640 using the long KAWS card and its shop link;
the full disclaimer remained visible and page dimensions matched the viewport.

Preflight passes 32 harness, nine site, nine browser and eight production tests,
plus build, syntax and delivery checks. The deterministic delivery model reports
942ms first paint and 1151ms full load against the unchanged 1066ms / 1271ms
baseline. It now counts the initial small preview in HTML; it does not measure
the subsequent JavaScript-requested full photo, which the browser suite checks
separately. No baseline or tolerance was changed.
