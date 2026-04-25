import { useEffect, useState } from 'react';
import LeadForm from './LeadForm';

const STORAGE_KEY = 'newVisitorOfferSeen';
const EXPIRATION_DAYS = 15;
const WA_DIGITS = '529818198199';

const OFFERS = {
  tangy: {
    name: 'Tangy Original',
    price: '$500 MXN',
    wasPrice: '$600',
    desc: '1 frasco (9 oz) — Suministro de 30 días',
    message: 'Hola! Quiero 1 frasco Tangy Original (9 oz) por $500 MXN',
    badge: undefined as string | undefined,
  },
  velvet: {
    name: 'Sweet Velvet',
    price: '$500 MXN',
    wasPrice: '$600',
    desc: '1 frasco (9 oz) — Suministro de 30 días',
    message: 'Hola! Quiero 1 frasco Sweet Velvet (9 oz) por $500 MXN',
    badge: undefined as string | undefined,
  },
  double: {
    name: 'Paquete Doble',
    price: '$900 MXN',
    wasPrice: '$1,100',
    desc: '2 frascos (9 oz c/u) — Suministro de 60 días',
    message: 'Hola! Quiero el paquete doble (2 frascos) por $900 MXN',
    badge: 'Más popular' as string | undefined,
  },
} as const;

type OfferKey = keyof typeof OFFERS;

export default function NewVisitorModal() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<OfferKey>('double');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const lastSeen = localStorage.getItem(STORAGE_KEY);
    if (lastSeen) {
      const daysSince = (Date.now() - parseInt(lastSeen, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < EXPIRATION_DAYS) return;
    }
    const t = setTimeout(() => {
      setOpen(true);
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  if (!open) return null;

  const offer = OFFERS[selected];
  const waUrl = `https://wa.me/${WA_DIGITS}?text=${encodeURIComponent(offer.message)}`;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl bg-background shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-center">¡Oferta Especial para Ti! 🎁</h2>

          <div className="w-full rounded-lg overflow-hidden">
            <img src="/images/beeghee-jars-duo.png" alt="Beeghee - Tangy Original y Sweet Velvet" className="w-full h-auto" />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Selecciona tu oferta:</p>
            <div className="space-y-2">
              {(Object.keys(OFFERS) as OfferKey[]).map((key) => {
                const o = OFFERS[key];
                const isSelected = selected === key;
                return (
                  <label
                    key={key}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                  >
                    <input
                      type="radio"
                      name="offer"
                      value={key}
                      checked={isSelected}
                      onChange={() => setSelected(key)}
                      className="mt-1 accent-primary"
                    />
                    <span className="flex-1">
                      <span className="flex items-center justify-between">
                        <span className="font-medium">{o.name}</span>
                        {o.badge && (
                          <span className="text-xs rounded-full bg-secondary/50 text-secondary-foreground px-2 py-0.5">{o.badge}</span>
                        )}
                      </span>
                      <span className="block text-sm text-muted-foreground">{o.desc}</span>
                      <span className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold">{o.price}</span>
                        <span className="text-sm line-through text-muted-foreground">{o.wasPrice}</span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-whatsapp text-whatsapp-foreground font-semibold px-6 py-3 text-base hover:bg-whatsapp/90 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            Comprar {offer.name} por WhatsApp
          </a>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-center mb-3 text-muted-foreground">O recibe la oferta por correo:</p>
            <LeadForm tag="mx-new-visitor" placeholder="Tu correo" buttonText="Enviar oferta" />
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
