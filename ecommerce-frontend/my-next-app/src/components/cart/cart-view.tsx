"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { PageContainer } from "@/components/layout/page-container";

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function CartView() {
  const { items, subtotal, updateQuantity, removeItem, clear, itemCount } =
    useCart();

  return (
    <PageContainer>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Cart</h1>
        <p className="text-sm text-zinc-500">
          {itemCount === 0
            ? "Your cart is empty."
            : `${itemCount} item${itemCount === 1 ? "" : "s"}`}
        </p>
      </header>

      {items.length === 0 ? (
        <Link
          href="/products"
          className="w-fit rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Browse products
        </Link>
      ) : (
        <>
          <ul className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {items.map((item) => (
              <li
                key={item.variantId}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-zinc-500">
                    {item.color} / {item.size}
                  </p>
                  <p className="text-sm">{money(item.price)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="sr-only" htmlFor={`qty-${item.variantId}`}>
                    Quantity
                  </label>
                  <input
                    id={`qty-${item.variantId}`}
                    type="number"
                    min={1}
                    max={item.stock}
                    value={item.quantity}
                    onChange={(event) =>
                      updateQuantity(
                        item.variantId,
                        Number(event.target.value),
                      )
                    }
                    className="w-16 rounded border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    className="text-sm text-zinc-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-lg font-medium">Subtotal {money(subtotal)}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clear}
                className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
              >
                Clear
              </button>
              <Link
                href="/products"
                className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}
