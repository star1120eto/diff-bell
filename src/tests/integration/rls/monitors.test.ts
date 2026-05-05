// Integration Test: monitors テーブルの RLS ポリシー検証
// TDD: これらのテストが先に書かれており、migration 適用後にパスする。
//
// 前提: Supabase local が起動していること (make supabase-start)
// 実行: make test-integration

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createAnonClient, cleanupTestUsers, generateTestEmail, signUpAndIn } from "../helpers";

const TEST_USER1_EMAIL = generateTestEmail("rls-monitor-user1");
const TEST_USER2_EMAIL = generateTestEmail("rls-monitor-user2");
const PASSWORD = "password123!";

describe("monitors テーブル RLS", () => {
  const client1 = createAnonClient();
  const client2 = createAnonClient();

  let user1Id: string;
  let monitorId: string;

  beforeAll(async () => {
    const user1 = await signUpAndIn(client1, TEST_USER1_EMAIL, PASSWORD);
    await signUpAndIn(client2, TEST_USER2_EMAIL, PASSWORD);
    user1Id = user1.id;
  });

  afterAll(async () => {
    await cleanupTestUsers([TEST_USER1_EMAIL, TEST_USER2_EMAIL]);
  });

  it("user1 は自分の monitor を INSERT できる", async () => {
    const { data, error } = await client1
      .from("monitors")
      .insert({
        name: "Test Monitor",
        url: "https://example.com",
        normalized_url: "https://example.com",
        user_id: user1Id,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.name).toBe("Test Monitor");
    monitorId = data!.id;
  });

  it("user1 は自分の monitors のみ SELECT できる", async () => {
    const { data, error } = await client1.from("monitors").select("*");

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(1);
    // RLS により取得できるのは自分の monitor のみ
    expect(data!.every((m) => m.user_id === user1Id)).toBe(true);
  });

  it("user2 は user1 の monitors を SELECT できない", async () => {
    const { data, error } = await client2.from("monitors").select("*").eq("id", monitorId);

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("user2 は user1 の monitor を UPDATE できない", async () => {
    const { error, count } = await client2
      .from("monitors")
      .update({ name: "Hacked" })
      .eq("id", monitorId);

    expect(error).toBeNull();
    expect(count).toBe(0);
  });

  it("user2 は user1 の monitor を DELETE できない", async () => {
    const { error, count } = await client2.from("monitors").delete().eq("id", monitorId);

    expect(error).toBeNull();
    expect(count).toBe(0);

    // monitor がまだ存在することを user1 で確認
    const { data } = await client1.from("monitors").select("*").eq("id", monitorId);
    expect(data).toHaveLength(1);
  });

  it("user1 は自分の monitor を UPDATE できる", async () => {
    const { error } = await client1
      .from("monitors")
      .update({ name: "Updated Name" })
      .eq("id", monitorId);

    expect(error).toBeNull();

    const { data } = await client1.from("monitors").select("*").eq("id", monitorId).single();
    expect(data!.name).toBe("Updated Name");
  });

  it("user1 は自分の monitor を DELETE できる", async () => {
    const { error } = await client1.from("monitors").delete().eq("id", monitorId);
    expect(error).toBeNull();

    const { data } = await client1.from("monitors").select("*").eq("id", monitorId);
    expect(data).toHaveLength(0);
  });
});
