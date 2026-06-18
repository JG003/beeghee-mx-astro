import { useEffect, useState } from 'react';
import { useCart } from './useCart';
import { CART_CONFIG, MX_SITE } from '../../data/site';

const SUPABASE_URL =
  import.meta.env.PUBLIC_SUPABASE_URL ?? 'https://nqskllzyphlhmuhzpcdy.supabase.co';
const SUPABASE_ANON =
  import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xc2tsbHp5cGhsaG11aHpwY2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDIyMjEsImV4cCI6MjA3ODcxODIyMX0.3Th9Bu441NwQT5C0-Ye9YPW7YnCtY7DGkUdT_iCd_4M';

const fmt = (n: number) => n.toLocaleString('es-MX');

function Icon({ path, className = 'h-4 w-4' }: { path: string; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

export default function CartDrawer() {
  const {
    items,
    isOpen,
    subtotal,
    itemCount,
    updateQuantity,
    removeItem,
    clearCart,
    closeCart,
    whatsAppOrderUrl,
  } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape + lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, closeCart]);

  const allHavePrice = items.length > 0 && items.every((i) => !!i.stripePriceId);
  const cardEnabled = CART_CONFIG.stripeEnabled && allHavePrice;

  const handleWhatsApp = () => {
    if (items.length === 0) return;
    window.open(whatsAppOrderUrl(), '_blank', 'noopener,noreferrer');
  };

  const handleCardCheckout = async () => {
    if (items.length === 0 || !cardEnabled) return;
    setError(null);
    setIsCheckingOut(true);
    try {
      const lineItems = items.map((i) => ({
        priceId: i.stripePriceId,
        quantity: i.quantity,
        name: i.name,
        price: i.priceMXN,
      }));
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/${CART_CONFIG.checkoutFunction}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON}`,
            apikey: SUPABASE_ANON,
          },
          body: JSON.stringify({ lineItems }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.url) throw new Error('no url');
      // Same-tab redirect — window.open after await is blocked on mobile.
      clearCart();
      window.location.href = data.url;
    } catch {
      setError('No se pudo iniciar el pago con tarjeta. Intenta de nuevo o usa WhatsApp.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-[9999] flex h-full w-full max-w-[420px] flex-col bg-background shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold">
            Tu carrito{itemCount > 0 ? ` (${itemCount})` : ''}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full p-1.5 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Cerrar carrito"
          >
            <Icon path='<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="mb-3 text-4xl">🛒</span>
              <p className="mb-4 text-muted-foreground">Tu carrito está vacío</p>
              <a
                href="/tienda/"
                onClick={closeCart}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Ver la tienda
              </a>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.key} className="flex gap-3 rounded-xl bg-muted/40 p-3">
                  {item.imageSrc && (
                    <img
                      src={item.imageSrc}
                      alt={item.name}
                      className="h-16 w-16 flex-shrink-0 rounded-md bg-card object-contain"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ${fmt(item.priceMXN)} {MX_SITE.currency}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted"
                        aria-label={`Quitar uno de ${item.name}`}
                      >
                        <Icon path='<line x1="5" y1="12" x2="19" y2="12"/>' className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted"
                        aria-label={`Agregar uno de ${item.name}`}
                      >
                        <Icon path='<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>' className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <Icon path='<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' />
                      </button>
                    </div>
                  </div>
                  <p className="flex-shrink-0 text-sm font-semibold">
                    ${fmt(item.priceMXN * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="space-y-3 border-t border-border p-4">
            <div className="flex items-center justify-between text-base font-bold">
              <span>Subtotal</span>
              <span>
                ${fmt(subtotal)} {MX_SITE.currency}
              </span>
            </div>
            <p className="-mt-1 text-xs text-muted-foreground">
              El costo de envío se confirma según tu ubicación.
            </p>

            {error && <p className="text-xs text-destructive">{error}</p>}

            {/* Card payment — live only when Stripe is configured */}
            {cardEnabled ? (
              <button
                type="button"
                onClick={handleCardCheckout}
                disabled={isCheckingOut}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                <Icon path='<rect x="2" y="6" width="20" height="12" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>' />
                {isCheckingOut ? 'Redirigiendo…' : 'Pagar con tarjeta'}
              </button>
            ) : (
              <button
                type="button"
                disabled
                title="Pago con tarjeta disponible muy pronto"
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm font-semibold text-muted-foreground"
              >
                <Icon path='<rect x="2" y="6" width="20" height="12" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>' />
                Pagar con tarjeta (próximamente)
              </button>
            )}

            {/* WhatsApp checkout — always available */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-whatsapp px-4 py-3 text-sm font-semibold text-whatsapp-foreground transition-all hover:bg-whatsapp/90"
            >
              <Icon path='<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>' />
              Confirmar pedido por WhatsApp
            </button>

            <button
              type="button"
              onClick={clearCart}
              className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Vaciar carrito
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
