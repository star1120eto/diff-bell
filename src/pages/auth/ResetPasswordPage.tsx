import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { resetPasswordSchema, type ResetPasswordInput } from "@/schemas/auth";
import { resetPassword } from "@/lib/auth";

export function ResetPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (values: ResetPasswordInput) => {
    setServerError(null);
    const redirectTo = `${window.location.origin}/reset-password/confirm`;
    const result = await resetPassword(values.email, redirectTo);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout title="メールを送信しました">
        <Alert variant="success">
          パスワードリセット用のリンクをメールに送信しました。メールをご確認ください。
        </Alert>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-brand-600 hover:underline">
            ログインページへ戻る
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="パスワードリセット"
      subtitle="登録済みのメールアドレスにリセットリンクを送信します"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {serverError && <Alert variant="error">{serverError}</Alert>}

        <FormField label="メールアドレス" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            error={!!errors.email}
            {...register("email")}
          />
        </FormField>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          リセットメールを送信
        </Button>

        <p className="text-center text-sm text-gray-600">
          <Link to="/login" className="text-brand-600 hover:underline">
            ログインページへ戻る
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
