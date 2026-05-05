// Integration Test: サインイン・サインアウト・パスワードリセットフロー
// 前提: Supabase local が起動していること (make supabase-start)

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createAnonClient, cleanupTestUsers, generateTestEmail, signUpAndIn } from "../helpers";

const TEST_EMAIL = generateTestEmail("auth-signin");
const PASSWORD = "password123!";

describe("サインインフロー", () => {
  const client = createAnonClient();

  beforeAll(async () => {
    // テストユーザーを事前作成
    await signUpAndIn(client, TEST_EMAIL, PASSWORD);
    await client.auth.signOut(); // 一旦サインアウト
  });

  afterAll(async () => {
    await cleanupTestUsers([TEST_EMAIL]);
  });

  it("正しい認証情報でサインインできる", async () => {
    const { data, error } = await client.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: PASSWORD,
    });

    expect(error).toBeNull();
    expect(data.session).not.toBeNull();
    expect(data.user?.email).toBe(TEST_EMAIL);
  });

  it("サインイン後にセッションを取得できる", async () => {
    const { data, error } = await client.auth.getSession();

    expect(error).toBeNull();
    expect(data.session).not.toBeNull();
    expect(data.session?.user.email).toBe(TEST_EMAIL);
  });

  it("誤ったパスワードでサインインするとエラー", async () => {
    const newClient = createAnonClient();
    const { data, error } = await newClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: "wrongpassword",
    });

    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  });

  it("存在しないメールアドレスでサインインするとエラー", async () => {
    const newClient = createAnonClient();
    const { data, error } = await newClient.auth.signInWithPassword({
      email: "nonexistent@test.local",
      password: PASSWORD,
    });

    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  });
});

describe("サインアウトフロー", () => {
  const client = createAnonClient();

  beforeAll(async () => {
    await signUpAndIn(client, generateTestEmail("auth-signout"), PASSWORD);
  });

  it("サインアウト後はセッションが無効になる", async () => {
    // サインアウト前はセッションあり
    const { data: before } = await client.auth.getSession();
    expect(before.session).not.toBeNull();

    // サインアウト
    const { error } = await client.auth.signOut();
    expect(error).toBeNull();

    // サインアウト後はセッションなし
    const { data: after } = await client.auth.getSession();
    expect(after.session).toBeNull();
  });

  it("サインアウト後は保護リソースにアクセスできない", async () => {
    // サインアウト済みなので monitors には自分のデータが見えない
    const { data } = await client.from("monitors").select("*");
    expect(data).toHaveLength(0);
  });
});

describe("パスワードリセットフロー", () => {
  const client = createAnonClient();
  const resetEmail = generateTestEmail("auth-reset");

  beforeAll(async () => {
    await signUpAndIn(client, resetEmail, PASSWORD);
    await client.auth.signOut();
  });

  afterAll(async () => {
    await cleanupTestUsers([resetEmail]);
  });

  it("登録済みメールアドレスにリセットメールを送れる（エラーなし）", async () => {
    const { error } = await client.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: "http://localhost:5173/reset-password/confirm",
    });

    // ローカル環境ではエラーなしで成功する（メールは Inbucket に届く）
    expect(error).toBeNull();
  });

  it("存在しないメールアドレスへのリセットもエラーを返さない（セキュリティ上）", async () => {
    const { error } = await client.auth.resetPasswordForEmail("nonexistent@example.com", {
      redirectTo: "http://localhost:5173/reset-password/confirm",
    });

    // Supabase はメールアドレスの存在を露出しないため、エラーを返さない
    expect(error).toBeNull();
  });
});
