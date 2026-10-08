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
