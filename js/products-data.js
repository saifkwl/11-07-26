/**
 * ShikarpuriAchar.pk — Product Data Access Layer
 * ------------------------------------------------------------------
 * Loads /products.json — the SINGLE SOURCE OF TRUTH for every product
 * on the site. No product name, price, description or video link is
 * ever hardcoded in HTML/CSS/JS. Update products.json and the whole
 * site (home, products grid, category filters, search, price list,
 * product pages, related products, WhatsApp messages) updates itself.
 *
 * HOW TO ADD A REAL VIDEO:
 *   Set "youtubeUrl" to the full YouTube Shorts / video URL, e.g.
 *   "https://youtube.com/shorts/XXXXXXXXXXX". Leave "" for a
 *   "Video Coming Soon" placeholder.
 *
 * HOW TO ADD REAL PRICES:
 *   Fill in "price400" / "price800" (plain numbers, PKR). Leave as
 *   null to show "Price on WhatsApp" (item stays sellable via WhatsApp).
 *
 * HOW TO ADD/REMOVE A PRODUCT:
 *   Add or remove an object in the "products" array. Category pages,
 *   search and related-products all pick it up automatically. If you
 *   add a product, also create a matching thin page at
 *   /products/<slug>.html (copy an existing one — it has no
 *   hardcoded content, only a data-product-slug attribute).
 * ------------------------------------------------------------------
 */

const SITE_CONFIG = {
  brandName: "ShikarpuriAchar.pk",
  tagline: "Original Shikarpuri Achar Since 1985",
  whatsappNumber: "923128461211", // international format, no + or leading 0
  whatsappDisplay: "0312 8461211",
  youtubeChannelUrl: "https://www.youtube.com/@Shikarpuriachar-m9i",
  facebookUrl: "https://www.facebook.com/people/Shikarpuri-Achar/61573741591107/",
  instagramUrl: "https://www.instagram.com/shikarpuriachar.pk/",
  codAvailable: true,
  deliveryCharge: 300,
  minProductOrder: 1500,
  minCodOrder: 1500, // = minProductOrder: COD is available on any order that meets the minimum
  freeDeliveryThreshold: 1800, // advance orders at/above this get FREE delivery (see advanceTiers)
  advanceDeliveryCharge: 200,  // advance orders below the threshold (still < COD's 300)
  currency: "PKR",

  /* Advance-payment incentive tiers (replaces the old flat % discount).
     Everything that rewards the customer is ADVANCE-ONLY. Highest matched
     tier wins. Tune numbers here — cart math, WhatsApp and copy all read
     this table. delivery:0 = FREE delivery; flatOff = Rs off; gift = free
     400g jar (customer picks from giftPicks). */
  advanceTiers: [
    { minSubtotal: 2500, delivery: 0,   flatOff: 0,   gift: true },
    { minSubtotal: 1800, delivery: 0,   flatOff: 100, gift: false },
    { minSubtotal: 0,    delivery: 200, flatOff: 0,   gift: false },
  ],
  /* Hero achars offered as the free 400g jar at the 2,500+ advance tier. */
  giftPicks: ["mix-achar", "aam-ka-achar", "lehsan-ka-achar", "green-chutney"],

  /* Locked microcopy — owner-approved exact strings. Reference these
     constants everywhere (buy-box, cart, WhatsApp, FAQ, price-list) so the
     Roman-Urdu + English tone stays identical. Do not paraphrase. */
  COPY: {
    advanceFreeDelivery: "Advance payment par delivery FREE 🎁",
    codMinWarning: "Minimum Order amount is PKR 1500, add more.",
    advanceTier1: "Advance payment par delivery FREE + Rs. 100 off 🎁",
    advanceTier2: "FREE delivery + FREE 400g achar 🎁",
    giftPickerTitle: "🎁 Apna FREE 400g achar chunein",
    advanceReassurance: "Payment screenshot WhatsApp par bhejein, order foran confirm ✓",
    advanceMethod: "Advance payment JazzCash/EasyPaisa se — account details WhatsApp par milen ge.",
  },
};

function resolveJsonUrl(filename) {
  // Works whether the page lives at /, /products/*.html, or /blog/*.html
  const depth = window.location.pathname.split("/").filter(Boolean);
  const parent = depth.length > 0 ? depth[depth.length - 2] : "";
  const inSubfolder = parent === "products" || parent === "blog";
  return (inSubfolder ? "../" : "/") + filename;
}

