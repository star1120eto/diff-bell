import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-600">DiffBell</h1>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
        </div>
        <div className="rounded-xl bg-white px-8 py-10 shadow-sm ring-1 ring-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
}
