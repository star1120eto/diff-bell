import { clsx } from "clsx";
import { forwardRef, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { error, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
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
});
