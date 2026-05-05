import { clsx } from "clsx";
import type { ReactNode } from "react";

type Props = {
  variant: "error" | "success" | "info";
  children: ReactNode;
  className?: string;
};

const styles = {
  error: "bg-red-50 border-red-200 text-red-800",
  success: "bg-green-50 border-green-200 text-green-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

export function Alert({ variant, children, className }: Props) {
  return (
    <div
      role="alert"
      className={clsx("rounded-md border px-4 py-3 text-sm", styles[variant], className)}
    >
      {children}
    </div>
  );
}
