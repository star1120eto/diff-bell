import { clsx } from "clsx";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export function Input({ error, className, ...props }: Props) {
  return (
    <input
      className={clsx(
        "block w-full rounded-md border px-3 py-2 text-sm shadow-sm",
        "placeholder:text-gray-400",
        "focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-600",
        "disabled:bg-gray-50 disabled:text-gray-500",
        error ? "border-red-500 focus:ring-red-500" : "border-gray-300",
        className,
      )}
      {...props}
    />
  );
}
