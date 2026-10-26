export type ProductVariant = {
  id: string;
  productId: string;
  color: string;
  size: string;
  price: string;
  stock: number;
  sku: string | null;
  createdAt: string;
  updatedAt: string;
  image: string | null;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  images: string[];
  rating: number;
  reviewsCount: number;
  brandId: string;
  isActive: boolean;
  categoryId: string;
  isFeatured: boolean;
  code: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
  };
  brand: {
    id: string;
    name: string;
  };
  variants: ProductVariant[];
};

export type ProductsMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ProductsResponse = {
  data: Product[];
  meta: ProductsMeta;
};

export type ProductsQuery = {
  isActive?: boolean;
  isFeatured?: boolean;
  page?: number;
  limit?: number;
};
