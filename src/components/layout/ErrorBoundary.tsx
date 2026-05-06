import { Component, type ErrorInfo, type ReactNode } from "react";

type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-bold text-gray-900">エラーが発生しました</h1>
            <p className="mt-2 text-sm text-gray-500">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              再試行
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
