import type { ReactNode } from "react";

export function PageContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 ${className}`}
    >
      {children}
    </div>
  );
}
