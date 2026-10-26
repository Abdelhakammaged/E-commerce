"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { getProducts } from "@/services/products";
import type { Product, ProductVariant, ProductsMeta } from "@/types/product";
import { useCart } from "@/components/cart/cart-provider";
import { PageContainer } from "@/components/layout/page-container";

function ProductItem({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id ?? "",
  );

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ??
    product.variants[0] ??
    null;

  // Use the selected variant's own image if it has one, otherwise fall
  // back to the product's default images.
  const variantImage = selectedVariant?.image ?? null;
  const primaryImage = variantImage ?? product.images[0];
  const hoverImage = variantImage ? undefined : product.images[1];

  return (
    <li className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start">
      <div className="group relative h-28 w-28 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {primaryImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={primaryImage}
              src={primaryImage}
              alt={product.name}
              className={`h-full w-full object-cover transition-opacity duration-200 ${
                hoverImage ? "group-hover:opacity-0" : ""
              }`}
            />
            {hoverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hoverImage}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">
            No image
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-lg font-medium">{product.name}</h2>
            <span className="text-xs text-zinc-500">{product.code}</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {product.description}
          </p>
          <p className="text-sm text-zinc-500">
            {product.brand.name} · {product.category.name}
          </p>
        </div>

        {product.variants.length > 0 ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Choose variant</legend>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((variant) => (
                <VariantOption
                  key={variant.id}
                  variant={variant}
                  selected={selectedVariant?.id === variant.id}
                  onSelect={() => setSelectedVariantId(variant.id)}
                />
              ))}
            </div>
          </fieldset>
        ) : (
          <p className="text-sm text-zinc-500">No variants available.</p>
        )}

        {selectedVariant && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-medium">${selectedVariant.price}</span>
            <span className="text-zinc-500">
              {selectedVariant.color} / {selectedVariant.size}
            </span>
            <span
              className={
                selectedVariant.stock > 0 ? "text-zinc-500" : "text-red-600"
              }
            >
              {selectedVariant.stock > 0
                ? `${selectedVariant.stock} in stock`
                : "Out of stock"}
            </span>
          </div>
        )}

        <button
          type="button"
          disabled={!selectedVariant || selectedVariant.stock <= 0}
          onClick={() => {
            if (!selectedVariant) return;
            addItem({
              productId: product.id,
              variantId: selectedVariant.id,
              name: product.name,
              color: selectedVariant.color,
              size: selectedVariant.size,
              price: Number(selectedVariant.price),
              image: selectedVariant.image ?? product.images[0] ?? null,
              stock: selectedVariant.stock,
            });
          }}
          className="w-fit rounded bg-orange-500 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Add to cart
        </button>
      </div>
    </li>
  );
}

function VariantOption({
  variant,
  selected,
  onSelect,
}: {
  variant: ProductVariant;
  selected: boolean;
  onSelect: () => void;
}) {
  const outOfStock = variant.stock <= 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={outOfStock}
      aria-pressed={selected}
      className={`rounded border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        selected
          ? "border-orange-500 bg-orange-500 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
          : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500"
      }`}
    >
      {variant.color} · {variant.size}
      <span className="ml-1.5 text-xs opacity-70">${variant.price}</span>
    </button>
  );
}

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<ProductsMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await getProducts({
          isActive: true,
          isFeatured: true,
          page,
          limit: 10,
        });

        if (!cancelled) {
          setProducts(response.data);
          setMeta(response.meta);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof AxiosError
              ? ((err.response?.data as { message?: string })?.message ??
                "Failed to load products.")
              : "Something went wrong.";
          setError(Array.isArray(message) ? message.join(", ") : message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <PageContainer>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        {meta && (
          <p className="text-sm text-zinc-500">
            {meta.total} product{meta.total === 1 ? "" : "s"}
          </p>
        )}
      </header>

      {loading && <p className="text-sm text-zinc-500">Loading products…</p>}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="text-sm text-zinc-500">No products found.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <ul className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {products.map((product) => (
            <ProductItem key={product.id} product={product} />
          ))}
        </ul>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-500">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= meta.totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700"
          >
            Next
          </button>
        </div>
      )}
    </PageContainer>
  );
};

export default ProductList;
