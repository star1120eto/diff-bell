// Integration Test: notifications テーブルの RLS ポリシー検証

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createAnonClient,
  createServiceClient,
  cleanupTestUsers,
  generateTestEmail,
  signUpAndIn,
} from "../helpers";

const TEST_USER1_EMAIL = generateTestEmail("rls-notif-user1");
const TEST_USER2_EMAIL = generateTestEmail("rls-notif-user2");
const PASSWORD = "password123!";

describe("notifications テーブル RLS", () => {
  const client1 = createAnonClient();
  const client2 = createAnonClient();

  let user1Id: string;
  let monitorId: string;
  let snapshotId: string;
  let changeEventId: string;
  let notificationId: string;

  beforeAll(async () => {
    const user1 = await signUpAndIn(client1, TEST_USER1_EMAIL, PASSWORD);
    await signUpAndIn(client2, TEST_USER2_EMAIL, PASSWORD);
    user1Id = user1.id;

    // service_role で monitor, snapshot, change_event, notification を作成
    const service = createServiceClient();

    const { data: monitor } = await service
      .from("monitors")
      .insert({
        user_id: user1Id,
        name: "Notif Test Monitor",
        url: "https://example.com",
        normalized_url: "https://example.com",
      })
      .select()
      .single();
    monitorId = monitor!.id;

    const { data: snapshot } = await service
      .from("monitor_snapshots")
      .insert({
        monitor_id: monitorId,
        user_id: user1Id,
        structure_hash: "hash1",
        text_hash: "text1",
        content: "<html></html>",
        content_length: 13,
        http_status: 200,
      })
      .select()
      .single();
    snapshotId = snapshot!.id;

    const { data: event } = await service
      .from("change_events")
      .insert({
        monitor_id: monitorId,
        user_id: user1Id,
        after_snapshot_id: snapshotId,
        structure_changed: true,
        text_changed: true,
      })
      .select()
      .single();
    changeEventId = event!.id;

    const { data: notification } = await service
      .from("notifications")
      .insert({
        user_id: user1Id,
        change_event_id: changeEventId,
        title: "変化を検出しました",
        body: "example.com に変化を検出しました。",
      })
      .select()
      .single();
    notificationId = notification!.id;
  });

  afterAll(async () => {
    await cleanupTestUsers([TEST_USER1_EMAIL, TEST_USER2_EMAIL]);
  });

  it("user1 は自分の notifications を SELECT できる", async () => {
    const { data, error } = await client1
      .from("notifications")
      .select("*")
      .eq("id", notificationId);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].title).toBe("変化を検出しました");
  });

  it("user2 は user1 の notifications を SELECT できない", async () => {
    const { data, error } = await client2
      .from("notifications")
      .select("*")
      .eq("id", notificationId);

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("user1 は自分の notification を既読にできる（UPDATE is_read）", async () => {
    const { error } = await client1
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    expect(error).toBeNull();

    const { data } = await client1
      .from("notifications")
      .select("is_read")
      .eq("id", notificationId)
      .single();
    expect(data!.is_read).toBe(true);
  });

  it("user2 は user1 の notification を UPDATE できない", async () => {
    const { error, count } = await client2
      .from("notifications")
      .update({ is_read: false })
      .eq("id", notificationId);

    expect(error).toBeNull();
    expect(count).toBe(0);
  });

  it("anon ユーザーは notifications にアクセスできない", async () => {
    const anonClient = createAnonClient();
    const { data, error } = await anonClient.from("notifications").select("*");

    // RLS により空配列が返る（エラーではなく0件）
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});
