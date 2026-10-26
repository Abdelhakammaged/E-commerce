"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { getProducts } from "@/services/products";
import type { Product } from "@/types/product";
import { PageContainer } from "@/components/layout/page-container";

export default function HomeView() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await getProducts({
          isActive: true,
          isFeatured: true,
          page: 1,
          limit: 4,
        });
        if (!cancelled) setFeatured(response.data);
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof AxiosError
              ? ((err.response?.data as { message?: string })?.message ??
                "Could not load featured products.")
              : "Could not load featured products.";
          setError(Array.isArray(message) ? message.join(", ") : message);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContainer>
      <section className="flex flex-col gap-4 py-6">
        <p className="text-sm text-zinc-500">Welcome</p>
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight">
          Shop products, pick a variant, and keep going to checkout later.
        </h1>
        <p className="max-w-lg text-sm text-zinc-600 dark:text-zinc-400">
          Browse the catalog, add items to your cart, and review them before you
          place an order.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/products"
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Shop products
          </Link>
          <Link
            href="/cart"
            className="rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            View cart
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Featured</h2>
        {error ? (
          <p className="text-sm text-zinc-500">{error}</p>
        ) : featured.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No featured products yet. See the full catalog instead.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {featured.map((product) => {
              const image = product.variants[0]?.image ?? product.images[0];
              return (
                <li
                  key={product.id}
                  className="flex gap-3 rounded border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="text-sm text-zinc-500">
                      {product.category?.name}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {product.code}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}
