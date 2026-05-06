import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { listMonitors, type Monitor } from "@/lib/monitors";
import { listChangeEvents, markChangeEventsRead, type ChangeEvent } from "@/lib/history";

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
          <div className="py-16 text-center text-sm text-gray-400">読み込み中…</div>
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
        <time className="shrink-0 text-xs text-gray-400">
          {new Date(event.detected_at).toLocaleString("ja-JP")}
        </time>
      </div>
    </div>
  );
}
