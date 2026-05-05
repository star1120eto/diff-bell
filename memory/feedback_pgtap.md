---
name: pgTAP の正しい使い方
description: pgTAP の throws_ok シグネチャと plan 数に関する注意点
type: feedback
---

`throws_ok` の引数は 4 形式あるが、3 引数は `(sql, errcode, errmsg)` であり description ではない。

**Why:** `throws_ok(sql, '42501', '日本語の説明')` とすると、第3引数が errmsg として解釈され、実際のエラーメッセージと一致せず失敗する。

**How to apply:** エラーコードのみ検証し description を付けたい場合は必ず 4 引数形式を使う：
```sql
SELECT throws_ok(
  $$ INSERT ... $$,
  '42501',   -- errcode (SQLSTATE)
  NULL,      -- errmsg (NULL = チェックしない)
  '説明文'   -- description
);
```

RLS 違反のエラーコードは `42501` (insufficient_privilege)。

---

`SELECT plan(N)` の N は SQL ファイル内のテスト生成関数呼び出し数と完全一致させること。ずれると "Bad plan" エラーで CI が落ちる。

---

check_runs のようなサービスロール専用テーブルへの INSERT は、pgTAP テスト内で `SET LOCAL role TO authenticated` した後に行うと RLS エラーで後続テストごと中断する。INSERT 前に `RESET role;` でスーパーユーザーに戻すこと。
</content>
</invoke>