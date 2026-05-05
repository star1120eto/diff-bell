-- ============================================================
-- DiffBell Seed Data (ローカル開発・テスト用)
-- ============================================================
-- 実行: supabase db reset (migration + seed を一括実行)
-- 注意: 本番環境には絶対に適用しないこと

-- テストユーザー (Supabase Auth)
-- パスワード: password123
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  aud, role, created_at, updated_at
) VALUES
(
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'alice@example.local',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Alice"}'::jsonb,
  'authenticated', 'authenticated', now(), now()
),
(
  'aaaaaaaa-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'bob@example.local',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Bob"}'::jsonb,
  'authenticated', 'authenticated', now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- profiles (on_auth_user_created トリガーで自動生成されるが、seed では明示的に挿入)
INSERT INTO public.profiles (id, email, display_name) VALUES
('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'alice@example.local', 'Alice'),
('aaaaaaaa-0000-0000-0000-000000000002'::uuid, 'bob@example.local', 'Bob')
ON CONFLICT (id) DO NOTHING;

-- user_settings
INSERT INTO public.user_settings (user_id) VALUES
('aaaaaaaa-0000-0000-0000-000000000001'::uuid),
('aaaaaaaa-0000-0000-0000-000000000002'::uuid)
ON CONFLICT (user_id) DO NOTHING;

-- monitors (Alice のサンプルデータ)
INSERT INTO public.monitors (id, user_id, name, url, normalized_url, interval_hours, is_active, last_status) VALUES
(
  'bbbbbbbb-0000-0000-0000-000000000001'::uuid,
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
  'Example.com',
  'https://example.com',
  'https://example.com',
  24, true, 'pending'
),
(
  'bbbbbbbb-0000-0000-0000-000000000002'::uuid,
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
  'Hacker News',
  'https://news.ycombinator.com',
  'https://news.ycombinator.com',
  1, true, 'ok'
),
(
  'bbbbbbbb-0000-0000-0000-000000000003'::uuid,
  'aaaaaaaa-0000-0000-0000-000000000002'::uuid,
  'Bob の監視サイト',
  'https://httpbin.org/html',
  'https://httpbin.org/html',
  6, true, 'pending'
)
ON CONFLICT (id) DO NOTHING;
