export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/cart", label: "Cart" },
] as const;

export type NavLink = (typeof NAV_LINKS)[number];
