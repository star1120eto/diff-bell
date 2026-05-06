const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /\.local$/i,
  // IPv6 loopback and private ranges
  /^\[?::1\]?$/i,
  /^\[?::ffff:/i,
  /^\[?fc[0-9a-f][0-9a-f]:/i,
  /^\[?fd[0-9a-f][0-9a-f]:/i,
  /^\[?fe80:/i,
  /^\[?0+\]?$/i,
];

export function isPrivateHost(hostname: string): boolean {
  return PRIVATE_HOST_PATTERNS.some((p) => p.test(hostname));
}

export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export interface CheckResult {
  ok: boolean;
  httpStatus?: number;
  content?: string;
  structureHash?: string;
  textHash?: string;
  contentLength?: number;
  etag?: string | null;
  lastModified?: string | null;
  error?: string;
  errorCode?: string;
  durationMs?: number;
}

const MAX_CONTENT_BYTES = 5 * 1024 * 1024; // 5 MB
const FETCH_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 5;

export async function checkUrl(rawUrl: string): Promise<CheckResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, error: "Invalid URL", errorCode: "INVALID_URL" };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return { ok: false, error: "Unsupported scheme", errorCode: "INVALID_SCHEME" };
  }

  if (isPrivateHost(url.hostname)) {
    return { ok: false, error: "Private host not allowed", errorCode: "SSRF_BLOCKED" };
  }

  const start = Date.now();
  try {
    const res = await fetchWithSsrfSafeRedirects(rawUrl, FETCH_TIMEOUT_MS, MAX_REDIRECTS);
    const durationMs = Date.now() - start;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/") && !contentType.includes("application/xhtml")) {
      return {
        ok: false,
        httpStatus: res.status,
        error: `Non-text content: ${contentType}`,
        errorCode: "NON_TEXT_CONTENT",
        durationMs,
      };
    }

    const buffer = await readWithLimit(res, MAX_CONTENT_BYTES);
    if (buffer === null) {
      return {
        ok: false,
        httpStatus: res.status,
        error: "Content too large",
        errorCode: "CONTENT_TOO_LARGE",
        durationMs,
      };
    }

    const content = new TextDecoder().decode(buffer);
    const [structureHash, textHash] = await Promise.all([
      sha256(content),
      sha256(extractText(content)),
    ]);

    return {
      ok: true,
      httpStatus: res.status,
      content,
      structureHash,
      textHash,
      contentLength: buffer.byteLength,
      etag: res.headers.get("etag"),
      lastModified: res.headers.get("last-modified"),
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - start;
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, error: "Request timed out", errorCode: "TIMEOUT", durationMs };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message, errorCode: "FETCH_ERROR", durationMs };
  }
}

// リダイレクト先を手動検証しながら追跡する（SSRF 対策）
async function fetchWithSsrfSafeRedirects(
  url: string,
  timeoutMs: number,
  maxRedirects: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let currentUrl = url;
    let redirectsLeft = maxRedirects;

    while (true) {
      const res = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: "manual",
        headers: { "User-Agent": "DiffBell/1.0 (+https://diffbell.app)" },
      });

      const isRedirect = res.status >= 300 && res.status < 400;
      if (!isRedirect || redirectsLeft <= 0) return res;

      const location = res.headers.get("location");
      if (!location) return res;

      // リダイレクト先を絶対 URL に解決
      const nextUrl = new URL(location, currentUrl);

      if (!["http:", "https:"].includes(nextUrl.protocol)) {
        throw new Error(`Redirect to disallowed scheme: ${nextUrl.protocol}`);
      }
      if (isPrivateHost(nextUrl.hostname)) {
        throw new Error(`Redirect to private host blocked: ${nextUrl.hostname}`);
      }

      currentUrl = nextUrl.toString();
      redirectsLeft--;
    }
  } finally {
    clearTimeout(timer);
  }
}

async function readWithLimit(res: Response, maxBytes: number): Promise<ArrayBuffer | null> {
  const reader = res.body?.getReader();
  if (!reader) return new ArrayBuffer(0);

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged.buffer;
}
