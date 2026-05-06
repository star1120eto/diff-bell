-- ============================================================
-- Slack 通知対応
-- ============================================================

-- user_settings に Slack Incoming Webhook URL を追加
ALTER TABLE public.user_settings
  ADD COLUMN slack_webhook_url TEXT;

-- notification_deliveries の channel 制約を更新
ALTER TABLE public.notification_deliveries
  DROP CONSTRAINT IF EXISTS notification_deliveries_channel_check;

ALTER TABLE public.notification_deliveries
  ADD CONSTRAINT notification_deliveries_channel_check
  CHECK (channel IN ('email', 'in_app', 'slack'));
