import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { MonitorCard } from "@/components/monitors/MonitorCard";
import { MonitorCardSkeleton } from "@/components/monitors/MonitorCardSkeleton";
import { EmptyState } from "@/components/monitors/EmptyState";
import { MonitorFormModal } from "@/components/monitors/MonitorFormModal";
import { DeleteConfirmModal } from "@/components/monitors/DeleteConfirmModal";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { signOut } from "@/lib/auth";
import {
  listMonitors,
  createMonitor,
  updateMonitor,
  deleteMonitor,
  toggleMonitor,
  type Monitor,
} from "@/lib/monitors";
import { getUnreadChangeEventCounts } from "@/lib/history";
import { checkMonitorNow } from "@/lib/monitors";
import type { MonitorCreateInput } from "@/schemas/monitor";

const MAX_MONITORS = 20;

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [deletingMonitor, setDeletingMonitor] = useState<Monitor | null>(null);

  const loadMonitors = useCallback(async () => {
    const [monitorsResult, countsResult] = await Promise.all([
      listMonitors(),
      getUnreadChangeEventCounts(),
    ]);
    if (monitorsResult.ok) {
      setMonitors(monitorsResult.data);
    } else {
      setError(monitorsResult.error);
    }
    if (countsResult.ok) {
      setUnreadCounts(countsResult.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMonitors();
  }, [loadMonitors]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const handleAdd = () => {
    setEditingMonitor(null);
    setShowForm(true);
  };

  const handleEdit = (monitor: Monitor) => {
    setEditingMonitor(monitor);
    setShowForm(true);
  };

  const handleFormSubmit = async (values: MonitorCreateInput) => {
    if (editingMonitor) {
      const result = await updateMonitor(editingMonitor.id, values);
      if (!result.ok) throw new Error(result.error);
    } else {
      const result = await createMonitor(values);
      if (!result.ok) throw new Error(result.error);
    }
    setShowForm(false);
    setEditingMonitor(null);
    await loadMonitors();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMonitor) return;
    const result = await deleteMonitor(deletingMonitor.id);
    if (!result.ok) {
      setError(result.error);
    }
    setDeletingMonitor(null);
    await loadMonitors();
  };

  const handleCheck = async (monitor: Monitor) => {
    const result = await checkMonitorNow(monitor.id);
    if (!result.ok) {
      setError(result.error);
    }
    await loadMonitors();
  };

  const handleToggle = async (monitor: Monitor) => {
    const result = await toggleMonitor(monitor.id, !monitor.is_active);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMonitors((prev) => prev.map((m) => (m.id === monitor.id ? result.data : m)));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-brand-600">DiffBell</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <NotificationBell />
            <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
              設定
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">監視URL</h2>
            <p className="text-sm text-gray-500">
              {monitors.length} / {MAX_MONITORS} 件
            </p>
          </div>
          {monitors.length > 0 && (
            <Button onClick={handleAdd} disabled={monitors.length >= MAX_MONITORS} size="sm">
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              URLを追加
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <MonitorCardSkeleton key={i} />
            ))}
          </div>
        ) : monitors.length === 0 ? (
          <EmptyState onAdd={handleAdd} />
        ) : (
          <div className="space-y-3">
            {monitors.map((monitor) => (
              <MonitorCard
                key={monitor.id}
                monitor={monitor}
                unreadCount={unreadCounts[monitor.id] ?? 0}
                onEdit={handleEdit}
                onDelete={setDeletingMonitor}
                onToggle={handleToggle}
                onCheck={handleCheck}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <MonitorFormModal
          monitor={editingMonitor}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingMonitor(null);
          }}
        />
      )}

      {deletingMonitor && (
        <DeleteConfirmModal
          monitor={deletingMonitor}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingMonitor(null)}
        />
      )}
    </div>
  );
}
