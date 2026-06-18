export const MX_SITE = {
  brand: "Beeghee México",
  whatsappE164: "+529818198199",
  // WhatsApp registered this account under the legacy Mexican mobile format
  // (+52 _1_ 981...). wa.me links MUST keep the "1" or WhatsApp won't match the
  // account and the chat never opens. The "1" is NOT used for dialing/display.
  whatsappDigits: "5219818198199",
  whatsappPrefill: "Hola! Quiero comprar Beeghee en México.",
  currency: "MXN",
} as const;

export type ProductKey =
  | "tangy"
  | "velvet"
  | "double"
  | "family"
  | "travel-tangy"
  | "travel-velvet";

export interface PriceInfo {
  key: ProductKey;
  name: string;
  desc: string;
  supplyNote: string;
  normal: number;
  sale?: number;
  promoLabel?: string;
  promoEndISO?: string;
  ctaText: string;
  badge?: string;
  comingSoon?: boolean;
  disabled?: boolean;
  imageSrc?: string;
  imageAlt?: string;
  /**
   * Stripe Price ID (MXN) for the card-checkout leg. Empty until Beeghee's
   * MXN prices are created on its Stripe account. The card button stays
   * disabled while CART_CONFIG.stripeEnabled is false (see below), so empty
   * values here are safe.
   */
  stripePriceId?: string;
}

export const PRICING: Record<ProductKey, PriceInfo> = {
  tangy: {
    key: "tangy",
    name: "Tangy Original",
    desc: "Sabor clásico y vibrante.",
    supplyNote: "Suministro de 30 días — toma 1 porción al día.",
    normal: 600,
    sale: 500,
    promoLabel: "Buen Fin",
    promoEndISO: "2025-11-17T23:59:59-06:00",
    ctaText: "Quiero 1 frasco Tangy Original (9 oz)",
    imageSrc: "/images/tangy-jar.png",
    imageAlt: "Frasco de Beeghee Tangy Original 255g (9 oz)",
    stripePriceId: "price_1Tjo5MIDXpCauYMaFCiklwKW",
  },
  velvet: {
    key: "velvet",
    name: "Sweet Velvet",
    desc: "Perfil suave y cremoso.",
    supplyNote: "Suministro de 30 días — toma 1 porción al día.",
    normal: 600,
    sale: 500,
    promoLabel: "Buen Fin",
    promoEndISO: "2025-11-17T23:59:59-06:00",
    ctaText: "Quiero 1 frasco Sweet Velvet (9 oz)",
    imageSrc: "/images/velvet-jar.png",
    imageAlt: "Frasco de Beeghee Sweet Velvet 255g (9 oz)",
    stripePriceId: "price_1Tjo5NIDXpCauYMa7OZsOxhz",
  },
  double: {
    key: "double",
    name: "Paquete Doble",
    desc: "Elige tu mezcla de Tangy + Velvet.",
    supplyNote: "Suministro de 60 días — toma 1 porción al día.",
    normal: 1100,
    sale: 900,
    promoLabel: "Buen Fin",
    promoEndISO: "2025-11-17T23:59:59-06:00",
    ctaText: "Quiero el paquete doble",
    badge: "Más popular",
    imageSrc: "/images/duo-pack.png",
    imageAlt: "Paquete doble de Beeghee (2 frascos de 9 oz)",
    stripePriceId: "price_1Tjo5OIDXpCauYMasLi61w2X",
  },
  family: {
    key: "family",
    name: "Paquete Familiar",
    desc: "Optimiza precio por unidad.",
    supplyNote: "Suministro de 120 días — 4 frascos de 9 oz.",
    normal: 1500,
    ctaText: "Quiero el paquete familiar",
    disabled: true,
  },
  "travel-tangy": {
    key: "travel-tangy",
    name: "Tangy Original Travel",
    desc: "Formato de viaje.",
    supplyNote: "Suministro de 7–10 días de uso.",
    normal: 130,
    ctaText: "Quiero 1 Travel Tangy Original (2 oz)",
    stripePriceId: "price_1Tjo5PIDXpCauYMaFcSMlr0H",
  },
  "travel-velvet": {
    key: "travel-velvet",
    name: "Sweet Velvet Travel",
    desc: "Formato de viaje.",
    supplyNote: "Suministro de 7–10 días de uso.",
    normal: 130,
    ctaText: "Quiero 1 Travel Sweet Velvet (2 oz)",
    stripePriceId: "price_1Tjo5QIDXpCauYMa0tkYroQP",
  },
};

