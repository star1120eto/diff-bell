import { clsx } from "clsx";
import type { LabelHTMLAttributes, ReactNode } from "react";

type Props = LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
  children: ReactNode;
};

export function Label({ required, className, children, ...props }: Props) {
  return (
    <label className={clsx("block text-sm font-medium text-gray-700", className)} {...props}>
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
}
