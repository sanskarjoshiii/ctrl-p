import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { cartTotals, clampPages, type BookOptions, type ShippingKey } from '@shared/pricing';

export interface CartItem {
  id: string;
  projectId: string;
  title: string;
  templateSlug: string;
  pages: number;
  qty: number;
  options: BookOptions;
  /** Small rendered cover (data URL) for projects without cover art. */
  coverThumb?: string;
  addedAt: number;
}

interface CartState {
  items: CartItem[];
  promoCode: string;
  shipping: ShippingKey;
  add: (item: Omit<CartItem, 'id' | 'addedAt' | 'qty'> & { qty?: number }) => void;
  update: (id: string, patch: Partial<Pick<CartItem, 'qty' | 'options' | 'pages' | 'title' | 'coverThumb'>>) => void;
  remove: (id: string) => void;
  removeProject: (projectId: string) => void;
  clear: () => void;
  setPromo: (code: string) => void;
  setShipping: (s: ShippingKey) => void;
}

const sameOptions = (a: BookOptions, b: BookOptions) => a.size === b.size && a.binding === b.binding && a.paper === b.paper && a.giftBox === b.giftBox;

export const useCart = create<CartState>()(
  persist(
    set => ({
      items: [],
      promoCode: '',
      shipping: 'standard',
      add: ({ qty = 1, ...item }) =>
        set(s => {
          const existing = s.items.find(i => i.projectId === item.projectId && sameOptions(i.options, item.options));
          if (existing) {
            return { items: s.items.map(i => (i === existing ? { ...i, ...item, qty: Math.min(20, i.qty + qty), pages: clampPages(item.pages) } : i)) };
          }
          return { items: [...s.items, { ...item, pages: clampPages(item.pages), qty, id: nanoid(8), addedAt: Date.now() }] };
        }),
      update: (id, patch) => set(s => ({ items: s.items.map(i => (i.id === id ? { ...i, ...patch, qty: Math.max(1, Math.min(20, patch.qty ?? i.qty)) } : i)) })),
      remove: id => set(s => ({ items: s.items.filter(i => i.id !== id) })),
      removeProject: projectId => set(s => ({ items: s.items.filter(i => i.projectId !== projectId) })),
      clear: () => set({ items: [], promoCode: '' }),
      setPromo: promoCode => set({ promoCode }),
      setShipping: shipping => set({ shipping }),
    }),
    { name: 'bd-cart', version: 1 },
  ),
);

export const useCartCount = () => useCart(s => s.items.reduce((n, i) => n + i.qty, 0));
export const useCartTotals = () => {
  const { items, shipping, promoCode } = useCart();
  return cartTotals(items, shipping, promoCode);
};
