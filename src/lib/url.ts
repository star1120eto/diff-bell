const ALLOWED_SCHEMES = ["http:", "https:"];

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
];

/** クライアント側 SSRF 簡易チェック。内部アドレス・非HTTPスキームなら true。 */
export function isSsrfUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return true;
  }

  if (!ALLOWED_SCHEMES.includes(parsed.protocol)) return true;

  const hostname = parsed.hostname.toLowerCase();

  if (hostname === "localhost") return true;
  if (hostname.endsWith(".local")) return true;
  if (PRIVATE_IP_PATTERNS.some((re) => re.test(hostname))) return true;

  return false;
}

/** URL を正規化する（スキーム・ホスト小文字化、デフォルトポート除去、フラグメント除去）。 */
export function normalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);

  url.hostname = url.hostname.toLowerCase();
  url.protocol = url.protocol.toLowerCase();

  if (
    (url.protocol === "http:" && url.port === "80") ||
    (url.protocol === "https:" && url.port === "443")
  ) {
    url.port = "";
  }

  url.hash = "";

  // pathname が空なら "/" にする（new URL が保証するが念のため）
  if (!url.pathname) url.pathname = "/";

  return url.toString();
}
