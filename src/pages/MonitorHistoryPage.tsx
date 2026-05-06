import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { listMonitors, type Monitor } from "@/lib/monitors";
import {
  listChangeEvents,
  markChangeEventsRead,
  fetchSnapshotContent,
  type ChangeEvent,
  type Snapshot,
} from "@/lib/history";
import { computeDiff, type DiffLine } from "@/utils/diff";

export function MonitorHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [events, setEvents] = useState<ChangeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [monitorsResult, eventsResult] = await Promise.all([
        listMonitors(),
        listChangeEvents(id!),
      ]);
      if (monitorsResult.ok) {
        setMonitor(monitorsResult.data.find((m) => m.id === id) ?? null);
      }
      if (eventsResult.ok) {
        setEvents(eventsResult.data);
      }
      await markChangeEventsRead(id!);
      setLoading(false);
    }
    load();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            ← 戻る
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900">{monitor?.name ?? "変更履歴"}</h1>
            {monitor && <p className="max-w-md truncate text-sm text-gray-500">{monitor.url}</p>}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">変更履歴はまだありません</div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <ChangeEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ChangeEventCard({ event }: { event: ChangeEvent }) {
  const [expanded, setExpanded] = useState(false);
  const [afterSnapshot, setAfterSnapshot] = useState<Snapshot | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffLines, setDiffLines] = useState<DiffLine[] | null>(null);

  const handleToggleDiff = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (diffLines !== null) return;

    setDiffLoading(true);
    const [beforeResult, afterResult] = await Promise.all([
      event.before_snapshot_id ? fetchSnapshotContent(event.before_snapshot_id) : null,
      fetchSnapshotContent(event.after_snapshot_id),
    ]);
    const before = beforeResult?.ok ? beforeResult.data : null;
    const after = afterResult?.ok ? afterResult.data : null;
    setAfterSnapshot(after);
    if (before && after) {
      setDiffLines(computeDiff(before.content, after.content));
    }
    setDiffLoading(false);
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {event.structure_changed && (
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
              構造変化
            </span>
          )}
          {event.text_changed && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              テキスト変化
            </span>
          )}
          {!event.structure_changed && !event.text_changed && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              変化検出
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <time className="text-xs text-gray-400">
            {new Date(event.detected_at).toLocaleString("ja-JP")}
          </time>
          <button onClick={handleToggleDiff} className="text-xs text-brand-600 hover:underline">
            {expanded ? "閉じる" : "差分を表示"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3">
          {diffLoading ? (
            <div className="space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : diffLines !== null ? (
            <DiffView lines={diffLines} />
          ) : !event.before_snapshot_id ? (
            <p className="text-xs text-gray-400">初回チェックのため比較対象がありません</p>
          ) : afterSnapshot ? (
            <SingleSnapshotView snapshot={afterSnapshot} />
          ) : (
            <p className="text-xs text-gray-400">スナップショットを取得できませんでした</p>
          )}
        </div>
      )}
    </div>
  );
}

function DiffView({ lines }: { lines: DiffLine[] }) {
  if (lines.length === 0) {
    return <p className="text-xs text-gray-400">差分なし</p>;
  }

  return (
    <div className="overflow-auto rounded border bg-gray-50 p-2 font-mono text-xs">
      {lines.map((line, i) => {
        if (line.type === "collapse") {
          return (
            <div key={i} className="py-0.5 text-center text-gray-400">
              … {line.count} 行変更なし …
            </div>
          );
        }
        return (
          <div
            key={i}
            className={
              line.type === "insert"
                ? "bg-green-50 text-green-800"
                : line.type === "delete"
                  ? "bg-red-50 text-red-800"
                  : "text-gray-600"
            }
          >
            <span className="mr-2 select-none text-gray-300">
              {line.type === "insert" ? "+" : line.type === "delete" ? "−" : " "}
            </span>
            {line.text}
          </div>
        );
      })}
    </div>
  );
}

function SingleSnapshotView({ snapshot }: { snapshot: Snapshot }) {
  return (
    <div>
      <p className="mb-1 text-xs text-gray-400">
        HTTP {snapshot.http_status} · {snapshot.content_length.toLocaleString()} bytes
      </p>
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded border bg-gray-50 p-2 text-xs text-gray-700">
        {snapshot.content}
      </pre>
    </div>
  );
}
