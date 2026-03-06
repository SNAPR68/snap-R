'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional context label for Sentry (e.g. 'StudioClient', 'CalendarView') */
  context?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report to Sentry with component context
    Sentry.withScope((scope) => {
      if (this.props.context) {
        scope.setTag('error.boundary', this.props.context);
      }
      if (errorInfo.componentStack) {
        scope.setExtra('componentStack', errorInfo.componentStack);
      }
      Sentry.captureException(error);
    });

    // Also log to our system (fire-and-forget)
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        context: this.props.context,
      }),
    }).catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-[400px] bg-[#0F0F0F] flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-white/60 mb-6">
              We&apos;ve been notified and are working on it. Please try again.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4A017] text-black font-medium rounded-lg hover:opacity-90"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
