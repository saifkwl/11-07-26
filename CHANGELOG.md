# CHANGELOG — CRO / AOV Optimization (branch `cro-update`)

Owner review before deploy. Prices are **real customer-facing amounts**.
Everything below is on branch `cro-update` — nothing is live until you merge to `main`.

## Pricing model

- Canonical per-product `variants[]` added; `price400`/`price800` kept as mirrors.
- **Greed ladder:** 400g rounded up to Rs. X49/X99; **800g = 1.8×400g** (~10% cheaper/gram, marked *Most Popular* + default); the **9 hero achars** add a **2kg Family Pack = 4×400g** (~20% cheaper/gram).
- Premium heroes (Garlic, Ginger) kept their higher base and laddered up — never cut.
- 800g never priced below its 400g; no price dropped below its previous 400g.

## Price changes (old → new)

| Product | 400g old→new | 800g old→new | 2kg (new) |
|---|---|---|---|
| **— Hero achars (with video, incl. 2kg Family Pack) —** | | | |
| Mix Achar 🎥 | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | Rs. 1,999 |
| Aam Ka Achar 🎥 | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | Rs. 1,999 |
| Lasooray Ka Achar 🎥 | Rs. 460 → Rs. 499 | Rs. 920 → Rs. 899 | Rs. 1,999 |
| Lehsan Ka Achar 🎥 | Rs. 700 → Rs. 749 | Rs. 1,400 → Rs. 1,349 | Rs. 2,999 |
| Adrak Ka Achar 🎥 | Rs. 800 → Rs. 849 | Rs. 1,600 → Rs. 1,549 | Rs. 3,399 |
| Lemon Ka Achar 🎥 | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | Rs. 1,999 |
| Pyaz Ka Achar 🎥 | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | Rs. 1,999 |
| Gajar Ka Achar 🎥 | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | Rs. 1,999 |
| Green Chutney 🎥 | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | Rs. 1,999 |
| **— All other products —** | | | |
| Chilli Achar (Oil) | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Mango Sweet & Sour Achar | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Mix Korma Achar | Rs. 500 → Rs. 549 | Rs. 1,000 → Rs. 999 | — |
| Mango Cut Achar (Oil) | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Dates Achar (Oil) | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Chana Achar (Vinegar) | Rs. 600 → Rs. 649 | Rs. 1,200 → Rs. 1,149 | — |
| Salad Achar (Vinegar) | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Stuffed Achar (Oil) | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Mix Vegetable Achar (Water) | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Garlic Achar (Vinegar) | Rs. 700 → Rs. 749 | Rs. 1,400 → Rs. 1,349 | — |
| Onion Cut Achar (Vinegar) | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Mango Achar (Vinegar) | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Mix Achar (Vinegar) | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Chilli Achar (Vinegar) | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Lemon Achar (Vinegar) | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Carrot Achar (Vinegar) | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Lemon Achar (Water) | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Karela Achar (Oil) | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Falsa Achar (Oil) | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Mango Chips Achar (Oil) | Rs. 500 → Rs. 549 | Rs. 1,000 → Rs. 999 | — |
| Chilli Cut Achar (Oil) | Rs. 500 → Rs. 549 | Rs. 1,000 → Rs. 999 | — |
| Chana Achar (Vinegar & Oil) | Rs. 600 → Rs. 649 | Rs. 1,200 → Rs. 1,149 | — |
| Chicken Achar (Oil) | Rs. 800 → Rs. 849 | Rs. 1,600 → Rs. 1,549 | — |
| Mango Cut Achar (Vinegar) | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Mango Cut Sweet & Sour Achar | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Palak Achar (Oil) | Rs. 480 → Rs. 499 | Rs. 960 → Rs. 899 | — |
| Aloo Bukhara Chutney | Rs. 1,000 → Rs. 1,049 | Rs. 2,000 → Rs. 1,899 | — |
| Mango Sweet & Sour Chutney | Rs. 700 → Rs. 749 | Rs. 1,400 → Rs. 1,349 | — |
| Aloo Bukhara Dry Fruit Chutney | Rs. 1,200 → Rs. 1,249 | Rs. 2,400 → Rs. 2,249 | — |
| Mango Sweet Chutney | Rs. 700 → Rs. 749 | Rs. 1,400 → Rs. 1,349 | — |
| Imli (Tamarind) Chutney | Rs. 700 → Rs. 749 | Rs. 1,400 → Rs. 1,349 | — |
| Mix Fruit Chutney | Rs. 700 → Rs. 749 | Rs. 1,400 → Rs. 1,349 | — |
| Dates Chutney | Rs. 700 → Rs. 749 | Rs. 1,400 → Rs. 1,349 | — |
| Mango Dry Fruit Chutney | Rs. 1,200 → Rs. 1,249 | Rs. 2,400 → Rs. 2,249 | — |
| Tomato Ketchup | — → — | — → — | — |
| Chilli Garlic Chutney | — → — | — → — | — |
| Mango Murabba | Rs. 700 → Rs. 749 | Rs. 1,400 → Rs. 1,349 | — |
| Amla Murabba | Rs. 700 → Rs. 749 | Rs. 1,400 → Rs. 1,349 | — |
| Harar Murabba | Rs. 700 → Rs. 749 | Rs. 1,400 → Rs. 1,349 | — |
| Quince (Behi) Murabba | Rs. 700 → Rs. 749 | Rs. 1,400 → Rs. 1,349 | — |
| Bael Giri Murabba | Rs. 700 → Rs. 749 | Rs. 1,400 → Rs. 1,349 | — |
| Karonda Murabba | Rs. 700 → Rs. 749 | Rs. 1,400 → Rs. 1,349 | — |
| Baans (Bamboo) Murabba | Rs. 1,400 → Rs. 1,449 | Rs. 2,800 → Rs. 2,599 | — |
| Apple Murabba | Rs. 700 → Rs. 749 | Rs. 1,400 → Rs. 1,349 | — |
| Carrot Murabba | Rs. 700 → Rs. 749 | Rs. 1,400 → Rs. 1,349 | — |
| Ginger Murabba | Rs. 1,600 → Rs. 1,649 | Rs. 3,200 → Rs. 2,949 | — |
| Pumpkin (Kaddu) Murabba | Rs. 700 → Rs. 749 | Rs. 1,400 → Rs. 1,349 | — |
| Ashrafi Murabba | Rs. 400 → Rs. 449 | Rs. 800 → Rs. 799 | — |
| Gulqand | Rs. 460 → Rs. 499 | Rs. 920 → Rs. 899 | — |
| Sarson Da Saag Achar | Rs. 560 → Rs. 599 | Rs. 1,120 → Rs. 1,099 | — |
| Moringa Achar | Rs. 650 → Rs. 699 | Rs. 1,300 → Rs. 1,249 | — |
| Larkana Bhei Achar (Lotus Root) | Rs. 560 → Rs. 599 | Rs. 1,120 → Rs. 1,099 | — |
| Amla Achar | Rs. 600 → Rs. 649 | Rs. 1,200 → Rs. 1,149 | — |
| Moringa Lahsan Achar | Rs. 650 → Rs. 699 | Rs. 1,300 → Rs. 1,249 | — |
| Hari Mirch Achar (Green Chilli) | Rs. 560 → Rs. 599 | Rs. 1,120 → Rs. 1,099 | — |
| Khubani Chutney (Apricot) | Rs. 840 → Rs. 849 | Rs. 1,680 → Rs. 1,549 | — |
| Cranberry Murabba (Karonda) | Rs. 560 → Rs. 599 | Rs. 1,120 → Rs. 1,099 | — |
| Bitter Gourd Murabba (Tuma) | Rs. 810 → Rs. 849 | Rs. 1,620 → Rs. 1,549 | — |
| Chia Seeds | Rs. 750 → Rs. 799 | Rs. 1,500 → Rs. 1,449 | — |
| Pumpkin Seeds | Rs. 900 → Rs. 949 | Rs. 1,800 → Rs. 1,699 | — |
| Sesame Seeds | Rs. 560 → Rs. 599 | Rs. 1,120 → Rs. 1,099 | — |
| Moringa Powder | Rs. 750 → Rs. 799 | Rs. 1,500 → Rs. 1,449 | — |
| Flax Seeds | Rs. 520 → Rs. 549 | Rs. 1,040 → Rs. 999 | — |

