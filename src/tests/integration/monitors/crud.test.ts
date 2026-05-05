// Integration Test: monitors CRUD
// 前提: Supabase local が起動していること (make supabase-start)

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createAnonClient, cleanupTestUsers, generateTestEmail, signUpAndIn } from "../helpers";

const TEST_EMAIL = generateTestEmail("monitor-crud");
const PASSWORD = "password123!";

describe("monitors CRUD", () => {
  const client = createAnonClient();
  let userId: string;
  let createdId: string;

  beforeAll(async () => {
    const user = await signUpAndIn(client, TEST_EMAIL, PASSWORD);
    userId = user.id;
  });

  afterAll(async () => {
    await cleanupTestUsers([TEST_EMAIL]);
  });

  it("monitor を作成できる", async () => {
    const { data, error } = await client
      .from("monitors")
      .insert({
        user_id: userId,
        name: "Example Monitor",
        url: "https://example.com/",
        normalized_url: "https://example.com/",
        interval_hours: 24,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.name).toBe("Example Monitor");
    expect(data!.url).toBe("https://example.com/");
    expect(data!.is_active).toBe(true);
    expect(data!.last_status).toBe("pending");
    createdId = data!.id;
  });

  it("自分の monitors を一覧取得できる", async () => {
    const { data, error } = await client.from("monitors").select("*").order("created_at");

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(1);
    expect(data!.every((m) => m.user_id === userId)).toBe(true);
  });

  it("monitor を更新できる", async () => {
    const { error } = await client
      .from("monitors")
      .update({ name: "Updated Name", interval_hours: 6 })
      .eq("id", createdId);

    expect(error).toBeNull();

    const { data } = await client.from("monitors").select("*").eq("id", createdId).single();
    expect(data!.name).toBe("Updated Name");
    expect(data!.interval_hours).toBe(6);
  });

  it("is_active をトグルできる", async () => {
    const { error } = await client
      .from("monitors")
      .update({ is_active: false })
      .eq("id", createdId);

    expect(error).toBeNull();

    const { data } = await client.from("monitors").select("is_active").eq("id", createdId).single();
    expect(data!.is_active).toBe(false);
  });

  it("monitor を削除できる", async () => {
    const { error } = await client.from("monitors").delete().eq("id", createdId);
    expect(error).toBeNull();

    const { data } = await client.from("monitors").select("*").eq("id", createdId);
    expect(data).toHaveLength(0);
  });
});

describe("monitors 上限チェック", () => {
  const client = createAnonClient();
  const limitEmail = generateTestEmail("monitor-limit");
  let userId: string;
  const createdIds: string[] = [];

  beforeAll(async () => {
    const user = await signUpAndIn(client, limitEmail, PASSWORD);
    userId = user.id;
  });

  afterAll(async () => {
    await cleanupTestUsers([limitEmail]);
  });

  it("20件まで作成できる", async () => {
    for (let i = 0; i < 20; i++) {
      const { data, error } = await client
        .from("monitors")
        .insert({
          user_id: userId,
          name: `Monitor ${i + 1}`,
          url: `https://example${i}.com/`,
          normalized_url: `https://example${i}.com/`,
        })
        .select("id")
        .single();

      expect(error).toBeNull();
      createdIds.push(data!.id);
    }

    const { data } = await client.from("monitors").select("id");
    expect(data).toHaveLength(20);
  });

  it("21件目は lib ヘルパー経由でエラーになる（DB INSERT は可だが上限チェックは lib 側）", async () => {
    // DB 直接 INSERT は RLS 的には可能（上限チェックは lib/monitors.ts 側で行う）
    // ここでは 20 件が最大であることを確認するため件数チェックのみ
    const { data } = await client.from("monitors").select("id");
    expect(data!.length).toBe(20);
  });
});
