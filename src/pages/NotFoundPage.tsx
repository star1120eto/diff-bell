import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function NotFoundPage() {
  const { session } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="text-6xl font-bold text-brand-600">404</div>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">ページが見つかりません</h1>
      <p className="mt-2 text-sm text-gray-500">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Link
        to={session ? "/dashboard" : "/"}
        className="mt-8 rounded-md bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        {session ? "ダッシュボードへ" : "トップページへ"}
      </Link>
    </div>
  );
}
