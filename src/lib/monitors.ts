import { supabase } from "@/lib/supabase";
import { normalizeUrl } from "@/lib/url";
import type { MonitorCreateInput, MonitorUpdateInput } from "@/schemas/monitor";
import type { Database } from "@/types/database";

export type Monitor = Database["public"]["Tables"]["monitors"]["Row"];

export type MonitorResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

const MAX_MONITORS = 20;

export async function listMonitors(): Promise<MonitorResult<Monitor[]>> {
  const { data, error } = await supabase
    .from("monitors")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createMonitor(input: MonitorCreateInput): Promise<MonitorResult<Monitor>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  // 上限チェック
  const { count } = await supabase.from("monitors").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= MAX_MONITORS) {
    return { ok: false, error: `監視URLは最大${MAX_MONITORS}件までです` };
  }

  const normalized = normalizeUrl(input.url);

  const { data, error } = await supabase
    .from("monitors")
    .insert({
      user_id: user.id,
      name: input.name,
      url: input.url,
      normalized_url: normalized,
      interval_hours: input.interval_hours,
      ignore_selectors: input.ignore_selectors,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data! };
}

export async function updateMonitor(
  id: string,
  input: MonitorUpdateInput,
): Promise<MonitorResult<Monitor>> {
  const updatePayload: Database["public"]["Tables"]["monitors"]["Update"] = {};

  if (input.name !== undefined) updatePayload.name = input.name;
  if (input.interval_hours !== undefined) updatePayload.interval_hours = input.interval_hours;
  if (input.ignore_selectors !== undefined) updatePayload.ignore_selectors = input.ignore_selectors;
  if (input.url !== undefined) {
    updatePayload.url = input.url;
    updatePayload.normalized_url = normalizeUrl(input.url);
  }

  const { data, error } = await supabase
    .from("monitors")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data! };
}

export async function deleteMonitor(id: string): Promise<MonitorResult> {
  const { error } = await supabase.from("monitors").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

export async function toggleMonitor(
  id: string,
  isActive: boolean,
): Promise<MonitorResult<Monitor>> {
  const { data, error } = await supabase
    .from("monitors")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data! };
}