🎥 = hero product (has a real YouTube video; gets the 2kg Family Pack).

## Null-price products (shown as 'Price on WhatsApp')

- **Tomato Ketchup**, **Chilli Garlic Chutney** — no price set; render 'Price on WhatsApp', still sellable. Send prices to set them.

## Config changes (`js/products-data.js` → SITE_CONFIG)

- **Removed** `advanceDiscountPercent: 10` (flat % discount) everywhere.
- **Added** advance-payment tier table (`advanceTiers`):
  - COD: delivery Rs. 300, minimum order Rs. 1,500, no perks.
  - Advance < Rs. 1,800: delivery Rs. 200.
  - Advance ≥ Rs. 1,800: **FREE delivery + Rs. 100 off**.
  - Advance ≥ Rs. 2,500: **FREE delivery + FREE 400g achar** (customer picks).
- `freeDeliveryThreshold: 1800`, `advanceDeliveryCharge: 200`.
- `giftPicks` (free-jar options): Mix Achar, Aam Ka Achar, Lehsan Ka Achar, Green Chutney.
- **Bundle** `bundlePrice: 2499`, `bundleSize: 3`: *Koi bhi 3 × 800g = Rs. 2,499* — restricted to the 7 standard (Rs.899) heroes; **Garlic & Ginger excluded** so the flat bundle never loses margin. Saves Rs. 198 per trio, auto-applied in the cart.
- Locked microcopy glossary (`COPY`) — exact owner-approved strings used across buy-box, cart, WhatsApp, FAQ.

