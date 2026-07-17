# -*- coding: utf-8 -*-
"""
ShikarpuriAchar.pk — Product page + sitemap generator
------------------------------------------------------
Reads products.json (the single source of truth) and generates:
  1. /products/<slug>.html for EVERY product — a thin dynamic shell with
     the product's SEO meta (title, description, keywords, Open Graph,
     canonical, JSON-LD Product schema) baked in for crawlers. All visible
     content is still rendered client-side by main.js from products.json,
     so nothing is duplicated: prices, videos, names live in ONE place.
  2. sitemap.xml covering all core pages + every product page.

Run from the project root:
    python tools/generate-product-pages.py

Re-run whenever you add/remove a product in products.json.
"""
import io
import json
import os
import re
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_URL = "https://shikarpuriachar.pk"


def esc(s):
    """Escape for use inside an HTML attribute/text."""
    return (
        str(s or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def build_jsonld(p):
    data = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": p["nameEn"],
        "alternateName": p["nameUr"],
        "description": p.get("shortDescription") or p.get("seoDescription", ""),
        "category": p["category"],
        "sku": p["id"],
        "url": f"{BASE_URL}/products/{p['slug']}.html",
        "image": f"{BASE_URL}/assets/og/{p['slug']}.png",
        "brand": {"@type": "Brand", "name": "ShikarpuriAchar.pk"},
    }
    offers = []
    availability = (
        "https://schema.org/InStock"
        if p.get("status") == "active"
        else "https://schema.org/PreOrder"
    )
    for size, key in (("400g", "price400"), ("800g", "price800")):
        if p.get(key):
            offers.append(
                {
                    "@type": "Offer",
                    "name": size,
                    "price": p[key],
                    "priceCurrency": "PKR",
                    "availability": availability,
                }
            )
    if offers:
        data["offers"] = offers
    return json.dumps(data, ensure_ascii=False)


def extract_youtube_id(url):
    """Mirror of extractYouTubeId() in js/products-data.js — keep both in sync."""
    if not url:
        return None
    patterns = [
        r"youtube\.com/shorts/([a-zA-Z0-9_-]{6,})",
        r"youtube\.com/watch\?v=([a-zA-Z0-9_-]{6,})",
        r"youtube(?:-nocookie)?\.com/embed/([a-zA-Z0-9_-]{6,})",
        r"youtu\.be/([a-zA-Z0-9_-]{6,})",
    ]
    for pat in patterns:
        m = re.search(pat, url)
        if m:
            return m.group(1)
    return None


def build_video_jsonld(p):
    """VideoObject schema for the product's YouTube Short, baked server-side so
    Google can discover it without running JS. Returns '' if no video."""
    yt_id = extract_youtube_id(p.get("youtubeUrl") or "")
    if not yt_id:
        return ""
    data = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": f"{p['nameEn']} — ShikarpuriAchar.pk",
        "description": p.get("shortDescription") or p.get("seoDescription", ""),
        "thumbnailUrl": [
            f"https://i.ytimg.com/vi/{yt_id}/maxresdefault.jpg",
            f"https://i.ytimg.com/vi/{yt_id}/hqdefault.jpg",
        ],
        "uploadDate": p.get("videoUploadDate") or "2026-01-01",
        "embedUrl": f"https://www.youtube-nocookie.com/embed/{yt_id}",
        "contentUrl": f"https://www.youtube.com/watch?v={yt_id}",
        "publisher": {
            "@type": "Organization",
            "name": "ShikarpuriAchar.pk",
            "logo": {"@type": "ImageObject", "url": f"{BASE_URL}/assets/icons/favicon.svg"},
        },
    }
    return json.dumps(data, ensure_ascii=False)


def load_site_config():
    """Extract the numeric config values from js/products-data.js's SITE_CONFIG
    so the FAQ answers baked into static HTML never drift from the live JS
    values (single source of truth stays SITE_CONFIG, not a Python copy)."""
    with io.open(os.path.join(ROOT, "js", "products-data.js"), encoding="utf-8") as f:
        js = f.read()
    cfg = {}
    for key in ("advanceDiscountPercent", "deliveryCharge", "minProductOrder", "minCodOrder"):
        m = re.search(rf"{key}\s*:\s*([\d.]+)", js)
        cfg[key] = m.group(1) if m else "0"
    return cfg


