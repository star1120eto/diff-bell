import { z } from "zod";
import { isSsrfUrl } from "@/lib/url";

const urlField = z
  .string()
  .min(1, "URLを入力してください")
  .url("有効なURLを入力してください")
  .refine((url) => !isSsrfUrl(url), "このURLは監視対象として指定できません");

export const monitorCreateSchema = z.object({
  name: z.string().min(1, "名前を入力してください").max(100, "名前は100文字以内で入力してください"),
  url: urlField,
  interval_hours: z.union(
    [z.literal(1), z.literal(3), z.literal(6), z.literal(12), z.literal(24)],
    { errorMap: () => ({ message: "チェック間隔を選択してください" }) },
  ),
  ignore_selectors: z.array(z.string()).default([]),
});

export const monitorUpdateSchema = monitorCreateSchema.partial();

export type MonitorCreateInput = z.infer<typeof monitorCreateSchema>;
export type MonitorUpdateInput = z.infer<typeof monitorUpdateSchema>;
export type IntervalHours = 1 | 3 | 6 | 12 | 24;
