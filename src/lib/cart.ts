// Framework-agnostic shopping cart for the Astro site.
//
// Astro islands don't share React context, so the cart lives in this plain ES
// module singleton. Every island (the nav cart button, the add-to-cart buttons,
// the cart drawer, and the chat widget) imports this same module and therefore
// shares one cart instance at runtime. React islands subscribe via
// `useSyncExternalStore` (see ../components/islands/useCart.ts).
//
// State is persisted to localStorage and synced across browser tabs.

import { PRICING, getPriceState, MX_SITE, type ProductKey } from '../data/site';

export interface CartLine {
  key: ProductKey;
  name: string;
  /** Unit price in MXN at the time it was added (honors active promo). */
  priceMXN: number;
  imageSrc?: string;
  /** Stripe Price ID (MXN). Empty until Beeghee's MXN prices are created. */
  stripePriceId?: string;
  quantity: number;
}

export interface CartState {
  items: CartLine[];
  isOpen: boolean;
}

const STORAGE_KEY = 'beeghee-mx-cart';
const isBrowser = typeof window !== 'undefined';

// `state` is replaced immutably on every mutation so the reference identity is a
// reliable change signal for useSyncExternalStore.
let state: CartState = { items: [], isOpen: false };
const listeners = new Set<() => void>();

const SERVER_SNAPSHOT: CartState = { items: [], isOpen: false };

function loadItems(): CartLine[] {
  if (!isBrowser) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Keep only lines that still resolve to a real, purchasable product, and
    // refresh name/price/image from the catalog so stale carts can't drift.
    return parsed
      .map((line: any): CartLine | null => {
        const product = PRICING[line?.key as ProductKey];
        if (!product || product.comingSoon || product.disabled) return null;
        const quantity = Math.max(1, Math.floor(Number(line?.quantity) || 1));
        return {
          key: product.key,
          name: product.name,
          priceMXN: getPriceState(product).current,
          imageSrc: product.imageSrc,
          stripePriceId: product.stripePriceId,
          quantity,
        };
      })
      .filter((l): l is CartLine => l !== null);
  } catch {
    return [];
  }
}

function persist() {
  if (!isBrowser) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state.items.map((i) => ({ key: i.key, quantity: i.quantity })))
    );
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

function setState(next: Partial<CartState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

// Initialize from storage on the client at module load.
if (isBrowser) {
  state = { items: loadItems(), isOpen: false };
  // loadItems() may have pruned stale/removed/coming-soon SKUs; rewrite storage
  // once so the persisted cart matches the live, cleaned state even if the user
  // never mutates the cart afterwards.
  persist();
  // Cross-tab sync: another tab changed the cart.
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) setState({ items: loadItems() });
  });
}

// ---- subscription API (for useSyncExternalStore) ----

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): CartState {
  return state;
}

export function getServerSnapshot(): CartState {
  return SERVER_SNAPSHOT;
}

// ---- selectors ----

export function getItemCount(s: CartState = state): number {
  return s.items.reduce((acc, i) => acc + i.quantity, 0);
}

export function getSubtotal(s: CartState = state): number {
  return s.items.reduce((acc, i) => acc + i.priceMXN * i.quantity, 0);
}

// ---- mutations ----

/** Add a product by its catalog key. No-op (but opens the cart) for unknown,
 *  coming-soon, or disabled products. Returns the resolved product name or null. */
export function addItemByKey(key: ProductKey, quantity = 1): string | null {
  const product = PRICING[key];
  if (!product || product.comingSoon || product.disabled) {
    setState({ isOpen: true });
    return null;
  }
  const qty = Math.max(1, Math.floor(quantity) || 1);
  const existing = state.items.find((i) => i.key === key);
  let items: CartLine[];
  if (existing) {
    items = state.items.map((i) =>
      i.key === key ? { ...i, quantity: i.quantity + qty } : i
    );
  } else {
    items = [
      ...state.items,
      {
        key: product.key,
        name: product.name,
        priceMXN: getPriceState(product).current,
        imageSrc: product.imageSrc,
        stripePriceId: product.stripePriceId,
        quantity: qty,
      },
    ];
  }
  setState({ items, isOpen: true });
  persist();
  return product.name;
}

export function removeItem(key: ProductKey) {
  setState({ items: state.items.filter((i) => i.key !== key) });
  persist();
}

export function updateQuantity(key: ProductKey, quantity: number) {
  if (quantity <= 0) {
    removeItem(key);
    return;
  }
  setState({
    items: state.items.map((i) =>
      i.key === key ? { ...i, quantity: Math.floor(quantity) } : i
    ),
  });
  persist();
}

export function clearCart() {
  setState({ items: [] });
  persist();
}

export function openCart() {
  setState({ isOpen: true });
}

export function closeCart() {
  setState({ isOpen: false });
}

export function toggleCart(force?: boolean) {
  setState({ isOpen: force ?? !state.isOpen });
}

// ---- checkout helpers ----

const fmt = (n: number) => n.toLocaleString('es-MX');

/** Build the itemized WhatsApp order message + wa.me URL. */
export function buildWhatsAppOrderUrl(s: CartState = state): string {
  const lines = s.items
    .map(
      (i) =>
        `• ${i.quantity}× ${i.name} — $${fmt(i.priceMXN)} ${MX_SITE.currency} c/u`
    )
    .join('\n');
  const subtotal = getSubtotal(s);
  const message =
    `¡Hola! Quiero hacer este pedido en Beeghee México:\n\n` +
    `${lines}\n\n` +
    `Subtotal: $${fmt(subtotal)} ${MX_SITE.currency}\n` +
    `(Envío por confirmar)\n\n` +
    `¿Me confirman disponibilidad y la forma de pago?`;
  return `https://wa.me/${MX_SITE.whatsappDigits}?text=${encodeURIComponent(message)}`;
}
