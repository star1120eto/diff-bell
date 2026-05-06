import { supabase } from "./supabase";

export interface TestNotificationResult {
  slack: "sent" | "failed" | "skipped";
  email: "sent" | "failed" | "skipped";
  slackError?: string;
  emailError?: string;
}

export interface UserSettings {
  email_notifications_enabled: boolean;
  slack_webhook_url: string | null;
}

export interface Profile {
  display_name: string | null;
  email: string;
}

export type SettingsResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function getSettings(): Promise<SettingsResult<UserSettings>> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("email_notifications_enabled, slack_webhook_url")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateSettings(
  updates: Partial<UserSettings>,
): Promise<SettingsResult<void>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await supabase.from("user_settings").update(updates).eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

export async function getProfile(): Promise<SettingsResult<Profile>> {
  const { data, error } = await supabase.from("profiles").select("display_name, email").single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function sendTestNotification(
  webhookUrl?: string,
): Promise<SettingsResult<TestNotificationResult>> {
  const { data, error } = await supabase.functions.invoke("send-test-notification", {
    body: { webhookUrl: webhookUrl ?? "" },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as TestNotificationResult };
}

export async function updateProfile(
  updates: Pick<Profile, "display_name">,
): Promise<SettingsResult<void>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}
