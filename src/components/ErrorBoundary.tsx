import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-lo-bg p-8 text-lo-text">
          <AlertOctagon className="h-12 w-12 text-rose-400" aria-hidden />
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="max-w-md text-center text-sm text-lo-muted">
            {this.state.message ?? 'An unexpected error occurred in the dashboard.'}
          </p>
          <button
            type="button"
            className="rounded-xl bg-lo-accent px-4 py-2 text-sm font-medium text-lo-bg"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return (this as React.Component<Props, State>).props.children;
  }
}
