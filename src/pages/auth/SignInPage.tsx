import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { signInSchema, type SignInInput } from "@/schemas/auth";
import { signIn } from "@/lib/auth";

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  // ProtectedRoute からのリダイレクト先を引き継ぐ
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (values: SignInInput) => {
    setServerError(null);
    const result = await signIn(values.email, values.password);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }

    navigate(from, { replace: true });
  };

  return (
    <AuthLayout title="ログイン">
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
            autoComplete="current-password"
            error={!!errors.password}
            {...register("password")}
          />
        </FormField>

        <div className="flex justify-end">
          <Link to="/reset-password" className="text-sm text-brand-600 hover:underline">
            パスワードを忘れた方
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          ログイン
        </Button>

        <p className="text-center text-sm text-gray-600">
          アカウントをお持ちでない方は{" "}
          <Link to="/signup" className="text-brand-600 hover:underline">
            新規登録
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
