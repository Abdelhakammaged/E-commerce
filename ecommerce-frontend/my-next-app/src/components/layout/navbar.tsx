"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/config/navigation";
import { useCart } from "@/components/cart/cart-provider";

function linkClass(active: boolean) {
  return `rounded px-3 py-2 text-sm transition-colors ${
    active
      ? "bg-orange-500 text-white "
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
  }`;
}

export default function Navbar() {
  const pathname = usePathname() ?? "";
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Store Title
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={linkClass(active)}
              >
                {link.label}
                {link.href === "/cart" && itemCount > 0 ? (
                  <span className="ml-1.5 rounded-full bg-zinc-200 px-1.5 text-xs dark:bg-zinc-700">
                    {itemCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/login"
          className="hidden text-sm text-zinc-500 hover:text-zinc-900 sm:inline dark:hover:text-zinc-100"
        >
          Login
        </Link>

        <button
          type="button"
          className="rounded border border-zinc-300 px-2 py-1 text-sm sm:hidden dark:border-zinc-700"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="flex flex-col gap-1 border-t border-zinc-200 px-4 py-3 sm:hidden dark:border-zinc-800"
          aria-label="Mobile"
        >
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={linkClass(active)}
                onClick={() => setOpen(false)}
              >
                {link.label}
                {link.href === "/cart" && itemCount > 0 ? ` (${itemCount})` : ""}
              </Link>
            );
          })}
          <Link
            href="/login"
            className="rounded px-3 py-2 text-sm text-zinc-500"
            onClick={() => setOpen(false)}
          >
            Login
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