const ProductsAPI = (function () {
  let dataPromise = null;

  function load() {
    if (!dataPromise) {
      dataPromise = fetch(resolveJsonUrl("products.json"), { cache: "no-cache" })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load products.json (" + res.status + ")");
          return res.json();
        })
        .then((json) => json.products || [])
        .catch((err) => {
          console.error("[ProductsAPI]", err);
          return [];
        });
    }
    return dataPromise;
  }

  function getBySlug(products, slug) {
    return products.find((p) => p.slug === slug) || null;
  }

  function getFeatured(products, limit) {
    const featured = products.filter((p) => p.featured);
    return limit ? featured.slice(0, limit) : featured;
  }

  function getByCategory(products, category) {
    if (!category || category === "all") return products;
    return products.filter((p) => slugify(p.category) === slugify(category));
  }

  function getCategories(products) {
    const seen = new Map();
    products.forEach((p) => {
      const slug = slugify(p.category);
      if (!seen.has(slug)) seen.set(slug, p.category);
    });
    return Array.from(seen, ([slug, name]) => ({ slug, name }));
  }

  function getRelated(products, slug, count) {
    const current = getBySlug(products, slug);
    if (!current) return products.slice(0, count || 3);
    const sameCategory = products.filter((p) => p.slug !== slug && p.category === current.category);
    const others = products.filter((p) => p.slug !== slug && p.category !== current.category);
    return sameCategory.concat(others).slice(0, count || 3);
  }

  function search(products, query) {
    if (!query) return products;
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const haystack = [
        p.nameEn, p.nameUr, p.category, p.shortDescription, p.description,
        ...(p.metaKeywords || []),
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }

  function slugify(str) {
    return String(str || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function extractYouTubeId(url) {
    if (!url) return "";
    const patterns = [
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
      /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/,
      /youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
    ];
    for (const re of patterns) {
      const m = url.match(re);
      if (m) return m[1];
    }
    if (/^[a-zA-Z0-9_-]{10,}$/.test(url.trim())) return url.trim();
    return "";
  }

  function formatPrice(value) {
    if (value === null || value === undefined || value === "") return null;
    return `Rs. ${Number(value).toLocaleString("en-PK")}`;
  }

  /* ---- Variant helpers ----------------------------------------------
     `variants` is the canonical price structure on every product:
       [{ weight:"400g", price:499 },
        { weight:"800g", price:899, popular:true },
        { weight:"2kg",  price:1999, label:"Family Pack" }]
     price400 / price800 are kept only as convenience mirrors. All size /
     savings logic reads variants so extra sizes (2kg) work everywhere. */
  function getVariants(product) {
    if (product && Array.isArray(product.variants) && product.variants.length) {
      return product.variants;
    }
    const v = [];
    if (product) {
      v.push({ weight: "400g", price: product.price400 != null ? product.price400 : null });
      v.push({ weight: "800g", price: product.price800 != null ? product.price800 : null, popular: true });
    }
    return v;
  }
  function variantByWeight(product, weight) {
    return getVariants(product).find((v) => v.weight === weight) || null;
  }
  function variantPrice(product, weight) {
    const v = variantByWeight(product, weight);
    return v ? v.price : null;
  }
  function defaultVariant(product) {
    const vs = getVariants(product);
    return vs.find((v) => v.popular) || vs[0] || null;
  }
  function baseVariant(product) {
    return variantByWeight(product, "400g") || getVariants(product)[0] || null;
  }
  function weightGrams(weight) {
    const m = String(weight || "").match(/([\d.]+)\s*(kg|g)/i);
    if (!m) return null;
    const n = parseFloat(m[1]);
    return /kg/i.test(m[2]) ? n * 1000 : n;
  }
  /** Rs saved vs buying the same grams in 400g jars, and % cheaper per gram. */
  function variantSavings(product, weight) {
    const base = baseVariant(product);
    const v = variantByWeight(product, weight);
    if (!base || !v || base.price == null || v.price == null) return null;
    const g = weightGrams(weight);
    const bg = weightGrams(base.weight);
    if (!g || !bg || g <= bg) return null;
    const perGramBase = base.price / bg;
    const equiv = Math.round(perGramBase * g);
    const saveRs = equiv - v.price;
    const pct = Math.round((1 - (v.price / g) / perGramBase) * 100);
    return { saveRs, pct, equiv };
  }

  function buildWhatsAppLink(message) {
    const base = `https://wa.me/${SITE_CONFIG.whatsappNumber}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
  }

  /**
   * Build the WhatsApp order message.
   * options (optional): { qty: number, unitPrice: number|null }
   * Includes weight, quantity and total price when available — the
   * customer can send the message as-is.
   */
  function buildProductOrderMessage(product, variantSize, options) {
    const name = (product && (product.whatsappProductName || product.nameEn)) || "your products";
    const size = variantSize ? ` (${variantSize})` : "";
    const qty = options && options.qty && options.qty > 0 ? options.qty : 1;
    const qtyText = qty > 1 ? ` x ${qty}` : "";
    let priceText = "";
    if (options && options.unitPrice) {
      const total = options.unitPrice * qty;
      priceText = ` — Total Rs. ${Number(total).toLocaleString("en-PK")}`;
    }
    return `Assalam-o-Alaikum! I want to order ${name}${size}${qtyText}${priceText} from ShikarpuriAchar.pk. Please confirm availability and delivery details.`;
  }

  return {
    ready: load(),
    getBySlug, getFeatured, getByCategory, getCategories, getRelated,
    search, slugify, extractYouTubeId, formatPrice,
    getVariants, variantByWeight, variantPrice, defaultVariant, baseVariant,
    weightGrams, variantSavings,
    buildWhatsAppLink, buildProductOrderMessage,
  };
})();

/**
 * Reviews Data Access Layer — loads /reviews.json.
 * Reviews ship as clearly-flagged PLACEHOLDER content (see reviews.json)
 * for layout/design purposes and must be swapped for genuine customer
 * feedback before launch. No fabricated review data is ever emitted as
 * schema.org structured data.
 */
const ReviewsAPI = (function () {
  let dataPromise = null;

  function load() {
    if (!dataPromise) {
      dataPromise = fetch(resolveJsonUrl("reviews.json"), { cache: "no-cache" })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load reviews.json (" + res.status + ")");
          return res.json();
        })
        .then((json) => json.reviews || [])
        .catch((err) => {
          console.error("[ReviewsAPI]", err);
          return [];
        });
    }
    return dataPromise;
  }

  return { ready: load() };
})();

/**
 * Blog Data Access Layer — loads /blog.json (single source of truth for
 * every article, same pattern as ProductsAPI). Mirrors ProductsAPI's
 * helpers so blog listing/filter/detail rendering can reuse the same
 * shape of code already proven on products.html / product detail pages.
 */
const BlogAPI = (function () {
  let dataPromise = null;

  function load() {
    if (!dataPromise) {
      dataPromise = fetch(resolveJsonUrl("blog.json"), { cache: "no-cache" })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load blog.json (" + res.status + ")");
          return res.json();
        })
        .then((json) => json.articles || [])
        .catch((err) => {
          console.error("[BlogAPI]", err);
          return [];
        });
    }
    return dataPromise;
  }

  function getBySlug(articles, slug) {
    return articles.find((a) => a.slug === slug) || null;
  }

  function getByCategory(articles, category) {
    if (!category || category === "all") return articles;
    return articles.filter((a) => ProductsAPI.slugify(a.category) === ProductsAPI.slugify(category));
  }

  function getCategories(articles) {
    const seen = new Map();
    articles.forEach((a) => {
      const slug = ProductsAPI.slugify(a.category);
      if (!seen.has(slug)) seen.set(slug, a.category);
    });
    return Array.from(seen, ([slug, name]) => ({ slug, name }));
  }

  function getRelated(articles, slug, count) {
    const current = getBySlug(articles, slug);
    if (!current) return articles.slice(0, count || 3);
    const sameCategory = articles.filter((a) => a.slug !== slug && a.category === current.category);
    const others = articles.filter((a) => a.slug !== slug && a.category !== current.category);
    return sameCategory.concat(others).slice(0, count || 3);
  }

  return { ready: load(), getBySlug, getByCategory, getCategories, getRelated };
})();

/**
 * Cart Data Layer — localStorage-persisted shopping cart.
 * Stores only { slug, weight, qty } per line; all pricing/names are
 * looked up live from products.json (via ProductsAPI) so the cart never
 * goes stale if products.json changes. Never reads/writes products.json.
 */
const CartAPI = (function () {
  const STORAGE_KEY = "shikarpuriachar_cart_v1";
  const listeners = [];

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const items = raw ? JSON.parse(raw) : [];
      return Array.isArray(items) ? items : [];
    } catch (e) {
      return [];
    }
  }

  function save(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("[CartAPI] could not persist cart", e);
    }
    listeners.forEach((fn) => {
      try { fn(items); } catch (e) { /* ignore listener errors */ }
    });
  }

  function onChange(fn) {
    if (typeof fn === "function") listeners.push(fn);
  }

  function getItems() {
    return load();
  }

  function getCount() {
    return load().reduce((sum, i) => sum + i.qty, 0);
  }

  function add(slug, weight, qty) {
    const items = load();
    const addQty = qty && qty > 0 ? qty : 1;
    const existing = items.find((i) => i.slug === slug && i.weight === weight);
    if (existing) existing.qty += addQty;
    else items.push({ slug, weight, qty: addQty });
    save(items);
  }

  function setQty(slug, weight, qty) {
    let items = load();
    if (qty <= 0) {
      items = items.filter((i) => !(i.slug === slug && i.weight === weight));
    } else {
      const existing = items.find((i) => i.slug === slug && i.weight === weight);
      if (existing) existing.qty = qty;
    }
    save(items);
  }

  function removeItem(slug, weight) {
    save(load().filter((i) => !(i.slug === slug && i.weight === weight)));
  }

  function empty() {
    save([]);
  }

  /** Cart lines resolved against live product data (price/name always current). */
  function getLines(products) {
    return load()
      .map((item) => {
        const product = products.find((p) => p.slug === item.slug);
        if (!product) return null;
        const unitPrice = ProductsAPI.variantPrice(product, item.weight);
        const hasPrice = unitPrice !== null && unitPrice !== undefined;
        return {
          slug: item.slug,
          weight: item.weight,
          qty: item.qty,
          product,
          unitPrice: hasPrice ? unitPrice : null,
          lineTotal: hasPrice ? unitPrice * item.qty : 0,
          hasPrice,
        };
      })
      .filter(Boolean);
  }

  function getSubtotal(products) {
    return getLines(products).reduce((sum, l) => sum + l.lineTotal, 0);
  }

  function hasUnpricedItems(products) {
    return getLines(products).some((l) => !l.hasPrice);
  }

  /** { eligible, amountNeeded } based on SITE_CONFIG.minCodOrder vs subtotal. */
  function getCodStatus(products) {
    const subtotal = getSubtotal(products);
    const min = Number(SITE_CONFIG.minCodOrder) || 0;
    const eligible = subtotal >= min;
    return { eligible, amountNeeded: eligible ? 0 : min - subtotal, subtotal, min };
  }

  /** Full pricing breakdown used by both the drawer UI and the WhatsApp message.
      COD: flat Rs.300 delivery, minimum order applies, no perks.
      ADVANCE: tiered (config.advanceTiers) — free delivery / Rs off / free jar. */
  function getSummary(products) {
    const subtotal = getSubtotal(products);
    const hasUnpriced = hasUnpricedItems(products);

    // ---- COD side ----
    const minCod = Number(SITE_CONFIG.minCodOrder) || 0;
    const codDelivery = subtotal > 0 ? Number(SITE_CONFIG.deliveryCharge) || 0 : 0;
    const codEligible = subtotal >= minCod;
    const codAmountNeeded = codEligible ? 0 : minCod - subtotal;
    const grandTotalCod = subtotal + codDelivery;

    // ---- Advance side (highest matched tier wins) ----
    const tiers = (SITE_CONFIG.advanceTiers || []).slice().sort((a, b) => b.minSubtotal - a.minSubtotal);
    const tier = tiers.find((t) => subtotal >= t.minSubtotal) ||
      { delivery: Number(SITE_CONFIG.advanceDeliveryCharge) || 0, flatOff: 0, gift: false };
    const advDelivery = subtotal > 0 ? Number(tier.delivery) || 0 : 0;
    const advFlatOff = Number(tier.flatOff) || 0;
    const advGift = !!tier.gift && subtotal > 0;
    const advFreeDelivery = advDelivery === 0 && subtotal > 0;
    const grandTotalAdvance = Math.max(0, subtotal - advFlatOff + advDelivery);
    const advanceSaving = grandTotalCod - grandTotalAdvance; // Rs advance beats COD (gift extra)

    // next advance tier still to unlock (for the progress bar / nudges)
    const asc = (SITE_CONFIG.advanceTiers || []).slice().sort((a, b) => a.minSubtotal - b.minSubtotal);
    const next = asc.find((t) => t.minSubtotal > subtotal) || null;
    const toNext = next ? {
      amountNeeded: next.minSubtotal - subtotal,
      min: next.minSubtotal,
      gift: !!next.gift,
      flatOff: Number(next.flatOff) || 0,
      freeDelivery: Number(next.delivery) === 0,
    } : null;

    return {
      subtotal, hasUnpriced,
      minCod, codEligible, codAmountNeeded, codDelivery, grandTotalCod,
      advDelivery, advFlatOff, advGift, advFreeDelivery, grandTotalAdvance,
      advanceSaving, toNext,
      shipping: codDelivery, // legacy alias
    };
  }

  function money(n) {
    return `Rs. ${Number(n).toLocaleString("en-PK")}`;
  }

  /** Builds the single consolidated WhatsApp order message for the whole cart.
      paymentMethod: "cod" | "advance" — the option the customer selected in
      the cart before checkout (defaults to COD). */
  function buildCartWhatsAppMessage(products, paymentMethod, giftSlug) {
    const lines = getLines(products);
    if (!lines.length) return "";
    const s = getSummary(products);
    const COPY = SITE_CONFIG.COPY || {};
    // Advance is the default unless the customer explicitly chose COD and qualifies.
    const isAdvance = paymentMethod !== "cod";
    const parts = [];
    parts.push("Assalam-o-Alaikum! I want to place the following order from ShikarpuriAchar.pk:");
    parts.push("");
    lines.forEach((l, i) => {
      const name = l.product.nameUr ? `${l.product.nameEn} (${l.product.nameUr})` : l.product.nameEn;
      const priceText = l.hasPrice ? `${money(l.unitPrice)} each = ${money(l.lineTotal)}` : "price to be confirmed";
      parts.push(`${i + 1}. ${name} — ${l.weight} x ${l.qty} — ${priceText}`);
    });
    parts.push("");
    parts.push(`Subtotal: ${money(s.subtotal)}`);
    if (isAdvance) {
      parts.push(`Delivery: ${s.advFreeDelivery ? "FREE 🎁" : money(s.advDelivery)}`);
      if (s.advFlatOff > 0) parts.push(`Advance discount: -${money(s.advFlatOff)}`);
      parts.push(`Grand Total: ${money(s.grandTotalAdvance)}`);
      if (s.advGift) {
        const picks = SITE_CONFIG.giftPicks || [];
        const gift = products.find((p) => p.slug === giftSlug) || products.find((p) => p.slug === picks[0]);
        const giftName = gift ? (gift.nameUr ? `${gift.nameEn} (${gift.nameUr})` : gift.nameEn) : "Mix Achar";
        parts.push(`🎁 FREE Gift: ${giftName} 400g (advance payment offer)`);
      }
      parts.push("");
      parts.push("Payment Method: Advance Payment (JazzCash/EasyPaisa)");
      if (COPY.advanceMethod) parts.push(COPY.advanceMethod);
    } else {
      parts.push(`Delivery: ${money(s.codDelivery)}`);
      parts.push(`Grand Total: ${money(s.grandTotalCod)}`);
      parts.push("");
      parts.push("Payment Method: Cash on Delivery");
    }
    if (s.hasUnpriced) parts.push("(Some items are priced on request — final total to be confirmed.)");
    parts.push("");
    parts.push(`💡 Rs. ${Number(SITE_CONFIG.freeDeliveryThreshold || 1800).toLocaleString("en-PK")}+ advance order par FREE delivery hai.`);
    parts.push("");
    parts.push("Name: ___");
    parts.push("City: ___");
    parts.push("Address: ___");
    parts.push("");
    parts.push("Please confirm availability and delivery details.");
    return parts.join("\n");
  }

  return {
    getItems, getCount, add, setQty, removeItem, empty,
    getLines, getSubtotal, hasUnpricedItems, getCodStatus, getSummary,
    buildCartWhatsAppMessage, onChange,
  };
})();

if (typeof window !== "undefined") {
  window.SITE_CONFIG = SITE_CONFIG;
  window.ProductsAPI = ProductsAPI;
  window.ReviewsAPI = ReviewsAPI;
  window.BlogAPI = BlogAPI;
  window.CartAPI = CartAPI;
  // Back-compat helpers used directly in HTML markup
  window.buildWhatsAppLink = ProductsAPI.buildWhatsAppLink;
  window.buildProductOrderMessage = ProductsAPI.buildProductOrderMessage;
}
