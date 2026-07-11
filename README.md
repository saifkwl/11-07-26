# ShikarpuriAchar.pk

Original Shikarpuri Achar Since 1985 — production website. Plain HTML5, modern CSS and vanilla JavaScript. No frameworks, no build step. Built for Cloudflare Pages + GitHub.

## Architecture

Everything product-related (names, Urdu names, category, description, SEO title/description, prices, YouTube video link, WhatsApp message text, featured flag, status) lives in **one file**:

```
products.json
```

No product name, price or description is ever hardcoded in HTML/CSS/JS. The homepage featured grid, the products page (with category filters + search), the price list table, every product detail page, and "related products" are all rendered client-side from this one JSON file by `js/products-data.js` (data-access layer) and `js/main.js` (rendering).

```
/
├── index.html                 Home
├── products.html               All products + category filter + search (data-driven)
├── price-list.html             Price table (data-driven)
├── about.html                  Brand story
├── faq.html                    FAQs (with FAQPage schema)
├── contact.html                Contact form → WhatsApp
├── 404.html
├── products.json               ⭐ SINGLE SOURCE OF TRUTH for all product data
├── reviews.json                 Customer review data (placeholder — see below)
├── products/
│   └── <slug>.html             one thin shell per product — NO hardcoded content, just
│                                data-product-slug="<slug>"; everything else
│                                (title, meta tags, video, price, description,
│                                related products) is injected by main.js
├── css/style.css               Premium design system v2 (tokens, motifs, cards, pages)
├── js/
│   ├── products-data.js        Fetches products.json + reviews.json, exposes ProductsAPI / ReviewsAPI
│   └── main.js                 Nav, header, video facades, rendering, forms, reviews, footer links
├── assets/icons/favicon.svg
├── manifest.webmanifest
├── robots.txt
├── sitemap.xml
├── _headers                    Cloudflare Pages caching + security headers
└── _redirects
```

## Updating content (the only file you should need to touch)

Open `products.json`. Each product object supports:

| Field | Purpose |
|---|---|
| `slug` | URL segment — must match a file in `/products/<slug>.html` |
| `nameEn` / `nameUr` | English / Urdu product name |
| `category` | e.g. `"Achar"`, `"Chutney"` — powers category filter pills automatically |
| `shortDescription` | Used on cards |
| `description` | Used on the product detail page |
| `ingredients` | Array of strings, shown as a chip list on the detail page |
| `seoTitle` / `seoDescription` | Injected as `<title>` / meta description on that product's page |
| `metaKeywords` | Array, joined into `<meta name="keywords">` |
| `price400` / `price800` | Numbers in PKR. Leave `null` to show "Contact for Price" |
| `youtubeUrl` | Full YouTube/Shorts URL. Leave `""` for a "Video Coming Soon" placeholder |
| `whatsappProductName` | Name used inside the WhatsApp order message |
| `featured` | `true`/`false` — controls the homepage featured grid |
| `status` | `"active"` or e.g. `"coming-soon"` — non-active products show a badge and the CTA becomes "Notify Me" |

**Adding a new product:** add an object to `products.json`, then run `python tools/generate-product-pages.py` from the project root. It regenerates every `/products/<slug>.html` shell (with that product's SEO meta, Open Graph tags and JSON-LD baked in) and rebuilds `sitemap.xml`. Nothing else needs to change.

**Editing prices/videos:** edit the relevant field in `products.json`. Every page picks it up automatically on next load. Footer "Popular Pickles" links are also generated from this file — nothing to edit there.

**Updating social share images (Open Graph):** run `python tools/generate-og-images.py` from the project root any time you add a product or change a product's name. It regenerates `assets/og/og-default.png` (site-wide fallback) and one `assets/og/<slug>.png` per product — minimal branded typographic cards (product English name large and centered, category as a small mustard subtitle) built from `products.json` and the site's own color palette in Pillow, not fake product photography. English text only — no Urdu/Arabic is rendered in these images. Product pages already reference their own file automatically (baked in by `tools/generate-product-pages.py`); the 6 core pages (`index.html`, `about.html`, `faq.html`, `contact.html`, `products.html`, `price-list.html`) use `og-default.png`.

## Customer reviews

`reviews.json` holds genuine customer reviews (single source of truth — the homepage review cards **and** the `Review`/`AggregateRating` JSON-LD on `index.html` are both generated from this one file at runtime, so they can never drift out of sync). `city` is optional; leave it `""` if not provided by the customer rather than inventing one — the UI hides the city line gracefully when blank. Only add reviews here that are real and verifiable — the site intentionally emits `Review`/`AggregateRating` structured data because these are genuine, and that should only ever be true of real feedback.

## Local development

Product data is loaded via `fetch()`, which requires an HTTP server (it will not work by double-clicking the HTML files — browsers block `fetch` on `file://`). Run any static server from the project root, e.g.:

```
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploying

**Cloudflare Pages**
1. Push this folder to a GitHub repository.
2. In Cloudflare Pages: "Create a project" → connect the repo.
3. Build command: none. Output directory: `/` (root).
4. Deploy. `_headers` and `_redirects` are picked up automatically.

## Business configuration

Site-wide settings (WhatsApp number, delivery charges, minimum order, YouTube channel URL) live in `SITE_CONFIG` at the top of `js/products-data.js`.

## What's intentionally not included

- **No stock photos or AI-generated product images.** Every product uses a real YouTube video (click-to-load facade for performance). Until you add a real `youtubeUrl`, the site shows a clean "Video Coming Soon" placeholder instead of a fake photo.
- **No fabricated prices.** Prices ship as `null` ("Contact for Price") until you fill them in.
- **No fake product photography for social sharing either.** `og:image` on every page is a simple branded typographic card generated by `tools/generate-og-images.py` (see "Updating social share images" above), not an AI-generated pretend product photo. Swap in real photography later if you get it — just point the `og:image` tags at the new file.
