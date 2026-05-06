import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Monitor } from "@/lib/monitors";

const STATUS_LABEL: Record<Monitor["last_status"], string> = {
  pending: "未チェック",
  ok: "変化なし",
  changed: "変化あり",
  error: "エラー",
};

const STATUS_COLOR: Record<Monitor["last_status"], string> = {
  pending: "bg-gray-100 text-gray-600",
  ok: "bg-green-100 text-green-700",
  changed: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
};

const INTERVAL_LABEL: Record<number, string> = {
  1: "1時間",
  3: "3時間",
  6: "6時間",
  12: "12時間",
  24: "24時間",
};

type Props = {
  monitor: Monitor;
  unreadCount: number;
  onEdit: (monitor: Monitor) => void;
  onDelete: (monitor: Monitor) => void;
  onToggle: (monitor: Monitor) => void;
  onCheck: (monitor: Monitor) => Promise<void>;
};

export function MonitorCard({ monitor, unreadCount, onEdit, onDelete, onToggle, onCheck }: Props) {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);

  const handleCheck = async () => {
    setIsChecking(true);
    await onCheck(monitor);
    setIsChecking(false);
  };

  return (
    <div
      className={`rounded-lg border bg-white p-4 transition-opacity ${monitor.is_active ? "" : "opacity-60"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[monitor.last_status]}`}
            >
              {STATUS_LABEL[monitor.last_status]}
            </span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                {unreadCount}件の未読変更
              </span>
            )}
            {!monitor.is_active && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                停止中
              </span>
            )}
          </div>
          <h3 className="mt-1 truncate font-medium text-gray-900">{monitor.name}</h3>
          <a
            href={monitor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block truncate text-sm text-brand-600 hover:underline"
          >
            {monitor.url}
          </a>
          <p className="mt-1 text-xs text-gray-400">
            間隔: {INTERVAL_LABEL[monitor.interval_hours]} ／{" "}
            {monitor.last_checked_at
              ? `最終チェック: ${new Date(monitor.last_checked_at).toLocaleString("ja-JP")}`
              : "未チェック"}
          </p>
          {monitor.last_status === "error" && monitor.last_error && (
            <p className="mt-1 truncate text-xs text-red-500">{monitor.last_error}</p>
          )}
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            onClick={handleCheck}
            disabled={isChecking}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
            title="今すぐチェック"
          >
            {isChecking ? <SpinnerIcon /> : <RefreshIcon />}
          </button>
          <button
            onClick={() => navigate(`/monitors/${monitor.id}/history`)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="変更履歴"
          >
            <HistoryIcon />
          </button>
          <button
            onClick={() => onToggle(monitor)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={monitor.is_active ? "停止" : "再開"}
          >
            {monitor.is_active ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            onClick={() => onEdit(monitor)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="編集"
          >
            <PencilIcon />
          </button>
          <button
            onClick={() => onDelete(monitor)}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
            title="削除"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
