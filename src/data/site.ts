export const MX_SITE = {
  brand: "Beeghee México",
  whatsappE164: "+529818198199",
  whatsappDigits: "529818198199",
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
  },
  "travel-velvet": {
    key: "travel-velvet",
    name: "Sweet Velvet Travel",
    desc: "Formato de viaje.",
    supplyNote: "Suministro de 7–10 días de uso.",
    normal: 130,
    ctaText: "Quiero 1 Travel Sweet Velvet (2 oz)",
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