## Behaviour

- Cart defaults to **Advance** (always the better deal, no minimum); COD is one tap away and disables checkout below Rs. 1,500 with the locked warning.
- Free-delivery/free-jar **progress bar** + **gift picker** + **discounts** show on the Advance side only.
- 'Complete your dastarkhwan' upsell row; mobile **sticky buy bar**; trust strip (no fabricated counts).
- WhatsApp order message reflects the chosen method only, JazzCash/EasyPaisa advance note, free-gift line, bundle saving, and a free-delivery upsell line.

## Copy changes

- `price-list.html`: table gained a **2kg** column (heroes only, "—" for others); added a highlighted **Advance Payment tier explainer box**.
- `faq.html` (visible + baked schema, in sync): minimum-order answer now says COD needs Rs. 1,500 but Advance has no minimum; added a new "Advance payment kaise hoti hai?" Q&A (JazzCash/EasyPaisa + WhatsApp screenshot); "discount for advance" answer rewritten to the tier model; "what sizes" mentions the 2kg Family Pack.
- All stale "10% discount" copy corrected across `index.html`, `contact.html`, `faq.html`, `price-list.html` (5 spots) to the FREE-delivery/tier language.
- Per-product FAQ (JS + baked schema, `generate-product-pages.py`) rewritten to the tier model — visible accordion and static `FAQPage` schema stay byte-identical.

## Verification performed (this session)

- `node --check` on `js/main.js` and `js/products-data.js` after every change — always clean.
- `python tools/audit.py` + `python tools/link_audit.py` after every task — 0 broken links, 0 case mismatches, 0 new SEO issues (pre-existing `404.html`/`products/index.html` generator-index flags are unrelated to this work).
- `python -c "import json; json.load(...)"` — `products.json` valid after every edit.
- Browser-tested at 360–390px: buy-box (499/899-popular/1999 Family Pack), product cards, 2kg through the cart, all 4 advance tiers (499/1549/1999/2898 subtotals), gift picker, COD-disable-below-minimum, bundle builder (select/cap-at-3/add), progress bar tease + celebrate + COD-hide, sticky buy bar, price-list table + tier box.
- Edge cases: exactly-Rs.1,800 boundary is inclusive (`subtotal >= minSubtotal`); removing an item correctly **re-locks** a tier (tested 2,297 → remove item → 1,798, perks correctly disappear).
- Smoke-tested (console-clean): `index.html`, `products.html`, `price-list.html`, one hero product (Mix Achar), one non-hero product (Flax Seeds — confirms branded placeholder, no broken image), `blog.html`.

## Acceptance checklist

- [x] No product renders NaN/null price anywhere (2 null-price products → "Price on WhatsApp")
- [x] 800g is default & marked popular; bigger sizes show savings
- [x] Cart shows COD vs Advance comparison; advance always visibly cheaper
- [x] Progress bar unlocks at 1,800 and 2,500 correctly (boundary + re-lock verified)
- [x] WhatsApp message includes correct new totals, tier benefits, gift selection, bundle saving
- [x] All 72 product pages regenerate without errors; site verified at 360px width
- [x] Every price/tier number lives in `products.json` or `SITE_CONFIG` — zero hardcoded prices in HTML/JS
- [x] Progress bar / gift / discount appear on ADVANCE side only; COD side shows none of them
- [x] COD order button disables with the locked warning below Rs. 1,500; Advance button always active
- [x] All locked microcopy strings match the glossary exactly, everywhere they appear
- [x] Buy-box shows "Advance payment par delivery FREE 🎁" under the size selector
- [x] This CHANGELOG lists every old→new price (both sizes + 2kg) for owner review before deploy

## Follow-ups for owner

- Set prices for Tomato Ketchup & Chilli Garlic Chutney (or leave as WhatsApp-priced).
- Confirm the 4 estimated prices (flagged `priceNote` in products.json): Moringa Lahsan Achar, Hari Mirch Achar, Cranberry Murabba, Bitter Gourd Murabba.
- Decide whether Garlic/Ginger should ever be bundle-eligible (currently excluded to protect margin).
- Optional: a real "X,XXX+ families served" figure was intentionally left out of the trust strip (no fabricated numbers) — provide one if you'd like it added.

