// Supabase の型定義
// 本来は `supabase gen types typescript` で自動生成する。
// PR #1 では最小限の手書き型を用意し、認証実装時に自動生成に切り替える。

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          email_notifications_enabled: boolean;
          max_monitors: number;
          min_interval_hours: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email_notifications_enabled?: boolean;
          max_monitors?: number;
          min_interval_hours?: number;
        };
        Update: {
          email_notifications_enabled?: boolean;
          max_monitors?: number;
          min_interval_hours?: number;
        };
      };
      monitors: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          url: string;
          normalized_url: string;
          interval_hours: 1 | 3 | 6 | 12 | 24;
          is_active: boolean;
          ignore_selectors: string[];
          last_checked_at: string | null;
          next_check_at: string;
          last_status: "pending" | "ok" | "changed" | "error";
          last_error: string | null;
          robots_txt_status: "allowed" | "disallowed" | "unknown" | null;
          retry_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          url: string;
          normalized_url: string;
          interval_hours?: 1 | 3 | 6 | 12 | 24;
          is_active?: boolean;
          ignore_selectors?: string[];
          next_check_at?: string;
          last_status?: "pending" | "ok" | "changed" | "error";
        };
        Update: {
          name?: string;
          url?: string;
          normalized_url?: string;
          interval_hours?: 1 | 3 | 6 | 12 | 24;
          is_active?: boolean;
          ignore_selectors?: string[];
          last_checked_at?: string | null;
          next_check_at?: string;
          last_status?: "pending" | "ok" | "changed" | "error";
          last_error?: string | null;
          robots_txt_status?: "allowed" | "disallowed" | "unknown" | null;
          retry_count?: number;
        };
      };
      monitor_snapshots: {
        Row: {
          id: string;
          monitor_id: string;
          user_id: string;
          structure_hash: string;
          text_hash: string;
          content: string;
          content_length: number;
          http_status: number;
          etag: string | null;
          last_modified: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          monitor_id: string;
          user_id: string;
          structure_hash: string;
          text_hash: string;
          content: string;
          content_length: number;
          http_status: number;
          etag?: string | null;
          last_modified?: string | null;
        };
        Update: Record<string, never>;
      };
      change_events: {
        Row: {
          id: string;
          monitor_id: string;
          user_id: string;
          before_snapshot_id: string | null;
          after_snapshot_id: string;
          structure_changed: boolean;
          text_changed: boolean;
          detected_at: string;
          is_read: boolean;
        };
        Insert: {
          id?: string;
          monitor_id: string;
          user_id: string;
          before_snapshot_id?: string | null;
          after_snapshot_id: string;
          structure_changed?: boolean;
          text_changed?: boolean;
        };
        Update: {
          is_read?: boolean;
        };
      };
      check_runs: {
        Row: {
          id: string;
          monitor_id: string;
          user_id: string;
          status: "ok" | "changed" | "error";
          http_status: number | null;
          error_code: string | null;
          error_message: string | null;
          duration_ms: number | null;
          snapshot_id: string | null;
          change_event_id: string | null;
          checked_at: string;
          retry_count: number;
        };
        Insert: {
          id?: string;
          monitor_id: string;
          user_id: string;
          status: "ok" | "changed" | "error";
          http_status?: number | null;
          error_code?: string | null;
          error_message?: string | null;
          duration_ms?: number | null;
          snapshot_id?: string | null;
          change_event_id?: string | null;
          retry_count?: number;
        };
        Update: Record<string, never>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          change_event_id: string;
          title: string;
          body: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          change_event_id: string;
          title: string;
          body: string;
          is_read?: boolean;
        };
        Update: {
          is_read?: boolean;
        };
      };
      notification_deliveries: {
        Row: {
          id: string;
          notification_id: string;
          channel: "email" | "in_app";
          status: "pending" | "sent" | "failed";
          provider_id: string | null;
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          notification_id: string;
          channel: "email" | "in_app";
          status?: "pending" | "sent" | "failed";
          provider_id?: string | null;
          error_message?: string | null;
          sent_at?: string | null;
        };
        Update: {
          status?: "pending" | "sent" | "failed";
          provider_id?: string | null;
          error_message?: string | null;
          sent_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
