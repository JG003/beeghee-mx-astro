import { useCart } from './useCart';
import type { ProductKey } from '../../data/site';

/**
 * "Agregar al carrito" button used on product cards. Adds the SKU to the shared
 * cart and opens the drawer. Sits alongside the WhatsApp CTA so shoppers can
 * choose either path.
 */
export default function AddToCartButton({
  productKey,
  label = 'Agregar al carrito',
}: {
  productKey: ProductKey;
  label?: string;
}) {
  const { addItemByKey } = useCart();
  return (
    <button
      type="button"
      onClick={() => addItemByKey(productKey, 1)}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {label}
    </button>
  );
}
