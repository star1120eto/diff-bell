-- ============================================================
-- DiffBell Cron ジョブ設定スクリプト
-- Supabase 本番プロジェクトの SQL Editor で実行してください
-- ローカル開発では不要です（手動で Edge Function を呼び出してください）
-- ============================================================

-- 前提: Supabase Dashboard > Database > Extensions で
--       pg_cron と pg_net を有効にしておくこと

-- Edge Function URL と認証シークレットを設定
-- 実際の値に書き換えてから実行してください
ALTER DATABASE postgres SET app.edge_function_url = 'https://<project-ref>.supabase.co/functions/v1';
ALTER DATABASE postgres SET app.cron_secret = '<your-cron-secret>';

-- check-due-monitors: 15分ごとに実行
SELECT cron.schedule(
  'check-due-monitors',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url        := current_setting('app.edge_function_url') || '/check-due-monitors',
    headers    := jsonb_build_object(
                    'Content-Type',  'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.cron_secret')
                  ),
    body       := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) AS request_id;
  $$
);

-- cleanup-old-snapshots: 毎日 03:00 UTC に実行
SELECT cron.schedule(
  'cleanup-old-snapshots',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url        := current_setting('app.edge_function_url') || '/cleanup-old-snapshots',
    headers    := jsonb_build_object(
                    'Content-Type',  'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.cron_secret')
                  ),
    body       := '{"keepCount": 5}'::jsonb,
    timeout_milliseconds := 60000
  ) AS request_id;
  $$
);

-- 設定確認
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
