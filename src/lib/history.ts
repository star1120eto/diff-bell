import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type ChangeEvent = Database["public"]["Tables"]["change_events"]["Row"];
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function listChangeEvents(monitorId: string): Promise<Result<ChangeEvent[]>> {
  const { data, error } = await supabase
    .from("change_events")
    .select("*")
    .eq("monitor_id", monitorId)
    .order("detected_at", { ascending: false })
    .limit(50);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function markChangeEventsRead(monitorId: string): Promise<Result<void>> {
  const { error } = await supabase
    .from("change_events")
    .update({ is_read: true })
    .eq("monitor_id", monitorId)
    .eq("is_read", false);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

export async function getUnreadChangeEventCounts(): Promise<Result<Record<string, number>>> {
  const { data, error } = await supabase
    .from("change_events")
    .select("monitor_id")
    .eq("is_read", false);

  if (error) return { ok: false, error: error.message };

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.monitor_id] = (counts[row.monitor_id] ?? 0) + 1;
  }
  return { ok: true, data: counts };
}