def spice_level_info(p):
    name = p["nameEn"].lower()
    cat = p["category"].lower()
    if "super food" in cat:
        return f"{p['nameEn']} is not a spice — it's a plain, mild everyday superfood you can add to your own recipes."
    if "murabba" in cat or "gulqand" in name or "ketchup" in name or ("sweet" in name and "sour" not in name):
        return f"{p['nameEn']} is not spicy — it's a sweet preparation the whole family can enjoy."
    if "chilli" in name or "chili" in name:
        return f"{p['nameEn']} is on the spicier side — made for people who love real heat. If you prefer milder flavours, try one of our murabba or sweet chutneys."
    if "sweet & sour" in name or "sweet and sour" in name:
        return f"{p['nameEn']} is mild — the sweetness balances the spice, making it family-friendly."
    return f"{p['nameEn']} has a balanced, traditional medium spice level — flavourful without being overwhelming."


def shelf_life_info(p):
    cat = p["category"].lower()
    if "super food" in cat:
        return "Several months when stored in a cool, dry, airtight container — check the pack for the exact best-before date."
    if "murabba" in cat:
        return "Several months in cool, dry storage — murabba is a traditional sugar preserve and keeps very well."
    if "chutney" in cat:
        return "Best enjoyed within 2–3 months of opening when kept refrigerated with a dry spoon."
    if "vinegar" in cat:
        return "Several months sealed; once opened, keep refrigerated and it stays fresh for a long time."
    return "Traditional oil pickles keep for many months at room temperature — the flavour actually matures and improves with time."


def storage_info(p):
    cat = p["category"].lower()
    if "super food" in cat:
        return "Store in a cool, dry, airtight container away from direct sunlight and moisture. No refrigeration needed."
    if "murabba" in cat:
        return "Store in a cool, dry place away from direct sunlight and always use a clean, dry spoon. Refrigeration is optional but helps in hot weather."
    if "chutney" in cat:
        return "Keep the jar tightly closed and refrigerate after opening. Always use a clean, dry spoon to keep it fresh longer."
    if "vinegar" in cat:
        return "Store in a cool, dry place away from sunlight. After opening, refrigeration is recommended for the best taste. Always use a dry spoon."
    return "No refrigeration needed — mustard oil is a natural preservative. Keep the jar tightly closed in a cool, dry place, keep the pieces submerged in oil, and always use a dry spoon."


def build_faq_jsonld(p, cfg):
    """Mirrors productFaqs() in js/main.js exactly, so the static schema and
    the live accordion text can never drift apart."""
    if p.get("price400"):
        price_text = (
            f"The 400g jar is Rs. {int(p['price400']):,} and the 800g jar is Rs. {int(p['price800']):,}."
        )
    else:
        price_text = "Message us on WhatsApp for the current price."

    faqs = [
        {"q": f"How spicy is {p['nameEn']}?", "a": spice_level_info(p)},
        {"q": f"How long does {p['nameEn']} last?", "a": shelf_life_info(p)},
        {"q": "Does it need refrigeration?", "a": storage_info(p)},
        {
            "q": "Is delivery available across Pakistan?",
            "a": f"Yes — we deliver {p['nameEn']} nationwide. Delivery charges are Rs. {cfg['deliveryCharge']}, "
                 f"minimum product order Rs. {cfg['minProductOrder']}, and Cash on Delivery is available on orders "
                 f"of Rs. {cfg['minCodOrder']} or more.",
        },
        {
            "q": "How do I order on WhatsApp?",
            "a": f'Choose your jar size (400g or 800g) and quantity above, then tap "Order on WhatsApp" — your '
                 f"message is pre-filled with the product, weight and price. {price_text} Advance payment gets "
                 f"{cfg['advanceDiscountPercent']}% off.",
        },
    ]
    data = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}}
            for f in faqs
        ],
    }
    return json.dumps(data, ensure_ascii=False)


def build_breadcrumb(p):
    data = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{BASE_URL}/"},
            {"@type": "ListItem", "position": 2, "name": "Products", "item": f"{BASE_URL}/products.html"},
            {"@type": "ListItem", "position": 3, "name": p["nameEn"], "item": f"{BASE_URL}/products/{p['slug']}.html"},
        ],
    }
    return json.dumps(data, ensure_ascii=False)


PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>__SEO_TITLE__</title>
<meta name="description" content="__SEO_DESC__">
<meta name="keywords" content="__KEYWORDS__">
<link rel="canonical" href="__CANONICAL__">
<meta property="og:type" content="product">
<meta property="og:site_name" content="ShikarpuriAchar.pk">
<meta property="og:title" content="__SEO_TITLE__">
<meta property="og:description" content="__SEO_DESC__">
<meta property="og:url" content="__CANONICAL__">
<meta property="og:locale" content="en_PK">
<meta property="og:image" content="__OG_IMAGE__">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="__NAME_EN__ — ShikarpuriAchar.pk">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="__OG_IMAGE__">
<meta name="theme-color" content="#1F4D3A">
<link rel="icon" href="/assets/icons/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700;800&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<script type="application/ld+json" data-product-schema>__JSONLD__</script>
<script type="application/ld+json" data-breadcrumb-schema>__BREADCRUMB__</script>
<script type="application/ld+json" data-faq-schema>__FAQJSONLD__</script>
__VIDEOJSONLD_TAG__</head>
<body data-product-slug="__SLUG__">
<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header">
  <div class="header-inner">
    <a href="/" class="logo" aria-label="ShikarpuriAchar.pk home">
      <span class="logo__mark" aria-hidden="true">SA</span>
      <span class="logo__text">
        <span class="logo__text-main">Shikarpuri Achar</span>
        <span class="logo__text-sub">Since 1985</span>
      </span>
    </a>
    <nav class="main-nav" aria-label="Primary">
      <ul class="main-nav__list">
        <li><a class="site-header__link" href="/">Home</a></li>
        <li><a class="site-header__link" href="/products.html">Products</a></li>
        <li><a class="site-header__link" href="/price-list.html">Price Lists</a></li>
        <li><a class="site-header__link" href="/blog.html">Blog</a></li>
        <li><a class="site-header__link" href="/about.html">About</a></li>
        <li><a class="site-header__link" href="/faq.html">FAQ</a></li>
        <li><a class="site-header__link" href="/contact.html">Contact</a></li>
        <li><a class="site-header__link" data-yt-channel href="#" target="_blank" rel="noopener">YouTube</a></li>
      </ul>
    </nav>
    <div class="header-actions">
      <a class="btn btn--gold btn--sm" data-wa-link href="#" target="_blank" rel="noopener">Order Now</a>
      <button class="hamburger" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>

<div class="mobile-nav" id="mobile-nav">
  <div class="mobile-nav__backdrop"></div>
  <div class="mobile-nav__panel" role="dialog" aria-modal="true" aria-label="Mobile menu">
    <button class="mobile-nav__close" aria-label="Close menu">&times;</button>
    <ul class="mobile-nav__list">
      <li><a href="/">Home</a></li>
      <li><a href="/products.html">Products</a></li>
      <li><a href="/price-list.html">Price Lists</a></li>
      <li><a href="/blog.html">Blog</a></li>
      <li><a href="/about.html">About</a></li>
      <li><a href="/faq.html">FAQ</a></li>
      <li><a href="/contact.html">Contact</a></li>
      <li><a data-yt-channel href="#" target="_blank" rel="noopener">YouTube</a></li>
    </ul>
    <div class="mobile-nav__foot">
      <a class="btn btn--whatsapp btn--block" data-wa-link href="#" target="_blank" rel="noopener">Order on WhatsApp</a>
    </div>
  </div>
</div>

<main id="main">
  <section class="page-hero page-hero--compact">
    <div class="container page-hero__inner">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a><span>/</span><a href="/products.html">Products</a><span>/</span>
        <span data-breadcrumb-current>__NAME_EN__</span>
      </nav>
      <h1 data-product-hero-title style="font-size:clamp(1.7rem,4vw,2.4rem)">__NAME_EN__</h1>
      <p class="product-detail__title-ur" data-product-hero-ur style="color:var(--color-mustard-light);margin-bottom:0">__NAME_UR__</p>
    </div>
  </section>
  <div class="sindhi-border--rich" role="presentation"></div>

  <section class="section section--tight">
    <div class="container">
      <div class="product-detail" data-product-root>
        <div class="text-center" style="grid-column:1/-1;padding:3rem"><p>Loading product details...</p></div>
      </div>
    </div>
  </section>

  <section class="section section--tight section--alt">
    <div class="container" style="max-width:860px">
      <div class="section-head" style="margin-bottom:var(--space-md)" data-reveal>
        <span class="eyebrow">Good To Know</span>
        <h2 style="font-size:clamp(1.4rem,3vw,1.9rem)">Questions About __NAME_EN__</h2>
      </div>
      <div class="faq-list" data-product-faq></div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="container">
      <div class="related-heading text-center" style="margin-top:0" data-reveal>
        <span class="eyebrow">You May Also Like</span>
        <h2 style="font-size:clamp(1.4rem,3vw,1.9rem)">More From This Collection</h2>
      </div>
      <div class="grid grid-3" data-related-grid></div>
    </div>
  </section>
