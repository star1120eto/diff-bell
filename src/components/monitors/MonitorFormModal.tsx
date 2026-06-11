import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { monitorCreateSchema, type MonitorCreateInput } from "@/schemas/monitor";
import type { Monitor } from "@/lib/monitors";

type Props = {
  monitor?: Monitor | null;
  onSubmit: (values: MonitorCreateInput) => Promise<void>;
  onClose: () => void;
  minIntervalHours?: number;
};

const INTERVAL_OPTIONS = [
  { value: 1, label: "1時間" },
  { value: 3, label: "3時間" },
  { value: 6, label: "6時間" },
  { value: 12, label: "12時間" },
  { value: 24, label: "24時間" },
] as const;

export function MonitorFormModal({ monitor, onSubmit, onClose, minIntervalHours = 1 }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = !!monitor;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MonitorCreateInput>({
    resolver: zodResolver(monitorCreateSchema),
    defaultValues: {
      name: "",
      url: "",
      interval_hours: 24,
      ignore_selectors: [],
    },
  });

  useEffect(() => {
    if (monitor) {
      reset({
        name: monitor.name,
        url: monitor.url,
        interval_hours: monitor.interval_hours,
        ignore_selectors: monitor.ignore_selectors,
      });
    } else {
      reset({ name: "", url: "", interval_hours: 24, ignore_selectors: [] });
    }
  }, [monitor, reset]);

  const handleFormSubmit = async (values: MonitorCreateInput) => {
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "エラーが発生しました");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "監視URLを編集" : "監視URLを追加"}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 px-6 py-5" noValidate>
          {serverError && <Alert variant="error">{serverError}</Alert>}

          <FormField label="名前" htmlFor="name" error={errors.name?.message} required>
            <Input
              id="name"
              placeholder="例: 公式サイト トップ"
              error={!!errors.name}
              {...register("name")}
            />
          </FormField>

          <FormField label="URL" htmlFor="url" error={errors.url?.message} required>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/"
              error={!!errors.url}
              {...register("url")}
            />
          </FormField>

          <FormField
            label="チェック間隔"
            htmlFor="interval_hours"
            error={errors.interval_hours?.message}
            required
          >
            <select
              id="interval_hours"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              {...register("interval_hours", { valueAsNumber: true })}
            >
              {INTERVAL_OPTIONS.filter((opt) => opt.value >= minIntervalHours).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? "更新" : "追加"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
