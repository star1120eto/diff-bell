import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import {
  getSettings,
  getProfile,
  updateSettings,
  updateProfile,
  sendTestNotification,
  type TestNotificationResult,
} from "@/lib/settings";

const settingsSchema = z.object({
  display_name: z.string().max(50, "50文字以内で入力してください").optional(),
  email_notifications_enabled: z.boolean(),
  slack_webhook_url: z
    .string()
    .max(500)
    .refine(
      (v) => v === "" || v.startsWith("https://hooks.slack.com/"),
      "Slack Incoming Webhook URL を入力してください（https://hooks.slack.com/ で始まる）",
    )
    .optional(),
});

type SettingsInput = z.infer<typeof settingsSchema>;

export function SettingsPage() {
  const [email, setEmail] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<TestNotificationResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      display_name: "",
      email_notifications_enabled: true,
      slack_webhook_url: "",
    },
  });

  useEffect(() => {
    async function load() {
      const [profileResult, settingsResult] = await Promise.all([getProfile(), getSettings()]);
      if (profileResult.ok) {
        setEmail(profileResult.data.email);
        if (settingsResult.ok) {
          reset({
            display_name: profileResult.data.display_name ?? "",
            email_notifications_enabled: settingsResult.data.email_notifications_enabled,
            slack_webhook_url: settingsResult.data.slack_webhook_url ?? "",
          });
        }
      }
      setLoading(false);
    }
    load();
  }, [reset]);

  const handleTestNotification = async () => {
    setIsTesting(true);
    setTestResult(null);
    const webhookUrl = watch("slack_webhook_url");
    const result = await sendTestNotification(webhookUrl);
    if (result.ok) {
      setTestResult(result.data);
    } else {
      setTestResult(null);
    }
    setIsTesting(false);
  };

  const onSubmit = async (values: SettingsInput) => {
    setSaveStatus("idle");
    setErrorMessage(null);

    const [profileResult, settingsResult] = await Promise.all([
      updateProfile({ display_name: values.display_name || null }),
      updateSettings({
        email_notifications_enabled: values.email_notifications_enabled,
        slack_webhook_url: values.slack_webhook_url || null,
      }),
    ]);

    if (!profileResult.ok) {
      setErrorMessage(profileResult.error);
      setSaveStatus("error");
      return;
    }
    if (!settingsResult.ok) {
      setErrorMessage(settingsResult.error);
      setSaveStatus("error");
      return;
    }

    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 3000);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">設定</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* プロフィール */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">プロフィール</h2>
          <div className="space-y-4">
            <div>
              <p className="mb-1 block text-sm font-medium text-gray-700">メールアドレス</p>
              <p className="text-sm text-gray-500">{email}</p>
            </div>
            <FormField label="表示名" htmlFor="display_name" error={errors.display_name?.message}>
              <Input
                id="display_name"
                type="text"
                placeholder="例: 山田 太郎"
                {...register("display_name")}
              />
            </FormField>
          </div>
        </section>

        {/* 通知設定 */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">通知設定</h2>

          {/* メール通知 */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">メール通知</p>
              <p className="text-xs text-gray-500">変更検出時にメールで通知します</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                {...register("email_notifications_enabled")}
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-600"></div>
            </label>
          </div>

          {/* Slack 通知 */}
          <div className="space-y-2">
            <FormField
              label="Slack Incoming Webhook URL"
              htmlFor="slack_webhook_url"
              error={errors.slack_webhook_url?.message}
            >
              <Input
                id="slack_webhook_url"
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                {...register("slack_webhook_url")}
              />
            </FormField>
            <p className="text-xs text-gray-500">
              設定すると変更検出時に Slack へ通知します。 Slack アプリの「Incoming Webhooks」から
              URL を取得してください。 空欄の場合は Slack 通知を送信しません。
            </p>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={isTesting}
                onClick={handleTestNotification}
              >
                テスト送信
              </Button>
              {testResult && <TestResultBadges result={testResult} />}
            </div>
          </div>
        </section>

        {/* 保存ボタン */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!isDirty && saveStatus !== "error"}
          >
            変更を保存
          </Button>
          {saveStatus === "saved" && (
            <p className="text-sm font-medium text-green-600">保存しました</p>
          )}
          {saveStatus === "error" && errorMessage && <Alert variant="error">{errorMessage}</Alert>}
        </div>
      </form>
    </div>
  );
}

const STATUS_COLOR = {
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  skipped: "bg-gray-100 text-gray-500",
} as const;

const STATUS_LABEL = {
  sent: "送信成功",
  failed: "送信失敗",
  skipped: "スキップ",
} as const;

function TestResultBadges({ result }: { result: TestNotificationResult }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[result.slack]}`}
      >
        Slack: {STATUS_LABEL[result.slack]}
        {result.slackError && ` (${result.slackError})`}
      </span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[result.email]}`}
      >
        メール: {STATUS_LABEL[result.email]}
        {result.emailError && ` (${result.emailError})`}
      </span>
    </div>
  );
}
