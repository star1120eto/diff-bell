import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env["SUPABASE_URL"] ?? "http://localhost:54321";
const SUPABASE_ANON_KEY = process.env["SUPABASE_ANON_KEY"] ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";

if (!SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_ANON_KEY が設定されていません。.env を確認してください。");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any>;

export function createAnonClient(): AnyClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

export function createServiceClient(): AnyClient {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY が設定されていません。");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function signUpAndIn(
  client: AnyClient,
  email: string,
  password: string,
): Promise<{ id: string; email: string }> {
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw new Error(`SignUp failed: ${error.message}`);
  if (!data.user) throw new Error("SignUp returned no user");

  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`SignIn failed: ${signInError.message}`);

  return { id: data.user.id, email: data.user.email ?? email };
}

export async function cleanupTestUsers(emails: string[]): Promise<void> {
  const service = createServiceClient();
  const { data: users } = await service.auth.admin.listUsers();
  if (!users) return;

  for (const user of users.users) {
    if (emails.includes(user.email ?? "")) {
      await service.auth.admin.deleteUser(user.id);
    }
  }
}

export function generateTestEmail(prefix: string): string {
  return `${prefix}-${Date.now()}@test.local`;
}
