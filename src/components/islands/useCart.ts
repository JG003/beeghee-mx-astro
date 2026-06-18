import { useSyncExternalStore } from 'react';
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  getItemCount,
  getSubtotal,
  addItemByKey,
  removeItem,
  updateQuantity,
  clearCart,
  openCart,
  closeCart,
  toggleCart,
  buildWhatsAppOrderUrl,
} from '../../lib/cart';

/** React binding for the shared cart store. Safe across multiple Astro islands. */
export function useCart() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    items: state.items,
    isOpen: state.isOpen,
    itemCount: getItemCount(state),
    subtotal: getSubtotal(state),
    addItemByKey,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    whatsAppOrderUrl: () => buildWhatsAppOrderUrl(state),
  };
}
