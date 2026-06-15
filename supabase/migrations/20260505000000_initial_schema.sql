-- ============================================================
-- DiffBell: Initial Schema
-- ============================================================
-- テーブル作成順序（FK依存の昇順）:
--   profiles → user_settings → monitors → monitor_snapshots
--   → change_events → check_runs → notifications → notification_deliveries

-- ===== Extensions =====

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== Helper: updated_at 自動更新トリガー =====

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== 1. profiles =====

CREATE TABLE public.profiles (
  id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT        NOT NULL,
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== 2. user_settings =====

CREATE TABLE public.user_settings (
  user_id                       UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_notifications_enabled   BOOLEAN NOT NULL DEFAULT true,
  max_monitors                  INTEGER NOT NULL DEFAULT 20,
  min_interval_hours            INTEGER NOT NULL DEFAULT 1,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

CREATE TRIGGER set_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== 3. monitors =====

CREATE TABLE public.monitors (
  id               UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  url              TEXT        NOT NULL,
  normalized_url   TEXT        NOT NULL,
  interval_hours   INTEGER     NOT NULL DEFAULT 24
                               CHECK (interval_hours IN (1, 3, 6, 12, 24)),
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  ignore_selectors TEXT[]      NOT NULL DEFAULT '{}',
  last_checked_at  TIMESTAMPTZ,
  next_check_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_status      TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (last_status IN ('pending', 'ok', 'changed', 'error')),
  last_error       TEXT,
  robots_txt_status TEXT       CHECK (robots_txt_status IN ('allowed', 'disallowed', 'unknown')),
  retry_count      INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_monitors_user_id         ON public.monitors(user_id);
CREATE INDEX idx_monitors_next_check_at   ON public.monitors(next_check_at, is_active)
  WHERE is_active = true;

CREATE TRIGGER set_monitors_updated_at
  BEFORE UPDATE ON public.monitors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== 4. monitor_snapshots =====

CREATE TABLE public.monitor_snapshots (
  id              UUID        NOT NULL DEFAULT gen_random_uuid(),
  monitor_id      UUID        NOT NULL REFERENCES public.monitors(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  structure_hash  TEXT        NOT NULL,
  text_hash       TEXT        NOT NULL,
  content         TEXT        NOT NULL,
  content_length  INTEGER     NOT NULL,
  http_status     INTEGER     NOT NULL,
  etag            TEXT,
  last_modified   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_monitor_snapshots_monitor_id
  ON public.monitor_snapshots(monitor_id, created_at DESC);

-- ===== 5. change_events =====

CREATE TABLE public.change_events (
  id                 UUID        NOT NULL DEFAULT gen_random_uuid(),
  monitor_id         UUID        NOT NULL REFERENCES public.monitors(id) ON DELETE CASCADE,
  user_id            UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  before_snapshot_id UUID        REFERENCES public.monitor_snapshots(id) ON DELETE SET NULL,
  after_snapshot_id  UUID        NOT NULL REFERENCES public.monitor_snapshots(id) ON DELETE RESTRICT,
  structure_changed  BOOLEAN     NOT NULL DEFAULT false,
  text_changed       BOOLEAN     NOT NULL DEFAULT false,
  detected_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_read            BOOLEAN     NOT NULL DEFAULT false,
  PRIMARY KEY (id)
);

CREATE INDEX idx_change_events_user_id
  ON public.change_events(user_id, detected_at DESC);
CREATE INDEX idx_change_events_monitor_id
  ON public.change_events(monitor_id, detected_at DESC);

-- ===== 6. check_runs =====

CREATE TABLE public.check_runs (
  id              UUID        NOT NULL DEFAULT gen_random_uuid(),
  monitor_id      UUID        NOT NULL REFERENCES public.monitors(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          TEXT        NOT NULL CHECK (status IN ('ok', 'changed', 'error')),
  http_status     INTEGER,
  error_code      TEXT,
  error_message   TEXT,
  duration_ms     INTEGER,
  snapshot_id     UUID        REFERENCES public.monitor_snapshots(id) ON DELETE SET NULL,
  change_event_id UUID        REFERENCES public.change_events(id) ON DELETE SET NULL,
  checked_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  retry_count     INTEGER     NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
);

CREATE INDEX idx_check_runs_monitor_id
  ON public.check_runs(monitor_id, checked_at DESC);

-- ===== 7. notifications =====

CREATE TABLE public.notifications (
  id              UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  change_event_id UUID        NOT NULL REFERENCES public.change_events(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  body            TEXT        NOT NULL,
  is_read         BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX idx_notifications_user_id
  ON public.notifications(user_id, is_read, created_at DESC);

-- ===== 8. notification_deliveries =====

CREATE TABLE public.notification_deliveries (
  id              UUID        NOT NULL DEFAULT gen_random_uuid(),
  notification_id UUID        NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel         TEXT        NOT NULL CHECK (channel IN ('email', 'in_app')),
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'sent', 'failed')),
  provider_id     TEXT,
  error_message   TEXT,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitors              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitor_snapshots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_runs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

-- ----- profiles -----

CREATE POLICY "profiles: own record only"
  ON public.profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ----- user_settings -----

CREATE POLICY "user_settings: own record only"
  ON public.user_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----- monitors -----

CREATE POLICY "monitors: own records only"
  ON public.monitors
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----- monitor_snapshots -----
-- READ のみ（書き込みは Edge Function / service_role が行う）

CREATE POLICY "monitor_snapshots: own records read"
  ON public.monitor_snapshots
  FOR SELECT
  USING (auth.uid() = user_id);

-- ----- change_events -----
-- READ と is_read の UPDATE のみ

CREATE POLICY "change_events: own records read"
  ON public.change_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "change_events: own records mark read"
  ON public.change_events
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----- check_runs -----
-- READ のみ（書き込みは Edge Function / service_role）

CREATE POLICY "check_runs: own records read"
  ON public.check_runs
  FOR SELECT
  USING (auth.uid() = user_id);

-- ----- notifications -----
-- READ と is_read の UPDATE のみ

CREATE POLICY "notifications: own records read"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications: own records mark read"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----- notification_deliveries -----
-- ユーザーからはアクセスしない（service_role のみ）
-- RLS enabled + no user policy = 完全ブロック

-- ============================================================
-- Trigger: 新規ユーザー登録時に profiles / user_settings を自動生成
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Role Grants
-- RLS policies control what rows are visible; grants here give
-- the roles the base privilege so queries return 0 rows instead
-- of throwing "permission denied".
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- anon: SELECT only — RLS has no matching policy so all rows are
-- filtered out, but the query itself does not error.
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.user_settings TO anon;
GRANT SELECT ON public.monitors TO anon;
GRANT SELECT ON public.monitor_snapshots TO anon;
GRANT SELECT ON public.change_events TO anon;
GRANT SELECT ON public.check_runs TO anon;
GRANT SELECT ON public.notifications TO anon;
-- notification_deliveries: intentionally no grant (service_role only)

-- authenticated: full CRUD controlled entirely by RLS policies above
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.user_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monitors TO authenticated;
GRANT SELECT ON public.monitor_snapshots TO authenticated;
GRANT SELECT, UPDATE ON public.change_events TO authenticated;
GRANT SELECT ON public.check_runs TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;

-- ============================================================
-- Retention Helper: 古いスナップショットを削除する関数
-- cleanup-old-snapshots Edge Function から呼ばれる
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_snapshots(keep_count INTEGER DEFAULT 5)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY monitor_id ORDER BY created_at DESC) AS rn
    FROM public.monitor_snapshots
  ),
  to_delete AS (
    SELECT id FROM ranked WHERE rn > keep_count
  )
  DELETE FROM public.monitor_snapshots
  WHERE id IN (SELECT id FROM to_delete);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
