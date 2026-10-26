import api from "@/lib/api";
import type { ProductsQuery, ProductsResponse } from "@/types/product";

export async function getProducts(
  query: ProductsQuery = {},
): Promise<ProductsResponse> {
  const { data } = await api.get<ProductsResponse>("/products", {
    params: {
      isActive: query.isActive ?? true,
      isFeatured: query.isFeatured ?? true,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    },
  });

  return data;
}
