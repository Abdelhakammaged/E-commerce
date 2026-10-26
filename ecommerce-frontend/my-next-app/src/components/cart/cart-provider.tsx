"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types/cart";

const STORAGE_KEY = "ecom-cart";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readStoredCart());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((current) => {
        const existing = current.find((row) => row.variantId === item.variantId);
        if (!existing) {
          return [
            ...current,
            { ...item, quantity: Math.min(quantity, item.stock) },
          ];
        }

        return current.map((row) =>
          row.variantId === item.variantId
            ? {
                ...row,
                quantity: Math.min(row.quantity + quantity, row.stock),
              }
            : row,
        );
      });
    },
    [],
  );

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((current) =>
      current
        .map((row) =>
          row.variantId === variantId
            ? { ...row, quantity: Math.min(Math.max(quantity, 0), row.stock) }
            : row,
        )
        .filter((row) => row.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((current) => current.filter((row) => row.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, row) => sum + row.quantity, 0);
    const subtotal = items.reduce(
      (sum, row) => sum + row.price * row.quantity,
      0,
    );
    return { items, itemCount, subtotal, addItem, updateQuantity, removeItem, clear };
  }, [addItem, clear, items, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
