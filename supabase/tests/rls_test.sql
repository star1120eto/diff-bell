-- RLS Policy Tests (pgTAP)
-- TDD: これらのテストは migration より先に書かれており、
-- supabase/migrations/20260505000000_initial_schema.sql が適用されて初めてパスする。
--
-- 実行: supabase test db

BEGIN;

SELECT plan(28);

-- ===== セットアップ =====
-- テスト用ユーザーを auth.users に直接挿入する

DO $$
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    aud, role, created_at, updated_at
  ) VALUES
  (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'user1@test.local',
    crypt('password123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb, 'authenticated', 'authenticated', now(), now()
  ),
  (
    'a0000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'user2@test.local',
    crypt('password123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb, 'authenticated', 'authenticated', now(), now()
  );
EXCEPTION WHEN unique_violation THEN NULL;
END;
$$;

-- profiles トリガーで自動生成されるが、テスト環境では手動で挿入
INSERT INTO public.profiles (id, email, display_name)
VALUES
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'user1@test.local', 'User One'),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'user2@test.local', 'User Two')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_settings (user_id)
VALUES
  ('a0000000-0000-0000-0000-000000000001'::uuid),
  ('a0000000-0000-0000-0000-000000000002'::uuid)
ON CONFLICT (user_id) DO NOTHING;

-- user1 の monitor
INSERT INTO public.monitors (
  id, user_id, name, url, normalized_url, interval_hours
) VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'User1 Monitor', 'https://example.com', 'https://example.com', 24
);

-- user1 の snapshot
INSERT INTO public.monitor_snapshots (
  id, monitor_id, user_id, structure_hash, text_hash, content, content_length, http_status
) VALUES (
  'c0000000-0000-0000-0000-000000000001'::uuid,
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'hash_structure_1', 'hash_text_1', '<html></html>', 13, 200
);

-- user1 の change_event
INSERT INTO public.change_events (
  id, monitor_id, user_id, after_snapshot_id, structure_changed, text_changed
) VALUES (
  'd0000000-0000-0000-0000-000000000001'::uuid,
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'c0000000-0000-0000-0000-000000000001'::uuid,
  true, true
);

-- user1 の notification
INSERT INTO public.notifications (
  id, user_id, change_event_id, title, body
) VALUES (
  'e0000000-0000-0000-0000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'd0000000-0000-0000-0000-000000000001'::uuid,
  'Example.com が変化しました',
  'https://example.com に変化を検出しました。'
);

-- ===== anon ロールのテスト =====

SET LOCAL role TO anon;
SELECT set_config('request.jwt.claims', '{}', TRUE);

SELECT results_eq(
  'SELECT count(*)::int FROM public.profiles',
  ARRAY[0],
  'anon: profiles にアクセスできない'
);

SELECT results_eq(
  'SELECT count(*)::int FROM public.monitors',
  ARRAY[0],
  'anon: monitors にアクセスできない'
);

SELECT results_eq(
  'SELECT count(*)::int FROM public.monitor_snapshots',
  ARRAY[0],
  'anon: monitor_snapshots にアクセスできない'
);

SELECT results_eq(
  'SELECT count(*)::int FROM public.notifications',
  ARRAY[0],
  'anon: notifications にアクセスできない'
);

-- ===== user1 としての READ テスト =====

SET LOCAL role TO authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}',
  TRUE
);

SELECT results_eq(
  'SELECT count(*)::int FROM public.profiles WHERE id = ''a0000000-0000-0000-0000-000000000001''::uuid',
  ARRAY[1],
  'user1: 自分の profile を読める'
);

SELECT results_eq(
  'SELECT count(*)::int FROM public.profiles WHERE id = ''a0000000-0000-0000-0000-000000000002''::uuid',
  ARRAY[0],
  'user1: 他ユーザーの profile を読めない'
);

SELECT results_eq(
  'SELECT count(*)::int FROM public.monitors',
  ARRAY[1],
  'user1: 自分の monitors を読める'
);

SELECT results_eq(
  'SELECT count(*)::int FROM public.monitor_snapshots',
  ARRAY[1],
  'user1: 自分の monitor_snapshots を読める'
);

SELECT results_eq(
  'SELECT count(*)::int FROM public.change_events',
  ARRAY[1],
  'user1: 自分の change_events を読める'
);

SELECT results_eq(
  'SELECT count(*)::int FROM public.notifications',
  ARRAY[1],
  'user1: 自分の notifications を読める'
);

