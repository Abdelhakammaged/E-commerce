export type CartItem = {
  productId: string;
  variantId: string;
  name: string;
  color: string;
  size: string;
  price: number;
  image: string | null;
  quantity: number;
  stock: number;
};
