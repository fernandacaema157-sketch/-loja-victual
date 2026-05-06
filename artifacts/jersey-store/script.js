// Clerk is loaded dynamically in initAuth() — no static import needed

/**
 * JerseyStore — Vanilla JS SPA
 *
 * Sections:
 *  1. CONFIG        — constants, env vars
 *  2. STATE         — app-level state object
 *  3. ICONS         — inline SVG helpers
 *  4. API           — Fetch API wrappers (async/await)
 *  5. AUTH          — Clerk JS initialization & helpers
 *  6. CART          — localStorage (guest) + server (logged-in)
 *  7. TOAST         — notification system
 *  8. ROUTER        — hash-based SPA routing
 *  9. HELPERS       — format, render utilities
 * 10. PAGES         — render functions for each page
 * 11. NAVBAR        — dynamic navbar updates
 * 12. INIT          — startup
 */

// ============================================================
// 1. CONFIG
// ============================================================

const CLERK_KEY       = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
const STORE_WHATSAPP  = import.meta.env.VITE_STORE_WHATSAPP || '5511999999999';
const CART_LS_KEY     = 'jerseystore_cart'; // localStorage key for guest cart
const TEAM_IMAGES = {
  'Real Madrid':       '/images/real-madrid.png',
  'Barcelona':         '/images/barcelona.png',
  'PSG':               '/images/psg.png',
  'Manchester United': '/images/man-united.png',
  'Brasil':            '/images/brasil.png',
  'Argentina':         '/images/argentina.png',
  'Bayern Munich':     '/images/bayern.png',
  'Liverpool':         '/images/liverpool.png',
};

// ============================================================
// 2. STATE
// ============================================================

const state = {
  clerk:       null,   // Clerk instance (from CDN)
  user:        null,   // current Clerk user object (or null)
  // Transient checkout data passed from cart → checkout page
  checkout: {
    shippingMethod: 'standard',
    shippingCost:   19.90,
    orderId:        null,
    step:           1,
    address:        {},
  },
};

// ============================================================
// 3. ICONS  (Lucide-compatible inline SVG strings)
// ============================================================