</main>

<div class="footer-cta">
  <div class="container footer-cta__inner">
    <div>
      <h3>Still deciding? Ask us on WhatsApp.</h3>
      <p>Fast replies every day — we'll help you pick the right pickle.</p>
    </div>
    <a class="btn" style="background:var(--color-ink);color:var(--color-cream)" data-wa-link href="#" target="_blank" rel="noopener">Chat Now</a>
  </div>
</div>
<footer class="site-footer">
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand">
        <a href="/" class="logo">
          <span class="logo__mark" aria-hidden="true">SA</span>
          <span class="logo__text">
            <span class="logo__text-main">Shikarpuri Achar</span>
            <span class="logo__text-sub">Since 1985</span>
          </span>
        </a>
        <p class="urdu-subtitle">اصل شکارپوری اچار</p>
        <p>Original Shikarpuri Achar since 1985 — traditional Sindhi pickles made with premium ingredients, delivered across Pakistan.</p>
        <div class="footer-social">
          <a data-yt-channel href="#" target="_blank" rel="noopener" aria-label="YouTube channel"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.6-.46-5.3a3 3 0 00-2.1-2.1C18.7 4 12 4 12 4s-6.7 0-8.44.6a3 3 0 00-2.1 2.1C1 8.4 1 12 1 12s0 3.6.46 5.3a3 3 0 002.1 2.1C5.3 20 12 20 12 20s6.7 0 8.44-.6a3 3 0 002.1-2.1C23 15.6 23 12 23 12zM9.75 15.5v-7l6 3.5-6 3.5z"/></svg></a>
          <a data-fb-link href="#" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.5-4.5-10-10-10S2 6.5 2 12c0 5 3.66 9.13 8.44 9.88v-6.99H7.9v-2.89h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.45 2.89h-2.33v6.99C18.34 21.13 22 17 22 12z"/></svg></a>
          <a data-ig-link href="#" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4 2.209 0 4 1.791 4 4 0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>
          <a data-wa-link href="#" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.1.2-.3.3-.4.1-.2 0-.3 0-.5s-.6-1.5-.9-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z"/><path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.8-1.5c1.5.8 3.3 1.3 5.2 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.3c-1.7 0-3.4-.5-4.8-1.3l-.3-.2-3.2 1 1-3.2-.2-.3C3.5 15 3 13.5 3 12c0-5 4-9 9-9s9 4 9 9-4 9-9 9z"/></svg></a>
        </div>
      </div>
      <nav class="footer-col" aria-label="Quick links">
        <h4>Quick Links</h4>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/products.html">Products</a></li>
          <li><a href="/price-list.html">Price Lists</a></li>
          <li><a href="/blog.html">Blog</a></li>
          <li><a href="/about.html">About</a></li>
          <li><a href="/faq.html">FAQ</a></li>
          <li><a href="/contact.html">Contact</a></li>
        </ul>
      </nav>
      <nav class="footer-col" aria-label="Popular products">
        <h4>Popular Pickles</h4>
        <ul data-footer-products data-limit="5"><li><span>Loading...</span></li></ul>
      </nav>
      <nav class="footer-col" aria-label="Categories">
        <h4>Categories</h4>
        <ul data-footer-categories><li><span>Loading...</span></li></ul>
      </nav>
      <div class="footer-col">
        <h4>We Deliver To</h4>
        <div class="footer-cities">
          <span>Karachi</span><span>Lahore</span><span>Islamabad</span><span>Hyderabad</span>
          <span>Sukkur</span><span>Shikarpur</span><span>Multan</span><span>Faisalabad</span>
        </div>
      </div>
      <div class="footer-col">
        <h4>Contact</h4>
        <ul>
          <li><a data-wa-link href="#" target="_blank" rel="noopener">WhatsApp: 0312 8461211</a></li>
          <li><span>Pakistan &middot; Nationwide Delivery</span></li>
          <li><a href="/contact.html">Contact Form</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span data-year></span> ShikarpuriAchar.pk. All rights reserved.</span>
      <span>Original Shikarpuri Achar Since 1985</span>
    </div>
  </div>
</footer>

<a class="wa-float" data-wa-link href="#" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.1.2-.3.3-.4.1-.2 0-.3 0-.5s-.6-1.5-.9-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z"/><path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.8-1.5c1.5.8 3.3 1.3 5.2 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.3c-1.7 0-3.4-.5-4.8-1.3l-.3-.2-3.2 1 1-3.2-.2-.3C3.5 15 3 13.5 3 12c0-5 4-9 9-9s9 4 9 9-4 9-9 9z"/></svg>
</a>
<button class="back-to-top" aria-label="Back to top">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
</button>

