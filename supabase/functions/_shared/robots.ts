export type RobotsTxtStatus = "allowed" | "disallowed" | "unknown";

export function checkRobotsTxt(robotsTxt: string, urlPath: string): "allowed" | "disallowed" {
  const lines = robotsTxt.split("\n");
  let appliesTo = false;
  for (const raw of lines) {
    const line = raw.trim();
    const lower = line.toLowerCase();
    if (lower.startsWith("user-agent:")) {
      const agent = lower.slice("user-agent:".length).trim();
      appliesTo = agent === "*";
    } else if (appliesTo && lower.startsWith("disallow:")) {
      const disallowPath = line.slice("disallow:".length).trim();
      if (disallowPath && urlPath.startsWith(disallowPath)) {
        return "disallowed";
      }
    }
  }
  return "allowed";
}

export async function fetchRobotsTxtStatus(
  siteUrl: URL,
  urlPath: string,
): Promise<RobotsTxtStatus> {
  const robotsUrl = `${siteUrl.protocol}//${siteUrl.host}/robots.txt`;
  try {
    const res = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(3_000),
      headers: { "User-Agent": "DiffBell/1.0 (+https://diffbell.app)" },
    });
    if (!res.ok) return "unknown";
    const text = await res.text();
    return checkRobotsTxt(text, urlPath);
  } catch {
    return "unknown";
  }
}
