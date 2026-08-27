import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled error in the UI:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-parchment px-4 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <div>
            <h1 className="font-display text-lg font-semibold text-ink">Something went wrong</h1>
            <p className="mt-1 text-sm text-ink-500">
              An unexpected error stopped this page from working. Reloading usually fixes it.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-brass-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-brass-700"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
