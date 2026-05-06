import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function listUnreadNotifications(): Promise<Result<Notification[]>> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function markAllNotificationsRead(): Promise<Result<void>> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}
