import type { ReactNode } from "react";
import Navbar from "@/components/layout/navbar";

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
    </>
  );
}