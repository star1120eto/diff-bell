// Unit Test: monitor Zod スキーマ

import { describe, it, expect } from "vitest";
import { monitorCreateSchema, monitorUpdateSchema } from "@/schemas/monitor";

describe("monitorCreateSchema", () => {
  const valid = {
    name: "Example Monitor",
    url: "https://example.com/",
    interval_hours: 24 as const,
  };

  it("有効なデータを受け付ける", () => {
    const result = monitorCreateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("名前が空だとエラー", () => {
    const result = monitorCreateSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("name");
  });

  it("名前が100文字超えるとエラー", () => {
    const result = monitorCreateSchema.safeParse({ ...valid, name: "a".repeat(101) });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("name");
  });

  it("URL が空だとエラー", () => {
    const result = monitorCreateSchema.safeParse({ ...valid, url: "" });
    expect(result.success).toBe(false);
  });

  it("URL が無効な形式だとエラー", () => {
    const result = monitorCreateSchema.safeParse({ ...valid, url: "not-a-url" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("url");
  });

  it("http URL も有効", () => {
    const result = monitorCreateSchema.safeParse({ ...valid, url: "http://example.com/" });
    expect(result.success).toBe(true);
  });

  it("localhost はSSRF防止でエラー", () => {
    const result = monitorCreateSchema.safeParse({ ...valid, url: "http://localhost/" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("url");
  });

  it("127.0.0.1 はSSRF防止でエラー", () => {
    const result = monitorCreateSchema.safeParse({ ...valid, url: "http://127.0.0.1/" });
    expect(result.success).toBe(false);
  });

  it("10.x.x.x はSSRF防止でエラー", () => {
    const result = monitorCreateSchema.safeParse({ ...valid, url: "http://10.0.0.1/" });
    expect(result.success).toBe(false);
  });

  it("192.168.x.x はSSRF防止でエラー", () => {
    const result = monitorCreateSchema.safeParse({ ...valid, url: "http://192.168.1.1/" });
    expect(result.success).toBe(false);
  });

  it("file:// スキームはエラー", () => {
    const result = monitorCreateSchema.safeParse({ ...valid, url: "file:///etc/passwd" });
    expect(result.success).toBe(false);
  });

  it("interval_hours は 1|3|6|12|24 のみ有効", () => {
    for (const v of [1, 3, 6, 12, 24] as const) {
      const result = monitorCreateSchema.safeParse({ ...valid, interval_hours: v });
      expect(result.success).toBe(true);
    }
  });

  it("interval_hours が無効な値だとエラー", () => {
    const result = monitorCreateSchema.safeParse({ ...valid, interval_hours: 2 });
    expect(result.success).toBe(false);
  });

  it("ignore_selectors は省略可能（デフォルト空配列）", () => {
    const result = monitorCreateSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ignore_selectors).toEqual([]);
    }
  });

  it("ignore_selectors を指定できる", () => {
    const result = monitorCreateSchema.safeParse({
      ...valid,
      ignore_selectors: [".ad", "#sidebar"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ignore_selectors).toEqual([".ad", "#sidebar"]);
    }
  });
});

describe("monitorUpdateSchema", () => {
  it("全フィールド省略可能（PATCH 用）", () => {
    const result = monitorUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("name だけ更新できる", () => {
    const result = monitorUpdateSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("url だけ更新できる", () => {
    const result = monitorUpdateSchema.safeParse({ url: "https://updated.com/" });
    expect(result.success).toBe(true);
  });

  it("SSRF チェックは update でも有効", () => {
    const result = monitorUpdateSchema.safeParse({ url: "http://192.168.1.1/" });
    expect(result.success).toBe(false);
  });
});
