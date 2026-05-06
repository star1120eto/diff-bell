import { assertEquals, assertMatch } from "jsr:@std/assert";
import { extractText, sha256, isPrivateHost } from "./url-checker.ts";

Deno.test("sha256: 空文字のハッシュは固定値", async () => {
  const hash = await sha256("");
  assertEquals(hash.length, 64);
  assertMatch(hash, /^[0-9a-f]{64}$/);
});

Deno.test("sha256: 同じ入力は同じハッシュ", async () => {
  const h1 = await sha256("hello world");
  const h2 = await sha256("hello world");
  assertEquals(h1, h2);
});

Deno.test("sha256: 異なる入力は異なるハッシュ", async () => {
  const h1 = await sha256("hello");
  const h2 = await sha256("world");
  assertEquals(h1 === h2, false);
});

Deno.test("extractText: script タグを除去", () => {
  const html = "<html><body>Hello<script>alert(1)</script> World</body></html>";
  const text = extractText(html);
  assertEquals(text.includes("alert"), false);
  assertEquals(text.includes("Hello"), true);
  assertEquals(text.includes("World"), true);
});

Deno.test("extractText: style タグを除去", () => {
  const html = "<html><head><style>body { color: red }</style></head><body>Content</body></html>";
  const text = extractText(html);
  assertEquals(text.includes("color"), false);
  assertEquals(text.includes("Content"), true);
});

Deno.test("extractText: HTMLタグを除去してテキストのみ抽出", () => {
  const html = "<p>Hello <strong>World</strong></p>";
  const text = extractText(html);
  assertEquals(text.includes("<"), false);
  assertEquals(text.includes("Hello"), true);
  assertEquals(text.includes("World"), true);
});

Deno.test("extractText: 空白を正規化", () => {
  const html = "<p>  Hello   World  </p>";
  const text = extractText(html);
  assertEquals(text.trim(), "Hello World");
});

Deno.test("isPrivateHost: localhost はプライベート", () => {
  assertEquals(isPrivateHost("localhost"), true);
});

Deno.test("isPrivateHost: 127.0.0.1 はプライベート", () => {
  assertEquals(isPrivateHost("127.0.0.1"), true);
});

Deno.test("isPrivateHost: 10.x はプライベート", () => {
  assertEquals(isPrivateHost("10.0.0.1"), true);
});

Deno.test("isPrivateHost: 192.168.x はプライベート", () => {
  assertEquals(isPrivateHost("192.168.1.1"), true);
});

Deno.test("isPrivateHost: 172.16.x はプライベート", () => {
  assertEquals(isPrivateHost("172.16.0.1"), true);
});

Deno.test("isPrivateHost: 169.254.x はプライベート", () => {
  assertEquals(isPrivateHost("169.254.0.1"), true);
});

Deno.test("isPrivateHost: .local はプライベート", () => {
  assertEquals(isPrivateHost("internal.local"), true);
});

Deno.test("isPrivateHost: 公開ドメインはプライベートでない", () => {
  assertEquals(isPrivateHost("example.com"), false);
  assertEquals(isPrivateHost("github.com"), false);
});