<script src="/js/products-data.js"></script>
<script src="/js/main.js"></script>
</body>
</html>
"""

SITEMAP_CORE = [
    ("/", "weekly", "1.0"),
    ("/products.html", "weekly", "0.9"),
    ("/price-list.html", "weekly", "0.8"),
    ("/blog.html", "weekly", "0.7"),
    ("/about.html", "monthly", "0.6"),
    ("/faq.html", "monthly", "0.6"),
    ("/contact.html", "monthly", "0.6"),
]


def main():
    with io.open(os.path.join(ROOT, "products.json"), encoding="utf-8") as f:
        products = json.load(f)["products"]

    site_cfg = load_site_config()

    out_dir = os.path.join(ROOT, "products")
    os.makedirs(out_dir, exist_ok=True)

    for p in products:
        video_jsonld = build_video_jsonld(p)
        video_tag = (
            f'<script type="application/ld+json" data-video-schema>{video_jsonld}</script>'
            if video_jsonld
            else ""
        )
        html = (
            PAGE_TEMPLATE.replace("__SEO_TITLE__", esc(p.get("seoTitle") or f"{p['nameEn']} | ShikarpuriAchar.pk"))
            .replace("__SEO_DESC__", esc(p.get("seoDescription") or p.get("shortDescription", "")))
            .replace("__KEYWORDS__", esc(", ".join(p.get("metaKeywords", []))))
            .replace("__CANONICAL__", f"{BASE_URL}/products/{p['slug']}.html")
            .replace("__OG_IMAGE__", f"{BASE_URL}/assets/og/{p['slug']}.png")
            .replace("__JSONLD__", build_jsonld(p))
            .replace("__BREADCRUMB__", build_breadcrumb(p))
            .replace("__FAQJSONLD__", build_faq_jsonld(p, site_cfg))
            .replace("__VIDEOJSONLD_TAG__", video_tag)
            .replace("__NAME_EN__", esc(p["nameEn"]))
            .replace("__NAME_UR__", esc(p["nameUr"]))
            .replace("__SLUG__", p["slug"])
        )
        path = os.path.join(out_dir, f"{p['slug']}.html")
        with io.open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(html)
        print(f"  wrote products/{p['slug']}.html")

    # ---- sitemap.xml (also includes blog.json articles, if any, so
    #      re-running this script never drops URLs generate-blog-pages.py added) ----
    articles = []
    blog_path = os.path.join(ROOT, "blog.json")
    if os.path.exists(blog_path):
        with io.open(blog_path, encoding="utf-8") as f:
            articles = json.load(f)["articles"]

    today = date.today().isoformat()
    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">'
    )
    for path, freq, prio in SITEMAP_CORE:
        lines.append(
            f"  <url><loc>{BASE_URL}{path}</loc><lastmod>{today}</lastmod>"
            f"<changefreq>{freq}</changefreq><priority>{prio}</priority></url>"
        )
    for p in products:
        yt_id = extract_youtube_id(p.get("youtubeUrl") or "")
        if yt_id:
            video_block = (
                "<video:video>"
                f"<video:thumbnail_loc>https://i.ytimg.com/vi/{yt_id}/hqdefault.jpg</video:thumbnail_loc>"
                f"<video:title>{esc(p['nameEn'])} — ShikarpuriAchar.pk</video:title>"
                f"<video:description>{esc(p.get('shortDescription') or p.get('seoDescription', ''))}</video:description>"
                f"<video:player_loc allow_embed=\"yes\">https://www.youtube-nocookie.com/embed/{yt_id}</video:player_loc>"
                "</video:video>"
            )
        else:
            video_block = ""
        lines.append(
            f"  <url><loc>{BASE_URL}/products/{p['slug']}.html</loc><lastmod>{today}</lastmod>"
            f"<changefreq>weekly</changefreq><priority>0.8</priority>{video_block}</url>"
        )
    for a in articles:
        lines.append(
            f"  <url><loc>{BASE_URL}/blog/{a['slug']}.html</loc><lastmod>{today}</lastmod>"
            f"<changefreq>monthly</changefreq><priority>0.6</priority></url>"
        )
    lines.append("</urlset>")
    with io.open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines) + "\n")
    print(f"  wrote sitemap.xml ({len(SITEMAP_CORE) + len(products) + len(articles)} URLs)")
    print(f"Done. {len(products)} product pages generated.")


if __name__ == "__main__":
    sys.exit(main())