const ic = {
  arrow_left:  `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>`,
  arrow_right: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M5 12h14"/><polyline points="12 5 19 12 12 19"/></svg>`,
  cart:        `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
  check:       `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  trash:       `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  minus:       `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  plus:        `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  chevron_r:   `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>`,
  package:     `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  truck:       `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
  card:        `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  map_pin:     `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  shield:      `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  zap:         `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  logout:      `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  orders_icon: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  dashboard:   `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  dollar:      `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  users:       `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  alert:       `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  pencil:      `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  star_filled: `★`,
  clock:       `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  home:        `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
};

// ============================================================
// 4. API  — all calls go through apiFetch()
// ============================================================

/**
 * Central fetch helper. Attaches Bearer token when user is logged in.
 * Throws an Error for non-OK responses.
 */
async function apiFetch(path, options = {}) {
  // Get a short-lived JWT from the active Clerk session (if any)
  let token = null;
  if (state.clerk?.session) {
    try { token = await state.clerk.session.getToken(); } catch (_) {}
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`/api${path}`, { ...options, headers });

  // No-content response
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data;
}

// Thin wrappers around each endpoint group
const api = {
  products: {
    list:     (params = {}) => apiFetch(`/products?${new URLSearchParams(params)}`),
    featured: ()            => apiFetch('/products/featured'),
    teams:    ()            => apiFetch('/products/teams'),
    get:      (id)          => apiFetch(`/products/${id}`),
    create:   (data)        => apiFetch('/products', { method: 'POST', body: JSON.stringify(data) }),
    update:   (id, data)    => apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete:   (id)          => apiFetch(`/products/${id}`, { method: 'DELETE' }),
  },
  cart: {
    get:        ()              => apiFetch('/cart'),
    add:        (data)          => apiFetch('/cart/items', { method: 'POST', body: JSON.stringify(data) }),
    update:     (itemId, data)  => apiFetch(`/cart/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove:     (itemId)        => apiFetch(`/cart/items/${itemId}`, { method: 'DELETE' }),
    clear:      ()              => apiFetch('/cart/clear', { method: 'DELETE' }),
    shipping:   (zipCode)       => apiFetch('/cart/shipping', { method: 'POST', body: JSON.stringify({ zipCode }) }),
  },
  orders: {
    list:    ()       => apiFetch('/orders'),
    get:     (id)     => apiFetch(`/orders/${id}`),
    create:  (data)   => apiFetch('/orders', { method: 'POST', body: JSON.stringify(data) }),
    payment: (id, d)  => apiFetch(`/orders/${id}/payment`, { method: 'POST', body: JSON.stringify(d) }),
  },
  admin: {
    stats:        ()       => apiFetch('/admin/stats'),
    orders:       (p = {}) => apiFetch(`/admin/orders?${new URLSearchParams(p)}`),
    salesByTeam:  ()       => apiFetch('/admin/sales-by-team'),
    updateStatus: (id, s)  => apiFetch(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: s }) }),
    guestOrders:  ()       => apiFetch('/admin/guest-orders'),
    updateGuestStatus: (id, s) => apiFetch(`/admin/guest-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: s }) }),
  },
  guestOrders: {
    create: (data) => apiFetch('/guest-orders', { method: 'POST', body: JSON.stringify(data) }),
    get:    (num)  => apiFetch(`/guest-orders/${num}`),
  },
};

// ============================================================
// 5. AUTH  — Clerk JS (loaded from CDN as window.Clerk)
// ============================================================

/** Dynamically load the Clerk browser bundle from CDN (includes full UI components).
 *  Setting data-clerk-publishable-key on the script element tells Clerk to
 *  auto-initialize with our key so it never throws "Missing publishableKey". */
function loadClerkCDN() {
  return new Promise((resolve, reject) => {
    // Already loaded — window.Clerk may be the auto-init instance or the class
    if (window.Clerk) { resolve(); return; }

    const script = document.createElement('script');
    script.setAttribute('data-clerk-publishable-key', CLERK_KEY);
    script.src = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js';
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Clerk CDN'));
    document.head.appendChild(script);
  });
}

/** Boot Clerk, listen for auth state changes */
async function initAuth() {
  if (!CLERK_KEY) return; // gracefully skip if no key

  await loadClerkCDN();

  // When loaded with data-clerk-publishable-key, window.Clerk is the singleton instance.
  // Calling load() is idempotent; it resolves immediately if already done.
  state.clerk = window.Clerk;
  await state.clerk.load();

  // Initial user state
  state.user = state.clerk.user || null;

  // React to sign-in / sign-out events
  state.clerk.addListener(({ user }) => {
    const wasLoggedIn = !!state.user;
    state.user = user || null;

    if (!wasLoggedIn && state.user) {
      // User just signed in → merge local cart to server
      mergeLocalCartToServer().then(() => {
        updateNavbar();
        navigate('#shop');
      });
    } else if (wasLoggedIn && !state.user) {
      // User signed out
      updateNavbar();
      navigate('#home');
    } else {
      updateNavbar();
    }
  });
}

function isLoggedIn() { return !!state.user; }
function isAdmin() {
  return state.user?.emailAddresses?.some(e => e.emailAddress?.includes('admin')) ?? false;
}

// ============================================================
// 6. CART  — guest (localStorage) + server (logged-in)
// ============================================================

// --- Guest cart helpers (localStorage) ---

function lsCartGet() {
  try { return JSON.parse(localStorage.getItem(CART_LS_KEY) || '[]'); }
  catch (_) { return []; }
}

function lsCartSave(items) {
  localStorage.setItem(CART_LS_KEY, JSON.stringify(items));
}

function lsCartAdd(item) {
  const items = lsCartGet();
  const idx = items.findIndex(i =>
    i.productId === item.productId &&
    i.size === item.size &&
    i.customName === (item.customName || '') &&
    i.customNumber === (item.customNumber || '')
  );
  if (idx >= 0) {
    items[idx].quantity = Math.min(items[idx].quantity + item.quantity, 99);
  } else {
    items.push({ ...item, id: Date.now() }); // temporary local id
  }
  lsCartSave(items);
}

function lsCartUpdate(id, qty) {
  const items = lsCartGet();
  const idx = items.findIndex(i => i.id === id);
  if (idx < 0) return;
  if (qty < 1) { items.splice(idx, 1); }
  else { items[idx].quantity = qty; }
  lsCartSave(items);
}

function lsCartRemove(id) {
  const items = lsCartGet().filter(i => i.id !== id);
  lsCartSave(items);
}

function lsCartClear() { localStorage.removeItem(CART_LS_KEY); }

function lsCartCount() { return lsCartGet().reduce((s, i) => s + i.quantity, 0); }

/**
 * When a guest logs in, push their localStorage items to the server cart,
 * then clear local storage.
 */
async function mergeLocalCartToServer() {
  const items = lsCartGet();
  if (!items.length) return;
  for (const item of items) {
    try {
      await api.cart.add({
        productId:    item.productId,
        size:         item.size,
        quantity:     item.quantity,
        customName:   item.customName || null,
        customNumber: item.customNumber || null,
      });
    } catch (_) { /* ignore individual merge errors */ }
  }
  lsCartClear();
}

/** Returns the effective cart for the current user (local or server) */
async function getEffectiveCart() {
  if (isLoggedIn()) {
    return api.cart.get();
  }
  // Build a server-like response from localStorage
  const items = lsCartGet();
  const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  return { items, subtotal, itemCount };
}

/** Add to cart (local for guests, server for logged-in) */
async function cartAdd({ productId, name, team, size, price, quantity, customName, customNumber, imageUrl }) {
  if (isLoggedIn()) {
    await api.cart.add({ productId, size, quantity, customName: customName || null, customNumber: customNumber || null });
  } else {
    lsCartAdd({ productId, name, team, size, price, quantity: quantity || 1, customName: customName || '', customNumber: customNumber || '', imageUrl });
  }
  await refreshCartBadge();
}

/** Update quantity (local or server) */
async function cartUpdate(id, qty) {
  if (isLoggedIn()) {
    if (qty < 1) await api.cart.remove(id);
    else await api.cart.update(id, { quantity: qty });
  } else {
    lsCartUpdate(id, qty);
  }
  await refreshCartBadge();
}

/** Remove item */
async function cartRemove(id) {
  if (isLoggedIn()) await api.cart.remove(id);
  else lsCartRemove(id);
  await refreshCartBadge();
}

/** Clear entire cart */
async function cartClear() {
  if (isLoggedIn()) await api.cart.clear();
  else lsCartClear();
  await refreshCartBadge();
}

/** Update the cart badge in navbar */
async function refreshCartBadge() {
  try {
    let count;
    if (isLoggedIn()) {
      const cart = await api.cart.get().catch(() => null);
      count = cart?.itemCount ?? 0;
    } else {
      count = lsCartCount();
    }
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    badge.textContent = count > 9 ? '9+' : String(count);
    badge.classList.toggle('zero', count === 0);
  } catch (_) {}
}

// ============================================================
// 7. TOAST  — lightweight notification
// ============================================================

function toast(message, type = 'success', duration = 3500) {
  const container = document.getElementById('toasts');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove());
  }, duration);
}

// ============================================================
// 8. ROUTER  — hash-based SPA
// ============================================================

function getRoute() {
  const raw = window.location.hash.slice(1) || 'home';
  const [page, qs] = raw.split('?');
  const params = Object.fromEntries(new URLSearchParams(qs || ''));
  return { page: page || 'home', params };
}

function navigate(hash) {
  window.location.hash = hash;
}

/** Called on every hashchange and on initial load */
async function handleRoute() {
  const { page, params } = getRoute();
  const app = document.getElementById('app');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Show loader while page renders
  app.innerHTML = `<div class="page-loader"><div class="spinner"></div></div>`;

  // Update active link in navbar
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href')?.slice(1) || '';
    a.classList.toggle('active', href === page);
  });

  try {
    switch (page) {
      case 'home':            await renderHome(); break;
      case 'shop':            await renderShop(params); break;
      case 'product':         await renderProduct(params); break;
      case 'cart':            await renderCart(); break;
      case 'checkout':
        if (!isLoggedIn()) { navigate('#sign-in'); return; }
        await renderCheckout(params);
        break;
      case 'orders':
        if (!isLoggedIn()) { navigate('#sign-in'); return; }
        await renderOrders();
        break;
      case 'order':
        if (!isLoggedIn()) { navigate('#sign-in'); return; }
        await renderOrderDetail(params);
        break;
      case 'admin':
        if (!isLoggedIn()) { navigate('#sign-in'); return; }
        await renderAdmin();
        break;
      case 'admin-products':
        if (!isLoggedIn()) { navigate('#sign-in'); return; }
        await renderAdminProducts();
        break;
      case 'sign-in':         await renderSignIn(); break;
      case 'sign-up':         await renderSignUp(); break;
      default:
        app.innerHTML = `<div class="empty-state page" style="min-height:80vh">
          <div class="empty-icon">404</div>
          <p class="empty-title">Página não encontrada</p>
          <a href="#home" class="btn btn-primary" style="margin-top:1rem">Voltar ao início</a>
        </div>`;
    }
  } catch (err) {
    console.error('Route render error:', err);
    app.innerHTML = `<div class="empty-state page" style="min-height:70vh">
      <div class="empty-icon">${ic.alert}</div>
      <p class="empty-title">Algo deu errado</p>
      <p class="empty-sub">${err.message}</p>
      <a href="#home" class="btn btn-primary" style="margin-top:1rem">Voltar ao início</a>
    </div>`;
  }
}

// ============================================================
// 9. HELPERS
// ============================================================

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function fmtPrice(v) { return `R$ ${Number(v).toFixed(2).replace('.', ',')}` ; }
function fmtDate(s)  {
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function teamImg(team) { return TEAM_IMAGES[team] || '/images/real-madrid.png'; }

const STATUS = {
  pending:    { label: 'Aguardando',   cls: 'badge-yellow' },
  processing: { label: 'Processando',  cls: 'badge-blue'   },
  shipped:    { label: 'Enviado',      cls: 'badge-purple'  },
  delivered:  { label: 'Entregue',     cls: 'badge-green'   },
  cancelled:  { label: 'Cancelado',    cls: 'badge-red'     },
};

function statusBadge(s) {
  const info = STATUS[s] || { label: s, cls: 'badge-yellow' };
  return `<span class="badge ${info.cls}">${info.label}</span>`;
}

function starsHtml() {
  return `<span class="product-stars">${ic.star_filled}${ic.star_filled}${ic.star_filled}${ic.star_filled}${ic.star_filled}</span>`;
}

/** Render a product card (used in home & shop) */
function productCardHtml(p) {
  const img = p.imageUrl || teamImg(p.team);
  return `
  <div class="product-card" data-action="goto-product" data-id="${p.id}" style="cursor:pointer">
    <div class="product-img-wrap">
      <img src="${img}" alt="${p.name}" loading="lazy" />
      <span class="product-team-badge label-outline">${p.team}</span>
      ${p.allowCustomization ? `<span class="product-custom-badge">CUSTOM</span>` : ''}
      ${p.stock === 0 ? `<div class="product-oos-overlay">Esgotado</div>` : ''}
      ${p.stock > 0 && p.stock < 10 ? `<span style="position:absolute;bottom:.5rem;right:.5rem;background:rgba(249,115,22,.9);color:#fff;font-size:.6rem;font-weight:700;padding:.2rem .5rem;border-radius:99px;">Últimas</span>` : ''}
    </div>
    <div class="product-body">
      <p class="product-name truncate">${p.name}</p>
      ${starsHtml()}
      <div class="product-footer">
        <span class="product-price">${fmtPrice(p.price)}</span>
        ${p.allowCustomization ? `<span style="font-size:.65rem;color:var(--primary);font-weight:700;border:1px solid rgba(0,255,135,.3);border-radius:99px;padding:.15rem .4rem">CUSTOM</span>` : ''}
      </div>
      <div class="product-sizes">
        ${(p.sizes || []).map(s => `<span class="product-size-tag">${s}</span>`).join('')}
      </div>
    </div>
  </div>`;
}

// ============================================================
// 10. PAGES
// ============================================================

// ── HOME ────────────────────────────────────────────────────

async function renderHome() {
  const app = document.getElementById('app');

  // Fetch data in parallel
  const [featured, teams] = await Promise.all([
    api.products.featured().catch(() => []),
    api.products.teams().catch(() => []),
  ]);

  app.innerHTML = `
  <!-- HERO -->
  <section class="hero">
    <div class="hero-bg">
      <img src="/images/hero-banner.png" alt="Hero" />
    </div>
    <div class="hero-content">
      <div class="hero-eyebrow">${ic.zap} Camisetas Premium</div>
      <h1 class="hero-title">VESTE O<br><span class="accent">SEU TIME</span><br>COM ESTILO</h1>
      <p class="hero-sub">Camisetas esportivas oficiais dos maiores times do mundo. Personalize com seu nome e número.</p>
      <div class="hero-actions">
        <a href="#shop" class="btn btn-primary btn-lg" data-action="nav-shop">Ver Catálogo ${ic.arrow_right}</a>
        ${!isLoggedIn() ? `<a href="#sign-up" class="btn btn-outline btn-lg">Criar Conta</a>` : ''}
      </div>
    </div>
  </section>

  <!-- FEATURES BAR -->
  <div class="features-bar">
    <div class="features-grid">
      <div class="feature-item">
        <div class="feature-icon">${ic.shield}</div>
        <div>
          <p class="feature-title">Qualidade Garantida</p>
          <p class="feature-desc">Materiais premium que duram temporadas</p>
        </div>
      </div>
      <div class="feature-item">
        <div class="feature-icon">${ic.zap}</div>
        <div>
          <p class="feature-title">Personalização</p>
          <p class="feature-desc">Seu nome e número em qualquer camisa</p>
        </div>
      </div>
      <div class="feature-item">
        <div class="feature-icon">${ic.truck}</div>
        <div>
          <p class="feature-title">Entrega Rápida</p>
          <p class="feature-desc">Receba em até 10 dias úteis</p>
        </div>
      </div>
    </div>
  </div>

  <!-- FEATURED PRODUCTS -->
  <section class="section">
    <div class="section-inner">
      <div class="section-header">
        <div>
          <p class="section-eyebrow">Destaque</p>
          <h2 class="section-title">MAIS VENDIDOS</h2>
        </div>
        <a href="#shop" class="section-link">Ver todos ${ic.arrow_right}</a>
      </div>
      <div class="product-grid">
        ${featured.map(productCardHtml).join('') || '<p style="color:var(--muted)">Nenhum produto em destaque.</p>'}
      </div>
    </div>
  </section>

  <!-- TEAMS -->
  <section class="section" style="background:rgba(255,255,255,0.015)">
    <div class="section-inner">
      <div class="section-header">
        <div>
          <p class="section-eyebrow">Categorias</p>
          <h2 class="section-title">SEUS TIMES FAVORITOS</h2>
        </div>
      </div>
      <div class="team-grid">
        ${teams.slice(0, 8).map(t => `
        <div class="team-card" data-action="filter-team" data-team="${t.name}">
          <img src="${teamImg(t.name)}" alt="${t.name}" loading="lazy" />
          <div class="team-card-info">
            <p class="team-card-name">${t.name}</p>
            <p class="team-card-count">${t.count} modelos</p>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer style="border-top:1px solid var(--border);padding:2.5rem 1.25rem;text-align:center">
    <div style="display:flex;align-items:center;justify-content:center;gap:.5rem;margin-bottom:.75rem">
      <img src="/logo.svg" alt="" style="width:1.5rem;height:1.5rem" />
      <span style="font-weight:900">JERSEY<span class="accent">STORE</span></span>
    </div>
    <p style="font-size:.8rem;color:var(--muted)">&copy; ${new Date().getFullYear()} JerseyStore. Todos os direitos reservados.</p>
  </footer>`;

  // Event delegation handled by the global listener below
}

// ── SHOP ────────────────────────────────────────────────────

let shopFilters = { search: '', team: '', size: '', minPrice: '', maxPrice: '', sort: 'default' };

async function renderShop(params = {}) {
  const app = document.getElementById('app');

  // Apply params from URL (e.g. team filter from home page)
  if (params.team) shopFilters.team = params.team;

  let products = [];
  let teams    = [];
  let filterOpen = false;

  const doRender = async () => {
    const qp = {};
    if (shopFilters.search)   qp.search   = shopFilters.search;
    if (shopFilters.team)     qp.team     = shopFilters.team;
    if (shopFilters.size)     qp.size     = shopFilters.size;
    if (shopFilters.minPrice) qp.minPrice = shopFilters.minPrice;
    if (shopFilters.maxPrice) qp.maxPrice = shopFilters.maxPrice;

    [products, teams] = await Promise.all([
      api.products.list(qp).catch(() => []),
      teams.length ? Promise.resolve(teams) : api.products.teams().catch(() => []),
    ]);

    // Sort client-side
    const sorted = [...products].sort((a, b) => {
      if (shopFilters.sort === 'price-asc')  return a.price - b.price;
      if (shopFilters.sort === 'price-desc') return b.price - a.price;
      if (shopFilters.sort === 'name')       return a.name.localeCompare(b.name);
      return 0;
    });

    const hasFilters = shopFilters.search || shopFilters.team || shopFilters.size || shopFilters.minPrice || shopFilters.maxPrice;
    const SIZES = ['P','M','G','GG'];

    app.innerHTML = `
    <div class="page">
      <!-- Shop header/controls -->
      <div class="shop-header">
        <div class="shop-header-inner">
          <div class="shop-title-row">
            <h1 class="shop-title">CATÁLOGO</h1>
            <span class="shop-count">${sorted.length} camisetas</span>
          </div>
          <div class="shop-controls">
            <div class="search-wrap" style="flex:1;min-width:12rem">
              <span class="search-icon">${ic.alert.replace('width="18" height="18"','width="14" height="14"')}</span>
              <input id="shop-search" class="search-input" type="search" placeholder="Buscar camiseta..." value="${shopFilters.search}" style="padding-left:2.1rem" />
            </div>
            <select id="shop-sort" class="field-select" style="width:auto;min-width:9rem">
              <option value="default"    ${shopFilters.sort==='default'?'selected':''}>Relevância</option>
              <option value="price-asc"  ${shopFilters.sort==='price-asc'?'selected':''}>Menor preço</option>
              <option value="price-desc" ${shopFilters.sort==='price-desc'?'selected':''}>Maior preço</option>
              <option value="name"       ${shopFilters.sort==='name'?'selected':''}>Nome A-Z</option>
            </select>
            <button id="filter-toggle" class="btn ${filterOpen || hasFilters ? 'btn-primary' : 'btn-outline'} btn-sm" style="gap:.4rem">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              Filtros ${hasFilters ? '●' : ''}
            </button>
          </div>

          <!-- Filter panel -->
          <div id="filter-panel" class="filter-panel" ${filterOpen ? '' : 'style="display:none"'}>
            <div class="field">
              <label class="field-label">Time</label>
              <select id="f-team" class="field-select">
                <option value="">Todos</option>
                ${teams.map(t => `<option value="${t.name}" ${shopFilters.team===t.name?'selected':''}>${t.name}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label class="field-label">Tamanho</label>
              <div class="size-toggles">
                ${SIZES.map(s => `<button class="size-toggle ${shopFilters.size===s?'active':''}" data-size="${s}">${s}</button>`).join('')}
              </div>
            </div>
            <div class="field">
              <label class="field-label">Preço mín (R$)</label>
              <input id="f-min" class="field-input" type="number" placeholder="0" value="${shopFilters.minPrice}" />
            </div>
            <div class="field">
              <label class="field-label">Preço máx (R$)</label>
              <input id="f-max" class="field-input" type="number" placeholder="999" value="${shopFilters.maxPrice}" />
            </div>
            ${hasFilters ? `<div class="field" style="justify-content:flex-end">
              <button id="clear-filters" class="btn btn-ghost btn-sm">✕ Limpar filtros</button>
            </div>` : ''}
          </div>
        </div>
      </div>

      <!-- Products grid -->
      <div class="page-inner">
        ${sorted.length === 0
          ? `<div class="empty-state"><div class="empty-icon">${ic.package}</div>
              <p class="empty-title">Nenhum resultado</p>
              <p class="empty-sub">Tente outros filtros</p>
              <button id="clear-filters2" class="btn btn-primary" style="margin-top:.75rem">Limpar filtros</button></div>`
          : `<div class="product-grid">${sorted.map(productCardHtml).join('')}</div>`
        }
      </div>
    </div>`;

    attachShopListeners(doRender, filterOpen);
  };

  await doRender();
}

function attachShopListeners(doRender, filterOpen) {
  let debounce;

  // Search
  const searchEl = document.getElementById('shop-search');
  if (searchEl) {
    searchEl.addEventListener('input', e => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        shopFilters.search = e.target.value;
        doRender();
      }, 350);
    });
  }

  // Sort
  document.getElementById('shop-sort')?.addEventListener('change', e => {
    shopFilters.sort = e.target.value;
    doRender();
  });

  // Filter toggle
  document.getElementById('filter-toggle')?.addEventListener('click', () => {
    const panel = document.getElementById('filter-panel');
    if (panel) {
      const hidden = panel.style.display === 'none';
      panel.style.display = hidden ? 'grid' : 'none';
    }
  });

  // Team select
  document.getElementById('f-team')?.addEventListener('change', e => {
    shopFilters.team = e.target.value;
    doRender();
  });

  // Size toggles
  document.querySelectorAll('.size-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size;
      shopFilters.size = shopFilters.size === size ? '' : size;
      doRender();
    });
  });

  // Price
  document.getElementById('f-min')?.addEventListener('change', e => { shopFilters.minPrice = e.target.value; doRender(); });
  document.getElementById('f-max')?.addEventListener('change', e => { shopFilters.maxPrice = e.target.value; doRender(); });

  // Clear filters
  const clearBtn1 = document.getElementById('clear-filters');
  const clearBtn2 = document.getElementById('clear-filters2');
  const clearAll = () => {
    shopFilters = { search: '', team: '', size: '', minPrice: '', maxPrice: '', sort: 'default' };
    doRender();
  };
  clearBtn1?.addEventListener('click', clearAll);
  clearBtn2?.addEventListener('click', clearAll);
}

// ── PRODUCT DETAIL ──────────────────────────────────────────

async function renderProduct(params) {
  const id = Number(params.id);
  if (!id) { navigate('#shop'); return; }

  const app = document.getElementById('app');
  const product = await api.products.get(id);

  let selectedSize = '';
  let qty          = 1;
  let adding       = false;

  const doRender = () => {
    const img = product.imageUrl || teamImg(product.team);
    app.innerHTML = `
    <div class="page">
      <div class="page-inner-md">
        <a href="#shop" class="back-link">${ic.arrow_left} Voltar ao catálogo</a>
        <div class="product-detail-grid">
          <!-- Image -->
          <div>
            <div class="pd-img-wrap" ${product.allowCustomization ? 'style="position:relative"' : ''}>
              <img src="${img}" alt="${product.name}" />
              ${product.allowCustomization ? `<span style="position:absolute;top:.85rem;right:.85rem" class="label-tag label-primary">PERSONALIZÁVEL</span>` : ''}
            </div>
          </div>

          <!-- Info -->
          <div>
            <p class="pd-eyebrow">${product.team}</p>
            <h1 class="pd-title">${product.name}</h1>
            ${starsHtml()} <span style="font-size:.8rem;color:var(--muted);margin-left:.4rem">(4.9 · 128 avaliações)</span>
            <p class="pd-price" style="margin-top:.75rem">${fmtPrice(product.price)}</p>
            <p class="pd-desc">${product.description || ''}</p>

            <!-- Size -->
            <p class="pd-section-label">Tamanho <span style="color:var(--destructive)">*</span></p>
            <div class="pd-sizes" id="pd-sizes">
              ${product.sizes.map(s => `
              <button class="pd-size-btn ${selectedSize === s ? 'active' : ''}" data-size="${s}">${s}</button>`).join('')}
            </div>

            <!-- Quantity -->
            <p class="pd-section-label">Quantidade</p>
            <div class="qty-control">
              <button class="qty-btn" id="qty-minus">−</button>
              <span class="qty-value" id="qty-val">${qty}</span>
              <button class="qty-btn" id="qty-plus">+</button>
              <span style="font-size:.78rem;color:var(--muted);margin-left:.5rem">${product.stock} em estoque</span>
            </div>

            <!-- Customization -->
            ${product.allowCustomization ? `
            <div class="custom-box">
              <p class="custom-box-title">Personalização</p>
              <div class="custom-grid">
                <div class="field">
                  <label class="field-label">Nome no dorso</label>
                  <input id="custom-name" class="field-input mono" style="text-transform:uppercase;letter-spacing:.1em" maxlength="20" placeholder="Ex: RONALDO" />
                </div>
                <div class="field">
                  <label class="field-label">Número</label>
                  <input id="custom-number" class="field-input mono" maxlength="2" placeholder="Ex: 7" />
                </div>
              </div>
            </div>` : ''}

            <!-- Add to cart -->
            <button id="add-cart-btn" class="add-to-cart-btn" ${product.stock === 0 ? 'disabled' : ''}>
              ${product.stock === 0 ? 'Esgotado' : `${ic.cart} ${isLoggedIn() ? 'Adicionar ao Carrinho' : 'Adicionar ao Carrinho'}`}
            </button>
            ${!isLoggedIn() ? `<p style="font-size:.75rem;color:var(--muted);margin-top:.5rem;text-align:center">Faça <a href="#sign-in" style="color:var(--primary)">login</a> para finalizar a compra</p>` : ''}
            <p style="font-size:.78rem;color:var(--muted);margin-top:.75rem;display:flex;align-items:center;gap:.4rem">
              ${ic.check} Frete calculado no checkout
            </p>
          </div>
        </div>
      </div>
    </div>`;

    // Attach size buttons
    document.querySelectorAll('.pd-size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedSize = btn.dataset.size;
        document.querySelectorAll('.pd-size-btn').forEach(b => b.classList.toggle('active', b.dataset.size === selectedSize));
      });
    });

    // Qty
    document.getElementById('qty-minus')?.addEventListener('click', () => {
      if (qty > 1) { qty--; document.getElementById('qty-val').textContent = qty; }
    });
    document.getElementById('qty-plus')?.addEventListener('click', () => {
      if (qty < product.stock) { qty++; document.getElementById('qty-val').textContent = qty; }
    });

    // Custom name uppercase
    document.getElementById('custom-name')?.addEventListener('input', e => {
      e.target.value = e.target.value.toUpperCase();
    });
    document.getElementById('custom-number')?.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 2);
    });

    // Add to cart
    document.getElementById('add-cart-btn')?.addEventListener('click', async () => {
      if (!selectedSize) { toast('Selecione um tamanho', 'error'); return; }
      if (adding) return;
      adding = true;
      const btn = document.getElementById('add-cart-btn');
      btn.disabled = true;
      btn.textContent = 'Adicionando...';
      try {
        await cartAdd({
          productId:    product.id,
          name:         product.name,
          team:         product.team,
          size:         selectedSize,
          price:        product.price,
          quantity:     qty,
          customName:   document.getElementById('custom-name')?.value || '',
          customNumber: document.getElementById('custom-number')?.value || '',
          imageUrl:     product.imageUrl,
        });
        btn.innerHTML = `${ic.check} Adicionado!`;
        btn.classList.add('success');
        toast(`${product.name} adicionado ao carrinho!`);
        await refreshCartBadge();
        setTimeout(() => {
          btn.innerHTML = `${ic.cart} Adicionar ao Carrinho`;
          btn.classList.remove('success');
          btn.disabled = false;
          adding = false;
        }, 2000);
      } catch (err) {
        toast(err.message || 'Erro ao adicionar', 'error');
        btn.innerHTML = `${ic.cart} Adicionar ao Carrinho`;
        btn.disabled = false;
        adding = false;
      }
    });
  };

  doRender();
}

// ── CART ────────────────────────────────────────────────────

async function renderCart() {
  const app    = document.getElementById('app');
  const cart   = await getEffectiveCart().catch(() => ({ items: [], subtotal: 0, itemCount: 0 }));
  let zipCode  = '';
  let shippingOptions  = [];
  let selectedShipping = null;
  // Track which items are selected (all selected by default)
  let selectedItems = new Set((cart.items || []).map(i => i.id));

  // Compute subtotal only for selected items
  const selSubtotal = () =>
    (cart.items || [])
      .filter(i => selectedItems.has(i.id))
      .reduce((s, i) => s + (i.price || 0) * i.quantity, 0);

  const doRender = () => {
    const shipping = shippingOptions.find(o => o.id === selectedShipping);
    const subAmt   = selSubtotal();
    const total    = subAmt + (shipping?.price || 0);
    const selCount = (cart.items || []).filter(i => selectedItems.has(i.id)).reduce((s,i) => s + i.quantity, 0);
    const allSelected = cart.items?.length > 0 && selectedItems.size === cart.items.length;

    if (!cart.items || cart.items.length === 0) {
      app.innerHTML = `
      <div class="page">
        <div class="empty-state" style="min-height:70vh">
          <div class="empty-icon">${ic.cart}</div>
          <p class="empty-title">Carrinho vazio</p>
          <p class="empty-sub">Adicione camisetas do nosso catálogo</p>
          <a href="#shop" class="btn btn-primary" style="margin-top:1rem">Ver Catálogo ${ic.arrow_right}</a>
        </div>
      </div>`;
      return;
    }

    app.innerHTML = `
    <div class="page">
      <div class="page-inner">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem;flex-wrap:wrap;gap:1rem">
          <h1 style="font-size:1.75rem;font-weight:900">MEU CARRINHO</h1>
          <button id="clear-cart-btn" class="btn btn-ghost btn-sm" style="color:var(--muted);display:flex;align-items:center;gap:.4rem">
            ${ic.trash} Limpar tudo
          </button>
        </div>

        <div class="cart-layout">
          <!-- Items list -->
          <div style="display:flex;flex-direction:column;gap:.85rem">
            <!-- Select all row -->
            <label style="display:flex;align-items:center;gap:.6rem;padding:.5rem .1rem;cursor:pointer;user-select:none">
              <input type="checkbox" id="select-all-chk" ${allSelected ? 'checked' : ''} style="width:1.1rem;height:1.1rem;accent-color:var(--primary);cursor:pointer" />
              <span style="font-size:.82rem;font-weight:600;color:var(--muted)">Selecionar todos (${cart.items.length})</span>
            </label>

            ${cart.items.map(item => {
              const img      = item.productImageUrl || item.imageUrl || teamImg(item.team);
              const checked  = selectedItems.has(item.id);
              return `
              <div class="cart-item ${checked ? '' : 'cart-item-dim'}" data-item-id="${item.id}">
                <label style="display:flex;align-items:center;padding:0 .2rem;cursor:pointer;flex-shrink:0">
                  <input type="checkbox" class="item-select-chk" data-item-chk="${item.id}"
                    ${checked ? 'checked' : ''}
                    style="width:1.1rem;height:1.1rem;accent-color:var(--primary);cursor:pointer" />
                </label>
                <div class="cart-item-img">
                  <img src="${img}" alt="${item.productName || item.name}" />
                </div>
                <div class="cart-item-info" style="flex:1;min-width:0">
                  <p class="cart-item-name truncate">${item.productName || item.name}</p>
                  <p class="cart-item-meta">${item.team} · Tam. ${item.size}</p>
                  ${(item.customName || item.customNumber) ? `<p class="cart-item-custom">${item.customName || ''} ${item.customNumber ? '#'+item.customNumber : ''}</p>` : ''}
                  <div class="cart-item-actions">
                    <div class="cart-qty">
                      <button class="cart-qty-btn" data-cart-minus="${item.id}">${ic.minus}</button>
                      <span style="font-weight:700;min-width:1.25rem;text-align:center">${item.quantity}</span>
                      <button class="cart-qty-btn" data-cart-plus="${item.id}">${ic.plus}</button>
                    </div>
                    <div style="display:flex;align-items:center;gap:.75rem">
                      <span class="cart-item-price">${fmtPrice((item.price || 0) * item.quantity)}</span>
                      <button class="cart-del-btn" data-cart-remove="${item.id}">${ic.trash}</button>
                    </div>
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>

          <!-- Summary column -->
          <div class="cart-summary">
            <!-- Shipping calc -->
            <div class="card" style="margin-bottom:1rem">
              <div class="card-body">
                <p class="card-title" style="display:flex;align-items:center;gap:.5rem">${ic.truck} Calcular Frete</p>
                <div style="display:flex;gap:.5rem;margin-bottom:.75rem">
                  <input id="zip-input" class="field-input mono" placeholder="Ex: 01310-100" maxlength="9" value="${zipCode}" style="flex:1" />
                  <button id="calc-ship-btn" class="btn btn-primary btn-sm">OK</button>
                </div>
                <div id="shipping-options-wrap">
                  ${shippingOptions.length > 0 ? `
                  <div class="shipping-options">
                    ${shippingOptions.map(o => `
                    <label class="shipping-option ${selectedShipping === o.id ? 'selected' : ''}">
                      <div style="display:flex;align-items:center;gap:.5rem">
                        <input type="radio" name="ship" value="${o.id}" ${selectedShipping === o.id ? 'checked' : ''} />
                        <div>
                          <p style="font-weight:700;font-size:.82rem">${o.name}</p>
                          <p style="font-size:.72rem;color:var(--muted)">${o.estimatedDays}</p>
                        </div>
                      </div>
                      <span style="font-weight:700;color:var(--primary);font-size:.85rem">${fmtPrice(o.price)}</span>
                    </label>`).join('')}
                  </div>` : ''}
                </div>
              </div>
            </div>

            <!-- Order summary -->
            <div class="card">
              <div class="card-body">
                <p class="card-title">Resumo do Pedido</p>
                <div class="summary-row"><span class="label">Subtotal (${selCount} ${selCount===1?'item':'itens'} selecionados)</span><span id="sel-subtotal">${fmtPrice(subAmt)}</span></div>
                <div class="summary-row"><span class="label">Frete</span><span>${shipping ? fmtPrice(shipping.price) : '—'}</span></div>
                <div class="summary-total">
                  <span>Total</span>
                  <span class="total-price" id="cart-total">${fmtPrice(total)}</span>
                </div>
                ${isLoggedIn()
                  ? `<button id="checkout-btn" class="btn btn-primary w-full" style="margin-top:1rem;justify-content:center;${!selectedShipping?'opacity:.6':''}" ${!selectedShipping?'data-no-ship="1"':''}>
                      Finalizar Pedido ${ic.arrow_right}
                    </button>`
                  : `<div style="margin-top:1rem;display:flex;flex-direction:column;gap:.55rem">
                      <p style="font-size:.78rem;color:var(--muted);text-align:center">Faça login para finalizar a compra</p>
                      <a href="#sign-in" class="btn btn-primary w-full" style="justify-content:center">Entrar para Comprar</a>
                      <div style="display:flex;align-items:center;gap:.5rem;padding:.25rem 0">
                        <div style="flex:1;height:1px;background:var(--border)"></div>
                        <span style="font-size:.72rem;color:var(--muted);white-space:nowrap">ou sem cadastro</span>
                        <div style="flex:1;height:1px;background:var(--border)"></div>
                      </div>
                      <button id="guest-checkout-btn" class="btn btn-outline w-full" style="justify-content:center;border-color:var(--primary);color:var(--primary)">
                        ${ic.truck} Pedir via WhatsApp
                      </button>
                    </div>`
                }
                <a href="#shop" style="display:block;text-align:center;font-size:.8rem;color:var(--muted);margin-top:.75rem">Continuar comprando</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

    // ── Recalculate summary without full re-render ──────────
    const refreshSummary = () => {
      const sub   = selSubtotal();
      const ship  = shippingOptions.find(o => o.id === selectedShipping);
      const tot   = sub + (ship?.price || 0);
      const cnt   = (cart.items || []).filter(i => selectedItems.has(i.id)).reduce((s,i) => s + i.quantity, 0);
      const subEl = document.getElementById('sel-subtotal');
      const totEl = document.getElementById('cart-total');
      if (subEl) subEl.textContent = fmtPrice(sub);
      if (totEl) totEl.textContent = fmtPrice(tot);
      // Update subtitle label
      const row = subEl?.closest('.summary-row')?.querySelector('.label');
      if (row) row.textContent = `Subtotal (${cnt} ${cnt===1?'item':'itens'} selecionados)`;
      // Dim/undim items
      cart.items?.forEach(i => {
        const el = document.querySelector(`.cart-item[data-item-id="${i.id}"]`);
        if (el) el.classList.toggle('cart-item-dim', !selectedItems.has(i.id));
      });
      // Update select-all checkbox
      const allChk = document.getElementById('select-all-chk');
      if (allChk) allChk.checked = cart.items?.length > 0 && selectedItems.size === cart.items.length;
    };

    // ── Select-all checkbox ─────────────────────────────────
    document.getElementById('select-all-chk')?.addEventListener('change', e => {
      if (e.target.checked) cart.items.forEach(i => selectedItems.add(i.id));
      else selectedItems.clear();
      document.querySelectorAll('.item-select-chk').forEach(chk => { chk.checked = e.target.checked; });
      refreshSummary();
    });

    // ── Per-item checkbox ───────────────────────────────────
    document.querySelectorAll('.item-select-chk').forEach(chk => {
      chk.addEventListener('change', e => {
        const id = Number(e.target.dataset.itemChk);
        if (e.target.checked) selectedItems.add(id);
        else selectedItems.delete(id);
        refreshSummary();
      });
    });

    // ── Clear all ──────────────────────────────────────────
    document.getElementById('clear-cart-btn')?.addEventListener('click', async () => {
      await cartClear();
      cart.items = [];
      cart.subtotal = 0;
      cart.itemCount = 0;
      selectedItems.clear();
      doRender();
    });

    document.querySelectorAll('[data-cart-minus]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.dataset.cartMinus);
        const item = cart.items.find(i => i.id === id);
        if (item) { item.quantity = Math.max(0, item.quantity - 1); if (item.quantity === 0) { cart.items = cart.items.filter(i => i.id !== id); selectedItems.delete(id); } }
        await cartUpdate(id, item?.quantity ?? 0);
        cart.subtotal = cart.items.reduce((s,i) => s + i.price*i.quantity, 0);
        cart.itemCount = cart.items.reduce((s,i) => s + i.quantity, 0);
        doRender();
      });
    });

    document.querySelectorAll('[data-cart-plus]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.dataset.cartPlus);
        const item = cart.items.find(i => i.id === id);
        if (item) item.quantity++;
        await cartUpdate(id, item?.quantity ?? 1);
        cart.subtotal = cart.items.reduce((s,i) => s + i.price*i.quantity, 0);
        doRender();
      });
    });

    document.querySelectorAll('[data-cart-remove]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.dataset.cartRemove);
        cart.items = cart.items.filter(i => i.id !== id);
        selectedItems.delete(id);
        await cartRemove(id);
        cart.subtotal = cart.items.reduce((s,i) => s + i.price*i.quantity, 0);
        cart.itemCount = cart.items.reduce((s,i) => s + i.quantity, 0);
        doRender();
      });
    });

    document.getElementById('calc-ship-btn')?.addEventListener('click', async () => {
      zipCode = document.getElementById('zip-input')?.value || '';
      if (zipCode.length < 5) { toast('CEP inválido', 'error'); return; }
      const btn = document.getElementById('calc-ship-btn');
      btn.disabled = true; btn.textContent = '...';
      try {
        const res = await api.cart.shipping(zipCode);
        shippingOptions = res.options || [];
        selectedShipping = shippingOptions[0]?.id || null;
        doRender();
      } catch (_) { toast('Erro ao calcular frete', 'error'); }
      finally { btn.disabled = false; btn.textContent = 'OK'; }
    });

    document.querySelectorAll('input[name="ship"]').forEach(radio => {
      radio.addEventListener('change', e => {
        selectedShipping = e.target.value;
        document.querySelectorAll('.shipping-option').forEach(el => el.classList.toggle('selected', el.querySelector('input').value === selectedShipping));
        refreshSummary();
      });
    });

    document.getElementById('checkout-btn')?.addEventListener('click', () => {
      if (!selectedShipping) { toast('Calcule o frete antes de continuar', 'error'); return; }
      if (selectedItems.size === 0) { toast('Selecione ao menos um item', 'error'); return; }
      const ship = shippingOptions.find(o => o.id === selectedShipping);
      state.checkout.shippingMethod = selectedShipping;
      state.checkout.shippingCost   = ship?.price || 0;
      state.checkout.step = 1;
      state.checkout.orderId = null;
      navigate('#checkout');
    });

    // ── Guest checkout (WhatsApp) button ───────────────────
    document.getElementById('guest-checkout-btn')?.addEventListener('click', () => {
      const items = (cart.items || []).filter(i => selectedItems.has(i.id));
      if (items.length === 0) { toast('Selecione ao menos um item', 'error'); return; }
      showGuestCheckoutModal(items);
    });
  };

  doRender();
}

// ── GUEST CHECKOUT MODAL ─────────────────────────────────────

function showGuestCheckoutModal(items) {
  // Remove any existing modal
  document.getElementById('guest-modal-overlay')?.remove();

  const subtotal = items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);

  const overlay = document.createElement('div');
  overlay.id = 'guest-modal-overlay';
  overlay.innerHTML = `
  <div style="position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);z-index:300;display:flex;align-items:center;justify-content:center;padding:1rem">
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-xl);width:100%;max-width:28rem;max-height:90vh;overflow-y:auto">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid var(--border)">
        <h3 style="font-weight:900;font-size:1.05rem">Pedir via WhatsApp</h3>
        <button id="guest-modal-close" class="btn btn-icon btn-ghost" style="font-size:1.1rem">✕</button>
      </div>
      <!-- Body -->
      <div style="padding:1.5rem">
        <!-- Items summary -->
        <div style="background:var(--bg-secondary);border-radius:var(--radius);padding:.85rem;margin-bottom:1.25rem">
          <p style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.6rem">Itens selecionados</p>
          ${items.map(i => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:.25rem 0;font-size:.82rem">
            <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:.5rem">${i.productName || i.name} <span style="color:var(--muted)">Tam.${i.size} ×${i.quantity}</span></span>
            <span style="font-weight:700;color:var(--primary);flex-shrink:0">${fmtPrice((i.price||0)*i.quantity)}</span>
          </div>`).join('')}
          <div style="border-top:1px solid var(--border);margin-top:.6rem;padding-top:.6rem;display:flex;justify-content:space-between;font-weight:800">
            <span>Total</span><span style="color:var(--primary)">${fmtPrice(subtotal)}</span>
          </div>
        </div>

        <!-- Form -->
        <form id="guest-order-form">
          <div style="display:grid;gap:.9rem">
            <div class="field">
              <label class="field-label">Seu nome *</label>
              <input id="guest-name" name="guestName" class="field-input" placeholder="Ex: João Silva" required />
            </div>
            <div class="field">
              <label class="field-label">WhatsApp (com DDD) *</label>
              <input id="guest-whatsapp" name="whatsapp" class="field-input mono" placeholder="Ex: 11999999999" type="tel" required />
            </div>
            <div class="field">
              <label class="field-label">Observações (opcional)</label>
              <textarea id="guest-notes" class="field-textarea" rows="2" placeholder="Endereço de entrega, cor preferida..."></textarea>
            </div>
          </div>
          <div style="display:flex;gap:.75rem;margin-top:1.25rem">
            <button type="button" id="guest-modal-cancel" class="btn btn-outline" style="flex:1">Cancelar</button>
            <button type="submit" id="guest-submit-btn" class="btn btn-primary" style="flex:1;justify-content:center;background:#25d366;border-color:#25d366">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Enviar no WhatsApp
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>`;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  document.getElementById('guest-modal-close')?.addEventListener('click', close);
  document.getElementById('guest-modal-cancel')?.addEventListener('click', close);
  overlay.querySelector('div')?.addEventListener('click', e => { if (e.target === e.currentTarget) close(); });

  document.getElementById('guest-order-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name      = document.getElementById('guest-name').value.trim();
    const whatsapp  = document.getElementById('guest-whatsapp').value.replace(/\D/g, '');
    const notes     = document.getElementById('guest-notes').value.trim();
    const submitBtn = document.getElementById('guest-submit-btn');

    if (!name)            { toast('Informe seu nome', 'error'); return; }
    if (whatsapp.length < 10) { toast('WhatsApp inválido (mín. 10 dígitos)', 'error'); return; }

    submitBtn.disabled   = true;
    submitBtn.textContent = 'Salvando...';

    try {
      const order = await api.guestOrders.create({
        guestName: name,
        whatsapp,
        items: items.map(i => ({
          productId:    i.productId,
          productName:  i.productName || i.name,
          team:         i.team,
          size:         i.size,
          quantity:     i.quantity,
          price:        i.price || 0,
          customName:   i.customName || undefined,
          customNumber: i.customNumber || undefined,
        })),
        notes: notes || undefined,
      });

      // Build WhatsApp message
      const itemLines = items.map(i =>
        `• ${i.productName || i.name} – Tam. ${i.size} ×${i.quantity} – ${fmtPrice((i.price||0)*i.quantity)}`
      ).join('\n');

      const msg = [
        `🛒 *Novo Pedido ${order.orderNumber}*`,
        ``,
        `*Nome:* ${name}`,
        ``,
        `*Itens:*`,
        itemLines,
        ``,
        `*Total: ${fmtPrice(order.total)}*`,
        notes ? `\n*Obs:* ${notes}` : '',
      ].filter(Boolean).join('\n');

      const waUrl = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(msg)}`;

      close();
      toast(`Pedido ${order.orderNumber} criado! Abrindo WhatsApp...`, 'success', 4000);
      setTimeout(() => window.open(waUrl, '_blank'), 600);

    } catch (err) {
      toast(err.message || 'Erro ao criar pedido', 'error');
      submitBtn.disabled   = false;
      submitBtn.innerHTML  = `Enviar no WhatsApp`;
    }
  });
}

// ── CHECKOUT ────────────────────────────────────────────────

async function renderCheckout() {
  const app  = document.getElementById('app');
  const cart = await api.cart.get().catch(() => ({ items: [], subtotal: 0 }));
  const total = (cart.subtotal || 0) + state.checkout.shippingCost;

  const stepsBar = (step) => `
  <div class="steps-bar">
    ${['Endereço','Pagamento','Confirmação'].map((label, i) => {
      const num = i + 1;
      const done   = step > num;
      const active = step === num;
      return `
      ${i > 0 ? `<div class="step-line ${done||active?'done':''}"></div>` : ''}
      <div class="step-item">
        <div class="step-circle ${done?'done':active?'active':''}">${done?ic.check:num}</div>
        <span class="step-label ${active?'active':''}">${label}</span>
      </div>`;
    }).join('')}
  </div>`;

  const summaryHtml = () => `
  <div class="card">
    <div class="card-body">
      <p class="card-title">Resumo</p>
      ${cart.items.map(i => `
      <div class="summary-row">
        <span class="label truncate" style="max-width:11rem">${i.productName} x${i.quantity}</span>
        <span style="font-weight:600">${fmtPrice((i.price||0)*i.quantity)}</span>
      </div>`).join('')}
      <div style="height:1px;background:var(--border);margin:.5rem 0"></div>
      <div class="summary-row"><span class="label">Subtotal</span><span>${fmtPrice(cart.subtotal||0)}</span></div>
      <div class="summary-row"><span class="label">Frete</span><span>${fmtPrice(state.checkout.shippingCost)}</span></div>
      <div class="summary-total"><span>Total</span><span class="total-price">${fmtPrice(total)}</span></div>
    </div>
  </div>`;

  // Step 1 – Address
  const renderStep1 = () => {
    const addr = state.checkout.address;
    app.innerHTML = `
    <div class="page">
      <div class="page-inner-sm">
        <h1 style="font-size:1.75rem;font-weight:900;margin-bottom:2rem">CHECKOUT</h1>
        ${stepsBar(1)}
        <div class="checkout-layout">
          <div class="card">
            <div class="card-body">
              <h2 style="font-size:1rem;font-weight:900;margin-bottom:1.25rem;display:flex;align-items:center;gap:.5rem">${ic.map_pin} Endereço de Entrega</h2>
              <form id="addr-form">
                <div class="field" style="margin-bottom:.85rem">
                  <label class="field-label">Endereço *</label>
                  <input name="addressLine1" class="field-input" placeholder="Rua, número" required value="${addr.addressLine1||''}" />
                </div>
                <div class="field" style="margin-bottom:.85rem">
                  <label class="field-label">Complemento</label>
                  <input name="addressLine2" class="field-input" placeholder="Apto, bloco (opcional)" value="${addr.addressLine2||''}" />
                </div>
                <div class="form-grid-2" style="margin-bottom:.85rem;gap:.75rem">
                  <div class="field">
                    <label class="field-label">Cidade *</label>
                    <input name="city" class="field-input" placeholder="São Paulo" required value="${addr.city||''}" />
                  </div>
                  <div class="field">
                    <label class="field-label">Estado *</label>
                    <input name="state" class="field-input" placeholder="SP" required value="${addr.state||''}" />
                  </div>
                </div>
                <div class="field" style="margin-bottom:1.25rem">
                  <label class="field-label">CEP *</label>
                  <input name="zipCode" class="field-input mono" placeholder="01310-100" required value="${addr.zipCode||''}" />
                </div>
                <button type="submit" class="btn btn-primary w-full" style="justify-content:center">Continuar para Pagamento</button>
              </form>
            </div>
          </div>
          ${summaryHtml()}
        </div>
      </div>
    </div>`;

    document.getElementById('addr-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const address = Object.fromEntries(fd.entries());
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Criando pedido...';
      try {
        const order = await api.orders.create({
          ...address,
          addressLine2:  address.addressLine2 || null,
          country:       'BR',
          shippingMethod: state.checkout.shippingMethod,
          shippingCost:  state.checkout.shippingCost,
        });
        state.checkout.orderId  = order.id;
        state.checkout.address  = address;
        state.checkout.step     = 2;
        renderStep2();
      } catch (err) {
        toast(err.message || 'Erro ao criar pedido', 'error');
        btn.disabled = false; btn.textContent = 'Continuar para Pagamento';
      }
    });
  };

  // Step 2 – Payment
  const renderStep2 = () => {
    app.innerHTML = `
    <div class="page">
      <div class="page-inner-sm">
        <h1 style="font-size:1.75rem;font-weight:900;margin-bottom:2rem">CHECKOUT</h1>
        ${stepsBar(2)}
        <div class="checkout-layout">
          <div class="card">
            <div class="card-body">
              <h2 style="font-size:1rem;font-weight:900;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem">${ic.card} Pagamento</h2>
              <div class="mock-warning">⚠ Ambiente de demonstração — use qualquer número de cartão</div>
              <form id="pay-form">
                <div class="field" style="margin-bottom:.85rem">
                  <label class="field-label">Nome do Titular *</label>
                  <input name="cardHolder" class="field-input mono" style="text-transform:uppercase;letter-spacing:.06em" placeholder="FULANO DE TAL" required />
                </div>
                <div class="field" style="margin-bottom:.85rem">
                  <label class="field-label">Número do Cartão *</label>
                  <input name="cardNumber" class="field-input mono" placeholder="1234 5678 9012 3456" maxlength="19" required />
                </div>
                <div class="form-grid-3" style="margin-bottom:1.25rem;gap:.75rem">
                  <div class="field">
                    <label class="field-label">Mês *</label>
                    <input name="expiryMonth" class="field-input mono" placeholder="MM" maxlength="2" required />
                  </div>
                  <div class="field">
                    <label class="field-label">Ano *</label>
                    <input name="expiryYear" class="field-input mono" placeholder="AA" maxlength="2" required />
                  </div>
                  <div class="field">
                    <label class="field-label">CVV *</label>
                    <input name="cvv" class="field-input mono" placeholder="123" maxlength="4" required />
                  </div>
                </div>
                <button type="submit" class="btn btn-primary w-full" style="justify-content:center">
                  Pagar ${fmtPrice(total)}
                </button>
              </form>
            </div>
          </div>
          ${summaryHtml()}
        </div>
      </div>
    </div>`;

    document.getElementById('pay-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const fd  = new FormData(e.target);
      const pay = Object.fromEntries(fd.entries());
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Processando...';
      try {
        await api.orders.payment(state.checkout.orderId, { ...pay, paymentMethod: 'credit_card' });
        state.checkout.step = 3;
        renderStep3();
      } catch (err) {
        toast(err.message || 'Erro no pagamento', 'error');
        btn.disabled = false; btn.textContent = `Pagar ${fmtPrice(total)}`;
      }
    });
  };

  // Step 3 – Confirmation
  const renderStep3 = () => {
    app.innerHTML = `
    <div class="page">
      <div class="page-inner-sm">
        <h1 style="font-size:1.75rem;font-weight:900;margin-bottom:2rem">CHECKOUT</h1>
        ${stepsBar(3)}
        <div class="card">
          <div class="confirm-card">
            <div class="confirm-icon">${ic.check}</div>
            <h2 class="confirm-title">Pedido Confirmado!</h2>
            <p class="confirm-sub">Pedido #${state.checkout.orderId} realizado com sucesso</p>
            <p class="confirm-sub">Você receberá atualizações por email</p>
            <div class="confirm-actions">
              <button class="btn btn-primary" onclick="navigate('#order?id=${state.checkout.orderId}')">Ver Pedido</button>
              <button class="btn btn-outline" onclick="navigate('#shop')">Continuar Comprando</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
    refreshCartBadge();
  };

  // Start at current step
  if (state.checkout.step === 3 && state.checkout.orderId) renderStep3();
  else if (state.checkout.step === 2 && state.checkout.orderId) renderStep2();
  else renderStep1();
}

// ── ORDERS ──────────────────────────────────────────────────

async function renderOrders() {
  const app    = document.getElementById('app');
  const orders = await api.orders.list().catch(() => []);

  if (!orders.length) {
    app.innerHTML = `
    <div class="page">
      <div class="empty-state" style="min-height:70vh">
        <div class="empty-icon">${ic.package}</div>
        <p class="empty-title">Nenhum pedido ainda</p>
        <a href="#shop" class="btn btn-primary" style="margin-top:1rem">Ver Catálogo</a>
      </div>
    </div>`;
    return;
  }

  app.innerHTML = `
  <div class="page">
    <div class="page-inner-md">
      <h1 style="font-size:1.75rem;font-weight:900;margin-bottom:2rem">MEUS PEDIDOS</h1>
      <div style="display:flex;flex-direction:column;gap:.85rem">
        ${orders.map(o => `
        <div class="order-card" onclick="navigate('#order?id=${o.id}')">
          <div class="order-card-left">
            <div class="order-icon">${ic.package}</div>
            <div>
              <p class="order-num">Pedido #${o.id}</p>
              <p class="order-date">${fmtDate(o.createdAt)}</p>
            </div>
          </div>
          <div class="order-card-right">
            ${statusBadge(o.status)}
            <span class="order-total">${fmtPrice(o.total)}</span>
            ${ic.chevron_r}
          </div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

// ── ORDER DETAIL ─────────────────────────────────────────────

async function renderOrderDetail(params) {
  const id  = Number(params.id);
  const app = document.getElementById('app');
  if (!id) { navigate('#orders'); return; }

  const order = await api.orders.get(id);
  const TRACK_STEPS = ['pending','processing','shipped','delivered'];
  const TRACK_LABELS = { pending:'Pedido Recebido', processing:'Em Processamento', shipped:'Enviado', delivered:'Entregue' };
  const TRACK_ICONS  = { pending: ic.clock, processing: ic.package, shipped: ic.truck, delivered: ic.home };
  const curIdx = TRACK_STEPS.indexOf(order.status);

  app.innerHTML = `
  <div class="page">
    <div class="page-inner-md">
      <a href="#orders" class="back-link">${ic.arrow_left} Meus Pedidos</a>

      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:2rem;flex-wrap:wrap;gap:1rem">
        <div>
          <h1 style="font-size:1.75rem;font-weight:900">Pedido #${order.id}</h1>
          <p style="color:var(--muted);font-size:.82rem;margin-top:.25rem">${fmtDate(order.createdAt)}</p>
        </div>
        ${statusBadge(order.status)}
      </div>

      ${order.status !== 'cancelled' ? `
      <div class="card" style="margin-bottom:1.25rem">
        <div class="card-body">
          <p class="card-title">Rastreamento</p>
          <div class="tracking-steps">
            ${TRACK_STEPS.map((s, i) => {
              const done    = i <= curIdx;
              const current = i === curIdx;
              return `
              <div class="track-step">
                <div class="track-dot ${done?'done':current?'current':''}">${done ? ic.check : TRACK_ICONS[s]}</div>
                <div class="track-info">
                  <span class="step-name" style="${done?'':'color:var(--muted)'}">${TRACK_LABELS[s]}</span>
                  ${current ? `<span class="current-tag">• Atual</span>` : ''}
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>` : ''}

      <!-- Items -->
      <div class="card" style="margin-bottom:1.25rem">
        <div class="card-body">
          <p class="card-title" style="display:flex;align-items:center;gap:.5rem">${ic.package} Itens</p>
          <div style="display:flex;flex-direction:column;gap:.75rem">
            ${order.items.map(item => `
            <div style="display:flex;align-items:center;gap:.85rem">
              <div style="width:3rem;height:3rem;border-radius:.5rem;overflow:hidden;background:var(--bg-secondary);flex-shrink:0">
                <img src="${item.imageUrl || teamImg(item.team)}" alt="${item.productName}" style="width:100%;height:100%;object-fit:cover" />
              </div>
              <div style="flex:1;min-width:0">
                <p style="font-weight:700;font-size:.875rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.productName}</p>
                <p style="font-size:.75rem;color:var(--muted)">${item.team} · Tam. ${item.size} · Qtd: ${item.quantity}</p>
                ${(item.customName||item.customNumber)?`<p style="font-size:.72rem;color:var(--primary);font-family:var(--mono)">${item.customName||''} ${item.customNumber?'#'+item.customNumber:''}</p>`:''}
              </div>
              <span style="font-weight:900;color:var(--primary);font-size:.95rem">${fmtPrice((item.price||0)*item.quantity)}</span>
            </div>`).join('')}
          </div>
          <div style="border-top:1px solid var(--border);margin-top:1rem;padding-top:1rem">
            <div class="info-row"><span class="info-key">Subtotal</span><span class="info-val">${fmtPrice(order.subtotal)}</span></div>
            <div class="info-row"><span class="info-key">Frete</span><span class="info-val">${fmtPrice(order.shippingCost)}</span></div>
            <div class="info-row" style="font-size:1rem;font-weight:900"><span>Total</span><span style="color:var(--primary)">${fmtPrice(order.total)}</span></div>
          </div>
        </div>
      </div>

      <!-- Address & Payment -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;flex-wrap:wrap">
        <div class="card"><div class="card-body">
          <p class="card-title" style="display:flex;align-items:center;gap:.5rem">${ic.map_pin} Endereço</p>
          <p style="font-size:.82rem;color:var(--muted);line-height:1.7">
            ${order.addressLine1}${order.addressLine2?', '+order.addressLine2:''}<br>
            ${order.city}, ${order.state} — ${order.zipCode}<br>${order.country}
          </p>
        </div></div>
        <div class="card"><div class="card-body">
          <p class="card-title" style="display:flex;align-items:center;gap:.5rem">${ic.card} Pagamento</p>
          <div class="info-row"><span class="info-key">Método</span><span class="info-val">${order.paymentMethod||'—'}</span></div>
          <div class="info-row"><span class="info-key">Status</span>
            <span style="font-weight:700;color:${order.paymentStatus==='paid'?'#4ade80':'#facc15'}">${order.paymentStatus==='paid'?'Pago':'Pendente'}</span>
          </div>
        </div></div>
      </div>
    </div>
  </div>`;
}

// ── SIGN IN ──────────────────────────────────────────────────

async function renderSignIn() {
  if (isLoggedIn()) { navigate('#shop'); return; }
  document.getElementById('app').innerHTML = `
  <div class="auth-page">
    <div id="clerk-sign-in-mount"></div>
  </div>`;
  if (state.clerk) {
    state.clerk.mountSignIn(document.getElementById('clerk-sign-in-mount'), {
      routing: 'hash',
      signUpUrl: '#sign-up',
    });
  }
}

// ── SIGN UP ──────────────────────────────────────────────────

async function renderSignUp() {
  if (isLoggedIn()) { navigate('#shop'); return; }
  document.getElementById('app').innerHTML = `
  <div class="auth-page">
    <div id="clerk-sign-up-mount"></div>
  </div>`;
  if (state.clerk) {
    state.clerk.mountSignUp(document.getElementById('clerk-sign-up-mount'), {
      routing: 'hash',
      signInUrl: '#sign-in',
    });
  }
}

// ── ADMIN ────────────────────────────────────────────────────

async function renderAdmin() {
  const app = document.getElementById('app');

  const [stats, orders, salesByTeam, guestOrders] = await Promise.all([
    api.admin.stats().catch(() => null),
    api.admin.orders({ limit: 10 }).catch(() => []),
    api.admin.salesByTeam().catch(() => []),
    api.admin.guestOrders().catch(() => []),
  ]);

  const maxRev = Math.max(...salesByTeam.map(s => s.totalSales), 1);

  app.innerHTML = `
  <div class="page">
    <div class="page-inner">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem;flex-wrap:wrap;gap:1rem">
        <div>
          <h1 style="font-size:1.75rem;font-weight:900">DASHBOARD ADMIN</h1>
          <p style="color:var(--muted);font-size:.82rem">Visão geral da loja</p>
        </div>
        <a href="#admin-products" class="btn btn-primary btn-sm">Gerenciar Produtos ${ic.arrow_right}</a>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        ${[
          { label:'Receita Total',   value: stats ? fmtPrice(stats.totalRevenue)  : '—', color:'var(--primary)', bg:'var(--primary-dim)', icon:ic.dollar },
          { label:'Total de Pedidos',value: stats?.totalOrders ?? '—',              color:'#60a5fa', bg:'rgba(59,130,246,.15)', icon:ic.orders_icon },
          { label:'Produtos Ativos', value: stats?.totalProducts ?? '—',            color:'#c084fc', bg:'rgba(168,85,247,.15)', icon:ic.package },
          { label:'Clientes Únicos', value: stats?.totalCustomers ?? '—',           color:'#fb923c', bg:'rgba(249,115,22,.15)', icon:ic.users },
        ].map(s => `
        <div class="stat-card">
          <div class="stat-icon-row">
            <div class="stat-icon" style="background:${s.bg};color:${s.color}">${s.icon}</div>
          </div>
          <p class="stat-value" style="color:${s.color}">${s.value}</p>
          <p class="stat-label">${s.label}</p>
        </div>`).join('')}
      </div>

      <div class="admin-grid">
        <!-- Recent orders table -->
        <div class="card">
          <div class="card-body" style="padding:0">
            <div style="padding:1.1rem 1.25rem;border-bottom:1px solid var(--border)">
              <p class="card-title" style="margin:0;display:flex;align-items:center;gap:.5rem">${ic.orders_icon} Pedidos Recentes</p>
            </div>
            <div style="overflow-x:auto">
              <table class="data-table">
                <thead><tr>
                  <th>#</th><th>Cliente</th><th>Data</th><th>Status</th><th class="text-right">Total</th>
                </tr></thead>
                <tbody>
                  ${orders.length === 0 ? `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--muted)">Nenhum pedido</td></tr>` :
                  orders.map(o => `
                  <tr onclick="navigate('#order?id=${o.id}')" style="cursor:pointer">
                    <td style="font-weight:700">#${o.id}</td>
                    <td>${o.customerName || o.customerEmail || '—'}</td>
                    <td style="color:var(--muted)">${new Date(o.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td>${statusBadge(o.status)}</td>
                    <td class="text-right" style="font-weight:700;color:var(--primary)">${fmtPrice(o.total)}</td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Sales by team bars -->
        <div class="card">
          <div class="card-body">
            <p class="card-title" style="display:flex;align-items:center;gap:.5rem">${ic.dashboard} Vendas por Time</p>
            ${salesByTeam.length === 0
              ? `<p style="color:var(--muted);font-size:.85rem">Nenhuma venda ainda</p>`
              : salesByTeam.slice(0, 8).map(s => `
              <div class="bar-row">
                <div class="bar-label-row">
                  <span style="font-size:.75rem;font-weight:600">${s.team}</span>
                  <span style="font-size:.72rem;color:var(--primary);font-weight:700">${fmtPrice(s.totalSales)}</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" style="width:${Math.round((s.totalSales/maxRev)*100)}%"></div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>

      ${stats?.lowStockProducts?.length > 0 ? `
      <div style="margin-top:1.5rem;background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.25);border-radius:var(--radius-xl);padding:1.1rem 1.25rem">
        <p style="font-weight:700;color:#fb923c;margin-bottom:.6rem;display:flex;align-items:center;gap:.4rem">${ic.alert} Estoque Baixo</p>
        <div style="display:flex;flex-wrap:wrap;gap:.4rem">
          ${stats.lowStockProducts.map(p => `
          <span style="font-size:.72rem;background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.3);color:#fdba74;padding:.2rem .6rem;border-radius:99px;font-weight:600">
            ${p.name} (${p.stock} restantes)
          </span>`).join('')}
        </div>
      </div>` : ''}

      <!-- Guest Orders table -->
      <div class="card" style="margin-top:1.5rem">
        <div class="card-body" style="padding:0">
          <div style="padding:1.1rem 1.25rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <p class="card-title" style="margin:0;display:flex;align-items:center;gap:.5rem">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color:#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Pedidos via WhatsApp (Visitantes)
            </p>
            <span style="font-size:.75rem;background:rgba(37,211,102,.12);color:#25d366;border:1px solid rgba(37,211,102,.3);padding:.15rem .6rem;border-radius:99px;font-weight:700">
              ${guestOrders.length} pedido${guestOrders.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style="overflow-x:auto">
            <table class="data-table">
              <thead><tr>
                <th>Pedido</th><th>Cliente</th><th>WhatsApp</th><th>Itens</th><th>Data</th><th>Status</th><th class="text-right">Total</th>
              </tr></thead>
              <tbody>
                ${guestOrders.length === 0
                  ? `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--muted)">Nenhum pedido de visitante ainda</td></tr>`
                  : guestOrders.map(o => {
                    const itemSummary = Array.isArray(o.items)
                      ? o.items.map(i => `${i.productName} ×${i.quantity}`).join(', ')
                      : '—';
                    const waLink = `https://wa.me/${o.whatsapp}`;
                    return `
                    <tr>
                      <td style="font-weight:800;color:var(--primary)">${o.orderNumber}</td>
                      <td style="font-weight:600">${o.guestName}</td>
                      <td>
                        <a href="${waLink}" target="_blank" style="color:#25d366;font-weight:600;font-size:.8rem;text-decoration:none">
                          ${o.whatsapp}
                        </a>
                      </td>
                      <td style="font-size:.78rem;color:var(--muted);max-width:14rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${itemSummary}">${itemSummary}</td>
                      <td style="color:var(--muted);font-size:.78rem">${new Date(o.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <select class="guest-status-sel" data-guest-id="${o.id}" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius);padding:.2rem .5rem;font-size:.75rem;color:inherit;cursor:pointer">
                          ${['pending','processing','shipped','delivered','cancelled'].map(s =>
                            `<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`
                          ).join('')}
                        </select>
                      </td>
                      <td class="text-right" style="font-weight:700;color:var(--primary)">${fmtPrice(o.total)}</td>
                    </tr>`;
                  }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  // Attach guest order status change listeners
  document.querySelectorAll('.guest-status-sel').forEach(sel => {
    sel.addEventListener('change', async e => {
      const id  = Number(e.target.dataset.guestId);
      const status = e.target.value;
      try {
        await api.admin.updateGuestStatus(id, status);
        toast('Status atualizado', 'success');
      } catch (_) {
        toast('Erro ao atualizar status', 'error');
      }
    });
  });
}

// ── ADMIN PRODUCTS ───────────────────────────────────────────

async function renderAdminProducts() {
  const app = document.getElementById('app');
  let products = await api.products.list({}).catch(() => []);
  let editProduct = null;
  let search = '';

  const doRender = () => {
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.team.toLowerCase().includes(search.toLowerCase())
    );
    const SIZES = ['P','M','G','GG'];
    const formHtml = (p) => `
    <div id="modal-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem">
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-xl);width:100%;max-width:30rem;max-height:90vh;overflow-y:auto">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid var(--border)">
          <h3 style="font-weight:900">${p ? 'Editar Produto' : 'Novo Produto'}</h3>
          <button id="modal-close" class="btn btn-icon btn-ghost">✕</button>
        </div>
        <div style="padding:1.5rem">
          <form id="product-form">
            <div style="display:grid;gap:.85rem">
              <div class="field"><label class="field-label">Nome *</label><input name="name" class="field-input" value="${p?.name||''}" required /></div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
                <div class="field"><label class="field-label">Time *</label><input name="team" class="field-input" value="${p?.team||''}" required /></div>
                <div class="field"><label class="field-label">Preço (R$) *</label><input name="price" type="number" step=".01" class="field-input" value="${p?.price||''}" required /></div>
              </div>
              <div class="field"><label class="field-label">Descrição</label><textarea name="description" class="field-textarea" rows="2">${p?.description||''}</textarea></div>
              <div class="field"><label class="field-label">Estoque *</label><input name="stock" type="number" class="field-input" value="${p?.stock||''}" required /></div>
              <div class="field">
                <label class="field-label">Tamanhos</label>
                <div class="size-toggles">
                  ${SIZES.map(s => `<button type="button" class="size-toggle ${(p?.sizes||SIZES).includes(s)?'active':''}" data-size="${s}">${s}</button>`).join('')}
                </div>
              </div>
              <div style="display:flex;gap:1.5rem">
                <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
                  <input type="checkbox" id="chk-featured" ${p?.isFeatured?'checked':''} />
                  <span style="font-size:.85rem;font-weight:600">Destaque</span>
                </label>
                <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
                  <input type="checkbox" id="chk-custom" ${p?.allowCustomization!==false?'checked':''} />
                  <span style="font-size:.85rem;font-weight:600">Personalizável</span>
                </label>
              </div>
              <div style="display:flex;gap:.75rem;padding-top:.5rem">
                <button type="button" id="modal-cancel" class="btn btn-outline" style="flex:1">Cancelar</button>
                <button type="submit" class="btn btn-primary" style="flex:1;justify-content:center">Salvar</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>`;

    app.innerHTML = `
    <div class="page">
      <div class="page-inner">
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:2rem;flex-wrap:wrap">
          <a href="#admin" class="btn btn-icon btn-ghost">${ic.arrow_left}</a>
          <div style="flex:1">
            <h1 style="font-size:1.75rem;font-weight:900">PRODUTOS</h1>
            <p style="color:var(--muted);font-size:.82rem">${products.length} produtos</p>
          </div>
          <button id="new-product-btn" class="btn btn-primary btn-sm">+ Novo Produto</button>
        </div>

        <div class="search-wrap" style="max-width:25rem;margin-bottom:1.25rem">
          <span class="search-icon">🔍</span>
          <input id="prod-search" class="search-input" type="search" placeholder="Buscar por nome ou time..." value="${search}" />
        </div>

        <div class="card" style="overflow:hidden">
          <div style="overflow-x:auto">
            <table class="data-table">
              <thead><tr>
                <th>Produto</th><th>Time</th><th class="text-right">Preço</th>
                <th class="text-right">Estoque</th><th>Destaque</th><th class="text-right">Ações</th>
              </tr></thead>
              <tbody>
                ${filtered.length === 0 ? `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--muted)">Nenhum produto encontrado</td></tr>` :
                filtered.map(p => `
                <tr>
                  <td><span style="font-weight:600">${p.name}</span><br><span style="font-size:.72rem;color:var(--muted)">${p.sizes.join(', ')}</span></td>
                  <td style="color:var(--muted)">${p.team}</td>
                  <td class="text-right" style="font-weight:700;color:var(--primary)">${fmtPrice(p.price)}</td>
                  <td class="text-right" style="font-weight:700;color:${p.stock<10?'#fb923c':'inherit'}">${p.stock}</td>
                  <td>${p.isFeatured?'✓':''}</td>
                  <td class="text-right">
                    <button class="btn btn-icon btn-ghost edit-btn" data-id="${p.id}" title="Editar">${ic.pencil}</button>
                    <button class="btn btn-icon btn-ghost del-btn" data-id="${p.id}" title="Excluir" style="color:var(--muted)">${ic.trash}</button>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        ${editProduct !== null ? formHtml(editProduct) : ''}
      </div>
    </div>`;

    // Search
    document.getElementById('prod-search')?.addEventListener('input', e => {
      search = e.target.value;
      doRender();
    });

    // New product
    document.getElementById('new-product-btn')?.addEventListener('click', () => {
      editProduct = null;
      showModal(null);
    });

    // Edit
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = products.find(p => p.id === Number(btn.dataset.id));
        showModal(p);
      });
    });

    // Delete
    document.querySelectorAll('.del-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const p = products.find(p => p.id === Number(btn.dataset.id));
        if (!confirm(`Excluir "${p?.name}"?`)) return;
        try {
          await api.products.delete(Number(btn.dataset.id));
          products = products.filter(px => px.id !== Number(btn.dataset.id));
          toast('Produto removido');
          doRender();
        } catch (err) { toast(err.message, 'error'); }
      });
    });
  };

  const showModal = (p) => {
    const SIZES = ['P','M','G','GG'];
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem';
    overlay.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-xl);width:100%;max-width:30rem;max-height:90vh;overflow-y:auto">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid var(--border)">
        <h3 style="font-weight:900">${p ? 'Editar Produto' : 'Novo Produto'}</h3>
        <button id="modal-close" class="btn btn-icon btn-ghost">✕</button>
      </div>
      <div style="padding:1.5rem">
        <form id="product-form">
          <div style="display:grid;gap:.85rem">
            <div class="field"><label class="field-label">Nome *</label><input name="name" class="field-input" value="${p?.name||''}" required /></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
              <div class="field"><label class="field-label">Time *</label><input name="team" class="field-input" value="${p?.team||''}" required /></div>
              <div class="field"><label class="field-label">Preço (R$) *</label><input name="price" type="number" step=".01" class="field-input" value="${p?.price||''}" required /></div>
            </div>
            <div class="field"><label class="field-label">Descrição</label><textarea name="description" class="field-textarea" rows="2">${p?.description||''}</textarea></div>
            <div class="field"><label class="field-label">Estoque *</label><input name="stock" type="number" class="field-input" value="${p?.stock||''}" required /></div>
            <div class="field">
              <label class="field-label">Tamanhos</label>
              <div class="size-toggles" id="modal-sizes">
                ${SIZES.map(s => `<button type="button" class="size-toggle ${(p?.sizes||SIZES).includes(s)?'active':''}" data-size="${s}">${s}</button>`).join('')}
              </div>
            </div>
            <div style="display:flex;gap:1.5rem">
              <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer"><input type="checkbox" id="chk-featured" ${p?.isFeatured?'checked':''} /><span style="font-size:.85rem;font-weight:600">Destaque</span></label>
              <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer"><input type="checkbox" id="chk-custom" ${p?.allowCustomization!==false?'checked':''} /><span style="font-size:.85rem;font-weight:600">Personalizável</span></label>
            </div>
            <div style="display:flex;gap:.75rem;padding-top:.5rem">
              <button type="button" id="modal-cancel" class="btn btn-outline" style="flex:1">Cancelar</button>
              <button type="submit" class="btn btn-primary" style="flex:1;justify-content:center">Salvar</button>
            </div>
          </div>
        </form>
      </div>
    </div>`;
    document.body.appendChild(overlay);

    // Size toggles in modal
    overlay.querySelectorAll('.size-toggle').forEach(btn => {
      btn.addEventListener('click', () => btn.classList.toggle('active'));
    });

    const closeModal = () => overlay.remove();
    overlay.querySelector('#modal-close')?.addEventListener('click', closeModal);
    overlay.querySelector('#modal-cancel')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

    // Form submit
    overlay.querySelector('#product-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const fd  = new FormData(e.target);
      const sizes = [...overlay.querySelectorAll('.size-toggle.active')].map(b => b.dataset.size);
      const data = {
        name:              fd.get('name'),
        team:              fd.get('team'),
        description:       fd.get('description') || null,
        price:             Number(fd.get('price')),
        stock:             Number(fd.get('stock')),
        sizes,
        isFeatured:        overlay.querySelector('#chk-featured')?.checked || false,
        allowCustomization:overlay.querySelector('#chk-custom')?.checked || false,
        imageUrl:          p?.imageUrl || null,
      };
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Salvando...';
      try {
        if (p) {
          const updated = await api.products.update(p.id, data);
          products = products.map(px => px.id === p.id ? updated : px);
          toast('Produto atualizado!');
        } else {
          const created = await api.products.create(data);
          products.push(created);
          toast('Produto criado!');
        }
        closeModal();
        doRender();
      } catch (err) {
        toast(err.message, 'error');
        btn.disabled = false; btn.textContent = 'Salvar';
      }
    });
  };

  doRender();
}

// ============================================================
// 11. NAVBAR  — updates auth state, cart badge, admin link
// ============================================================

function updateNavbar() {
  // Auth-only links visibility
  document.querySelectorAll('.nav-auth-only, .mobile-auth-only').forEach(el => {
    el.classList.toggle('hidden', !isLoggedIn());
  });
  document.querySelectorAll('.nav-admin-only, .mobile-admin-only').forEach(el => {
    el.classList.toggle('hidden', !isAdmin());
  });

  // Auth area (right side of navbar)
  const authArea = document.getElementById('auth-area');
  const mobileRow = document.getElementById('mobile-auth-row');
  if (!authArea) return;

  if (isLoggedIn()) {
    const user = state.user;
    const name = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Usuário';
    const initial = name[0]?.toUpperCase() || 'U';
    const avatar = user?.imageUrl;

    authArea.innerHTML = `
    <div class="user-menu-btn" id="user-menu-btn">
      <div class="user-avatar">
        ${avatar ? `<img src="${avatar}" alt="${name}" />` : initial}
      </div>
      <span class="user-name">${name}</span>
      <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      <div class="user-dropdown" id="user-dropdown" style="display:none">
        <a href="#orders">${ic.orders_icon} Meus Pedidos</a>
        ${isAdmin() ? `<a href="#admin">${ic.dashboard} Dashboard</a>` : ''}
        <div class="divider"></div>
        <button id="sign-out-btn" class="danger">${ic.logout} Sair</button>
      </div>
    </div>`;

    document.getElementById('user-menu-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const dd = document.getElementById('user-dropdown');
      if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('sign-out-btn')?.addEventListener('click', async () => {
      await state.clerk?.signOut();
    });
    document.addEventListener('click', () => {
      const dd = document.getElementById('user-dropdown');
      if (dd) dd.style.display = 'none';
    }, { once: true });

    if (mobileRow) {
      mobileRow.innerHTML = `<button id="mobile-sign-out" class="btn btn-danger btn-sm" style="width:100%">${ic.logout} Sair da conta</button>`;
      document.getElementById('mobile-sign-out')?.addEventListener('click', () => state.clerk?.signOut());
    }
  } else {
    authArea.innerHTML = `
    <span class="desktop-auth" style="display:flex;gap:.4rem;align-items:center">
      <a href="#sign-in" class="auth-sign-in">Entrar</a>
      <a href="#sign-up" class="auth-sign-up">Cadastrar</a>
    </span>`;
    if (mobileRow) {
      mobileRow.innerHTML = `
      <a href="#sign-in" style="flex:1;text-align:center;padding:.6rem;border:1px solid var(--border);border-radius:var(--radius);font-size:.82rem;font-weight:700">Entrar</a>
      <a href="#sign-up" style="flex:1;text-align:center;padding:.6rem;background:var(--primary);color:#000;border-radius:var(--radius);font-size:.82rem;font-weight:700">Cadastrar</a>`;
    }
  }

  refreshCartBadge();
}

// ============================================================
// 12. GLOBAL EVENT DELEGATION
// ============================================================

document.addEventListener('click', (e) => {
  // Product card click → navigate to product
  const card = e.target.closest('[data-action="goto-product"]');
  if (card) { navigate(`#product?id=${card.dataset.id}`); return; }

  // Team filter from home page
  const teamCard = e.target.closest('[data-action="filter-team"]');
  if (teamCard) {
    shopFilters.team = teamCard.dataset.team;
    navigate('#shop');
    return;
  }

  // Hamburger toggle
  if (e.target.closest('#hamburger')) {
    document.getElementById('mobile-drawer')?.classList.toggle('open');
    return;
  }

  // Close mobile menu on nav link click
  if (e.target.closest('.mobile-link') || e.target.closest('.mobile-auth-row a')) {
    document.getElementById('mobile-drawer')?.classList.remove('open');
  }
});

// ============================================================
// 13. INIT
// ============================================================

async function init() {
  // Boot Clerk auth
  await initAuth();

  // Update navbar with auth state
  updateNavbar();

  // Listen for hash changes (user navigates)
  window.addEventListener('hashchange', handleRoute);

  // Render the initial route
  await handleRoute();
}

// Kick off the app
init().catch(console.error);
