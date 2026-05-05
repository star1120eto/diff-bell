import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { resetPasswordConfirmSchema, type ResetPasswordConfirmInput } from "@/schemas/auth";
import { updatePassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export function ResetPasswordConfirmPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Supabase は URL の hash (#access_token=...) を自動処理してセッションを確立する
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordConfirmInput>({
    resolver: zodResolver(resetPasswordConfirmSchema),
  });

  const onSubmit = async (values: ResetPasswordConfirmInput) => {
    setServerError(null);
    const result = await updatePassword(values.password);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  if (!ready) {
    return (
      <AuthLayout title="パスワードリセット">
        <Alert variant="info">リセットリンクを確認中です。しばらくお待ちください。</Alert>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="新しいパスワードを設定" subtitle="新しいパスワードを入力してください">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {serverError && <Alert variant="error">{serverError}</Alert>}

        <FormField
          label="新しいパスワード"
          htmlFor="password"
          error={errors.password?.message}
          required
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="8文字以上"
            error={!!errors.password}
            {...register("password")}
          />
        </FormField>

        <FormField
          label="新しいパスワード（確認）"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
          required
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
        </FormField>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          パスワードを更新
        </Button>
      </form>
    </AuthLayout>
  );
}