export const COMING_SOON = [
  {
    key: "bars80g",
    title: "Dark Chocolate Beeghee Bars – 80 g",
    desc: "Oaxacan Chocolate 80% cacao. Con Beeghee.",
    imageSrc: "/images/bars-80g.png",
    imageAlt: "Dark Chocolate Beeghee Bars 80g con chocolate oaxaqueño 80% cacao y relleno de Beeghee",
  },
  {
    key: "bites12g",
    title: "Dark Chocolate Beeghee Bites – 12 g",
    desc: "Oaxacan Chocolate 80% cacao. Con Beeghee.",
    imageSrc: "/images/bites-12g.png",
    imageAlt: "Dark Chocolate Beeghee Bites 12g con chocolate oaxaqueño 80% cacao y relleno de Beeghee",
  },
] as const;

export function whatsappUrl(text: string): string {
  return `https://wa.me/${MX_SITE.whatsappDigits}?text=${encodeURIComponent(text)}`;
}

export function getPriceState(p: PriceInfo) {
  const now = Date.now();
  const end = p.promoEndISO ? new Date(p.promoEndISO).getTime() : null;
  const onSale =
    p.sale != null &&
    end != null &&
    !Number.isNaN(end) &&
    now <= end &&
    p.sale < p.normal;
  return {
    onSale,
    current: onSale && p.sale != null ? p.sale : p.normal,
    normalPrice: p.normal,
    salePrice: p.sale,
  };
}

// ---- Cart / checkout configuration ----

export const CART_CONFIG = {
  /**
   * Flip to `true` once (a) MXN Stripe Prices are filled into PRICING[*].
   * stripePriceId AND (b) the `mx-create-checkout` edge function is deployed
   * to the MX Supabase project with Beeghee's STRIPE_SECRET_KEY set. Until
   * then, the cart's "Pagar con tarjeta" button shows as "Próximamente" and
   * only WhatsApp checkout is active.
   */
  stripeEnabled: true,
  /** Path of the Stripe-checkout edge function on the MX Supabase project. */
  checkoutFunction: 'mx-create-checkout',
} as const;

/**
 * Maps the product "slugs" the AI agents emit (voice client-tool + text
 * chatbot `[ACTION:add_to_cart:<slug>]`) onto real catalog keys. The agents'
 * historical vocabulary (`beeghee-bee-bread`, etc.) is normalized here so the
 * client can add the correct SKU regardless of which slug the model sends.
 * Unknown slugs (e.g. the not-yet-launched chocolates) resolve to null and the
 * handler responds honestly instead of pretending to add something.
 */
export const AGENT_SLUG_TO_KEY: Record<string, ProductKey | null> = {
  // Real catalog keys (preferred — agents are being updated to use these)
  tangy: 'tangy',
  velvet: 'velvet',
  double: 'double',
  family: null, // currently disabled in the catalog
  'travel-tangy': 'travel-tangy',
  'travel-velvet': 'travel-velvet',
  // Legacy generic slugs still in the agents' older prompts
  'beeghee-bee-bread': 'tangy', // generic jar → default to the signature Tangy
  'pan-de-abeja': 'tangy',
  // Chocolates are "Próximamente" — not purchasable yet
  'chocolate-bars-6': null,
  'chocolate-bites-12': null,
  bars80g: null,
  bites12g: null,
};
