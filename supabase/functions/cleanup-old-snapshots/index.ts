import { createServiceClient, errorResponse, jsonResponse } from "../_shared/supabase.ts";

const DEFAULT_KEEP_COUNT = 5;

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return errorResponse("Method Not Allowed", 405);

  // CRON_SECRET による認証（必須）
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    console.error("CRON_SECRET is not configured");
    return errorResponse("Server misconfiguration", 500);
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return errorResponse("Unauthorized", 401);
  }

  let keepCount = DEFAULT_KEEP_COUNT;
  try {
    const body = await req.json();
    if (typeof body.keepCount === "number") keepCount = body.keepCount;
  } catch {
    // keepCount はオプション
  }

  const db = createServiceClient();

  const { data, error } = await db.rpc("cleanup_old_snapshots", {
    keep_count: keepCount,
  });

  if (error) {
    console.error("cleanup_old_snapshots error:", error);
    return errorResponse("Cleanup failed");
  }

  return jsonResponse({ deleted: data });
});
