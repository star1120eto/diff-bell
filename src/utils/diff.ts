export type DiffLine =
  | { type: "equal"; text: string }
  | { type: "insert"; text: string }
  | { type: "delete"; text: string }
  | { type: "collapse"; count: number };

export function computeDiff(before: string, after: string, context = 3): DiffLine[] {
  const a = before
    .split("\n")
    .filter((l) => l.trim())
    .slice(0, 300);
  const b = after
    .split("\n")
    .filter((l) => l.trim())
    .slice(0, 300);

  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const raw: Array<{ type: "equal" | "insert" | "delete"; text: string }> = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      raw.unshift({ type: "equal", text: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      raw.unshift({ type: "insert", text: b[j - 1] });
      j--;
    } else {
      raw.unshift({ type: "delete", text: a[i - 1] });
      i--;
    }
  }

  const result: DiffLine[] = [];
  let equalStart = -1;
  let equalCount = 0;

  const flushEqual = (end: number) => {
    if (equalCount === 0) return;
    const start = equalStart;
    if (equalCount <= context * 2 + 1) {
      for (let k = start; k < end; k++) result.push(raw[k]);
    } else {
      for (let k = start; k < start + context; k++) result.push(raw[k]);
      result.push({ type: "collapse", count: equalCount - context * 2 });
      for (let k = end - context; k < end; k++) result.push(raw[k]);
    }
    equalCount = 0;
    equalStart = -1;
  };

  for (let k = 0; k < raw.length; k++) {
    if (raw[k].type === "equal") {
      if (equalCount === 0) equalStart = k;
      equalCount++;
    } else {
      flushEqual(k);
      result.push(raw[k]);
    }
  }
  flushEqual(raw.length);

  return result;
}
