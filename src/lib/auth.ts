import { supabase } from "@/lib/supabase";
import type { AuthError, Session, User } from "@supabase/supabase-js";

export type AuthResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

function formatAuthError(error: AuthError): string {
  switch (error.message) {
    case "Invalid login credentials":
      return "メールアドレスまたはパスワードが正しくありません";
    case "Email not confirmed":
      return "メールアドレスの確認が完了していません。確認メールをご確認ください";
    case "User already registered":
      return "このメールアドレスはすでに登録されています";
    case "Password should be at least 6 characters.":
      return "パスワードは6文字以上にしてください";
    default:
      return error.message;
  }
}

export async function signUp(
  email: string,
  password: string,
): Promise<AuthResult<{ user: User; session: Session | null }>> {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return { ok: false, error: formatAuthError(error) };
  if (!data.user) return { ok: false, error: "ユーザー作成に失敗しました" };

  return { ok: true, data: { user: data.user, session: data.session } };
}

export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult<{ user: User; session: Session }>> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { ok: false, error: formatAuthError(error) };
  if (!data.session) return { ok: false, error: "ログインに失敗しました" };

  return { ok: true, data: { user: data.user, session: data.session } };
}

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();

  if (error) return { ok: false, error: formatAuthError(error) };
  return { ok: true, data: null };
}

export async function resetPassword(email: string, redirectTo: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) return { ok: false, error: formatAuthError(error) };
  return { ok: true, data: null };
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return { ok: false, error: formatAuthError(error) };
  return { ok: true, data: null };
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
