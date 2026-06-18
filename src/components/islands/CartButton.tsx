import { useCart } from './useCart';

/** Cart icon + item-count badge for the nav. Opens the cart drawer. */
export default function CartButton({ className = '' }: { className?: string }) {
  const { itemCount, openCart } = useCart();
  return (
    <button
      type="button"
      onClick={openCart}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 transition-colors hover:text-foreground hover:bg-muted/60 ${className}`}
      aria-label={`Abrir carrito${itemCount > 0 ? ` (${itemCount})` : ''}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
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
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold leading-none text-primary-foreground">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}
