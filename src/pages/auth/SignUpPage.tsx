import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { signUpSchema, type SignUpInput } from "@/schemas/auth";
import { signUp } from "@/lib/auth";

export function SignUpPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (values: SignUpInput) => {
    setServerError(null);
    const result = await signUp(values.email, values.password);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }

    // ローカルは即ログイン可。本番は確認メール待ち。
    if (result.data.session) {
      navigate("/dashboard", { replace: true });
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <AuthLayout title="確認メールを送信しました">
        <Alert variant="success">
          <strong>{}</strong>
          に確認メールを送信しました。メール内のリンクをクリックしてアカウントを有効化してください。
        </Alert>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-brand-600 hover:underline">
            ログインページへ
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="アカウント登録" subtitle="無料でDiffBellを始めましょう">
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

        <FormField label="パスワード" htmlFor="password" error={errors.password?.message} required>
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
          label="パスワード（確認）"
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
          アカウントを作成
        </Button>

        <p className="text-center text-sm text-gray-600">
          すでにアカウントをお持ちの方は{" "}
          <Link to="/login" className="text-brand-600 hover:underline">
            ログイン
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
