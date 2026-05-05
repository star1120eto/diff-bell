// Unit Test: URL ユーティリティ (SSRF チェック + 正規化)

import { describe, it, expect } from "vitest";
import { isSsrfUrl, normalizeUrl } from "@/lib/url";

describe("isSsrfUrl", () => {
  describe("ブロックされるべき URL", () => {
    it("localhost をブロックする", () => {
      expect(isSsrfUrl("http://localhost/")).toBe(true);
      expect(isSsrfUrl("http://localhost:8080/path")).toBe(true);
    });

    it("127.x.x.x をブロックする", () => {
      expect(isSsrfUrl("http://127.0.0.1/")).toBe(true);
      expect(isSsrfUrl("http://127.1.2.3/")).toBe(true);
    });

    it("10.x.x.x をブロックする", () => {
      expect(isSsrfUrl("http://10.0.0.1/")).toBe(true);
      expect(isSsrfUrl("http://10.255.255.255/")).toBe(true);
    });

    it("192.168.x.x をブロックする", () => {
      expect(isSsrfUrl("http://192.168.0.1/")).toBe(true);
      expect(isSsrfUrl("http://192.168.255.255/")).toBe(true);
    });

    it("172.16–31.x.x をブロックする", () => {
      expect(isSsrfUrl("http://172.16.0.1/")).toBe(true);
      expect(isSsrfUrl("http://172.31.255.255/")).toBe(true);
    });

    it("169.254.x.x (リンクローカル) をブロックする", () => {
      expect(isSsrfUrl("http://169.254.169.254/")).toBe(true);
    });

    it(".local ドメインをブロックする", () => {
      expect(isSsrfUrl("http://myserver.local/")).toBe(true);
    });

    it("file:// スキームをブロックする", () => {
      expect(isSsrfUrl("file:///etc/passwd")).toBe(true);
    });

    it("ftp:// スキームをブロックする", () => {
      expect(isSsrfUrl("ftp://example.com/")).toBe(true);
    });

    it("javascript: スキームをブロックする", () => {
      expect(isSsrfUrl("javascript:alert(1)")).toBe(true);
    });
  });

  describe("許可されるべき URL", () => {
    it("一般的な https URL を許可する", () => {
      expect(isSsrfUrl("https://example.com/")).toBe(false);
    });

    it("一般的な http URL を許可する", () => {
      expect(isSsrfUrl("http://example.com/")).toBe(false);
    });

    it("ポート付き URL を許可する", () => {
      expect(isSsrfUrl("https://example.com:8443/")).toBe(false);
    });

    it("サブドメイン付きを許可する", () => {
      expect(isSsrfUrl("https://blog.example.com/")).toBe(false);
    });

    it("172.32.x.x は private 外なので許可する", () => {
      expect(isSsrfUrl("http://172.32.0.1/")).toBe(false);
    });
  });
});

describe("normalizeUrl", () => {
  it("スキームとホストを小文字にする", () => {
    expect(normalizeUrl("HTTP://EXAMPLE.COM/")).toBe("http://example.com/");
    expect(normalizeUrl("HTTPS://Example.Com/path")).toBe("https://example.com/path");
  });

  it("http のデフォルトポート (80) を除去する", () => {
    expect(normalizeUrl("http://example.com:80/")).toBe("http://example.com/");
  });

  it("https のデフォルトポート (443) を除去する", () => {
    expect(normalizeUrl("https://example.com:443/")).toBe("https://example.com/");
  });

  it("非デフォルトポートは保持する", () => {
    expect(normalizeUrl("https://example.com:8443/")).toBe("https://example.com:8443/");
    expect(normalizeUrl("http://example.com:3000/")).toBe("http://example.com:3000/");
  });

  it("パスのない URL にトレイリングスラッシュを付与する", () => {
    expect(normalizeUrl("https://example.com")).toBe("https://example.com/");
  });

  it("フラグメント (#) を除去する", () => {
    expect(normalizeUrl("https://example.com/page#section")).toBe("https://example.com/page");
  });

  it("パスとクエリは保持する", () => {
    expect(normalizeUrl("https://example.com/path?q=1")).toBe("https://example.com/path?q=1");
  });
});
