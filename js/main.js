/**
 * ShikarpuriAchar.pk — Site Behaviour
 * Vanilla JS. No dependencies. No build step.
 * All product content is fetched from /products.json via ProductsAPI —
 * nothing product-related is hardcoded here.
 */
(function () {
  "use strict";

  const cfg = window.SITE_CONFIG || {};
  const api = window.ProductsAPI;
  const blogApi = window.BlogAPI;
  let productsCache = [];

  /* ---------------------------------------------------------------
     Sticky / transparent header
  --------------------------------------------------------------- */
  function initHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const setState = () => {
      if (window.scrollY > 24) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    };
    setState();
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => { setState(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ---------------------------------------------------------------
     Mobile navigation drawer
  --------------------------------------------------------------- */
  function initMobileNav() {
    const toggle = document.querySelector(".hamburger");
    const nav = document.querySelector(".mobile-nav");
    if (!toggle || !nav) return;
    const closeBtn = nav.querySelector(".mobile-nav__close");
    const backdrop = nav.querySelector(".mobile-nav__backdrop");
    const links = nav.querySelectorAll("a");

    function open() {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      closeBtn && closeBtn.focus();
    }
    function close() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      toggle.focus();
    }
    toggle.addEventListener("click", () => {
      nav.classList.contains("is-open") ? close() : open();
    });
    closeBtn && closeBtn.addEventListener("click", close);
    backdrop && backdrop.addEventListener("click", close);
    links.forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) close();
    });
  }

  /* ---------------------------------------------------------------
     Highlight active nav link
  --------------------------------------------------------------- */
  function setActiveNavLink() {
    const path = window.location.pathname.replace(/\/index\.html$/, "/");
    document.querySelectorAll(".site-header__link, .mobile-nav__list a").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const normalized = href.replace(/\/index\.html$/, "/");
      if (normalized === path || (path.endsWith(normalized) && normalized !== "/")) {
        a.classList.add("is-active");
      }
    });
  }

  /* ---------------------------------------------------------------
     Reveal-on-scroll animation
  --------------------------------------------------------------- */
  function initReveal(scope) {
    const els = (scope || document).querySelectorAll("[data-reveal]:not(.is-visible)");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    els.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------
     Back to top button
  --------------------------------------------------------------- */
  function initBackToTop() {
    const btn = document.querySelector(".back-to-top");
    if (!btn) return;
    window.addEventListener("scroll", () => {
      btn.classList.toggle("is-visible", window.scrollY > 700);
    }, { passive: true });
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------------------------------------------------------------
     Floating + inline WhatsApp / YouTube links
  --------------------------------------------------------------- */
  function initWhatsAppLinks() {
    if (!cfg.whatsappNumber) return;
    document.querySelectorAll("[data-wa-link]").forEach((el) => {
      const customMsg = el.getAttribute("data-wa-message");
      const msg = customMsg || `Assalam-o-Alaikum! I'd like to order from ${cfg.brandName || "ShikarpuriAchar.pk"}.`;
      el.href = api.buildWhatsAppLink(msg);
    });
  }
  function initYouTubeLinks() {
    if (!cfg.youtubeChannelUrl) return;
    document.querySelectorAll("[data-yt-channel]").forEach((el) => {
      el.href = cfg.youtubeChannelUrl;
    });
  }
  function initSocialLinks() {
    if (cfg.facebookUrl) {
      document.querySelectorAll("[data-fb-link]").forEach((el) => { el.href = cfg.facebookUrl; });
    }
    if (cfg.instagramUrl) {
      document.querySelectorAll("[data-ig-link]").forEach((el) => { el.href = cfg.instagramUrl; });
    }
  }

  /* ---------------------------------------------------------------
     YouTube facade (click-to-load) for performance
  --------------------------------------------------------------- */
  function createFacadeMarkup(id, label) {
    if (id) {
      return `
        <button type="button" class="video-facade" data-yt-id="${id}"
          style="background-image:url('https://i.ytimg.com/vi/${id}/hqdefault.jpg')"
          aria-label="Play video: ${label}">
          <span class="video-facade__play" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </span>
          <span class="video-facade__shorts-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73Z"/></svg>
            Shorts
          </span>
          <span class="video-facade__label">${label}</span>
        </button>`;
    }
    return `
      <div class="video-facade video-facade--pending">
        <span class="video-facade__brandmark" aria-hidden="true">SA</span>
        <span class="video-facade__label">Product video coming soon</span>
      </div>`;
  }

  function loadYouTube(container, id, title) {
    container.innerHTML = `<iframe
        src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1"
        title="${title}"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>`;
  }

  function initVideoFacades(scope) {
    (scope || document).querySelectorAll(".product-card__media, .product-detail__media, .video-embed").forEach((container) => {
      if (container.dataset.wired) return;
      container.dataset.wired = "true";
      const id = api.extractYouTubeId(container.getAttribute("data-youtube-url") || "");
      const label = container.getAttribute("data-video-label") || "Product video";
      container.innerHTML = createFacadeMarkup(id, label);
      const btn = container.querySelector(".video-facade[data-yt-id]");
      if (btn) {
        btn.addEventListener("click", () => loadYouTube(container, btn.dataset.ytId, label));
      }
    });
  }

  /* ---------------------------------------------------------------
     Product card markup (shared everywhere: home, grid, related, search)
  --------------------------------------------------------------- */
  function cardPriceHTML(price) {
    return price
      ? `Rs. ${Number(price).toLocaleString("en-PK")}`
      : `<span style="font-size:.78rem;font-weight:600;font-style:italic">Contact for Price</span>`;
  }

  function productCardHTML(p) {
    const comingSoon = p.status && p.status !== "active";
    const statusBadge = comingSoon
      ? `<span class="chip" style="background:var(--color-dark-red);color:#fff;border-color:transparent">${p.status.replace(/-/g, " ")}</span>`
      : "";
    const ribbon = p.featured ? `<span class="product-card__ribbon">Bestseller</span>` : "";
    const hasVideo = !!api.extractYouTubeId(p.youtubeUrl || "");
    const actionsRow = hasVideo
      ? `<div class="product-card__actions product-card__actions--split">
            <button type="button" class="btn btn--outline-dark btn--sm" data-card-watch>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
              Watch Video
            </button>
            <a class="btn btn--outline-dark btn--sm" href="/products/${p.slug}.html">View Details</a>
          </div>`
      : `<div class="product-card__actions">
            <a class="btn btn--outline-dark btn--sm btn--block" href="/products/${p.slug}.html">View Details</a>
          </div>`;
    return `
      <article class="product-card" data-reveal data-slug="${p.slug}" data-category="${api.slugify(p.category)}" data-name="${(p.nameEn + " " + p.nameUr).toLowerCase()}">
        ${ribbon}
        <div class="product-card__media" data-youtube-url="${p.youtubeUrl || ""}" data-video-label="${p.nameEn}"></div>
        <div class="product-card__body">
          <h3 class="product-card__name-en">${p.nameEn}</h3>
          <p class="product-card__name-ur">${p.nameUr}</p>
          <div class="product-card__buy">
            <div class="card-weights" role="group" aria-label="Select weight">
              <button type="button" class="card-weight is-active" data-card-weight="400g">400g</button>
              <button type="button" class="card-weight" data-card-weight="800g">800g</button>
            </div>
            <span class="product-card__price" data-card-price>${cardPriceHTML(p.price400)}</span>
          </div>
          ${statusBadge ? `<div class="product-card__variants">${statusBadge}</div>` : ""}
          ${actionsRow}
          <div class="product-card__actions">
            <button type="button" class="btn btn--gold btn--sm btn--block" data-card-add-cart aria-label="Add ${p.nameEn} to cart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="9" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/><path d="M2.5 3h2l2.2 11.2a2 2 0 002 1.6h8a2 2 0 002-1.7L20.5 7H6"/></svg>
              Add to Cart
            </button>
          </div>
        </div>
      </article>`;
  }

  /* ---------------------------------------------------------------
     Card interactions (weight toggle, watch video) — one delegated
     listener for every grid on the page.
  --------------------------------------------------------------- */
  function initCardInteractions() {
    document.addEventListener("click", (e) => {
      const weightBtn = e.target.closest("[data-card-weight]");
      if (weightBtn) {
        const card = weightBtn.closest(".product-card");
        const product = api.getBySlug(productsCache, card ? card.dataset.slug : "");
        if (!card || !product) return;
        const weight = weightBtn.dataset.cardWeight;
        const price = weight === "800g" ? product.price800 : product.price400;
        card.querySelectorAll("[data-card-weight]").forEach((b) => b.classList.toggle("is-active", b === weightBtn));
        const priceEl = card.querySelector("[data-card-price]");
        if (priceEl) priceEl.innerHTML = cardPriceHTML(price);
        const orderEl = card.querySelector("[data-card-order]");
        if (orderEl) orderEl.href = api.buildWhatsAppLink(api.buildProductOrderMessage(product, weight, { unitPrice: price }));
        return;
      }
      const watchBtn = e.target.closest("[data-card-watch]");
      if (watchBtn) {
        const card = watchBtn.closest(".product-card");
        if (!card) return;
        const facade = card.querySelector(".video-facade[data-yt-id]");
        if (facade) {
          facade.click();
          card.querySelector(".product-card__media").scrollIntoView({ behavior: "smooth", block: "nearest" });
        } else {
          window.location.href = `/products/${card.dataset.slug}.html`;
        }
        return;
      }
      const addCartBtn = e.target.closest("[data-card-add-cart]");
      if (addCartBtn) {
        const card = addCartBtn.closest(".product-card");
        if (!card) return;
        const activeWeightBtn = card.querySelector("[data-card-weight].is-active");
        const weight = activeWeightBtn ? activeWeightBtn.dataset.cardWeight : "400g";
        window.CartAPI.add(card.dataset.slug, weight, 1);
        flashButton(addCartBtn, "Added ✓");
        openCart();
        return;
      }
      const priceAddCartBtn = e.target.closest("[data-price-add-cart]");
      if (priceAddCartBtn) {
        window.CartAPI.add(priceAddCartBtn.dataset.priceAddCart, "400g", 1);
        flashButton(priceAddCartBtn, "Added ✓");
        openCart();
        return;
      }
    });
  }

  function emptyStateHTML(message) {
    return `<div class="text-center" style="grid-column:1/-1;padding:2rem"><p>${message}</p></div>`;
  }

  /* ---------------------------------------------------------------
     Small reusable UI feedback: swap a button's label briefly.
  --------------------------------------------------------------- */
  function flashButton(btn, text) {
    if (!btn || btn.dataset.flashing) return;
    btn.dataset.flashing = "true";
    const original = btn.innerHTML;
    btn.innerHTML = text;
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = original;
      btn.disabled = false;
      delete btn.dataset.flashing;
    }, 900);
  }

  /* =================================================================
     WHATSAPP SHOPPING CART
     An ADDITION to the existing per-product WhatsApp/Buy-Now flow —
     that flow is untouched. The cart icon + drawer are injected via
     JS (not duplicated across 66 HTML files); persisted in
     localStorage via CartAPI (js/products-data.js); every price/name
     is looked up live from products.json — nothing hardcoded here.
  ================================================================= */
  function money(n) {
    return `Rs. ${Number(n).toLocaleString("en-PK")}`;
  }

  function updateCartBadge() {
    const badge = document.querySelector("[data-cart-badge]");
    if (!badge || !window.CartAPI) return;
    const count = window.CartAPI.getCount();
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.hidden = count === 0;
  }

  function openCart() {
    const overlay = document.querySelector("[data-cart-overlay]");
    if (!overlay) return;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => overlay.classList.add("is-open"));
    renderCart(productsCache);
  }
  function closeCart() {
    const overlay = document.querySelector("[data-cart-overlay]");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => { if (!overlay.classList.contains("is-open")) overlay.hidden = true; }, 320);
  }

  function cartLineHTML(line) {
    const priceText = line.hasPrice ? money(line.lineTotal) : "Contact for Price";
    return `
      <div class="cart-line" data-slug="${line.slug}" data-weight="${line.weight}">
        <div class="cart-line__info">
          <strong>${line.product.nameEn}</strong>
          <span class="cart-line__ur">${line.product.nameUr}</span>
          <span class="chip">${line.weight}</span>
        </div>
        <div class="cart-line__controls">
          <div class="qty-stepper qty-stepper--sm" role="group" aria-label="Quantity for ${line.product.nameEn}">
            <button type="button" data-cart-qty-minus aria-label="Decrease quantity">&minus;</button>
            <span aria-live="polite">${line.qty}</span>
            <button type="button" data-cart-qty-plus aria-label="Increase quantity">+</button>
          </div>
          <span class="cart-line__price">${priceText}</span>
          <button type="button" class="cart-line__remove" data-cart-remove aria-label="Remove ${line.product.nameEn} from cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-7 0v12a2 2 0 002 2h4a2 2 0 002-2V7"/></svg>
          </button>
        </div>
      </div>`;
  }

  function cartSuggestionHTML(p) {
    const priceText = p.price400 ? money(p.price400) : "Contact for Price";
    return `
      <div class="cart-suggest-item">
        <div class="cart-suggest-item__info">
          <strong>${p.nameEn}</strong>
          <span>${priceText}</span>
        </div>
        <button type="button" class="btn btn--outline-dark btn--sm" data-cart-suggest-add data-slug="${p.slug}">Add</button>
      </div>`;
  }

  function renderCartSuggestions(products, lines) {
    const el = document.querySelector("[data-cart-suggested]");
    if (!el) return;
    if (!lines.length) { el.innerHTML = ""; return; }
    const cartSlugs = new Set(lines.map((l) => l.slug));
    const categories = new Set(lines.map((l) => l.product.category));
    const suggestions = products.filter((p) => !cartSlugs.has(p.slug) && categories.has(p.category)).slice(0, 3);
    el.innerHTML = suggestions.length
      ? `<h3 class="cart-suggested__title">Customers Also Buy</h3>` + suggestions.map(cartSuggestionHTML).join("")
      : "";
  }

  function renderCartSummary(products) {
    const el = document.querySelector("[data-cart-summary]");
    if (!el || !window.CartAPI) return;
    const s = window.CartAPI.getSummary(products);
    const codMsg = s.codEligible
      ? `<p class="cart-cod cart-cod--eligible">&#10003; Cash on Delivery available for this order.</p>`
      : `<p class="cart-cod cart-cod--ineligible">COD is not available. Add ${money(s.codAmountNeeded)} more to qualify for Cash on Delivery.</p>`;
    el.innerHTML = `
      <div class="cart-summary__row"><span>Subtotal</span><strong>${money(s.subtotal)}</strong></div>
      <div class="cart-summary__row"><span>Shipping</span><strong>${money(s.shipping)}</strong></div>
      <div class="cart-summary__row cart-summary__row--discount"><span>Advance Discount (${s.discountPct}%)</span><strong>&minus;${money(s.discountAmount)}</strong></div>
      <div class="cart-summary__row cart-summary__row--total"><span>Grand Total (COD)</span><strong>${money(s.grandTotalCod)}</strong></div>
      <div class="cart-summary__row cart-summary__row--total-alt"><span>Grand Total (Pay in Advance)</span><strong>${money(s.grandTotalAdvance)}</strong></div>
      ${codMsg}
      ${s.hasUnpriced ? `<p class="cart-summary__note">Some items are priced on request — final total confirmed on WhatsApp.</p>` : ""}
    `;
  }

  function renderCart(products) {
    if (!window.CartAPI || !products) return;
    const lines = window.CartAPI.getLines(products);
    const linesEl = document.querySelector("[data-cart-lines]");
    const emptyEl = document.querySelector("[data-cart-empty-state]");
    const footEl = document.querySelector("[data-cart-foot]");
    if (linesEl) linesEl.innerHTML = lines.map(cartLineHTML).join("");
    if (emptyEl) emptyEl.hidden = lines.length > 0;
    if (footEl) footEl.hidden = lines.length === 0;
    renderCartSummary(products);
    renderCartSuggestions(products, lines);
    const checkoutBtn = document.querySelector("[data-cart-checkout]");
    if (checkoutBtn) {
      const msg = window.CartAPI.buildCartWhatsAppMessage(products);
      checkoutBtn.href = msg ? api.buildWhatsAppLink(msg) : "#";
      checkoutBtn.setAttribute("aria-disabled", lines.length ? "false" : "true");
    }
    updateCartBadge();
  }

  function injectCartUI() {
    const actions = document.querySelector(".header-actions");
    if (actions && !actions.querySelector("[data-cart-toggle]")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cart-toggle";
      btn.setAttribute("data-cart-toggle", "");
      btn.setAttribute("aria-label", "Open cart");
      btn.setAttribute("aria-haspopup", "dialog");
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h2l2.6 12.4a2 2 0 002 1.6h8.4a2 2 0 002-1.6L21 8H6"/></svg>
        <span class="cart-badge" data-cart-badge hidden>0</span>`;
      const hamburger = actions.querySelector(".hamburger");
      if (hamburger) actions.insertBefore(btn, hamburger);
      else actions.appendChild(btn);
    }

    if (!document.querySelector("[data-cart-overlay]")) {
      const overlay = document.createElement("div");
      overlay.className = "cart-overlay";
      overlay.setAttribute("data-cart-overlay", "");
      overlay.hidden = true;
      overlay.innerHTML = `
        <div class="cart-overlay__backdrop" data-cart-close></div>
        <div class="cart-panel" role="dialog" aria-modal="true" aria-label="Shopping cart">
          <div class="cart-panel__head">
            <h2>Your Cart</h2>
            <button type="button" class="cart-panel__close" data-cart-close aria-label="Close cart">&times;</button>
          </div>
          <div class="cart-panel__body">
            <div data-cart-lines class="cart-lines"></div>
            <div data-cart-empty-state class="cart-empty-state" hidden>
              <p>Your cart is empty.</p>
              <a href="/products.html" class="btn btn--outline-dark btn--sm">Browse Products</a>
            </div>
            <div data-cart-suggested class="cart-suggested"></div>
          </div>
          <div class="cart-panel__foot" data-cart-foot hidden>
            <div data-cart-summary class="cart-summary"></div>
            <div class="cart-panel__actions">
              <button type="button" class="btn btn--outline-dark btn--sm btn--block" data-cart-empty-btn>Empty Cart</button>
              <a class="btn btn--whatsapp btn--lg btn--block" data-cart-checkout href="#" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.1.2-.3.3-.4.1-.2 0-.3 0-.5s-.6-1.5-.9-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z"/><path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.8-1.5c1.5.8 3.3 1.3 5.2 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.3c-1.7 0-3.4-.5-4.8-1.3l-.3-.2-3.2 1 1-3.2-.2-.3C3.5 15 3 13.5 3 12c0-5 4-9 9-9s9 4 9 9-4 9-9 9z"/></svg>
                Order Cart on WhatsApp
              </a>
            </div>
          </div>
        </div>`;
      document.body.appendChild(overlay);
    }

    updateCartBadge();
    window.CartAPI.onChange(() => {
      updateCartBadge();
      const overlay = document.querySelector("[data-cart-overlay]");
      if (overlay && overlay.classList.contains("is-open")) renderCart(productsCache);
    });
  }

  function initCartEvents() {
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-cart-toggle]")) { openCart(); return; }
      if (e.target.closest("[data-cart-close]")) { closeCart(); return; }
      if (e.target.closest("[data-cart-empty-btn]")) { window.CartAPI.empty(); return; }

      const minusBtn = e.target.closest("[data-cart-qty-minus]");
      if (minusBtn) {
        const line = minusBtn.closest(".cart-line");
        const current = window.CartAPI.getItems().find((i) => i.slug === line.dataset.slug && i.weight === line.dataset.weight);
        if (current) window.CartAPI.setQty(line.dataset.slug, line.dataset.weight, current.qty - 1);
        return;
      }
      const plusBtn = e.target.closest("[data-cart-qty-plus]");
      if (plusBtn) {
        const line = plusBtn.closest(".cart-line");
        const current = window.CartAPI.getItems().find((i) => i.slug === line.dataset.slug && i.weight === line.dataset.weight);
        window.CartAPI.setQty(line.dataset.slug, line.dataset.weight, (current ? current.qty : 0) + 1);
        return;
      }
      const removeBtn = e.target.closest("[data-cart-remove]");
      if (removeBtn) {
        const line = removeBtn.closest(".cart-line");
        window.CartAPI.removeItem(line.dataset.slug, line.dataset.weight);
        return;
      }
      const suggestAddBtn = e.target.closest("[data-cart-suggest-add]");
      if (suggestAddBtn) {
        window.CartAPI.add(suggestAddBtn.dataset.slug, "400g", 1);
        flashButton(suggestAddBtn, "Added ✓");
        return;
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const overlay = document.querySelector("[data-cart-overlay]");
      if (overlay && overlay.classList.contains("is-open")) closeCart();
    });
  }

  /* ---------------------------------------------------------------
     Homepage: featured products grid
  --------------------------------------------------------------- */
  function renderFeaturedGrid(products) {
    document.querySelectorAll("[data-product-grid][data-featured]").forEach((grid) => {
      const limit = parseInt(grid.getAttribute("data-limit") || "0", 10);
      const list = api.getFeatured(products, limit || undefined);
      grid.innerHTML = list.length ? list.map(productCardHTML).join("") : emptyStateHTML("Products are being updated. Please check back soon.");
      initVideoFacades(grid);
      initWhatsAppLinks();
      initReveal(grid);
    });
  }

  /* ---------------------------------------------------------------
     Homepage: Featured Videos — only products that have a real
     youtubeUrl in products.json (never hardcoded). The whole section
     hides itself if no product has a video yet.
  --------------------------------------------------------------- */
  function renderVideoGrid(products) {
    document.querySelectorAll("[data-video-grid]").forEach((grid) => {
      const section = grid.closest("[data-video-section]") || grid;
      const list = products.filter((p) => api.extractYouTubeId(p.youtubeUrl || ""));
      if (!list.length) {
        if (section !== grid) section.hidden = true;
        grid.innerHTML = "";
        return;
      }
      if (section !== grid) section.hidden = false;
      grid.innerHTML = list.map(productCardHTML).join("");
      initVideoFacades(grid);
      initWhatsAppLinks();
      initReveal(grid);
    });
  }

  /* ---------------------------------------------------------------
     products.html: category filter + search, URL-param driven
  --------------------------------------------------------------- */
  function initProductsPage(products) {
    const grid = document.querySelector("[data-product-grid]:not([data-featured])");
    if (!grid) return;

    const countText = document.querySelector("[data-product-count-text]");
    if (countText) countText.textContent = `${products.length} recipes`;

    const filterBar = document.querySelector("[data-category-filters]");
    const searchInput = document.querySelector("[data-product-search]");
    const resultCount = document.querySelector("[data-result-count]");
    const params = new URLSearchParams(window.location.search);
    let activeCategory = params.get("category") || "all";
    let activeQuery = params.get("q") || "";

    if (filterBar) {
      const categories = api.getCategories(products);
      const pills = [{ slug: "all", name: "All Products" }].concat(categories);
      filterBar.innerHTML = pills.map((c) => `
        <button type="button" class="category-pill" data-cat="${c.slug}">${c.name}</button>
      `).join("");
    }

    if (searchInput) searchInput.value = activeQuery;

    function syncUrl() {
      const p = new URLSearchParams();
      if (activeCategory !== "all") p.set("category", activeCategory);
      if (activeQuery) p.set("q", activeQuery);
      const qs = p.toString();
      history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    }

    function render() {
      let list = api.getByCategory(products, activeCategory);
      list = api.search(list, activeQuery);
      grid.innerHTML = list.length ? list.map(productCardHTML).join("") : emptyStateHTML("No products match your search. Try a different keyword.");
      if (resultCount) resultCount.textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
      if (filterBar) {
        filterBar.querySelectorAll(".category-pill").forEach((btn) => {
          btn.classList.toggle("is-active", btn.dataset.cat === activeCategory);
        });
      }
      initVideoFacades(grid);
      initWhatsAppLinks();
      initReveal(grid);
      syncUrl();
    }

    if (filterBar) {
      filterBar.addEventListener("click", (e) => {
        const btn = e.target.closest(".category-pill");
        if (!btn) return;
        activeCategory = btn.dataset.cat;
        render();
      });
    }
    if (searchInput) {
      let t;
      searchInput.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(() => { activeQuery = searchInput.value; render(); }, 220);
      });
    }
    render();
  }

  /* ---------------------------------------------------------------
     Price table renderer — with live search
  --------------------------------------------------------------- */
  function priceRowHTML(p) {
    const p400 = api.formatPrice(p.price400);
    const p800 = api.formatPrice(p.price800);
    return `
      <tr>
        <td>
          <strong>${p.nameEn}</strong><br>
          <span class="price-table__ur">${p.nameUr}</span>
        </td>
        <td class="price-table__price" data-empty="${!p400}">${p400 || "Contact for Price"}</td>
        <td class="price-table__price" data-empty="${!p800}">${p800 || "Contact for Price"}</td>
        <td class="price-table__cta">
          <a class="btn btn--outline-dark btn--sm" href="/products/${p.slug}.html">View</a>
          <button type="button" class="btn btn--gold btn--sm" data-price-add-cart="${p.slug}" aria-label="Add ${p.nameEn} to cart">Add to Cart</button>
        </td>
      </tr>`;
  }

  function renderPriceTable(products) {
    const tbody = document.querySelector("[data-price-table-body]");
    if (!tbody) return;
    const searchInput = document.querySelector("[data-price-search]");
    const resultCount = document.querySelector("[data-price-result-count]");
    const filterBar = document.querySelector("[data-category-filters]");

    let activeCategory = "all";
    let activeQuery = "";

    if (filterBar) {
      const categories = api.getCategories(products);
      const pills = [{ slug: "all", name: "All" }].concat(categories);
      filterBar.innerHTML = pills.map((c) => `<button type="button" class="category-pill" data-cat="${c.slug}">${c.name}</button>`).join("");
    }

    function render() {
      let list = api.getByCategory(products, activeCategory);
      list = api.search(list, activeQuery);
      tbody.innerHTML = list.length
        ? list.map(priceRowHTML).join("")
        : `<tr><td colspan="4" class="text-center">No products match your search.</td></tr>`;
      if (resultCount) resultCount.textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
      if (filterBar) {
        filterBar.querySelectorAll(".category-pill").forEach((btn) => {
          btn.classList.toggle("is-active", btn.dataset.cat === activeCategory);
        });
      }
      initWhatsAppLinks();
    }

    render();
    if (filterBar) {
      filterBar.addEventListener("click", (e) => {
        const btn = e.target.closest(".category-pill");
        if (!btn) return;
        activeCategory = btn.dataset.cat;
        render();
      });
    }
    if (searchInput) {
      let t;
      searchInput.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(() => { activeQuery = searchInput.value; render(); }, 200);
      });
    }
  }

  /* ---------------------------------------------------------------
     Customer reviews — data-driven from reviews.json (genuine reviews)
  --------------------------------------------------------------- */
  function starsHTML(rating) {
    const full = Math.max(0, Math.min(5, Math.round(rating || 0)));
    let out = "";
    for (let i = 0; i < 5; i++) {
      out += `<svg viewBox="0 0 24 24" fill="${i < full ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.5"><path d="M12 2.5l3 6.1 6.7.97-4.85 4.73 1.14 6.67L12 17.9l-5.99 3.15 1.14-6.67L2.3 9.57l6.7-.97L12 2.5z"/></svg>`;
    }
    return out;
  }
  function initialsOf(name) {
    return String(name || "?").trim().slice(0, 1).toUpperCase();
  }
  function renderReviews(reviews, products) {
    const grid = document.querySelector("[data-reviews-grid]");
    if (!grid) return;
    if (!reviews.length) {
      grid.innerHTML = emptyStateHTML("Reviews are coming soon.");
      return;
    }
    grid.innerHTML = reviews.map((r) => {
      const product = r.product ? api.getBySlug(products, r.product) : null;
      const verified = product ? `<span class="chip" style="margin-top:.5rem">Verified order: ${product.nameEn}</span>` : "";
      return `
        <article class="review-card" data-reveal>
          <svg class="review-card__quote" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.17 6A5.17 5.17 0 002 11.17V18h6.83v-6.83H4.83a2.17 2.17 0 012.17-2.17H8V6H7.17zm10 0A5.17 5.17 0 0012 11.17V18h6.83v-6.83H14.83a2.17 2.17 0 012.17-2.17H18V6h-.83z"/></svg>
          <div class="review-card__stars" role="img" aria-label="${r.rating} out of 5 stars">${starsHTML(r.rating)}</div>
          <p class="review-card__text">&ldquo;${r.text}&rdquo;</p>
          ${verified}
          <div class="review-card__author">
            <span class="review-card__avatar" aria-hidden="true">${initialsOf(r.name)}</span>
            <div><strong>${r.name}</strong>${r.city ? `<span> ${r.city}</span>` : ""}</div>
          </div>
        </article>`;
    }).join("");
    initReveal(grid);
    injectReviewSchema(reviews);
  }

  /**
   * Merges aggregateRating + review into the homepage's existing LocalBusiness
   * JSON-LD, generated live from reviews.json (never hardcoded in HTML) so
   * structured data can never drift out of sync with the visible reviews.
   */
  function injectReviewSchema(reviews) {
    const schemaEl = document.querySelector("script[data-business-schema]");
    if (!schemaEl || !reviews.length) return;
    let data;
    try {
      data = JSON.parse(schemaEl.textContent);
    } catch (e) {
      return;
    }
    const sum = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0);
    const avg = sum / reviews.length;
    data.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": String(Math.round(avg * 10) / 10),
      "reviewCount": String(reviews.length),
      "bestRating": "5",
      "worstRating": "1",
    };
    data.review = reviews.map((r) => ({
      "@type": "Review",
      "reviewRating": { "@type": "Rating", "ratingValue": String(r.rating), "bestRating": "5" },
      "author": { "@type": "Person", "name": r.name },
      "reviewBody": r.text,
    }));
    schemaEl.textContent = JSON.stringify(data);
  }

  /* ---------------------------------------------------------------
     Footer product links — centralized from products.json
  --------------------------------------------------------------- */
  function renderFooterProducts(products) {
    document.querySelectorAll("[data-footer-products]").forEach((list) => {
      const limit = parseInt(list.getAttribute("data-limit") || "5", 10);
      const items = api.getFeatured(products, limit).length ? api.getFeatured(products, limit) : products.slice(0, limit);
      list.innerHTML = items.map((p) => `<li><a href="/products/${p.slug}.html">${p.nameEn}</a></li>`).join("");
    });
  }

  /* ---------------------------------------------------------------
     Footer category links — centralized from products.json
  --------------------------------------------------------------- */
  function renderFooterCategories(products) {
    document.querySelectorAll("[data-footer-categories]").forEach((list) => {
      const categories = api.getCategories(products);
      list.innerHTML = categories.map((c) => `<li><a href="/products.html?category=${c.slug}">${c.name}</a></li>`).join("");
    });
  }

  /* ---------------------------------------------------------------
     Blog — listing (blog.html) + article detail (/blog/<slug>.html)
     Mirrors the products.html / product-detail pattern exactly.
  --------------------------------------------------------------- */
  function blogCardHTML(a) {
    return `
      <article class="product-card" data-reveal data-slug="${a.slug}" data-category="${api.slugify(a.category)}" data-name="${a.title.toLowerCase()}">
        <div class="product-card__body">
          <span class="chip">${a.category}</span>
          <h3 class="product-card__name-en" style="margin-top:.5rem">${a.title}</h3>
          <p style="font-size:.9rem;color:var(--color-text-muted);flex:1">${a.excerpt || ""}</p>
          <div class="product-card__actions">
            <a class="btn btn--outline-dark btn--sm btn--block" href="/blog/${a.slug}.html">Read Article</a>
          </div>
        </div>
      </article>`;
  }

  function initBlogPage(articles) {
    const grid = document.querySelector("[data-blog-grid]");
    if (!grid) return;

    const filterBar = document.querySelector("[data-blog-category-filters]");
    const searchInput = document.querySelector("[data-blog-search]");
    const resultCount = document.querySelector("[data-blog-result-count]");
    const params = new URLSearchParams(window.location.search);
    let activeCategory = params.get("category") || "all";
    let activeQuery = params.get("q") || "";

    if (filterBar) {
      const categories = blogApi.getCategories(articles);
      const pills = [{ slug: "all", name: "All Articles" }].concat(categories);
      filterBar.innerHTML = pills.map((c) => `
        <button type="button" class="category-pill" data-cat="${c.slug}">${c.name}</button>
      `).join("");
    }
    if (searchInput) searchInput.value = activeQuery;

    function render() {
      let list = blogApi.getByCategory(articles, activeCategory);
      if (activeQuery) {
        const q = activeQuery.trim().toLowerCase();
        list = list.filter((a) => `${a.title} ${a.category} ${a.excerpt || ""}`.toLowerCase().includes(q));
      }
      grid.innerHTML = list.length
        ? list.map(blogCardHTML).join("")
        : emptyStateHTML("No articles yet in this category — check back soon.");
      if (resultCount) resultCount.textContent = `${list.length} article${list.length === 1 ? "" : "s"}`;
      if (filterBar) {
        filterBar.querySelectorAll(".category-pill").forEach((btn) => {
          btn.classList.toggle("is-active", btn.dataset.cat === activeCategory);
        });
      }
      initReveal(grid);
    }

    if (filterBar) {
      filterBar.addEventListener("click", (e) => {
        const btn = e.target.closest(".category-pill");
        if (!btn) return;
        activeCategory = btn.dataset.cat;
        render();
      });
    }
    if (searchInput) {
      let t;
      searchInput.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(() => { activeQuery = searchInput.value; render(); }, 220);
      });
    }
    render();
  }

  /* Blog article body blocks: a plain string renders as <p>; an object
     selects a block type ({h2}/{h3} headings, {ul}/{ol} lists) so recipe
     and guide articles can have real structure, not just flat paragraphs.
     Existing articles (plain string arrays) keep rendering exactly as
     before — this is purely additive. */
  function renderBlogBlock(block) {
    if (typeof block === "string") return `<p style="margin-block:0 1.1em">${block}</p>`;
    if (block.h2) return `<h2 style="font-size:clamp(1.25rem,2.6vw,1.6rem);margin-block:1.6em .6em">${block.h2}</h2>`;
    if (block.h3) return `<h3 style="font-size:clamp(1.1rem,2.2vw,1.3rem);margin-block:1.3em .5em">${block.h3}</h3>`;
    if (block.ul) return `<ul style="margin-block:0 1.1em;padding-inline-start:1.4em">${block.ul.map((li) => `<li style="margin-block:.3em">${li}</li>`).join("")}</ul>`;
    if (block.ol) return `<ol style="margin-block:0 1.1em;padding-inline-start:1.4em">${block.ol.map((li) => `<li style="margin-block:.3em">${li}</li>`).join("")}</ol>`;
    return "";
  }

  function initBlogDetail(articles, products) {
    const root = document.querySelector("[data-blog-slug]");
    if (!root) return;
    const slug = root.getAttribute("data-blog-slug");
    const article = blogApi.getBySlug(articles, slug);
    const container = root.querySelector("[data-blog-article-root]");
    if (!article) {
      if (container) container.innerHTML = `<div class="text-center"><h2>Article Not Found</h2><p>This article may have been removed. <a href="/blog.html">View all articles</a>.</p></div>`;
      return;
    }

    document.title = article.seoTitle || `${article.title} | ShikarpuriAchar.pk`;
    setMeta("description", article.seoDescription || article.excerpt || "");
    setMeta("keywords", (article.metaKeywords || []).join(", "));
    setOg("og:title", document.title);
    setOg("og:description", article.seoDescription || article.excerpt || "");

    const crumbCurrent = root.querySelector("[data-blog-breadcrumb-current]");
    if (crumbCurrent) crumbCurrent.textContent = article.title;
    const titleEl = root.querySelector("[data-blog-title]");
    if (titleEl) titleEl.textContent = article.title;

    if (container) {
      const body = (article.body || []).map(renderBlogBlock).join("");
      container.innerHTML = `
        <p class="chip" style="margin-bottom:1rem">${article.category}</p>
        ${body}`;
    }

    const relatedGrid = root.querySelector("[data-blog-related-products]");
    if (relatedGrid && products && products.length) {
      const slugs = article.relatedProductSlugs || [];
      const related = slugs.map((s) => api.getBySlug(products, s)).filter(Boolean);
      relatedGrid.innerHTML = related.length ? related.map(productCardHTML).join("") : "";
      initVideoFacades(relatedGrid);
      initWhatsAppLinks();
    }
  }

  /* Small "Related Reading" block on product detail pages, linking to
     blog articles that share the product's category. Runs once blog.json
     has loaded — degrades to nothing if no article matches. */
  function renderRelatedReading(articles, products) {
    const root = document.querySelector("[data-product-slug]");
    if (!root || !articles || !articles.length) return;
    const slug = root.getAttribute("data-product-slug");
    const product = api.getBySlug(products, slug);
    const container = root.querySelector("[data-product-root]");
    if (!product || !container) return;
    const matches = articles.filter((a) => api.slugify(a.category) === api.slugify(product.category)
      || (a.relatedProductSlugs || []).includes(product.slug)).slice(0, 2);
    if (!matches.length) return;
    const block = document.createElement("div");
    block.innerHTML = `
      <h2 class="mt-lg" style="font-size:clamp(1.25rem,2.6vw,1.6rem)">Related Reading</h2>
      <ul style="margin-top:.5rem">
        ${matches.map((a) => `<li><a href="/blog/${a.slug}.html">${a.title}</a></li>`).join("")}
      </ul>`;
    container.appendChild(block);
  }

  /* ---------------------------------------------------------------
     Product detail page — fully generated from products.json
  --------------------------------------------------------------- */
  /* ----- Data-driven content helpers (derived from category/name,
         never hardcoded per product) ----- */
  function tasteProfile(p) {
    const name = p.nameEn.toLowerCase();
    const cat = p.category.toLowerCase();
    const chips = [];
    if (cat.includes("murabba") || name.includes("gulqand")) chips.push("Sweet", "Fragrant", "Mild");
    else if (name.includes("sweet & sour") || name.includes("sweet and sour")) chips.push("Sweet & Sour", "Tangy");
    else if (name.includes("sweet")) chips.push("Sweet", "Rich");
    else if (name.includes("chilli") || name.includes("chili")) chips.push("Fiery", "Bold");
    else if (name.includes("garlic") || name.includes("lehsan")) chips.push("Bold", "Savoury");
    else if (name.includes("ginger") || name.includes("adrak")) chips.push("Sharp", "Warming");
    else if (name.includes("lemon") || name.includes("imli")) chips.push("Zesty", "Tangy");
    else if (cat.includes("chutney")) chips.push("Tangy", "Fresh");
    else chips.push("Tangy", "Traditional Spice");
    if (cat.includes("oil")) chips.push("Mustard Oil Depth");
    else if (cat.includes("vinegar")) chips.push("Vinegar Brightness");
    return chips;
  }

  function storageInfo(p) {
    const cat = p.category.toLowerCase();
    if (cat.includes("super food")) return "Store in a cool, dry, airtight container away from direct sunlight and moisture. No refrigeration needed.";
    if (cat.includes("murabba")) return "Store in a cool, dry place away from direct sunlight and always use a clean, dry spoon. Refrigeration is optional but helps in hot weather.";
    if (cat.includes("chutney")) return "Keep the jar tightly closed and refrigerate after opening. Always use a clean, dry spoon to keep it fresh longer.";
    if (cat.includes("vinegar")) return "Store in a cool, dry place away from sunlight. After opening, refrigeration is recommended for the best taste. Always use a dry spoon.";
    return "No refrigeration needed — mustard oil is a natural preservative. Keep the jar tightly closed in a cool, dry place, keep the pieces submerged in oil, and always use a dry spoon.";
  }

  function shelfLifeInfo(p) {
    const cat = p.category.toLowerCase();
    if (cat.includes("super food")) return "Several months when stored in a cool, dry, airtight container — check the pack for the exact best-before date.";
    if (cat.includes("murabba")) return "Several months in cool, dry storage — murabba is a traditional sugar preserve and keeps very well.";
    if (cat.includes("chutney")) return "Best enjoyed within 2–3 months of opening when kept refrigerated with a dry spoon.";
    if (cat.includes("vinegar")) return "Several months sealed; once opened, keep refrigerated and it stays fresh for a long time.";
    return "Traditional oil pickles keep for many months at room temperature — the flavour actually matures and improves with time.";
  }

  function spiceLevelInfo(p) {
    const name = p.nameEn.toLowerCase();
    const cat = p.category.toLowerCase();
    if (cat.includes("super food")) {
      return `${p.nameEn} is not a spice — it's a plain, mild everyday superfood you can add to your own recipes.`;
    }
    if (cat.includes("murabba") || name.includes("gulqand") || name.includes("ketchup") || (name.includes("sweet") && !name.includes("sour"))) {
      return `${p.nameEn} is not spicy — it's a sweet preparation the whole family can enjoy.`;
    }
    if (name.includes("chilli") || name.includes("chili")) {
      return `${p.nameEn} is on the spicier side — made for people who love real heat. If you prefer milder flavours, try one of our murabba or sweet chutneys.`;
    }
    if (name.includes("sweet & sour") || name.includes("sweet and sour")) {
      return `${p.nameEn} is mild — the sweetness balances the spice, making it family-friendly.`;
    }
    return `${p.nameEn} has a balanced, traditional medium spice level — flavourful without being overwhelming.`;
  }

  function productFaqs(p) {
    const priceText = p.price400
      ? `The 400g jar is Rs. ${Number(p.price400).toLocaleString("en-PK")} and the 800g jar is Rs. ${Number(p.price800).toLocaleString("en-PK")}.`
      : "Message us on WhatsApp for the current price.";
    return [
      { q: `How spicy is ${p.nameEn}?`, a: spiceLevelInfo(p) },
      { q: `How long does ${p.nameEn} last?`, a: shelfLifeInfo(p) },
      { q: "Does it need refrigeration?", a: storageInfo(p) },
      { q: "Is delivery available across Pakistan?", a: `Yes — we deliver ${p.nameEn} nationwide. Delivery charges are Rs. ${cfg.deliveryCharge}, minimum product order Rs. ${cfg.minProductOrder}, and Cash on Delivery is available on orders of Rs. ${cfg.minCodOrder} or more.` },
      { q: "How do I order on WhatsApp?", a: `Choose your jar size (400g or 800g) and quantity above, then tap "Order on WhatsApp" — your message is pre-filled with the product, weight and price. ${priceText} Advance payment gets ${cfg.advanceDiscountPercent}% off.` },
    ];
  }

  function renderProductFaq(product) {
    const faqRoot = document.querySelector("[data-product-faq]");
    if (!faqRoot) return;
    const faqs = productFaqs(product);
    faqRoot.innerHTML = faqs.map((f, i) => `
      <details class="faq-item"${i === 0 ? " open" : ""}>
        <summary class="faq-item__q">${f.q}
          <span class="faq-item__icon" aria-hidden="true">+</span>
        </summary>
        <div class="faq-item__a">${f.a}</div>
      </details>`).join("");
    initFaq();

    /* FAQPage schema for this product's questions */
    if (!document.querySelector("script[data-faq-schema]")) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-faq-schema", "");
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map((f) => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      });
      document.head.appendChild(script);
    }
  }

  function initProductDetail(products) {
    const root = document.querySelector("[data-product-slug]");
    if (!root) return;
    const slug = root.getAttribute("data-product-slug");
    const product = api.getBySlug(products, slug);
    const container = root.querySelector("[data-product-root]");
    if (!product) {
      if (container) container.innerHTML = `<div class="text-center"><h2>Product Not Found</h2><p>This product may have been removed. <a href="/products.html">View all products</a>.</p></div>`;
      return;
    }

    /* SEO: title + meta, driven entirely by products.json.
       (Generated pages already bake these in — the JS keeps them in
       sync if products.json changes before pages are regenerated.) */
    document.title = product.seoTitle || `${product.nameEn} | ShikarpuriAchar.pk`;
    setMeta("description", product.seoDescription || product.shortDescription);
    setMeta("keywords", (product.metaKeywords || []).join(", "));
    setOg("og:title", document.title);
    setOg("og:description", product.seoDescription || product.shortDescription);
    injectProductSchema(product);

    /* Breadcrumb + hero title */
    const crumbCurrent = root.querySelector("[data-breadcrumb-current]");
    if (crumbCurrent) crumbCurrent.textContent = product.nameEn;
    const heroTitle = root.querySelector("[data-product-hero-title]");
    if (heroTitle) heroTitle.textContent = product.nameEn;
    const heroUr = root.querySelector("[data-product-hero-ur]");
    if (heroUr) heroUr.textContent = product.nameUr;

    const comingSoon = product.status && product.status !== "active";
    const p400 = api.formatPrice(product.price400);
    const p800 = api.formatPrice(product.price800);
    const taste = tasteProfile(product);

    if (container) {
      container.innerHTML = `
        <div class="product-detail__media" data-youtube-url="${product.youtubeUrl || ""}" data-video-label="${product.nameEn}"></div>
        <div class="product-detail__info" data-reveal>
          <h2 style="font-size:clamp(1.7rem,3.6vw,2.4rem)">${product.nameEn}</h2>
          <p class="product-detail__title-ur">${product.nameUr}</p>
          <div class="product-detail__meta">
            <a class="chip" href="/products.html?category=${api.slugify(product.category)}">${product.category}</a>
            ${comingSoon ? `<span class="chip" style="background:var(--color-dark-red);color:#fff;border-color:transparent">${product.status.replace(/-/g, " ")}</span>` : `<span class="chip">In Stock</span>`}
          </div>
          <p class="product-detail__intro">${product.shortDescription || ""}</p>
          <p style="font-size:.9rem"><a href="/price-list.html">See full price list</a> &middot; <a href="/contact.html">Contact us</a></p>

          <div class="buy-box">
            <div class="variant-select" role="radiogroup" aria-label="Select size" style="margin-bottom:0">
              <label class="variant-option is-selected">
                <input type="radio" name="variant" value="400g" checked>
                <strong>400g</strong>
                <span>${p400 || "Contact for Price"}</span>
              </label>
              <label class="variant-option">
                <input type="radio" name="variant" value="800g">
                <strong>800g</strong>
                <span>${p800 || "Contact for Price"}</span>
              </label>
            </div>
            <div class="qty-row">
              <span class="qty-row__label">Quantity</span>
              <div class="qty-stepper" role="group" aria-label="Quantity">
                <button type="button" data-qty-minus aria-label="Decrease quantity">&minus;</button>
                <span data-qty-value aria-live="polite">1</span>
                <button type="button" data-qty-plus aria-label="Increase quantity">+</button>
              </div>
              <strong class="qty-row__total" data-price-display></strong>
            </div>
            <div class="product-detail__actions" style="margin-top:0">
              <button type="button" class="btn btn--outline-dark btn--lg" data-detail-add-cart>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="9" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/><path d="M2.5 3h2l2.2 11.2a2 2 0 002 1.6h8a2 2 0 002-1.7L20.5 7H6"/></svg>
                Add to Cart
              </button>
              <a class="btn btn--whatsapp btn--lg" data-order-btn href="#" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.1.2-.3.3-.4.1-.2 0-.3 0-.5s-.6-1.5-.9-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z"/><path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.8-1.5c1.5.8 3.3 1.3 5.2 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.3c-1.7 0-3.4-.5-4.8-1.3l-.3-.2-3.2 1 1-3.2-.2-.3C3.5 15 3 13.5 3 12c0-5 4-9 9-9s9 4 9 9-4 9-9 9z"/></svg>
                ${comingSoon ? "Notify Me on WhatsApp" : "Order on WhatsApp"}
              </a>
            </div>
            <p class="buy-box__note">${cfg.advanceDiscountPercent}% off on advance payment &middot; COD available (min. Rs. ${cfg.minCodOrder}) &middot; Delivery Rs. ${cfg.deliveryCharge}</p>
          </div>

          ${product.whatIsIt ? `
            <h2 class="mt-lg" style="font-size:clamp(1.25rem,2.6vw,1.6rem)">What Is ${product.nameEn}?</h2>
            <p style="margin-block:.5rem 0">${product.whatIsIt}</p>` : ""}

          ${product.traditionalBackground ? `
            <h2 class="mt-lg" style="font-size:clamp(1.25rem,2.6vw,1.6rem)">Traditional Sindhi Background</h2>
            <p style="margin-block:.5rem 0">${product.traditionalBackground}</p>` : ""}

          <h2 class="mt-lg" style="font-size:clamp(1.25rem,2.6vw,1.6rem)">Traditional Recipe</h2>
          <p class="product-detail__desc" style="margin-block:.5rem 0">${product.description}</p>

          ${(product.ingredients && product.ingredients.length) ? `
            <h2 class="mt-lg" style="font-size:clamp(1.25rem,2.6vw,1.6rem)">What's Inside</h2>
            <ul class="ingredients-list">
              ${product.ingredients.map((i) => `<li>${i}</li>`).join("")}
            </ul>` : ""}

          ${product.howToEat ? `
            <h2 class="mt-lg" style="font-size:clamp(1.25rem,2.6vw,1.6rem)">How To Eat ${product.nameEn}</h2>
            <p style="margin-block:.5rem 0">${product.howToEat}</p>` : ""}

          <h2 class="mt-lg" style="font-size:clamp(1.25rem,2.6vw,1.6rem)">Taste Profile</h2>
          <div class="taste-chips">
            ${taste.map((t) => `<span class="chip chip--gold">${t}</span>`).join("")}
          </div>
          ${product.tasteProfileText ? `<p style="margin-block:.6rem 0">${product.tasteProfileText}</p>` : ""}

          <h2 class="mt-lg" style="font-size:clamp(1.25rem,2.6vw,1.6rem)">Storage</h2>
          <p style="font-size:.95rem;margin-top:.4rem">${storageInfo(product)}</p>

          ${product.whoShouldBuy ? `
            <h2 class="mt-lg" style="font-size:clamp(1.25rem,2.6vw,1.6rem)">Who Should Buy ${product.nameEn}?</h2>
            <p style="margin-block:.5rem 0">${product.whoShouldBuy}</p>` : ""}
        </div>`;
    }

    initVideoFacades(root);

    /* Weight + quantity → live total + WhatsApp message */
    let qty = 1;
    const orderBtn = root.querySelector("[data-order-btn]");
    const priceDisplay = root.querySelector("[data-price-display]");
    const qtyValue = root.querySelector("[data-qty-value]");
    const variantInputs = root.querySelectorAll(".variant-option input[name='variant']");

    function selectedWeight() {
      const checked = root.querySelector(".variant-option input[name='variant']:checked");
      return checked ? checked.value : "400g";
    }
    function updateOrder() {
      const weight = selectedWeight();
      const unitPrice = weight === "800g" ? product.price800 : product.price400;
      if (qtyValue) qtyValue.textContent = qty;
      if (priceDisplay) {
        priceDisplay.textContent = unitPrice
          ? `Total: Rs. ${Number(unitPrice * qty).toLocaleString("en-PK")}`
          : "Price confirmed on WhatsApp";
      }
      if (orderBtn) orderBtn.href = api.buildWhatsAppLink(api.buildProductOrderMessage(product, weight, { qty, unitPrice }));
      variantInputs.forEach((input) => {
        input.closest(".variant-option").classList.toggle("is-selected", input.checked);
      });
    }
    variantInputs.forEach((input) => input.addEventListener("change", updateOrder));
    const minusBtn = root.querySelector("[data-qty-minus]");
    const plusBtn = root.querySelector("[data-qty-plus]");
    if (minusBtn) minusBtn.addEventListener("click", () => { qty = Math.max(1, qty - 1); updateOrder(); });
    if (plusBtn) plusBtn.addEventListener("click", () => { qty = Math.min(50, qty + 1); updateOrder(); });
    const addCartBtn = root.querySelector("[data-detail-add-cart]");
    if (addCartBtn) {
      addCartBtn.addEventListener("click", () => {
        window.CartAPI.add(product.slug, selectedWeight(), qty);
        flashButton(addCartBtn, "Added to Cart ✓");
        openCart();
      });
    }
    updateOrder();

    /* Per-product FAQ + schema */
    renderProductFaq(product);

    /* Related products — same category first */
    const relatedGrid = root.querySelector("[data-related-grid]");
    if (relatedGrid) {
      const related = api.getRelated(products, slug, 3);
      relatedGrid.innerHTML = related.map(productCardHTML).join("");
      initVideoFacades(relatedGrid);
      initWhatsAppLinks();
    }
    initReveal(root);
  }

  function setMeta(name, content) {
    if (!content) return;
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }
  function setOg(property, content) {
    if (!content) return;
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("property", property);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }
  function injectProductSchema(product) {
    /* Generated product pages already ship a static Product schema. */
    if (document.querySelector("script[data-product-schema]")) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    const data = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.nameEn,
      "description": product.shortDescription,
      "category": product.category,
      "sku": product.id,
      "brand": { "@type": "Brand", "name": "ShikarpuriAchar.pk" },
    };
    const offers = [];
    if (product.price400) offers.push({ "@type": "Offer", "name": "400g", "price": product.price400, "priceCurrency": "PKR", "availability": product.status === "active" ? "https://schema.org/InStock" : "https://schema.org/PreOrder" });
    if (product.price800) offers.push({ "@type": "Offer", "name": "800g", "price": product.price800, "priceCurrency": "PKR", "availability": product.status === "active" ? "https://schema.org/InStock" : "https://schema.org/PreOrder" });
    if (offers.length) data.offers = offers;
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /* ---------------------------------------------------------------
     Contact form -> WhatsApp
  --------------------------------------------------------------- */
  function initContactForm() {
    const form = document.querySelector("#contact-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get("name") || "").toString().trim();
      const phone = (data.get("phone") || "").toString().trim();
      const city = (data.get("city") || "").toString().trim();
      const message = (data.get("message") || "").toString().trim();

      let text = `Assalam-o-Alaikum! My name is ${name || "___"}.`;
      if (city) text += ` I'm from ${city}.`;
      text += ` ${message || "I would like to know more about your products."}`;
      if (phone) text += ` (Contact: ${phone})`;

      window.open(api.buildWhatsAppLink(text), "_blank", "noopener");
    });
  }

  /* ---------------------------------------------------------------
     FAQ accordion (native <details>, close others on open)
  --------------------------------------------------------------- */
  function initFaq() {
    document.querySelectorAll(".faq-item").forEach((item) => {
      item.addEventListener("toggle", () => {
        if (item.open) {
          document.querySelectorAll(".faq-item[open]").forEach((other) => {
            if (other !== item) other.removeAttribute("open");
          });
        }
      });
    });
  }

  function initYear() {
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------------------------------------------------------------
     Hydrate on-page order/delivery figures from SITE_CONFIG — never
     hardcoded. Elements ship with a correct static fallback (for
     no-JS/crawlers) inside <span data-cfg="...">, which this
     overwrites with the live value on load.
  --------------------------------------------------------------- */
  function initDynamicConfigText() {
    const fmt = {
      minCodOrder: () => `${Number(cfg.minCodOrder).toLocaleString("en-PK")}`,
      minProductOrder: () => `${Number(cfg.minProductOrder).toLocaleString("en-PK")}`,
      deliveryCharge: () => `${Number(cfg.deliveryCharge).toLocaleString("en-PK")}`,
      advanceDiscountPercent: () => `${cfg.advanceDiscountPercent}%`,
    };
    document.querySelectorAll("[data-cfg]").forEach((el) => {
      const key = el.getAttribute("data-cfg");
      if (fmt[key]) el.textContent = fmt[key]();
    });

    /* Rebuild the static FAQPage JSON-LD (faq.html) from the now-hydrated
       visible Q&A so structured data always matches on-page text exactly
       — single source of truth is the DOM, which itself reads SITE_CONFIG. */
    const schemaEl = document.querySelector("script[data-faq-schema-static]");
    const items = document.querySelectorAll(".faq-list .faq-item");
    if (schemaEl && items.length) {
      const mainEntity = [...items].map((item) => ({
        "@type": "Question",
        "name": item.querySelector(".faq-item__q").childNodes[0].textContent.trim(),
        "acceptedAnswer": { "@type": "Answer", "text": item.querySelector(".faq-item__a").textContent.trim() },
      }));
      schemaEl.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": mainEntity,
      });
    }
  }

  /* ---------------------------------------------------------------
     Boot
  --------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initHeader();
    initMobileNav();
    setActiveNavLink();
    initBackToTop();
    initWhatsAppLinks();
    initYouTubeLinks();
    initSocialLinks();
    initContactForm();
    initDynamicConfigText();
    initFaq();
    initYear();
    initReveal();

    initCardInteractions();

    if (window.CartAPI) {
      injectCartUI();
      initCartEvents();
    }

    if (!api) return;
    api.ready.then((products) => {
      productsCache = products;
      renderFeaturedGrid(products);
      renderVideoGrid(products);
      initProductsPage(products);
      renderPriceTable(products);
      initProductDetail(products);
      renderFooterProducts(products);
      renderFooterCategories(products);
      if (window.CartAPI) renderCart(products);

      const reviewsApi = window.ReviewsAPI;
      if (reviewsApi) reviewsApi.ready.then((reviews) => renderReviews(reviews, products));

      if (blogApi) {
        blogApi.ready.then((articles) => {
          initBlogPage(articles);
          initBlogDetail(articles, products);
          renderRelatedReading(articles, products);
        });
      }
    });
  });
})();