SELECT results_eq(
  'SELECT count(*)::int FROM public.user_settings WHERE user_id = ''a0000000-0000-0000-0000-000000000001''::uuid',
  ARRAY[1],
  'user1: 自分の user_settings を読める'
);

-- ===== user2 としての READ テスト（データ分離） =====

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}',
  TRUE
);

SELECT results_eq(
  'SELECT count(*)::int FROM public.monitors',
  ARRAY[0],
  'user2: user1 の monitors を読めない'
);

SELECT results_eq(
  'SELECT count(*)::int FROM public.monitor_snapshots',
  ARRAY[0],
  'user2: user1 の monitor_snapshots を読めない'
);

SELECT results_eq(
  'SELECT count(*)::int FROM public.change_events',
  ARRAY[0],
  'user2: user1 の change_events を読めない'
);

SELECT results_eq(
  'SELECT count(*)::int FROM public.notifications',
  ARRAY[0],
  'user2: user1 の notifications を読めない'
);

-- ===== user1 としての WRITE テスト =====

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}',
  TRUE
);

-- user1 は自分の monitor を INSERT できる
SELECT lives_ok(
  $$
    INSERT INTO public.monitors (user_id, name, url, normalized_url)
    VALUES (
      'a0000000-0000-0000-0000-000000000001'::uuid,
      'Another Monitor', 'https://example.org', 'https://example.org'
    )
  $$,
  'user1: 自分の monitor を INSERT できる'
);

-- user1 は他ユーザーの user_id で monitor を INSERT できない
SELECT throws_ok(
  $$
    INSERT INTO public.monitors (user_id, name, url, normalized_url)
    VALUES (
      'a0000000-0000-0000-0000-000000000002'::uuid,
      'Evil Monitor', 'https://evil.com', 'https://evil.com'
    )
  $$,
  'user1: 他ユーザーの user_id で monitors を INSERT できない'
);

-- user1 は自分の monitor を UPDATE できる
SELECT lives_ok(
  $$
    UPDATE public.monitors
    SET name = 'Updated Name'
    WHERE id = 'b0000000-0000-0000-0000-000000000001'::uuid
  $$,
  'user1: 自分の monitor を UPDATE できる'
);

-- user2 として user1 の monitor を UPDATE しようとしても行数ゼロ（RLSでブロック）
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}',
  TRUE
);

SELECT results_eq(
  $$
    WITH upd AS (
      UPDATE public.monitors
      SET name = 'Hacked'
      WHERE id = 'b0000000-0000-0000-0000-000000000001'::uuid
      RETURNING 1
    ) SELECT count(*)::int FROM upd
  $$,
  ARRAY[0],
  'user2: user1 の monitor を UPDATE できない'
);

-- user2 として user1 の monitor を DELETE しようとしても行数ゼロ
SELECT results_eq(
  $$
    WITH del AS (
      DELETE FROM public.monitors
      WHERE id = 'b0000000-0000-0000-0000-000000000001'::uuid
      RETURNING 1
    ) SELECT count(*)::int FROM del
  $$,
  ARRAY[0],
  'user2: user1 の monitor を DELETE できない'
);

-- ===== user_settings の RLS テスト =====

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}',
  TRUE
);

SELECT results_eq(
  'SELECT count(*)::int FROM public.user_settings',
  ARRAY[1],
  'user1: 自分の user_settings のみ見える'
);

-- user1 は自分の user_settings を UPDATE できる
SELECT lives_ok(
  $$
    UPDATE public.user_settings
    SET email_notifications_enabled = false
    WHERE user_id = 'a0000000-0000-0000-0000-000000000001'::uuid
  $$,
  'user1: 自分の user_settings を UPDATE できる'
);

-- ===== check_runs の RLS テスト =====
-- check_runs の INSERT は service_role のみ（Edge Function）

-- user1 は自分の check_runs を読める（READ のみ）
INSERT INTO public.check_runs (
  monitor_id, user_id, status, checked_at
) VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'ok', now()
); -- service role として事前挿入

SET LOCAL role TO authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}',
  TRUE
);

SELECT results_eq(
  'SELECT count(*)::int FROM public.check_runs',
  ARRAY[1],
  'user1: 自分の check_runs を読める'
);

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}',
  TRUE
);

SELECT results_eq(
  'SELECT count(*)::int FROM public.check_runs',
  ARRAY[0],
  'user2: user1 の check_runs を読めない'
);

SELECT * FROM finish();

ROLLBACK;
