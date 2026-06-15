import { createClient } from "@supabase/supabase-js";
import { createUserClient, errorResponse, jsonResponse } from "../_shared/supabase.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return errorResponse("Method Not Allowed", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return errorResponse("Unauthorized", 401);

  // ユーザー認証
  const userClient = createUserClient(authHeader);
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) return errorResponse("Unauthorized", 401);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured");
    return errorResponse("Server misconfiguration", 500);
  }

  // 管理者クライアントでユーザーを削除（profiles は CASCADE で自動削除される）
  const adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("Failed to delete user:", deleteError);
    return errorResponse("アカウントの削除に失敗しました", 500);
  }

  return jsonResponse({ deleted: true });
});
