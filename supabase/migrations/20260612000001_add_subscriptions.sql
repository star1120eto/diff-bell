-- ============================================================
-- DiffBell: Subscriptions & Paid Plan Support
-- ============================================================

-- ===== subscriptions テーブル =====

CREATE TABLE public.subscriptions (
  id                     UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id                UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id     TEXT        UNIQUE,
  stripe_subscription_id TEXT        UNIQUE,
  plan                   TEXT        NOT NULL DEFAULT 'free'
                                     CHECK (plan IN ('free', 'pro')),
  status                 TEXT        NOT NULL DEFAULT 'active'
                                     CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id)
);

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: 自分のレコードのみ読み取り可
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions: own record read"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- ===== 既存ユーザーを Free プランで登録 =====

INSERT INTO public.subscriptions (user_id, plan, status)
SELECT id, 'free', 'active' FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- ===== Free プランの上限値に更新（既存ユーザー） =====
-- Pro ユーザーが存在しない前提でフルリセット

UPDATE public.user_settings
SET max_monitors = 3, min_interval_hours = 6;

-- ===== 新規ユーザー登録トリガーを更新 =====
-- Free プランのデフォルト値 (3件, 6時間) を適用

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

  INSERT INTO public.user_settings (user_id, max_monitors, min_interval_hours)
  VALUES (NEW.id, 3, 6)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
