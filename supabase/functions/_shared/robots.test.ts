import { assertEquals } from "jsr:@std/assert";
import { checkRobotsTxt } from "./robots.ts";

const ALLOW_ALL = `
User-agent: *
Disallow:
`;

const DISALLOW_ALL = `
User-agent: *
Disallow: /
`;

const PARTIAL = `
User-agent: *
Disallow: /private/
Disallow: /admin/
Allow: /public/
`;

const SPECIFIC_BOT = `
User-agent: googlebot
Disallow: /

User-agent: *
Disallow: /secret/
`;

Deno.test("checkRobotsTxt: 空のDisallowは全て許可", () => {
  assertEquals(checkRobotsTxt(ALLOW_ALL, "/any/path"), "allowed");
});

Deno.test("checkRobotsTxt: Disallow: / は全てブロック", () => {
  assertEquals(checkRobotsTxt(DISALLOW_ALL, "/"), "disallowed");
  assertEquals(checkRobotsTxt(DISALLOW_ALL, "/page"), "disallowed");
});

Deno.test("checkRobotsTxt: 一部パスのブロック", () => {
  assertEquals(checkRobotsTxt(PARTIAL, "/private/page"), "disallowed");
  assertEquals(checkRobotsTxt(PARTIAL, "/admin/"), "disallowed");
  assertEquals(checkRobotsTxt(PARTIAL, "/public/page"), "allowed");
  assertEquals(checkRobotsTxt(PARTIAL, "/other"), "allowed");
});

Deno.test("checkRobotsTxt: 特定botのルールは無視し * ルールを使用", () => {
  assertEquals(checkRobotsTxt(SPECIFIC_BOT, "/"), "allowed");
  assertEquals(checkRobotsTxt(SPECIFIC_BOT, "/secret/data"), "disallowed");
});

Deno.test("checkRobotsTxt: robots.txt が空なら許可", () => {
  assertEquals(checkRobotsTxt("", "/any"), "allowed");
});
