import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Monitor } from "@/lib/monitors";

type Props = {
  monitor: Monitor;
  onConfirm: () => Promise<void>;
  onClose: () => void;
};

export function DeleteConfirmModal({ monitor, onConfirm, onClose }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">監視URLを削除</h2>
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium">「{monitor.name}」</span>
          を削除しますか？この操作は取り消せません。
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            キャンセル
          </Button>
          <Button
            onClick={handleConfirm}
            loading={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
          >
            削除する
          </Button>
        </div>
      </div>
    </div>
  );
}
